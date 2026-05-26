import type { StorybookConfig } from "@storybook/web-components-vite";

const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(js|ts)"],
	addons: ["@storybook/addon-docs"],
	framework: {
		name: "@storybook/web-components-vite",
		options: {},
	},
	core: {
		builder: "@storybook/builder-vite",
	},
};

export default config;
