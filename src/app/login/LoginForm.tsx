"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

type AuthMode = "signin" | "signup";

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (mode === "signin") {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } else {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            brand_name: brandName,
            role: "OWNER",
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      setSuccess(
        "Account created! Check your email to confirm, then sign in."
      );
      setMode("signin");
      setPassword("");
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    border: "1px solid #e0e0e0",
    borderRadius: 10,
    fontSize: "0.9rem",
    background: "#f8f9fb",
    color: "#1a1a2e",
    outline: "none",
    transition: "border-color 0.25s, box-shadow 0.25s",
    boxSizing: "border-box" as const,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#888",
    marginBottom: "0.4rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f6f8",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          padding: "2.5rem",
          background: "#ffffff",
          borderRadius: 20,
          border: "1px solid #e8e8e8",
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
        }}
      >
        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              marginBottom: "0.75rem",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "#fff",
                boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
              }}
            >
              R
            </div>
            <h1
              style={{
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "#1a1a2e",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Riliks
            </h1>
          </div>
          <p
            style={{
              fontSize: "0.8rem",
              color: "#999",
              margin: 0,
            }}
          >
            Fashion ERP — Financial & Ops Engine
          </p>
        </div>

        {/* ── Tabs ── */}
        <div
          style={{
            display: "flex",
            background: "#f0f1f4",
            borderRadius: 12,
            padding: 4,
            marginBottom: "1.75rem",
          }}
        >
          {(["signin", "signup"] as AuthMode[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setMode(tab);
                setError(null);
                setSuccess(null);
              }}
              style={{
                flex: 1,
                padding: "0.6rem",
                border: "none",
                borderRadius: 9,
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.25s",
                background:
                  mode === tab ? "#fff" : "transparent",
                color:
                  mode === tab ? "#1a1a2e" : "#999",
                boxShadow:
                  mode === tab
                    ? "0 2px 8px rgba(0,0,0,0.08)"
                    : "none",
              }}
            >
              {tab === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* ── Error / Success Banners ── */}
        {error && (
          <div
            style={{
              padding: "0.7rem 1rem",
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 10,
              color: "#b91c1c",
              fontSize: "0.78rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: "1rem" }}>⚠</span>
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              padding: "0.7rem 1rem",
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: 10,
              color: "#166534",
              fontSize: "0.78rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: "1rem" }}>✓</span>
            {success}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="fullName" style={labelStyle}>
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ahmed Mohamed"
                  required
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e0e0e0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="brandName" style={labelStyle}>
                  Brand Name
                </label>
                <input
                  id="brandName"
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Your Fashion Brand"
                  required
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e0e0e0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="email" style={labelStyle}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@brand.com"
              required
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e0e0e0";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <label htmlFor="password" style={labelStyle}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e0e0e0";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.8rem",
              background: loading ? "#a5b4fc" : "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s",
              boxShadow: loading
                ? "none"
                : "0 4px 16px rgba(99,102,241,0.25)",
              letterSpacing: "0.02em",
            }}
          >
            {loading
              ? mode === "signin"
                ? "Signing in..."
                : "Creating account..."
              : mode === "signin"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        {/* ── Footer ── */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.65rem",
            color: "#bbb",
            marginTop: "2rem",
            letterSpacing: "0.05em",
          }}
        >
          Powered by{" "}
          <span style={{ color: "#6366f1", fontWeight: 600 }}>
            Riliks
          </span>{" "}
          — SaaS for Fashion Brands
        </p>
      </div>
    </div>
  );
}
