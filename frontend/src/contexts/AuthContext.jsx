/**
 * ─── Auth Context ───────────────────────────────────────────────
 * Global authentication state provider.
 *
 * Responsibilities:
 *   • Listens to Supabase auth state changes
 *   • Fetches the user profile from the `profiles` table
 *   • Exposes login / register / logout via the service layer
 *   • Never calls Supabase directly (delegates to authService)
 * ────────────────────────────────────────────────────────────────
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Profile fetch (via service-exposed supabase client) ────────
  const fetchProfile = useCallback(async (userId) => {
    try {
      const sb = authService.getSupabaseClient();
      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) setProfile(data);
    } catch {
      // Swallow — profile is optional metadata
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Bootstrap: check existing session + subscribe to changes ───
  useEffect(() => {
    const sb = authService.getSupabaseClient();

    // 1. Check current session
    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // 2. Listen for future auth events
    const { data: { subscription } } = sb.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ── Wrapped methods (delegate to authService) ──────────────────
  const login = useCallback(async (email, password) => {
    await authService.signIn(email, password);
    // State updates happen automatically via onAuthStateChange
  }, []);

  const register = useCallback(async (email, password, metadata) => {
    return await authService.signUp(email, password, metadata);
  }, []);

  const logout = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
