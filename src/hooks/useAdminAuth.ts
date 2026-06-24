import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  bootstrapCurrentUserAsFirstAdmin,
  getCurrentProfile,
  signInAdmin,
  signOutAdmin,
  signUpFirstAdmin,
  resendAdminConfirmation,
} from "../services/supabaseService";
import type { AdminAccount } from "../types/auth";

export function useAdminAuth() {
  const [account, setAccount] = useState<AdminAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        let profile = await getCurrentProfile(data.session.user);
        if (profile && profile.role !== "admin") {
          try {
            await bootstrapCurrentUserAsFirstAdmin();
            profile = await getCurrentProfile(data.session.user);
          } catch {
            // Another admin already exists.
          }
        }
        if (active && profile?.role === "admin") setAccount(profile);
      }
      if (active) setLoading(false);
      if (window.location.hash.includes("access_token=")) {
        window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}`);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (!session?.user) setAccount(null);
      else {
        const profile = await getCurrentProfile(session.user);
        setAccount(profile?.role === "admin" ? profile : null);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const register = async (email: string, displayName: string, password: string) => {
    const result = await signUpFirstAdmin(email, displayName, password);
    if (result.account) setAccount(result.account);
    return result;
  };

  const login = async (email: string, password: string) => {
    try {
      const profile = await signInAdmin(email, password);
      setAccount(profile);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    await signOutAdmin();
    setAccount(null);
  };

  const resendConfirmation = async (email: string) => {
    await resendAdminConfirmation(email);
  };

  return {
    account,
    authenticated: account?.role === "admin",
    loading,
    register,
    login,
    logout,
    resendConfirmation,
  };
}
