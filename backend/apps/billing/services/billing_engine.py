# Bus logic: calculate_gst(), create_invoice()
from decimal import Decimal, ROUND_HALF_UP

class BillingEngine:

    def __init__(self, items, rate_10gm, making_per_gm, extra):
        """
        items: [
            {
                "weight": Decimal,
                "making": Decimal (optional manual)
            }
        ]
        extra: {
            old_weight,
            old_less_percent,
            advance,
            cgst,
            sgst,
            other_charges,
            hallmark_charges
        }
        """

        self.items = items
        self.rate_per_g = Decimal(rate_10gm) / Decimal(10)
        self.making_per_g = Decimal(making_per_gm)

        self.old_weight = Decimal(extra.get("old_weight", 0))
        self.old_less_percent = Decimal(extra.get("old_less_percent", 0))
        self.advance = Decimal(extra.get("advance", 0))

        self.cgst = Decimal(extra.get("cgst", 0))
        self.sgst = Decimal(extra.get("sgst", 0))

        self.other = Decimal(extra.get("other_charges", 0))
        self.hallmark = Decimal(extra.get("hallmark_charges", 0))

    # ----------------------------------------
    # ITEM CALCULATION
    # ----------------------------------------
    def calculate_items(self):
        total_weight = Decimal(0)
        total_making = Decimal(0)

        for item in self.items:
            weight = Decimal(item.get("weight", 0))

            if item.get("making") is not None:
                making = Decimal(item["making"])
            else:
                making = weight * self.making_per_g

            total_weight += weight
            total_making += making

        return total_weight, total_making

    # ----------------------------------------
    # SCENARIO LOGIC (CORE)
    # ----------------------------------------
    def calculate_base_amount(self, weight, making):
        """
        Handles:
        - Normal billing
        - Old gold exchange
        """

        # No old gold → normal
        if self.old_weight <= 0:
            return {
                "type": "normal",
                "amount": (weight * self.rate_per_g) + making
            }

        # Case 1: New > Old
        if weight >= self.old_weight:
            diff = weight - self.old_weight
            return {
                "type": "payable",
                "amount": (diff * self.rate_per_g) + making
            }

        # Case 2: Old > New (Return)
        diff = self.old_weight - weight

        adjusted_rate = self.rate_per_g * (Decimal(1) - (self.old_less_percent / 100))
        return_amount = (diff * adjusted_rate) - making

        return {
            "type": "return",
            "amount": return_amount
        }

    # ----------------------------------------
    # TAX & FINAL CALCULATION
    # ----------------------------------------
    def apply_charges(self, base_result, subtotal):
        base_amount = base_result["amount"]

        cgst_amt = (subtotal + self.hallmark) * self.cgst / 100
        sgst_amt = (subtotal + self.hallmark) * self.sgst / 100

        if base_result["type"] == "return":
            deductions = self.hallmark + cgst_amt + sgst_amt + self.other
            final = (base_amount + self.advance) - deductions
        else:
            gross = base_amount + self.hallmark + cgst_amt + sgst_amt + self.other
            final = gross - self.advance

        return {
            "cgst_amt": cgst_amt,
            "sgst_amt": sgst_amt,
            "final": final
        }

    # ----------------------------------------
    # MAIN ENTRY
    # ----------------------------------------
    def calculate(self):
        weight, making = self.calculate_items()

        subtotal = (weight * self.rate_per_g) + making

        base_result = self.calculate_base_amount(weight, making)

        charges = self.apply_charges(base_result, subtotal)

        final = charges["final"].quantize(Decimal("1"), rounding=ROUND_HALF_UP)

        return {
            "total_weight": weight,
            "making_total": making,
            "subtotal": subtotal,
            "base_type": base_result["type"],
            "base_amount": base_result["amount"],
            "cgst": charges["cgst_amt"],
            "sgst": charges["sgst_amt"],
            "grand_total": abs(final),
            "transaction_type": "return" if base_result["type"] == "return" else "payable"
        }
