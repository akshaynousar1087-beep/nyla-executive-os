"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, isConfigured } from "@/lib/supabase/client";

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isConfigured()) return;
    let active = true;
    auth.restoreSession().then((session) => {
      if (active && session) router.replace("/dashboard");
    });
    return () => {
      active = false;
    };
  }, [router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!isConfigured())
        throw new Error(
          "Supabase is not configured yet. Add the environment keys, then try again.",
        );
      if (mode === "signup") {
        await auth.signUp(email.trim(), password, name);
        setMode("login");
        setError(
          "Account created. Check your inbox if email confirmation is enabled.",
        );
      } else {
        await auth.signIn(email.trim(), password);
        router.replace("/dashboard");
      }
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "Unable to authenticate.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand">
        <div>
          <span className="login-mark">N</span>
          <b>Nyla</b>
        </div>
        <blockquote>
          “Clarity before activity.
          <br />
          Intent before motion.”
        </blockquote>
        <p>Akshay Noushar · Executive Operating System</p>
      </section>
      <section className="login-form">
        <form onSubmit={submit}>
          <small>PRIVATE WORKSPACE</small>
          <h1>{mode === "login" ? "Welcome back." : "Create your workspace."}</h1>
          <p>
            {mode === "login"
              ? "Sign in to continue to Nyla."
              : "A secure operating system for your life and business."}
          </p>
          {mode === "signup" && (
            <label>
              <span>Full name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
          )}
          <label>
            <span>Email address</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && (
            <div className={error.startsWith("Account") ? "notice" : "error"}>
              {error}
            </div>
          )}
          <button className="login-submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in to Nyla"
                : "Create account"}
          </button>
          <button
            className="mode"
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login"
              ? "New to Nyla? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
