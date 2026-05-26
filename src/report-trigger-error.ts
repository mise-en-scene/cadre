import { css, html, LitElement, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Theme } from "./types";

/**
 * Displays a non-interactive error pill.
 * Used by `<mes-report-trigger>` whenever the DSL is invalid or rendering fails.
 */
@customElement("mes-report-trigger-error")
export class ReportTriggerError extends LitElement {
	@property({ reflect: true }) theme: Theme = "light";

	static override styles = css`
		:host {
			display: block;
			font-family: system-ui, sans-serif;
			color-scheme: light;
		}
		:host([theme="dark"]) { color-scheme: dark; }

		.card {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 6px 12px 6px 8px;
			border-radius: 8px;
			border: 1px solid light-dark(#fecaca, #7f1d1d);
			background: light-dark(#fff1f2, #1c0a0a);
			user-select: none;
			max-width: 100%;
		}

		.icon { flex-shrink: 0; width: 16px; height: 16px; color: light-dark(#ef4444, #f87171); }

		.title { font-size: 13px; font-weight: 500; color: light-dark(#b91c1c, #fca5a5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
	`;

	protected override render(): TemplateResult {
		return html`
			<div class="card">
				<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
					<line x1="12" y1="9" x2="12" y2="13"/>
					<line x1="12" y1="17" x2="12.01" y2="17"/>
				</svg>
				<span class="title">Failed to load report</span>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"mes-report-trigger-error": ReportTriggerError;
	}
}
