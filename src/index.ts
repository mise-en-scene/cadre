// @mise-en-scene/cadre

// ── API helpers ───────────────────────────────────────────────────────────────
// These call the endpoint configured at library build time (API_BASE).
// Export them so consumers can fetch report data to build custom triggers or modals.
// Note: fetchReportMeta / fetchReportPdfBytes require an AbortSignal for cancellation support.
export { downloadReportPdf, fetchReportMeta, fetchReportPdfBytes } from "./api";
export { ReportDisplay } from "./report-display";
export { ReportModal } from "./report-modal";
export { ReportTrigger } from "./report-trigger";
// ── Types ─────────────────────────────────────────────────────────────────────
// Re-exported so consumers don't need a direct dependency on internal modules.
export type { ReportMetaData, Theme } from "./types";
