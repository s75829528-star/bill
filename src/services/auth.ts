/**
 * auth.ts — reusable Supabase auth service
 *
 * All authentication operations go through here so the rest of the
 * app never imports supabase directly for auth purposes.
 */

import { supabase } from "../lib/supabase";

// ── Types re-exported for convenience ─────────────────────────────

export type { User, Session } from "@supabase/supabase-js";

// ── Auth service ───────────────────────────────────────────────────

export const authService = {
  /**
   * Returns the current session (null if unauthenticated).
   * Safe to call on mount — does NOT throw.
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Sign in with email + password.
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Create a new account.
   * @param emailRedirectTo  Full URL for the email verification callback.
   */
  async signUp(
    email: string,
    password: string,
    fullName: string,
    emailRedirectTo: string
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo,
      },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Sign out the current user.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Send a password-reset email.
   * @param redirectTo  Full URL for the reset-password page.
   */
  async resetPasswordForEmail(email: string, redirectTo: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
  },

  /**
   * Set a new password (must be called inside a PASSWORD_RECOVERY session).
   */
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  /**
   * Re-send the signup verification email.
   */
  async resendVerification(email: string, emailRedirectTo: string) {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo },
    });
    if (error) throw error;
  },

  /**
   * Exchange an auth code (from email link) for a session.
   */
  async exchangeCodeForSession(code: string) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data;
  },

  /**
   * Subscribe to auth state changes. Returns the unsubscribe function.
   */
  onAuthStateChange(
    callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
  ) {
    const { data } = supabase.auth.onAuthStateChange(callback);
    return () => data.subscription.unsubscribe();
  },
};
