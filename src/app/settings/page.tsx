"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBrand } from "@/components/BrandProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { brand, refresh: refreshBrand } = useBrand();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("EGP");
  const [commercialReg, setCommercialReg] = useState("");
  const [taxId, setTaxId] = useState("");
  const [logoUrl, setLogoUrl] = useState("");    // external URL field only
  const [logoPreview, setLogoPreview] = useState<string | null>(null); // preview URL

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Populate fields from BrandProvider (already fetched globally)
  useEffect(() => {
    if (brand) {
      setName(brand.name || "");
      setCurrency(brand.currency || "EGP");
      setCommercialReg(brand.commercialReg || "");
      setTaxId(brand.taxId || "");
      setLogoPreview(brand.logoDisplayUrl);
      setLoading(false);
    }
  }, [brand]);

  // Fallback: if BrandProvider hasn't loaded yet, fetch directly
  useEffect(() => {
    if (!brand) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((data) => {
          setName(data.name || "");
          setCurrency(data.currency || "EGP");
          setCommercialReg(data.commercialReg || "");
          setTaxId(data.taxId || "");
          setLogoUrl(data.logoUrl || "");
          setLogoPreview(
            data.logoKey
              ? `/api/images/logo?t=${Date.now()}`
              : data.logoUrl || null
          );
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currency, commercialReg, taxId, logoUrl }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save settings");
      }

      setMessage({ type: "success", text: "Brand settings updated successfully." });
      refreshBrand(); // update Sidebar and other consumers
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
      // Show a local preview immediately
      const localPreview = URL.createObjectURL(file);
      setLogoPreview(localPreview);

      // Upload via server-side API (Service Role — private bucket)
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        URL.revokeObjectURL(localPreview);
        throw new Error(err.error || "Upload failed");
      }

      const { signedUrl } = await res.json();

      // Switch to signed URL if we got one
      if (signedUrl) {
        URL.revokeObjectURL(localPreview);
        setLogoPreview(signedUrl);
      }

      // Clear external URL field (now using storage)
      setLogoUrl("");

      setMessage({ type: "success", text: "Logo uploaded securely! It is now visible in the sidebar." });
      refreshBrand(); // update Sidebar logo
    } catch (err: any) {
      console.error(err);
      setLogoPreview(brand?.logoDisplayUrl || null); // revert preview
      setMessage({ type: "error", text: "Upload failed: " + err.message });
    } finally {
      setUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
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

        {/* Visual Identity */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ fontSize: "1.1rem" }}>Visual Identity</h3>

          <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Logo Upload Area */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
              <div
                style={{
                  width: "120px", height: "120px",
                  borderRadius: "12px",
                  border: uploadingLogo ? "2px solid var(--color-primary)" : "2px dashed var(--color-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "var(--color-bg)",
                  cursor: "pointer",
                  overflow: "hidden",
                  transition: "border-color 0.2s ease",
                  position: "relative",
                }}
                onClick={() => !uploadingLogo && fileInputRef.current?.click()}
                title="Click to upload logo"
              >
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="Brand Logo"
                    style={{ width: "100%", height: "100%", objectFit: "contain", padding: "0.5rem" }}
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: "0.75rem" }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>🖼️</div>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Click to upload</span>
                  </div>
                )}

                {uploadingLogo && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "rgba(0,0,0,0.45)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: "0.75rem", fontWeight: 600,
                  }}>
                    Uploading...
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                style={{ display: "none" }}
              />

              <small style={{ color: "var(--color-text-muted)", fontSize: "0.7rem", textAlign: "center" }}>
                JPEG, PNG, WebP, SVG<br />Max 5 MB — stored securely
              </small>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", minWidth: "250px" }}>
              <div>
                <label className="kpi-label" style={{ marginBottom: "0.4rem", display: "block" }}>Brand Name</label>
                <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Riliks Studio" />
              </div>

              <details style={{ cursor: "pointer", userSelect: "none" }}>
                <summary className="kpi-label" style={{ marginBottom: "0.4rem", display: "inline-block", color: "var(--color-primary)" }}>
                  Use an external link instead? (Google Drive, etc.)
                </summary>
                <div style={{ marginTop: "0.5rem" }}>
                  <input
                    type="url"
                    className="input"
                    value={logoUrl}
                    onChange={(e) => { setLogoUrl(e.target.value); setLogoPreview(e.target.value || null); }}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-muted" style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
                    External URLs are used directly without storage — no egress cost.
                    Uploading a file above is preferred for reliability.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Official Entity */}
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

        {/* Financial Engine */}
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

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary" disabled={saving || uploadingLogo}>
            {saving ? "Saving..." : "Save Brand Profile"}
          </button>
        </div>

      </form>
    </div>
  );
}
