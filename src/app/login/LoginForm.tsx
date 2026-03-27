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
      // Sign Up
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
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
        "Account created successfully! Check your email to confirm, then sign in."
      );
      setMode("signin");
      setPassword("");
      setLoading(false);
    }
  }

  // ── Shared Styles ──
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    fontSize: "0.9rem",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    outline: "none",
    transition: "border-color 0.25s, box-shadow 0.25s",
    boxSizing: "border-box" as const,
    backdropFilter: "blur(4px)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "rgba(255,255,255,0.5)",
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
        background: "linear-gradient(135deg, #0a0a0f 0%, #101024 40%, #0d1117 100%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: "-10%",
          width: "60%",
          height: "60%",
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "50%",
          height: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          padding: "2.5rem",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
          position: "relative",
          zIndex: 1,
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
                boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
              }}
            >
              R
            </div>
            <h1
              style={{
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "#fff",
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
              color: "rgba(255,255,255,0.45)",
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
            background: "rgba(255,255,255,0.04)",
            borderRadius: 12,
            padding: 4,
            marginBottom: "1.75rem",
            border: "1px solid rgba(255,255,255,0.06)",
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
                  mode === tab
                    ? "linear-gradient(135deg, #6366f1, #7c3aed)"
                    : "transparent",
                color:
                  mode === tab ? "#fff" : "rgba(255,255,255,0.4)",
                boxShadow:
                  mode === tab
                    ? "0 4px 12px rgba(99,102,241,0.3)"
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
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10,
              color: "#fca5a5",
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
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 10,
              color: "#86efac",
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
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
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
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
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
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
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
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
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
              background: loading
                ? "rgba(99,102,241,0.4)"
                : "linear-gradient(135deg, #6366f1, #7c3aed)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s",
              boxShadow: loading
                ? "none"
                : "0 8px 24px rgba(99,102,241,0.35)",
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
            color: "rgba(255,255,255,0.25)",
            marginTop: "2rem",
            letterSpacing: "0.05em",
          }}
        >
          Powered by{" "}
          <span style={{ color: "rgba(168,85,247,0.7)", fontWeight: 600 }}>
            Riliks
          </span>{" "}
          — SaaS for Fashion Brands
        </p>
      </div>
    </div>
  );
}
