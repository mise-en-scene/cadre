import * as v from "valibot";
import { type ReportMetaData, ReportMetaSchema } from "./types";
import { triggerBlobDownload } from "./utils";

/**
 * Hardcoded API base URL — all cadre components always talk to this endpoint.
 * Breaking changes bump the major version. The `X-Cadre-Version` header
 * tells the backend which response shape this cadre expects.
 */
export const API_BASE = __API_BASE__;

/** Returns the request headers that must accompany every API call. */
function apiHeaders(): Record<string, string> {
	return { "X-Cadre-Version": __CADRE_VERSION__ };
}

/** Fetches lightweight report metadata (title, subtitle, page count, primary color). */
export async function fetchReportMeta(
	reportId: string,
	signal: AbortSignal,
): Promise<ReportMetaData> {
	const res = await fetch(`${API_BASE}/reports/${reportId}/meta`, {
		method: "GET",
		headers: apiHeaders(),
		signal,
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const json = (await res.json()) as unknown;
	const result = v.safeParse(ReportMetaSchema, json);
	if (!result.success)
		throw new Error(`Invalid meta response: ${JSON.stringify(result.issues)}`);
	return result.output;
}

/**
 * Fetches the raw PDF bytes for a report.
 *
 * Used by `<mes-report-display>` for inline rendering, and by {@link downloadReportPdf}
 * to keep both code paths in sync (same endpoint, headers, and error handling).
 *
 * @param reportId - The report to fetch.
 * @param signal - Optional AbortSignal to cancel the request mid-flight.
 */
export async function fetchReportPdfBytes(
	reportId: string,
	signal?: AbortSignal,
): Promise<ArrayBuffer> {
	const res = await fetch(`${API_BASE}/reports/${reportId}/print`, {
		method: "GET",
		headers: apiHeaders(),
		signal: signal ?? null,
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.arrayBuffer();
}

/**
 * Fetches the PDF for a report and triggers a browser download.
 *
 * Delegates the HTTP request to {@link fetchReportPdfBytes} so both functions
 * always use the same endpoint, headers, and error handling.
 *
 * @param reportId - The report to download.
 * @param filename - Suggested filename (without `.pdf` extension). Defaults to `report-{reportId}`.
 * @throws {Error} If the server responds with a non-OK status.
 */
export async function downloadReportPdf(
	reportId: string,
	filename?: string,
): Promise<void> {
	const bytes = await fetchReportPdfBytes(reportId);
	const url = URL.createObjectURL(
		new Blob([bytes], { type: "application/pdf" }),
	);
	triggerBlobDownload(url, `${filename ?? `report-${reportId}`}.pdf`);
	URL.revokeObjectURL(url);
}
