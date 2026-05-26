import {
	css,
	html,
	LitElement,
	type PropertyValues,
	type TemplateResult,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fetchReportPdfBytes } from "./api";
import type { Theme } from "./types";

/**
 * Fetches a report PDF and renders it inline via the browser's native PDF viewer.
 *
 * Dispatches `"mes-pdf-ready"` (bubbles + composed) with `detail: { blobUrl: string }`
 * once the PDF is loaded, so parent components can reuse the bytes for an
 * instant download without a second network request.
 *
 * Dispatches `"mes-pdf-error"` (bubbles + composed) if the fetch fails.
 *
 * The blob URL is revoked automatically on disconnect.
 *
 * @fires mes-pdf-ready
 * @fires mes-pdf-error
 */
@customElement("mes-report-display")
export class ReportDisplay extends LitElement {
	@property() reportId: string | undefined;
	@property() override title = "Report";
	@property({ reflect: true }) theme: Theme = "light";
	/** When false, the PDF is not fetched. Set to true to trigger loading. Defaults to true for standalone use. */
	@property({ type: Boolean }) active = true;

	@state() private _loading = false;
	@state() private _error = false;
	@state() private _blobUrl: string | undefined;

	private _abortController: AbortController | undefined;
	/** The reportId for which _blobUrl was last fetched, to avoid double-fetching on connect. */
	private _fetchedReportId: string | undefined;

	override connectedCallback(): void {
		super.connectedCallback();
		if (this.active) void this._fetchPdf();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this._abortController?.abort();
		this._revokeBlobUrl();
	}

	override updated(changed: PropertyValues): void {
		if (
			(changed.has("reportId") || changed.has("active")) &&
			this.active &&
			this.reportId !== this._fetchedReportId
		) {
			void this._fetchPdf();
		}
	}

	private _revokeBlobUrl(): void {
		if (this._blobUrl) {
			URL.revokeObjectURL(this._blobUrl);
			this._blobUrl = undefined;
		}
	}

	private async _fetchPdf(): Promise<void> {
		this._fetchedReportId = this.reportId;
		if (!this.reportId) return;

		this._abortController?.abort();
		this._abortController = new AbortController();
		this._revokeBlobUrl();
		this._loading = true;
		this._error = false;

		try {
			const bytes = await fetchReportPdfBytes(
				this.reportId,
				this._abortController.signal,
			);
			const filename = `${this.title || this.reportId || "report"}.pdf`;
			// Note: doesn't work in Chrome
			const url = URL.createObjectURL(
				new File([bytes], filename, { type: "application/pdf" }),
			);
			this._blobUrl = url;
			this.dispatchEvent(
				new CustomEvent<{ blobUrl: string }>("mes-pdf-ready", {
					bubbles: true,
					composed: true,
					detail: { blobUrl: url },
				}),
			);
		} catch (err) {
			if (err instanceof Error && err.name === "AbortError") return;
			this._error = true;
			this.dispatchEvent(
				new CustomEvent("mes-pdf-error", { bubbles: true, composed: true }),
			);
			// biome-ignore lint/suspicious/noConsole: surfaces PDF load errors to integrators
			console.warn("Failed to fetch report PDF:", err);
		} finally {
			this._loading = false;
		}
	}

	static override styles = css`
		:host {
			display: block;
			font-family: system-ui, sans-serif;
			color-scheme: light;
		}
		:host([theme="dark"]) { color-scheme: dark; }

		.spinner-wrap {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 80vh;
			color: light-dark(#94a3b8, #475569);
		}
		@keyframes spin { to { transform: rotate(360deg); } }
		.spinner {
			width: 32px;
			height: 32px;
			animation: spin 0.8s linear infinite;
		}

		.error-wrap {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 8px;
			height: 80vh;
			color: light-dark(#ef4444, #f87171);
			font-size: 13px;
		}
		.error-icon { width: 28px; height: 28px; }

		embed {
			display: block;
			width: 100%;
			height: 80vh;
			border: none;
			border-radius: 8px;
		}
	`;

	protected override render(): TemplateResult {
		if (!this.reportId) return html``;

		if (this._loading) {
			return html`
				<div class="spinner-wrap" aria-label="Loading PDF…" aria-busy="true">
					<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path d="M21 12a9 9 0 1 1-6.219-8.56"/>
					</svg>
				</div>
			`;
		}

		if (this._error) {
			return html`
				<div class="error-wrap" role="alert">
					<svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
						<line x1="12" y1="9" x2="12" y2="13"/>
						<line x1="12" y1="17" x2="12.01" y2="17"/>
					</svg>
					<span>Failed to load PDF</span>
				</div>
			`;
		}

		if (!this._blobUrl) return html``;

		return html`<embed type="application/pdf" src=${this._blobUrl} />`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"mes-report-display": ReportDisplay;
	}
}
