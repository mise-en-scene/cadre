import { nothing } from "lit";

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

export const MmToPx = (mm: number) => (mm * 96) / 25.4;

export const buildStyleString = (
	style: Record<string, string> | undefined,
): string | typeof nothing =>
	(style
		? Object.entries(style)
				.map(([k, v]) => `${k}: ${v}`)
				.join("; ")
		: "") || nothing;

export const mergeStyles = (
	base: Record<string, string>,
	override: Record<string, string> | undefined,
): Record<string, string> => {
	return { ...base, ...override };
};

/**
 * Triggers a browser file download for a pre-existing URL by temporarily appending
 * an invisible anchor element and programmatically clicking it.
 *
 * The caller is responsible for revoking any blob URL after this call.
 */
export function triggerBlobDownload(blobUrl: string, filename: string): void {
	const a = document.createElement("a");
	a.href = blobUrl;
	a.download = filename;
	document.body.append(a);
	a.click();
	a.remove();
}
