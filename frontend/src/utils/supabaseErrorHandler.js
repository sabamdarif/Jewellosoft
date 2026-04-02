/**
 * ─── Supabase Error Handler ─────────────────────────────────────
 * Centralised error mapper for every Supabase Auth / REST error.
 * Components NEVER parse raw errors — they receive clean strings.
 * ────────────────────────────────────────────────────────────────
 */

const ERROR_MAP = {
  // ── Rate limits ────────────────────────────────────────────────
  'email rate limit exceeded': 'Too many attempts. Please wait a minute before trying again.',
  'rate limit exceeded': 'You are being rate limited. Please wait a moment.',
  'over_email_send_rate_limit': 'Email sending limit reached. Please wait 60 seconds.',

  // ── Email / Confirmation ───────────────────────────────────────
  'email not confirmed': 'Please verify your email address before logging in. Check your inbox.',
  'email_not_confirmed': 'Please verify your email address before logging in. Check your inbox.',
  'email link is invalid or has expired': 'The confirmation link has expired. Please request a new one.',

  // ── Credentials ────────────────────────────────────────────────
  'invalid login credentials': 'Incorrect email or password. Please try again.',
  'invalid credentials': 'Incorrect email or password. Please try again.',
  'invalid_credentials': 'Incorrect email or password. Please try again.',

  // ── Signup ─────────────────────────────────────────────────────
  'user already registered': 'An account with this email already exists. Try logging in.',
  'a]user with this email address has already been registered': 'An account with this email already exists.',
  'password should be at least 6 characters': 'Password must be at least 6 characters long.',
  'signup_disabled': 'New registrations are currently disabled. Contact support.',

  // ── Session / Token ────────────────────────────────────────────
  'refresh_token_not_found': 'Your session has expired. Please log in again.',
  'session_not_found': 'Your session has expired. Please log in again.',
  'invalid claim: missing sub claim': 'Your session is invalid. Please log in again.',

  // ── Network ────────────────────────────────────────────────────
  'failed to fetch': 'Unable to connect. Please check your internet connection.',
  'fetch failed': 'Unable to connect. Please check your internet connection.',
  'networkerror': 'Network error. Please check your internet connection.',
  'load failed': 'Connection failed. Please check your internet and try again.',
};

/**
 * Parse any error thrown by Supabase or the network layer into a
 * user-friendly string.
 *
 * @param {Error|Object|string} error
 * @returns {string} Human-readable error message
 */
export function parseAuthError(error) {
  if (!error) return 'An unexpected error occurred.';

  // Extract the raw message from whatever shape we receive
  const raw =
    typeof error === 'string'
      ? error
      : error?.message || error?.error_description || error?.msg || '';

  const needle = raw.toLowerCase().trim();

  // Direct map lookup
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (needle.includes(key)) return friendly;
  }

  // HTTP status codes (Supabase sometimes attaches `.status`)
  const status = error?.status || error?.statusCode;
  if (status === 429) return ERROR_MAP['rate limit exceeded'];
  if (status === 422) return 'Invalid input. Please check your details.';
  if (status === 500) return 'Server error. Please try again later.';

  // Fallback — never expose raw technical messages to the user
  if (needle.length > 0 && needle.length < 120) return raw;
  return 'Something went wrong. Please try again.';
}

/**
 * Returns true if the error is a rate-limit (429) error.
 */
export function isRateLimitError(error) {
  if (!error) return false;
  const raw = (error?.message || error?.error_description || '').toLowerCase();
  return (
    error?.status === 429 ||
    raw.includes('rate limit') ||
    raw.includes('over_email_send_rate_limit')
  );
}

/**
 * Returns true if the error indicates email is not confirmed.
 */
export function isEmailNotConfirmed(error) {
  if (!error) return false;
  const raw = (error?.message || error?.error_description || '').toLowerCase();
  return raw.includes('email not confirmed') || raw.includes('email_not_confirmed');
}
