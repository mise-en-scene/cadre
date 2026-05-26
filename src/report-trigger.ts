import {
	css,
	html,
	LitElement,
	type PropertyValues,
	type TemplateResult,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { downloadReportPdf, fetchReportMeta } from "@/api";
import type { ReportMetaData, Theme } from "./types";
import { triggerBlobDownload } from "./utils";
import "./report-trigger-error";

/**
 * Pill component that opens a full-screen report modal on click.
 *
 * Fetches lightweight metadata (title, subtitle, page count) from the API
 * when `report-id` is set. The PDF is fetched lazily by the embedded
 * `<mes-report-display>` when the modal is first opened; the resulting blob URL
 * is forwarded back here via `mes-pdf-ready` for instant pill-level downloads.
 *
 * The pill also exposes an inline download button that bypasses the modal.
 *
 * @example
 * ```html
 * <mes-report-trigger report-id="abc123" theme="dark" />
 * ```
 */
@customElement("mes-report-trigger")
export class ReportTrigger extends LitElement {
	@property({ reflect: true }) reportId: string | undefined;
	@property({ reflect: true }) theme: Theme = "light";

	/** True while the metadata request is in flight. */
	@state() private _loading = false;
	/** True if the metadata request failed. */
	@state() private _error = false;
	/** True while the fallback network download is in progress (modal not yet opened). */
	@state() private _downloading = false;
	/** Fetched report metadata; drives the pill display. */
	@state() private _meta: ReportMetaData | undefined;
	/** Controls visibility of the `<mes-report-modal>`. */
	@state() private _open = false;

	/** Blob URL forwarded from `<mes-report-display>` via `mes-pdf-ready` — enables instant download. */
	private _blobUrl: string | undefined;

	/**
	 * AbortController for the in-flight metadata request.
	 * Aborted when `reportId` changes (to discard stale responses) or on disconnect.
	 */
	private _abortController: AbortController | null = null;

	// True after the first connectedCallback — used to detect reconnections
	// (e.g. React StrictMode unmount/remount) vs. the initial mount.
	#hasConnected = false;

	override connectedCallback(): void {
		super.connectedCallback();
		if (this.#hasConnected && this.reportId && !this._meta && !this._error) {
			this._loading = true;
			void this._fetchMeta();
		}
		this.#hasConnected = true;
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this._abortController?.abort();
	}

	protected override willUpdate(changed: PropertyValues): void {
		if (changed.has("reportId")) {
			this._meta = undefined;
			this._error = false;
			this._loading = !!this.reportId;
		}
	}

	protected override updated(changed: PropertyValues): void {
		if (changed.has("reportId")) {
			void this._fetchMeta();
		}
	}

	/** Fetches report metadata and stores it in `_meta`. Aborts any prior in-flight request first. */
	private async _fetchMeta(): Promise<void> {
		this._abortController?.abort();
		if (!this.reportId) return;

		this._abortController = new AbortController();

		try {
			this._meta = await fetchReportMeta(
				this.reportId,
				this._abortController.signal,
			);
			this.style.setProperty("--_primary", this._meta.primary_color);
		} catch (err) {
			if (err instanceof Error && err.name === "AbortError") return;
			// biome-ignore lint/suspicious/noConsole: surfaces fetch errors to integrators
			console.warn("Failed to fetch report metadata:", err);
			this._error = true;
		} finally {
			this._loading = false;
		}
	}

	/** Caches the blob URL received from `<mes-report-display>` for instant pill-level downloads. */
	private readonly _onPdfReady = (
		e: CustomEvent<{ blobUrl: string }>,
	): void => {
		this._blobUrl = e.detail.blobUrl;
	};

	/**
	 * Downloads the report PDF. Uses the cached blob URL for an instant download if the modal
	 * was previously opened; falls back to a fresh network request otherwise.
	 */
	private readonly _download = async (): Promise<void> => {
		if (!this.reportId) return;
		if (this._blobUrl) {
			// Instant download — PDF bytes already loaded by the display component.
			triggerBlobDownload(
				this._blobUrl,
				`${this._meta?.title || `report-${this.reportId}`}.pdf`,
			);
			return;
		}
		this._downloading = true;
		try {
			await downloadReportPdf(this.reportId, this._meta?.title);
		} catch (err) {
			// biome-ignore lint/suspicious/noConsole: surfaces download errors to integrators
			console.warn("Failed to download report PDF:", err);
		} finally {
			this._downloading = false;
		}
	};

	/** Opens the modal. */
	private readonly _openModal = (): void => {
		this._open = true;
	};

	static override styles = css`
		:host {
			display: block;
			font-family: system-ui, sans-serif;
			color-scheme: light;
		}
		:host([theme="dark"]) { color-scheme: dark; }

		/* ── Loading skeleton pill ── */
		.trigger-loading {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 6px 12px 6px 8px;
			border-radius: 8px;
			border: 1px solid light-dark(#e2e8f0, #334155);
			background: light-dark(#f8fafc, #1e293b);
			pointer-events: none;
			animation: pulse 1.5s ease-in-out infinite;
		}
		.loading-icon {
			flex-shrink: 0;
			width: 16px;
			height: 16px;
			border-radius: 4px;
			background: light-dark(#e2e8f0, #334155);
		}
		.loading-body { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
		.loading-line { border-radius: 4px; background: light-dark(#e2e8f0, #334155); }
		.loading-title { height: 10px; width: 120px; }
		.loading-sub { height: 8px; width: 80px; }
		@keyframes pulse {
			0%, 100% { opacity: 1; }
			50% { opacity: 0.5; }
		}

		/* ── Trigger pill ── */
		.trigger {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 6px 12px 6px 8px;
			border-radius: 8px;
			border: 1px solid light-dark(#e2e8f0, #334155);
			background: light-dark(#f8fafc, #1e293b);
			cursor: pointer;
			user-select: none;
			max-width: 100%;
			transition: background 0.15s, border-color 0.15s;
		}
		.trigger:hover {
			background: light-dark(#f1f5f9, #263448);
			border-color: light-dark(#cbd5e1, #475569);
		}
		.trigger:focus-visible {
			outline: 2px solid var(--_primary, #3b82f6);
			outline-offset: 2px;
		}

		.icon { flex-shrink: 0; width: 16px; height: 16px; color: var(--_primary, #3b82f6); }

		.body { min-width: 0; }
		.t-title {
			font-size: 13px;
			font-weight: 500;
			color: light-dark(#0f172a, #f1f5f9);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.t-sub {
			font-size: 11px;
			color: light-dark(#64748b, #94a3b8);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.t-badge {
			flex-shrink: 0;
			font-size: 10px;
			font-weight: 500;
			color: var(--_primary, #3b82f6);
			background: color-mix(in srgb, var(--_primary, #3b82f6) 12%, transparent);
			padding: 2px 7px;
			border-radius: 99px;
		}

		/* ── Pill download button ── */
		.pill-dl-btn {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 20px;
			height: 20px;
			background: none;
			border: none;
			border-radius: 4px;
			padding: 0;
			color: light-dark(#94a3b8, #64748b);
			cursor: pointer;
			transition: color 0.15s, background 0.15s;
		}
		.pill-dl-btn:hover:not(:disabled) {
			color: var(--_primary, #3b82f6);
			background: color-mix(in srgb, var(--_primary, #3b82f6) 10%, transparent);
		}
		.pill-dl-btn:disabled { opacity: 0.5; cursor: not-allowed; }
		.pill-dl-btn:focus-visible { outline: 2px solid var(--_primary, #3b82f6); outline-offset: 2px; }
		.pill-dl-btn svg { width: 13px; height: 13px; }
		@keyframes dl-spin { to { transform: rotate(360deg); } }
		.dl-spin { animation: dl-spin 0.8s linear infinite; }
	`;

	protected override render(): TemplateResult {
		if (this._loading) {
			return html`
				<div class="trigger-loading" aria-label="Loading report…" aria-busy="true">
					<div class="loading-icon"></div>
					<div class="loading-body">
						<div class="loading-line loading-title"></div>
						<div class="loading-line loading-sub"></div>
					</div>
				</div>
			`;
		}

		if (this._error || !this._meta) {
			return html`<mes-report-trigger-error .theme=${this.theme} />`;
		}

		const meta = this._meta;

		return html`
			<div class="trigger" role="button" tabindex="0"
					@click=${this._openModal}
					@keydown=${(e: KeyboardEvent) => (e.key === "Enter" || e.key === " ") && this._openModal()}>
				<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
					<polyline points="14 2 14 8 20 8"/>
					<line x1="8" y1="13" x2="16" y2="13"/>
					<line x1="8" y1="17" x2="16" y2="17"/>
				</svg>
				<div class="body">
					<div class="t-title">${meta.title}</div>
					<div class="t-sub">${meta.subtitle}</div>
				</div>
				<span class="t-badge">${meta.page_count}p</span>
			<button class="pill-dl-btn"
					@click=${(e: MouseEvent) => {
						e.stopPropagation();
						void this._download();
					}}
					?disabled=${this._downloading}
					aria-label="Download PDF">
				${
					this._downloading
						? html`<svg class="dl-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`
						: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`
				}
			</button>
			</div>

			<mes-report-modal
				.open=${this._open}
				.reportId=${this.reportId}
				.title=${meta.title}
				.subtitle=${meta.subtitle}
				.theme=${this.theme}
				@mes-close=${() => {
					this._open = false;
				}}
				@mes-pdf-ready=${this._onPdfReady}
			></mes-report-modal>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"mes-report-trigger": ReportTrigger;
	}
}
