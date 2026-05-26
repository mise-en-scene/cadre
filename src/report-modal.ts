import {
	css,
	html,
	LitElement,
	type PropertyValues,
	type TemplateResult,
} from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Theme } from "./types";
import "./report-display";

/**
 * Full-screen modal that displays a report with download controls.
 *
 * Open by setting the `open` boolean property to `true`.
 * Dispatches a `"mes-close"` custom event (bubbles + composed) when dismissed
 * via the close button, backdrop click, or Escape key.
 *
 * @fires mes-close
 *
 * @example
 * ```html
 * <mes-report-modal id="m" title="Q1 Report" subtitle="3 pages" report-id="abc" />
 * <script>document.querySelector('#m').open = true</script>
 * ```
 */
@customElement("mes-report-modal")
export class ReportModal extends LitElement {
	@property() reportId: string | undefined;
	@property() override title = "";
	@property() subtitle = "";
	@property({ reflect: true }) theme: Theme = "light";
	@property({ type: Boolean, reflect: true }) open = false;

	/** Ref to the native `<dialog>` element inside the shadow DOM. */
	private get _dialog(): HTMLDialogElement | null {
		return this.shadowRoot?.querySelector("dialog") ?? null;
	}

	override updated(changed: PropertyValues): void {
		if (changed.has("open")) {
			if (this.open) this._dialog?.showModal();
			else this._dialog?.close();
		}
	}

	/** Closes the modal and dispatches `mes-close`. */
	private readonly _closeModal = (): void => {
		this.open = false;
		this.dispatchEvent(
			new CustomEvent("mes-close", { bubbles: true, composed: true }),
		);
	};

	/** Handles the native `cancel` event (Escape key) to keep `open` in sync. */
	private readonly _onCancel = (e: Event): void => {
		e.preventDefault();
		this.open = false;
		this.dispatchEvent(
			new CustomEvent("mes-close", { bubbles: true, composed: true }),
		);
	};

	/** Closes the modal when the user clicks the backdrop (the `<dialog>` element itself). */
	private readonly _onDialogClick = (e: MouseEvent): void => {
		if (e.target === e.currentTarget) this._closeModal();
	};

	static override styles = css`
		:host {
			display: contents;
			font-family: system-ui, sans-serif;
			color-scheme: light;
		}
		:host([theme="dark"]) { color-scheme: dark; }

		dialog {
			all: unset;
			position: fixed;
			inset: 0;
			width: 100%;
			height: 100%;
			max-width: 100%;
			max-height: 100%;
			display: none;
			flex-direction: column;
			align-items: center;
			overflow-y: auto;
			padding: 32px 16px 48px;
			box-sizing: border-box;
		}
		dialog[open] { display: flex; animation: fade-in 0.2s ease; }
		dialog::backdrop { background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(6px); }

		@keyframes fade-in {
			from { opacity: 0; }
			to   { opacity: 1; }
		}

		.bar {
			width: 100%;
			max-width: 900px;
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 20px;
			flex-shrink: 0;
		}
		.bar-info { min-width: 0; flex: 1; }
		.m-title { font-size: 15px; font-weight: 600; color: #f1f5f9; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.m-sub { font-size: 11px; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

		.icon-btn {
			flex-shrink: 0;
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(255, 255, 255, 0.08);
			border: 1px solid rgba(255, 255, 255, 0.12);
			border-radius: 6px;
			color: #94a3b8;
			cursor: pointer;
			transition: background 0.15s, color 0.15s;
		}
		.icon-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.15); color: #f1f5f9; }
		.icon-btn:focus-visible { outline: 2px solid rgba(255, 255, 255, 0.5); outline-offset: 2px; }
		.icon-btn svg { width: 14px; height: 14px; }

		.inner { width: 100%; max-width: 900px; }

		@media (max-width: 500px) {
			dialog { padding: 16px 12px 32px; }
		}
	`;

	protected override render(): TemplateResult {
		return html`
			<dialog @click=${this._onDialogClick} @cancel=${this._onCancel}>
				<div class="bar">
					<div class="bar-info">
						<div class="m-title">${this.title}</div>
						<div class="m-sub">${this.subtitle}</div>
					</div>
					<button class="icon-btn" @click=${this._closeModal} aria-label="Close report">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<line x1="18" y1="6" x2="6" y2="18"/>
							<line x1="6" y1="6" x2="18" y2="18"/>
						</svg>
					</button>
				</div>
				<div class="inner">
					<mes-report-display
						.reportId=${this.reportId}
						.title=${this.title}
						.theme=${this.theme}
						.active=${this.open}
					></mes-report-display>
				</div>
			</dialog>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"mes-report-modal": ReportModal;
	}
}
