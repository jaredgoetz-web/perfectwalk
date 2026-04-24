import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { clearSignupDraft } from "@/lib/authDraft";

const AuthCallback = () => {
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finalize = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const errorDescription = params.get("error_description");

      if (errorDescription) {
        setError(errorDescription);
        setStatus("error");
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          setStatus("error");
          return;
        }
      }

      clearSignupDraft();
      setStatus("ready");
    };

    void finalize();
  }, [location.search]);

  if (status === "ready") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">
          {status === "error" ? "Login couldn't finish" : "Finishing your login"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {status === "error"
            ? error ?? "Please go back and try again."
            : "Just a second while we secure your account and load your practice."}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
