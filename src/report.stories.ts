import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { css, html, LitElement, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import type { Theme } from "./types";
import "./report-trigger";

class StoryChatWrapper extends LitElement {
	@property({ reflect: true })
	reportId: string | undefined;

	@property({ reflect: true })
	theme: Theme = "light";

	static override styles = css`
		:host {
			display: block;
			width: 100%;
			min-height: 400px;
			background: #eef2f7;
			padding: 32px 24px;
			box-sizing: border-box;
			font-family: system-ui, sans-serif;
		}

		.chat {
			max-width: 580px;
			margin: 0 auto;
			display: flex;
			flex-direction: column;
			gap: 2px;
		}

		.timestamp {
			font-size: 11px;
			color: #94a3b8;
			text-align: center;
			padding: 0 0 16px;
			margin: 0;
		}

		.row {
			display: flex;
			align-items: flex-end;
			gap: 8px;
		}

		.row.sent {
			flex-direction: row-reverse;
		}

		.avatar {
			width: 28px;
			height: 28px;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 10px;
			font-weight: 700;
			color: #fff;
			flex-shrink: 0;
		}

		.avatar.bot {
			background: linear-gradient(135deg, #6366f1, #3b82f6);
		}

		.avatar.me {
			background: #64748b;
		}

		.avatar.spacer {
			visibility: hidden;
		}

		.bubble {
			background: #ffffff;
			border-radius: 16px 16px 16px 4px;
			padding: 9px 14px;
			font-size: 13.5px;
			color: #1e293b;
			line-height: 1.55;
			max-width: 75%;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
		}

		.bubble.sent {
			background: #3b82f6;
			color: #fff;
			border-radius: 16px 16px 4px 16px;
		}

		.bubble.attachment {
			padding: 0;
			background: transparent;
			box-shadow: none;
			border-radius: 0;
			width: min(360px, 100%);
		}

		.gap {
			height: 10px;
		}
	`;

	protected override render(): TemplateResult {
		return html`
			<div class="chat">
				<p class="timestamp">Today, 14:32</p>
				<div class="row">
					<div class="avatar bot">AI</div>
					<div class="bubble">Here is the quarterly sales report you requested:</div>
				</div>
				<div class="row" style="margin-top: 6px">
					<div class="avatar spacer"></div>
					<div class="bubble attachment">
						<mes-report-trigger .reportId=${this.reportId} .theme=${this.theme} />
					</div>
				</div>
				<div class="gap"></div>
				<div class="row sent">
					<div class="avatar me">Me</div>
					<div class="bubble sent">Thanks! Can you summarize the key findings?</div>
				</div>
				<div class="row" style="margin-top: 6px">
					<div class="avatar bot">AI</div>
					<div class="bubble">Of course! The report highlights a 12% revenue growth in Q3, driven primarily by the EMEA region...</div>
				</div>
			</div>
		`;
	}
}
customElements.define("mes-story-chat-wrapper", StoryChatWrapper);

const meta: Meta = {
	title: "Reports",
	tags: ["autodocs"],
	render: (args) =>
		html`<mes-story-chat-wrapper .reportId=${args.reportId} .theme=${args.theme} />`,
	argTypes: {
		reportId: { control: "text" },
		theme: { control: "radio", options: ["light", "dark"] },
	},
};

export default meta;
type Story = StoryObj<{ reportId: string | undefined; theme: Theme }>;

export const Default: Story = {
	args: {
		reportId: "xxxxxxxx-xxxx-vxxx-wxxx-xxxxxxxxxxxx",
		theme: "light",
	},
};
