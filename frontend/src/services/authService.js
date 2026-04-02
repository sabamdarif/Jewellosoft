/**
 * ─── Auth Service Layer ─────────────────────────────────────────
 * The ONLY module that touches Supabase Auth.  Every component
 * calls this service — never Supabase directly.
 *
 * Features:
 *   • Request-locking (prevents duplicate signup/login)
 *   • Offline detection (blocks calls when no network)
 *   • Exponential back-off retry on 429
 *   • Centralised error parsing (user-friendly strings)
 *   • Email-confirmation awareness
 * ────────────────────────────────────────────────────────────────
 */

import { supabase } from '../lib/supabase';
import { parseAuthError, isRateLimitError } from '../utils/supabaseErrorHandler';

// ── Request lock (prevents duplicate parallel calls) ────────────
const _locks = {};

function acquireLock(key) {
  if (_locks[key]) return false; // already in-flight
  _locks[key] = true;
  return true;
}

function releaseLock(key) {
  _locks[key] = false;
}

// ── Offline check ────────────────────────────────────────────────
function assertOnline() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw Object.assign(
      new Error('You are offline. Please check your internet connection and try again.'),
      { __offline: true }
    );
  }
}

// ── Retry helper (exponential back-off for 429s) ────────────────
async function withRetry(fn, { maxRetries = 2, baseDelay = 2000 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (isRateLimitError(err) && attempt < maxRetries) {
        attempt++;
        const delay = baseDelay * Math.pow(2, attempt - 1); // 2s, 4s
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

// ─── PUBLIC API ──────────────────────────────────────────────────

/**
 * Sign up a new user.
 * @returns {{ user, session, needsEmailConfirmation: boolean }}
 */
export async function signUp(email, password, metadata = {}) {
  assertOnline();
  if (!acquireLock('signup')) throw new Error('Registration already in progress.');

  try {
    const result = await withRetry(async () => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    });

    const user = result?.user;
    const session = result?.session;

    // Supabase returns a user with identities=[] when email already exists
    // but doesn't throw an error — handle this gracefully
    if (user && user.identities && user.identities.length === 0) {
      throw new Error('user already registered');
    }

    // Determine if email confirmation is required
    // (session is null when Supabase requires email confirmation)
    const needsEmailConfirmation = !!user && !session;

    // Create profile row (only if user was actually created)
    if (user && user.id) {
      try {
        await supabase.from('profiles').insert([{
          id: user.id,
          email,
          shop_name: metadata.shopName || '',
          owner_name: metadata.ownerName || '',
          mobile_number: metadata.mobileNumber || '',
        }]);
      } catch (profileErr) {
        // Profile insert failure is non-fatal for signup
        // (the auth user was already created successfully)
        console.warn('Profile insert failed (non-fatal):', profileErr?.message);
      }
    }

    return { user, session, needsEmailConfirmation };
  } catch (err) {
    throw new Error(parseAuthError(err));
  } finally {
    releaseLock('signup');
  }
}

/**
 * Sign in an existing user.
 * @returns {{ user, session }}
 */
export async function signIn(email, password) {
  assertOnline();
  if (!acquireLock('signin')) throw new Error('Login already in progress.');

  try {
    const result = await withRetry(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    });

    return { user: result.user, session: result.session };
  } catch (err) {
    throw new Error(parseAuthError(err));
  } finally {
    releaseLock('signin');
  }
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  if (!acquireLock('signout')) return; // silent — don't error on double-tap logout

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (err) {
    // Even if signOut fails server-side, clear local state
    console.warn('SignOut API error (local state cleared):', err?.message);
  } finally {
    releaseLock('signout');
  }
}

/**
 * Resend confirmation email.
 */
export async function resendConfirmation(email) {
  assertOnline();
  if (!acquireLock('resend')) throw new Error('Please wait before requesting another email.');

  try {
    await withRetry(async () => {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
    });
  } catch (err) {
    throw new Error(parseAuthError(err));
  } finally {
    releaseLock('resend');
  }
}

/**
 * Get the current session (safe, never throws).
 */
export async function getSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the Supabase client instance (for AuthContext listener only).
 * Components must NOT import this.
 */
export function getSupabaseClient() {
  return supabase;
}
