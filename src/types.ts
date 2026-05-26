import * as v from "valibot";

export const ReportMetaSchema = v.object({
	report_id: v.string(),
	title: v.string(),
	subtitle: v.string(),
	primary_color: v.string(),
	page_count: v.number(),
	created_at: v.pipe(v.string(), v.isoTimestamp()),
});
export type ReportMetaData = v.InferOutput<typeof ReportMetaSchema>;

export type Theme = "light" | "dark";
