import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { extractList } from '../../lib/axios';
import PrintPreviewModal from '../pdfs/PrintPreviewModal';

/* ─── Indian Number-to-Words ─── */
function numToWords(n) {
  if (n === 0) return 'Zero';
  const o = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const t = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function c(num) {
    if (num === 0) return '';
    if (num < 20) return o[num] + ' ';
    if (num < 100) return t[Math.floor(num / 10)] + (num % 10 ? ' ' + o[num % 10] : '') + ' ';
    if (num < 1000) return o[Math.floor(num / 100)] + ' Hundred ' + c(num % 100);
    if (num < 100000) return c(Math.floor(num / 1000)).trim() + ' Thousand ' + c(num % 1000);
    if (num < 10000000) return c(Math.floor(num / 100000)).trim() + ' Lakh ' + c(num % 100000);
    return c(Math.floor(num / 10000000)).trim() + ' Crore ' + c(num % 10000000);
  }
  return c(Math.abs(Math.floor(n))).replace(/\s+/g, ' ').trim();
}
function amountWords(amt) {
  const r = Math.floor(Math.abs(amt));
  const p = Math.round((Math.abs(amt) - r) * 100);
  let s = numToWords(r) + ' Rupees';
  if (p > 0) s += ' and ' + numToWords(p) + ' Paise';
  return s + ' Only';
}

const fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN');

/* ─── Default Workers (for auto-suggestion) ─── */
const defaultWorkers = [
  'Ramesh — Senior Karigar',
  'Sunil — Gold Specialist',
  'Deepak — Silver Specialist',
  'Manoj — Diamond Setter',
  'Ravi — Polisher',
];

/* ═══════════════════════════════════════════
   ORDER SETUP MODAL
   ═══════════════════════════════════════════ */
