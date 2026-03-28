"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("EGP");
  const [commercialReg, setCommercialReg] = useState("");
  const [taxId, setTaxId] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings (or your brand was just created). Retrying now...");
      const data = await res.json();
      
      setName(data.name || "");
      setCurrency(data.currency || "EGP");
      setCommercialReg(data.commercialReg || "");
      setTaxId(data.taxId || "");
      setLogoUrl(data.logoUrl || "");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          currency,
          commercialReg,
          taxId,
          logoUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save settings");
      }

      setMessage({ type: "success", text: "Brand settings updated successfully." });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setMessage(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("brands")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("brands")
        .getPublicUrl(filePath);

      setLogoUrl(publicUrlData.publicUrl);
      setMessage({ type: "success", text: "Logo uploaded! Remember to click Save." });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to upload logo: " + err.message });
    } finally {
      setUploadingLogo(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
        Loading configuration...
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h2>Brand Profile</h2>
        <p>Manage your SaaS identity, legal entity, and core financial behavior.</p>
      </div>

      {message && (
        <div style={{
          padding: "1rem", 
          marginBottom: "1.5rem", 
          borderRadius: "8px", 
          display: "flex", 
          alignItems: "center", 
          gap: "0.5rem",
          background: message.type === "success" ? "rgba(5, 150, 105, 0.1)" : "rgba(220, 38, 38, 0.1)",
          color: message.type === "success" ? "var(--color-success)" : "var(--color-danger)",
          border: `1px solid ${message.type === "success" ? "var(--color-success)" : "var(--color-danger)"}`
        }}>
          <b>{message.type === "success" ? "✓" : "⚠"}</b> {message.text}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "800px" }}>
        
        {/* Visual Identity Node */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ fontSize: "1.1rem" }}>Visual Identity</h3>
          
          <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div 
                style={{
                  width: "120px", height: "120px", 
                  borderRadius: "12px", 
                  border: "2px dashed var(--color-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "var(--color-bg)",
                  cursor: "pointer",
                  overflow: "hidden"
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: "0.5rem" }} />
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Upload Logo</span>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" style={{ display: "none" }} />
              {uploadingLogo && <small style={{ color: "var(--color-primary)" }}>Uploading...</small>}
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", minWidth: "250px" }}>
              <div>
                <label className="kpi-label" style={{ marginBottom: "0.4rem", display: "block" }}>Brand Name</label>
                <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Riliks Studio" />
              </div>
              <details style={{ cursor: "pointer", userSelect: "none" }}>
                <summary className="kpi-label" style={{ marginBottom: "0.4rem", display: "inline-block", color: "var(--color-primary)" }}>
                  Want to use an external link instead? (e.g. Google Drive)
                </summary>
                <div style={{ marginTop: "0.5rem" }}>
                  <input type="url" className="input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                  <p className="text-muted" style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
                    If you upload an image, its link will appear here. You can also paste any direct image link to override it.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Official Entity Node */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem" }}>Official Entity Data</h3>
            <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
              This guarantees legal compliance on invoices and official financial reports in the ERP.
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label className="kpi-label" style={{ marginBottom: "0.4rem", display: "block" }}>Commercial Registration No.</label>
              <input type="text" className="input text-mono" value={commercialReg} onChange={(e) => setCommercialReg(e.target.value)} placeholder="209-12343-X" />
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label className="kpi-label" style={{ marginBottom: "0.4rem", display: "block" }}>Tax ID Number (TIN)</label>
              <input type="text" className="input text-mono" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="XXX-XXX-XXX" />
            </div>
          </div>
        </div>

        {/* Financial Node */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ fontSize: "1.1rem" }}>Financial Engine</h3>
          
          <div style={{ maxWidth: "300px" }}>
            <label className="kpi-label" style={{ marginBottom: "0.4rem", display: "block" }}>Default Platform Currency</label>
            <select className="input text-mono" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="EGP">EGP - Egyptian Pound</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="SAR">SAR - Saudi Riyal</option>
              <option value="AED">AED - Emirati Dirham</option>
            </select>
            <p className="text-muted" style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
              If changed, all dashboards and reports will anchor to this base currency.
            </p>
          </div>
        </div>

        {/* Action Node */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary" disabled={saving || uploadingLogo}>
            {saving ? "Saving..." : "Save Brand Profile"}
          </button>
        </div>

      </form>
    </div>
  );
}
