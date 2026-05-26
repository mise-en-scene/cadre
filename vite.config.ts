import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { version } from "./package.json";

export default defineConfig(({ command }) => {
	const apiUrl = process.env.VITE_API_URL;
	if (!apiUrl) throw new Error("VITE_API_URL is required");

	return {
		define: {
			// Injected into source via `declare const __CADRE_VERSION__: string` in vendor.d.ts.
			// The backend uses this header to return the DSL structure expected by this cadre version.
			__CADRE_VERSION__: JSON.stringify(version),
			__API_BASE__: JSON.stringify(apiUrl),
		},
		resolve: {
			alias: {
				"@": resolve(__dirname, "src"),
			},
		},
		build: {
			lib: {
				entry: resolve(__dirname, "src/index.ts"),
				formats: ["es"],
				fileName: "cadre",
			},
			rollupOptions: {
				external: ["lit", /^lit\//, "echarts", /^echarts\//],
			},
		},
		// Only generate type declarations during `vite build`.
		// vite-plugin-dts with rollupTypes pulls in @microsoft/api-extractor
		// which has heavy deps not needed at dev/storybook time.
		plugins:
			command === "build"
				? [dts({ insertTypesEntry: true, bundleTypes: true })]
				: [],
	};
});
