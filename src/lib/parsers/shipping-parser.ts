/**
 * Universal File Parser for Shipping Provider Statements
 *
 * Supports CSV and XLSX formats from providers like Bosta, J&T, and Aramex.
 * Each provider defines a field mapping to normalize data into ParsedShippingRow.
 */

import * as XLSX from "xlsx";

export interface FieldMapping {
  orderNumber: string; // Column header for order number
  codCollected: string; // Column header for COD amount
  shippingFee: string; // Column header for shipping fee
  returnFee?: string; // Column header for return fee (optional)
  status?: string; // Column header for delivery status
}

export interface ParsedRow {
  orderNumber: string;
  codCollected: number;
  shippingFee: number;
  returnFee: number;
  status: string;
}

// ── Pre-defined mappings for common Egyptian shipping providers ──

export const PROVIDER_MAPPINGS: Record<string, FieldMapping> = {
  bosta: {
    orderNumber: "Order ID",
    codCollected: "COD Amount",
    shippingFee: "Shipping Fees",
    returnFee: "Return Fees",
    status: "Status",
  },
  jnt: {
    orderNumber: "Waybill No",
    codCollected: "COD",
    shippingFee: "Freight",
    returnFee: "Return Fee",
    status: "Parcel Status",
  },
  aramex: {
    orderNumber: "Reference",
    codCollected: "COD Value",
    shippingFee: "Charges",
    returnFee: "Return Charges",
    status: "Shipment Status",
  },
};

/**
 * Parse a buffer (CSV or XLSX) into normalized rows using a field mapping.
 */
export function parseShippingFile(
  buffer: Buffer,
  mapping: FieldMapping
): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

  return rawRows.map((raw) => ({
    orderNumber: String(raw[mapping.orderNumber] ?? "").trim(),
    codCollected: toNumber(raw[mapping.codCollected]),
    shippingFee: toNumber(raw[mapping.shippingFee]),
    returnFee: mapping.returnFee ? toNumber(raw[mapping.returnFee]) : 0,
    status: mapping.status ? String(raw[mapping.status] ?? "") : "Unknown",
  }));
}

function toNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.\-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}