function OrderSetupModal({ onStart, onClose }) {
  const [metal, setMetal] = useState('');
  const [orderType, setOrderType] = useState('');
  const [liveRates, setLiveRates] = useState({ Gold: 0, Silver: 0 });

  useEffect(() => {
    api.get('/rates/latest/').then(res => {
      const d = res.data;
      setLiveRates({
        Gold: d.gold22k?.rate_per_gram || d.gold24k?.rate_per_gram || 0,
        Silver: d.silver925?.rate_per_gram || d.silver999?.rate_per_gram || 0,
      });
    }).catch(() => {});
  }, []);

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal" style={{ maxWidth: 520, overflow: 'visible' }}>
        <div className="modal__header" style={{ borderBottom: '1px solid var(--border-primary)', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', right: 16, top: 16, background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
          <h2 className="modal__title">
            <i className="fa-solid fa-box" style={{ marginRight: 10, color: 'var(--color-warning)' }}></i>
            Start New Order
          </h2>
        </div>
        <div className="modal__body" style={{ padding: 'var(--space-6)' }}>
          {/* Metal Type */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select Metal Type</label>
            <div className="bsetup-grid">
              <button type="button" className={`bsetup-card${metal === 'Gold' ? ' bsetup-card--active' : ''}`} onClick={() => setMetal('Gold')}>
                <div className="bsetup-card__icon" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#78350f' }}><i className="fa-solid fa-coins"></i></div>
                <div className="bsetup-card__title">Gold</div>
                <div className="bsetup-card__rate">{liveRates.Gold ? fmt(liveRates.Gold) + '/g' : 'Loading...'}</div>
              </button>
              <button type="button" className={`bsetup-card${metal === 'Silver' ? ' bsetup-card--active' : ''}`} onClick={() => setMetal('Silver')}>
                <div className="bsetup-card__icon" style={{ background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)', color: '#1e293b' }}><i className="fa-solid fa-coins"></i></div>
                <div className="bsetup-card__title">Silver</div>
                <div className="bsetup-card__rate">{liveRates.Silver ? fmt(liveRates.Silver) + '/g' : 'Loading...'}</div>
              </button>
            </div>
          </div>
          {/* Order Type */}
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select Order Type</label>
            <div className="bsetup-grid">
              <button type="button" className={`bsetup-card${orderType === 'Invoice' ? ' bsetup-card--active' : ''}`} onClick={() => setOrderType('Invoice')}>
                <div className="bsetup-card__icon" style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}><i className="fa-solid fa-file-invoice"></i></div>
                <div className="bsetup-card__title">Invoice</div>
                <div className="bsetup-card__rate">With GST (3%)</div>
              </button>
              <button type="button" className={`bsetup-card${orderType === 'Estimate' ? ' bsetup-card--active' : ''}`} onClick={() => setOrderType('Estimate')}>
                <div className="bsetup-card__icon" style={{ background: 'var(--color-info-muted)', color: 'var(--color-info)' }}><i className="fa-solid fa-file-lines"></i></div>
                <div className="bsetup-card__title">Estimate</div>
                <div className="bsetup-card__rate">No GST</div>
              </button>
            </div>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--primary btn--lg" style={{ width: '100%', gap: 10 }} disabled={!metal || !orderType} onClick={() => onStart(metal, orderType, liveRates[metal] || 0)}>
            <i className="fa-solid fa-arrow-right"></i> Start Order
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   WORKER AUTO-SUGGESTION INPUT
   ═══════════════════════════════════════════ */
function WorkerInput({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  const [allWorkers, setAllWorkers] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('jewellosoft_workers') || '[]');
      return [...new Set([...defaultWorkers, ...saved])];
    } catch { return [...defaultWorkers]; }
  });
  const wrapRef = useRef(null);

  const suggestions = useMemo(() => {
    if (!focused) return [];
    const q = (value || '').toLowerCase();
    return allWorkers.filter(w => !q || w.toLowerCase().includes(q)).slice(0, 8);
  }, [value, focused, allWorkers]);

  const selectWorker = (w) => { onChange(w); setFocused(false); };

  const handleBlur = () => setTimeout(() => setFocused(false), 200);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim() && !allWorkers.includes(value.trim())) {
      const updated = [...allWorkers, value.trim()];
      setAllWorkers(updated);
      try { localStorage.setItem('jewellosoft_workers', JSON.stringify(updated.filter(w => !defaultWorkers.includes(w)))); } catch { }
    }
  };

  return (
    <div className="search-ac" ref={wrapRef}>
      <input
        className="form-input" type="text" placeholder="Type or select worker..."
        value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={handleBlur} onKeyDown={handleKeyDown}
      />
      {focused && suggestions.length > 0 && (
        <div className="search-ac__dropdown">
          {suggestions.map((w, i) => (
            <div key={i} className="search-ac__item" onMouseDown={() => selectWorker(w)}>
              <span><i className="fa-solid fa-user-gear" style={{ marginRight: 6, opacity: 0.5, fontSize: '0.7rem' }}></i>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN ORDERS COMPONENT
   ═══════════════════════════════════════════ */
export default function Orders() {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const searchWrapRef = useRef(null);
  const fileInputRef = useRef(null);
  const custWrapRef = useRef(null);

  /* ─── Modal ─── */
  const [showModal, setShowModal] = useState(true);
  const [metalType, setMetalType] = useState('');
  const [orderType, setOrderType] = useState('');

  /* ─── Order Info ─── */
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [orderStatus, setOrderStatus] = useState('Pending');
  const [assignedWorker, setAssignedWorker] = useState('');

  /* ─── Customer ─── */
  const [customerId, setCustomerId] = useState(null);
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custSuggestions, setCustSuggestions] = useState([]);
  const [showCustSuggestions, setShowCustSuggestions] = useState(false);

  // Debounced Customer Search
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (custName.length > 2 && !customerId) {
        try {
          const res = await api.get(`/customers/?search=${encodeURIComponent(custName)}`);
          setCustSuggestions(extractList(res.data));
          setShowCustSuggestions(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        setShowCustSuggestions(false);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [custName, customerId]);

  const selectCustomer = (c) => {
    setCustomerId(c.id);
    setCustName(c.name);
    setCustMobile(c.phone || '');
    setCustAddress(c.address || '');
    setShowCustSuggestions(false);
  };

  /* ─── Metal Rate ─── */
  const [metalRate, setMetalRate] = useState(0);
  const [allRates, setAllRates] = useState({});

  useEffect(() => {
    api.get('/rates/latest/').then(res => setAllRates(res.data)).catch(() => {});
  }, []);

  const rateOptions = useMemo(() => {
    const isGold = metalType.toLowerCase() === 'gold';
    const labels = isGold
      ? { gold24k: 'Gold 24K (999)', gold22k: 'Gold 22K (916)', gold18k: 'Gold 18K (750)' }
      : { silver999: 'Silver 999 (Pure)', silver925: 'Silver 925 (Sterling)' };
    return Object.entries(labels)
      .filter(([key]) => allRates[key]?.rate_per_gram > 0)
      .map(([key, label]) => ({ key, label, rate: allRates[key].rate_per_gram }));
  }, [metalType, allRates]);

  /* ─── Items ─── */
  const [items, setItems] = useState([]);

  /* ─── Product Search Removed for Orders ─── */

  /* ─── Design ─── */
  const [designNotes, setDesignNotes] = useState('');
  const [designImages, setDesignImages] = useState([]);

  /* ─── Old Exchange ─── */
  const [oldWeight, setOldWeight] = useState('');
  const [oldDeductPct, setOldDeductPct] = useState('10');

  /* ─── Charges & Deductions ─── */
  const [otherCharges, setOtherCharges] = useState('');
  const [hallmarkCount, setHallmarkCount] = useState('');
  const [advance, setAdvance] = useState('');
  const [discount, setDiscount] = useState('');

  /* ─── Payment ─── */
  const [paymentMode, setPaymentMode] = useState('Cash');

  /* ─── Settings ─── */
  const hallmarkValue = useMemo(() => {
    try { return Number(localStorage.getItem('jewellosoft_hallmark_value')) || 53; }
    catch { return 53; }
  }, []);

  /* ─── Modal Handler ─── */
  const handleStart = useCallback((metal, type, rate) => {
    setMetalType(metal);
    setOrderType(type);
    setMetalRate(rate || 0);
    setItems([createEmptyItem()]);
    setShowModal(false);
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);

  /* ─── Item Helpers ─── */
  const createEmptyItem = () => ({
    id: Date.now() + Math.random(),
    name: '', weight: '', size: '', makingCharges: '', specialNotes: '',
    metalValue: 0, total: 0,
  });

  const recalcItem = (item, rate) => {
    const w = parseFloat(item.weight) || 0;
    const mk = parseFloat(item.makingCharges) || 0;
    const mv = Math.round(w * rate * 100) / 100;
    return { ...item, metalValue: mv, total: Math.round((mv + mk) * 100) / 100 };
  };

  const updateItem = useCallback((id, field, value) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      if (field === 'weight' || field === 'makingCharges') return recalcItem(updated, metalRate);
      return updated;
    }));
  }, [metalRate]);

  // Product add from search removed

  const addEmptyItem = useCallback(() => setItems(prev => [...prev, createEmptyItem()]), []);
  const removeItem = useCallback((id) => setItems(prev => prev.filter(it => it.id !== id)), []);

  /* ─── Recalc on rate change ─── */
  useEffect(() => {
    if (metalRate > 0) setItems(prev => prev.map(it => recalcItem(it, metalRate)));
  }, [metalRate]);

  /* ─── Click-outside ─── */
  useEffect(() => {
    const handler = (e) => { 
        if (custWrapRef.current && !custWrapRef.current.contains(e.target)) setShowCustSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ─── Keyboard Shortcuts ─── */
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Escape' && !showModal) handleCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showModal]);

  /* ─── Image Upload ─── */
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => { setDesignImages(prev => [...prev, { name: file.name, url: ev.target.result, size: file.size }]); };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  const removeImage = (idx) => setDesignImages(prev => prev.filter((_, i) => i !== idx));

  /* ═══ INSTANT LOCAL CALCULATIONS (Matching Billing) ═══ */
  const calc = useMemo(() => {
    const totalWeight = items.reduce((s, i) => s + (parseFloat(i.weight) || 0), 0);
    const totalMaking = items.reduce((s, i) => s + (parseFloat(i.makingCharges) || 0), 0);

    const oldWt = parseFloat(oldWeight) || 0;
    const deductPct = parseFloat(oldDeductPct) || 0;
    
    // Netting the physical weight first
    const netWeight = totalWeight - oldWt;
    let baseMetalValue = 0;

    if (netWeight >= 0) {
       // Customer buys more weight than they deposited
       baseMetalValue = netWeight * metalRate;
    } else {
       // Customer deposited more weight than they bought
       const adjustedRate = metalRate * (1 - deductPct / 100);
       baseMetalValue = netWeight * adjustedRate; // This is a negative value
    }

    // Subtotal combines the Net Metal Value and Making Charges
    const subtotal = baseMetalValue + totalMaking;

    // Hallmark
    const hc = parseInt(hallmarkCount) || 0;
    const hallmarkAmt = hc * hallmarkValue;

    const oc = parseFloat(otherCharges) || 0;
    
    // All charges added together (always against customer)
    const payableBeforeTax = subtotal + hallmarkAmt + oc;

    // GST (only for Invoice)
    const isInvoice = orderType === 'Invoice';
    // GST triggers on the absolute value of the net transaction
    const gstBase = Math.abs(payableBeforeTax);
    const cgst = isInvoice ? (gstBase * 0.015) : 0;
    const sgst = isInvoice ? (gstBase * 0.015) : 0;

    const adv = parseFloat(advance) || 0;
    const disc = parseFloat(discount) || 0;

    // The final pre-round algebraic sum
    const preRound = payableBeforeTax + cgst + sgst - adv - disc;
    
    const roundOff = Math.round(preRound);
    const roundOffVal = roundOff - preRound;
    const finalAmt = roundOff;

    const balance = Math.abs(finalAmt);

    return {
      totalWeight, totalMaking, subtotal,
      netWeight, baseMetalValue, oldWt, deductPct,
      hallmarkAmt, cgst, sgst,
      otherChargesVal: oc, advanceVal: adv, discountVal: disc,
      preRound, roundOffVal, finalAmt, balance,
      amountInWords: amountWords(finalAmt),
    };
  }, [items, oldWeight, oldDeductPct, metalRate, hallmarkCount, hallmarkValue, orderType, otherCharges, advance, discount]);

  /* ─── Print Preview ─── */
  const [printData, setPrintData] = useState(null);

  /* ─── Actions ─── */
  const handleSave = async (redirectAfter = true) => {
      if (!custName.trim()) {
          alert('Validation Error: Customer name is required.');
          return false;
      }
      if (items.length === 0) {
          alert('Validation Error: Order must have at least one item.');
          return false;
      }
      try {
          let finalId = customerId;
          if (!finalId) {
             const cr = await api.post('/customers/', {
                 shop: 1, name: custName, phone: custMobile || `NA-${Date.now().toString().slice(-8)}`, address: custAddress
             });
             finalId = cr.data.id;
             setCustomerId(finalId);
          }

          const payload = {
              shop: 1, 
              customer: finalId,
              order_no: orderNumber || undefined, // Backend gen
              order_status: orderStatus.toLowerCase().replace(' ', '_'),
              order_type: orderType.toLowerCase(),
              metal_type: metalType,
              metal_rate: metalRate,
              priority: priority,
              worker: assignedWorker,
              design_notes: designNotes,
              weight_total: Number(calc.totalWeight || 0).toFixed(3),
              making_total: Number(calc.totalMaking || 0).toFixed(2),
              subtotal: Number(calc.subtotal || 0).toFixed(2),
              old_weight: Number(calc.oldWt || 0).toFixed(3),
              old_amount: Number(Math.abs(calc.baseMetalValue || 0)).toFixed(2),
              advance: Number(calc.advanceVal || 0).toFixed(2),
              cgst: Number(calc.cgst || 0).toFixed(2),
              sgst: Number(calc.sgst || 0).toFixed(2),
              hallmark: Number(calc.hallmarkAmt || 0).toFixed(2),
              others: Number(calc.otherChargesVal || 0).toFixed(2),
              discount: Number(calc.discountVal || 0).toFixed(2),
              round_off: Number(calc.roundOffVal || 0).toFixed(2),
              grand_total: Number(calc.finalAmt || 0).toFixed(2),
              payment_method: paymentMode.toLowerCase(),
              delivery_date: deliveryDate ? deliveryDate : null,
              items: items.map(it => ({
                  inventory_item: null,
                  product_name: it.name,
                  design_remarks: it.specialNotes,
                  size: it.size,
                  metal_type: metalType,
                  expected_weight: Number(it.weight || 0).toFixed(3),
                  metal_value: Number(it.metalValue || 0).toFixed(2),
                  making_charge: Number(it.makingCharges || 0).toFixed(2),
                  total: Number(it.total || 0).toFixed(2),
                  status: 'created'
              })),
              design_images: designImages.map(img => img.url)
          };
          
          console.log("Payload:", payload);
          await api.post('/orders/', payload);
          if (redirectAfter) {
            alert('Order saved successfully!');
            navigate('/orders/list');
          }
          return true;
      } catch (err) {
          console.error(err);
          alert('Failed to save order. Make sure customer is selected and items are valid.');
          return false;
      }
  };

  const handlePrint = async () => {
      const success = await handleSave(false);
      if (success) {
          const docData = {
              docType: 'ORDER RECEIPT',
              theme: metalType.toLowerCase() === 'silver' ? 'silver' : 'gold',
              customer: { name: custName, phone: custMobile, address: custAddress },
              meta: { number: orderNumber || 'NEW', date: new Date().toLocaleDateString('en-IN') },
              rates: { rate10gm: metalRate * 10, priority: priority },
              items: items.map(it => ({
                  name: it.name + (it.size ? ` (Size: ${it.size})` : ''),
                  weight: it.weight || 0,
                  metalValue: it.metalValue || 0,
                  making: it.makingCharges || 0,
                  total: it.total || 0
              })),
              oldMetal: parseFloat(oldWeight) > 0 ? { weight: parseFloat(oldWeight), value: Math.abs(calc.baseMetalValue) } : null,
              totals: {
                  subtotal: calc.subtotal,
                  cgst: calc.cgst,
                  sgst: calc.sgst,
                  otherCharges: calc.otherChargesVal,
                  hallmark: calc.hallmarkAmt,
                  advance: calc.advanceVal,
                  discount: calc.discountVal,
                  roundOff: calc.roundOffVal,
                  finalAmount: calc.finalAmt,
                  amountInWords: calc.amountInWords
              },
              payment: { amounts: [
                  { mode: 'ADVANCE', amount: calc.advanceVal }
              ].filter(x => x.amount > 0) }
          };
          setPrintData(docData);
      }
  };

  const handleCancel = () => { setShowModal(true); setItems([]); setDesignImages([]); };

  const statusColors = { Pending: 'warning', 'In Progress': 'info', Completed: 'success', Delivered: 'primary' };

  /* ═══ RENDER ═══ */
  if (showModal) return <OrderSetupModal onStart={handleStart} onClose={() => navigate('/dashboard')} />;

  return (
    <div className="animate-fade-in">
      {/* ─── Page Header ─── */}
      <div className="page-header">
        <div className="page-header__top">
          <div className="flex items-center gap-3">
            <h1 className="page-header__title">New {metalType} Order</h1>
            <span className={`badge ${orderType === 'Invoice' ? 'badge--primary' : 'badge--info'}`} style={{ fontSize: 'var(--text-sm)', padding: '4px 12px' }}>{orderType}</span>
            <span className="badge badge--warning" style={{ fontSize: 'var(--text-sm)', padding: '4px 12px' }}>
              <i className="fa-solid fa-coins" style={{ marginRight: 4 }}></i>{metalType} @ {fmt(metalRate)}/g
            </span>
            {orderType === 'Invoice' && <span className="badge badge--success" style={{ fontSize: 'var(--text-xs)', padding: '3px 8px' }}>GST 3%</span>}
            <span className={`badge badge--${statusColors[orderStatus]}`} style={{ fontSize: 'var(--text-sm)', padding: '4px 12px' }}>{orderStatus}</span>
          </div>
          <div className="page-header__actions">
            <span className="kbd-hint">Ctrl+S Save</span>
            <button className="btn btn--ghost btn--sm" onClick={handleCancel}><i className="fa-solid fa-xmark"></i> Cancel</button>
            <button className="btn btn--primary" onClick={handleSave}><i className="fa-solid fa-check"></i> Save Order</button>
          </div>
        </div>
      </div>

      {/* ─── Customer + Order Info ─── */}
      <div className="billing-form animate-fade-in-up" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="billing-form__header">
          <span className="billing-form__header-title"><i className="fa-solid fa-user" style={{ marginRight: 8, opacity: 0.6 }}></i>Customer & Order Details</span>
        </div>
        <div className="billing-form__body" style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <div className="form-row" style={{ gridTemplateColumns: '1.5fr 1fr 2fr' }}>
            <div className="form-group" style={{ marginBottom: 'var(--space-3)', position: 'relative' }} ref={custWrapRef}>
              <label className="form-label">Customer Name *</label>
              <input 
                 className="form-input" 
                 type="text" 
                 placeholder="Search or enter customer..." 
                 value={custName} 
                 onChange={e => { setCustName(e.target.value); setCustomerId(null); setShowCustSuggestions(true); }} 
              />
              {showCustSuggestions && custSuggestions.length > 0 && (
                <div className="search-ac__dropdown">
                  {custSuggestions.map(c => (
                    <div key={c.id} className="search-ac__item" onClick={() => selectCustomer(c)}>
                      <span>{c.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.phone}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
              <label className="form-label">Mobile Number</label>
              <input className="form-input" type="tel" placeholder="Phone number" value={custMobile} onChange={e => setCustMobile(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
              <label className="form-label">Address</label>
              <input className="form-input" type="text" placeholder="Customer address" value={custAddress} onChange={e => setCustAddress(e.target.value)} />
            </div>
          </div>
          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Order Date *</label>
              <input className="form-input" type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Delivery Date *</label>
              <input className="form-input" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} style={{ borderColor: !deliveryDate ? 'var(--color-warning)' : undefined }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Priority</label>
              <select className="form-input form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                <option>Normal</option><option>High</option><option>Urgent</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select className="form-input form-select" value={orderStatus} onChange={e => setOrderStatus(e.target.value)}>
                <option>Pending</option><option>In Progress</option><option>Completed</option><option>Delivered</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{metalType} Rate (₹/g)</label>
              <select
                className="form-input form-select"
                value={metalRate}
                onChange={e => setMetalRate(parseFloat(e.target.value) || 0)}
                style={{ fontWeight: 700, color: 'var(--color-warning)' }}
              >
                {rateOptions.length === 0 && <option value={metalRate}>{metalRate > 0 ? `₹${metalRate}` : 'No rates set'}</option>}
                {rateOptions.map(r => (
                  <option key={r.key} value={r.rate}>{r.label} — ₹{r.rate.toLocaleString('en-IN')}/g</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Worker Assignment (Auto-Suggestion) ─── */}
      <div className="billing-form animate-fade-in-up" style={{ animationDelay: '40ms', animationFillMode: 'both', marginBottom: 'var(--space-4)' }}>
        <div className="billing-form__header" style={{ padding: 'var(--space-3) var(--space-5)' }}>
          <span className="billing-form__header-title" style={{ fontSize: 'var(--text-sm)' }}>
            <i className="fa-solid fa-user-gear" style={{ marginRight: 8, opacity: 0.6 }}></i>Worker Assignment
          </span>
        </div>
        <div className="billing-form__body" style={{ padding: 'var(--space-3) var(--space-5) var(--space-4)' }}>
          <div className="form-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assigned Worker / Karigar</label>
              <WorkerInput value={assignedWorker} onChange={setAssignedWorker} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Estimated Days</label>
              <input className="form-input" type="number" placeholder="Days to complete" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Urgency Note</label>
              <input className="form-input" type="text" placeholder="Any urgency info..." />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Product Search + Items Table ─── */}
      <div className="billing-form animate-fade-in-up" style={{ animationDelay: '80ms', animationFillMode: 'both', marginBottom: 'var(--space-4)' }}>
        <div className="billing-form__header">
          <span className="billing-form__header-title"><i className="fa-solid fa-gem" style={{ marginRight: 8, opacity: 0.6 }}></i>Order Items</span>
          <div className="flex gap-2">
            <button className="btn btn--primary btn--sm" onClick={addEmptyItem}><i className="fa-solid fa-plus"></i> Add Item Details</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="billing-items-table">
            <thead>
              <tr>
                <th style={{ width: '3%' }}>#</th>
                <th style={{ width: '22%' }}>Product / Design</th>
                <th style={{ width: '8%' }}>Size</th>
                <th style={{ width: '10%' }}>Approx Wt (g)</th>
                <th style={{ width: '12%' }}>Metal Value (₹)</th>
                <th style={{ width: '10%' }}>Making (₹)</th>
                <th style={{ width: '12%' }}>Est. Total (₹)</th>
                <th style={{ width: '18%' }}>Special Notes</th>
                <th style={{ width: '4%' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-box-open" style={{ fontSize: '1.5rem', marginBottom: 8, display: 'block', opacity: 0.3 }}></i>
                  Search for a product or click "Add Item"
                </td></tr>
              ) : items.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>{idx + 1}</td>
                  <td><input className="form-input" type="text" placeholder="Product name" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} style={{ height: 32, fontSize: 'var(--text-sm)' }} /></td>
                  <td><input className="form-input" type="text" placeholder="—" value={item.size} onChange={e => updateItem(item.id, 'size', e.target.value)} style={{ height: 32, fontSize: 'var(--text-sm)' }} /></td>
                  <td><input className="form-input" type="number" step="0.001" placeholder="0.000" value={item.weight} onChange={e => updateItem(item.id, 'weight', e.target.value)} style={{ height: 32, fontSize: 'var(--text-sm)' }} /></td>
                  <td><span className="bill-readonly-val">{item.metalValue ? fmt(item.metalValue) : '—'}</span></td>
                  <td><input className="form-input" type="number" step="1" placeholder="0" value={item.makingCharges} onChange={e => updateItem(item.id, 'makingCharges', e.target.value)} style={{ height: 32, fontSize: 'var(--text-sm)' }} /></td>
                  <td><span className="bill-readonly-val bill-readonly-val--highlight">{item.total ? fmt(item.total) : '—'}</span></td>
                  <td><input className="form-input" type="text" placeholder="Notes..." value={item.specialNotes} onChange={e => updateItem(item.id, 'specialNotes', e.target.value)} style={{ height: 32, fontSize: 'var(--text-sm)' }} /></td>
                  <td><button className="btn btn--ghost btn--sm btn--icon" onClick={() => removeItem(item.id)} style={{ color: 'var(--color-danger)', width: 28, height: 28 }}><i className="fa-solid fa-trash-can" style={{ fontSize: '0.7rem' }}></i></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length > 0 && (
          <div className="bill-totals-bar">
            <div className="bill-totals-item"><span className="bill-totals-label">Total Weight</span><span className="bill-totals-value">{calc.totalWeight.toFixed(3)} g</span></div>
            <div className="bill-totals-item"><span className="bill-totals-label">Total Metal Value</span><span className="bill-totals-value">{fmt(calc.totalWeight * metalRate)}</span></div>
            <div className="bill-totals-item"><span className="bill-totals-label">Total Making</span><span className="bill-totals-value">{fmt(calc.totalMaking)}</span></div>
            <div className="bill-totals-item" style={{ borderLeft: '2px solid var(--color-primary)', paddingLeft: 'var(--space-4)' }}>
              <span className="bill-totals-label" style={{ color: 'var(--color-primary-hover)' }}>Net Weight</span>
              <span className="bill-totals-value" style={{ color: 'var(--color-primary-hover)', fontSize: 'var(--text-md)', fontWeight: 700 }}>{calc.netWeight.toFixed(3)}g</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Section: 2 Columns ─── */}
      <div className="bill-bottom-grid">
        {/* ═══ LEFT COLUMN ═══ */}
        <div>
          {/* Design Notes & Image Upload */}
          <div className="billing-form animate-fade-in-up" style={{ animationDelay: '120ms', animationFillMode: 'both', marginBottom: 'var(--space-4)' }}>
            <div className="billing-form__header" style={{ padding: 'var(--space-3) var(--space-5)' }}>
              <span className="billing-form__header-title" style={{ fontSize: 'var(--text-sm)' }}><i className="fa-solid fa-palette" style={{ marginRight: 8, opacity: 0.6 }}></i>Design Details</span>
            </div>
            <div className="billing-form__body" style={{ padding: 'var(--space-3) var(--space-5) var(--space-4)' }}>
              <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                <label className="form-label">Custom Design Notes</label>
                <textarea className="form-input form-textarea" placeholder="Describe the design..." value={designNotes} onChange={e => setDesignNotes(e.target.value)} style={{ minHeight: 80 }}></textarea>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Design Reference Images</label>
                <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed var(--border-hover)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-surface)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; }}>
                  <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}></i>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Click to upload</div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageUpload} />
                {designImages.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    {designImages.map((img, i) => (
                      <div key={i} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-primary)', aspectRatio: '1' }}>
                        <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-xmark"></i></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Old Metal Exchange */}
          <div className="billing-form animate-fade-in-up" style={{ animationDelay: '140ms', animationFillMode: 'both', marginBottom: 'var(--space-4)' }}>
            <div className="billing-form__header" style={{ padding: 'var(--space-3) var(--space-5)' }}>
              <span className="billing-form__header-title" style={{ fontSize: 'var(--text-sm)' }}><i className="fa-solid fa-scale-balanced" style={{ marginRight: 8, opacity: 0.6 }}></i>Old Metal Exchange</span>
            </div>
            <div className="billing-form__body" style={{ padding: 'var(--space-3) var(--space-5) var(--space-4)' }}>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group" style={{ marginBottom: 'var(--space-2)' }}>
                  <label className="form-label">Old Metal Weight (g)</label>
                  <input className="form-input" type="number" step="0.001" placeholder="0.000" value={oldWeight} onChange={e => setOldWeight(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 'var(--space-2)' }}>
                  <label className="form-label">Deduction %</label>
                  <div className="flex gap-2">
                    <select className="form-input form-select" value={oldDeductPct} onChange={e => setOldDeductPct(e.target.value)} style={{ width: '50%' }}>
                      <option value="8">8%</option><option value="10">10%</option><option value="12">12%</option>
                    </select>
                    <input className="form-input" type="number" step="0.1" placeholder="Custom %" value={oldDeductPct} onChange={e => setOldDeductPct(e.target.value)} style={{ width: '50%' }} />
                  </div>
                </div>
              </div>
              {parseFloat(oldWeight) > 0 && (
                <div className="bill-old-summary animate-fade-in">
                  <div className="flex justify-between"><span>Old Metal Weight</span><span style={{ fontWeight: 600 }}>{calc.oldWt.toFixed(3)}g</span></div>
                  <div className="flex justify-between"><span>Base Rate Applied</span><span>{fmt(metalRate * (1 - calc.deductPct / 100))}</span></div>
                </div>
              )}
            </div>
          </div>

          {/* Charges & Deductions */}
          <div className="billing-form animate-fade-in-up" style={{ animationDelay: '160ms', animationFillMode: 'both', marginBottom: 'var(--space-4)' }}>
            <div className="billing-form__header" style={{ padding: 'var(--space-3) var(--space-5)' }}>
              <span className="billing-form__header-title" style={{ fontSize: 'var(--text-sm)' }}><i className="fa-solid fa-calculator" style={{ marginRight: 8, opacity: 0.6 }}></i>Charges & Deductions</span>
            </div>
            <div className="billing-form__body" style={{ padding: 'var(--space-3) var(--space-5) var(--space-4)' }}>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="form-label">Other Charges (₹)</label>
                  <input className="form-input" type="number" step="1" placeholder="0" value={otherCharges} onChange={e => setOtherCharges(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="form-label">Hallmark Count <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(×₹{hallmarkValue})</span></label>
                  <input className="form-input" type="number" step="1" placeholder="0" value={hallmarkCount} onChange={e => setHallmarkCount(e.target.value)} />
                </div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="form-label">Add Advance (₹)</label>
                  <input className="form-input" type="number" step="1" placeholder="0" value={advance} onChange={e => setAdvance(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="form-label">Discount (₹)</label>
                  <input className="form-input" type="number" step="1" placeholder="0" value={discount} onChange={e => setDiscount(e.target.value)} />
                </div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Mode</label>
                  <select className="form-input form-select" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                    <option>Cash</option><option>Online / UPI</option><option>Card</option><option>Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN — ORDER SUMMARY ═══ */}
        <div className="bill-summary-card animate-fade-in-up" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
          <div className="billing-form__header" style={{ padding: 'var(--space-3) var(--space-5)' }}>
            <span className="billing-form__header-title" style={{ fontSize: 'var(--text-sm)' }}><i className="fa-solid fa-receipt" style={{ marginRight: 8, opacity: 0.6 }}></i>Order Summary</span>
          </div>
          <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
            {/* Order Details Recap */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Type</span></div>
              <div style={{ textAlign: 'right' }}><span className={`badge ${orderType === 'Invoice' ? 'badge--primary' : 'badge--info'}`}>{orderType}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Metal</span></div>
              <div style={{ textAlign: 'right', fontWeight: 600 }}>{metalType} @ {fmt(metalRate)}/g</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Delivery</span></div>
              <div style={{ textAlign: 'right', fontWeight: 600, color: deliveryDate ? 'var(--text-primary)' : 'var(--color-warning)' }}>{deliveryDate || 'Not set'}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Priority</span></div>
              <div style={{ textAlign: 'right' }}><span className={`badge badge--${priority === 'Urgent' ? 'danger' : priority === 'High' ? 'warning' : 'primary'}`}>{priority}</span></div>
              {assignedWorker && <>
                <div><span style={{ color: 'var(--text-muted)' }}>Worker</span></div>
                <div style={{ textAlign: 'right', fontWeight: 500 }}>{assignedWorker.split('—')[0].trim()}</div>
              </>}
            </div>

            {/* Summary Lines */}
            <div className="bill-summary-lines">
              <div className="bill-sline">
                <span>Net Metal Base {calc.netWeight < 0 && <span style={{ color: 'var(--color-danger)' }}>({calc.netWeight.toFixed(3)}g)</span>}</span>
                <span style={{ color: calc.baseMetalValue < 0 ? 'var(--color-danger)' : 'inherit' }}>{fmt(calc.baseMetalValue)}</span>
              </div>
              <div className="bill-sline"><span>(+) Total Making</span><span>{fmt(calc.totalMaking)}</span></div>
              <div className="bill-sline" style={{ fontWeight: 600, borderBottom: '1px dashed var(--border-primary)', paddingBottom: 8, marginBottom: 8 }}>
                 <span>Subtotal</span><span>{fmt(calc.subtotal)}</span>
              </div>
              <div className="bill-sline"><span>(+) Other Charges</span><span>{fmt(calc.otherChargesVal)}</span></div>
              <div className="bill-sline">
                <span>(+) Hallmark {parseInt(hallmarkCount) > 0 && <span style={{ color: 'var(--text-muted)' }}>({hallmarkCount} × ₹{hallmarkValue})</span>}</span>
                <span>{fmt(calc.hallmarkAmt)}</span>
              </div>
              {orderType === 'Invoice' && (<>
                <div className="bill-sline"><span>(+) CGST @ 1.5%</span><span>{fmt(calc.cgst)}</span></div>
                <div className="bill-sline"><span>(+) SGST @ 1.5%</span><span>{fmt(calc.sgst)}</span></div>
              </>)}
              <div className="bill-sline"><span>(−) Advance</span><span>{calc.advanceVal > 0 ? '−' : ''}{fmt(calc.advanceVal)}</span></div>
              <div className="bill-sline bill-sline--deduct"><span>(−) Discount</span><span>{calc.discountVal > 0 ? '−' : ''}{fmt(calc.discountVal)}</span></div>
              <div className="bill-sline" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                <span>Round Off</span>
                <span>{calc.roundOffVal >= 0 ? '+' : ''}{calc.roundOffVal.toFixed(2)}</span>
              </div>
            </div>

            {/* Final Amount */}
            <div className="bill-final-block">
              <div className="bill-final-label">FINAL AMOUNT</div>
              <div className="bill-final-value">{fmtInt(calc.finalAmt)}</div>
              <div className="bill-final-words">{calc.amountInWords}</div>
            </div>

            {/* Indicator */}
            {calc.finalAmt !== 0 && (
              <div style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
                {calc.finalAmt > 0 ? (
                  <span className="bill-indicator bill-indicator--pay"><i className="fa-solid fa-arrow-up"></i> Customer Pays</span>
                ) : (
                  <span className="bill-indicator bill-indicator--return"><i className="fa-solid fa-arrow-down"></i> Return to Customer</span>
                )}
              </div>
            )}

            {/* Design Images Count */}
            {designImages.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-image" style={{ marginRight: 4 }}></i>
                {designImages.length} design image{designImages.length > 1 ? 's' : ''} attached
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div style={{ padding: 'var(--space-3) var(--space-5) var(--space-4)', borderTop: '1px solid var(--border-primary)', display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn--ghost" onClick={handleCancel} style={{ flex: 1 }}><i className="fa-solid fa-xmark"></i> Cancel</button>
            <button className="btn btn--ghost" onClick={handlePrint} style={{ flex: 1 }}><i className="fa-solid fa-print"></i> Print</button>
            <button className="btn btn--success" onClick={() => handleSave(true)} style={{ flex: 1.5 }}><i className="fa-solid fa-check"></i> Save Order</button>
          </div>
        </div>
      </div>
      <PrintPreviewModal isOpen={!!printData} data={printData} onClose={() => setPrintData(null)} />
    </div>
  );
}
