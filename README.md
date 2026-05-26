# @mise-en-scene/cadre

Web component library for viewing and downloading mise-en-scène reports. Built with [Lit](https://lit.dev/), ships as a single ES module.

## Installation

```bash
npm install @mise-en-scene/cadre lit
# or
bun add @mise-en-scene/cadre lit
```

`lit` is a peer dependency — your project must provide it.

## Build-time configuration

The library must be built with the API base URL injected at build time:

```bash
VITE_API_URL=https://your-api.example.com vite build
```

This bakes `__API_BASE__` into the output. There is no runtime fallback — omitting `VITE_API_URL` throws during the build.

## Components

### `<mes-report-trigger>`

The recommended entry point. Renders a pill that fetches report metadata, opens a full-screen modal on click, and provides an inline download button.

```html
<mes-report-trigger report-id="abc123" theme="dark"></mes-report-trigger>
```

| Property    | Attribute     | Type               | Default   | Description                        |
|-------------|---------------|--------------------|-----------|------------------------------------|
| `reportId`  | `report-id`   | `string`           | —         | ID of the report to display        |
| `theme`     | `theme`       | `"light" \| "dark"` | `"light"` | Color scheme (reflected to host)   |

---

### `<mes-report-modal>`

Full-screen dialog with the PDF viewer. Controlled via the `open` property.

```html
<mes-report-modal
  id="modal"
  report-id="abc123"
  title="Q1 Revenue"
  subtitle="5 pages"
></mes-report-modal>
<script>
  document.querySelector('#modal').open = true;
</script>
```

| Property    | Attribute     | Type               | Default   | Description                                    |
|-------------|---------------|--------------------|-----------|-------------------------------------------------|
| `reportId`  | `report-id`   | `string`           | —         | ID of the report to display                    |
| `title`     | `title`       | `string`           | `""`      | Shown in the modal header                      |
| `subtitle`  | `subtitle`    | `string`           | `""`      | Shown below the title (e.g. page count)        |
| `theme`     | `theme`       | `"light" \| "dark"` | `"light"` | Color scheme (reflected to host)               |
| `open`      | `open`        | `boolean`          | `false`   | Controls modal visibility (reflected to host)  |

**Events**

| Event       | When                                                   |
|-------------|--------------------------------------------------------|
| `mes-close` | Dismissed via close button, backdrop click, or Escape |

---

### `<mes-report-display>`

Fetches and renders a PDF inline using the browser's native viewer. Useful for embedding a report directly without a modal.

```html
<mes-report-display report-id="abc123" title="Q1 Revenue"></mes-report-display>
```

| Property   | Attribute    | Type               | Default    | Description                                            |
|------------|--------------|--------------------|------------|--------------------------------------------------------|
| `reportId` | `report-id`  | `string`           | —          | ID of the report to fetch                              |
| `title`    | `title`      | `string`           | `"Report"` | Used as the PDF download filename hint                 |
| `theme`    | `theme`      | `"light" \| "dark"` | `"light"`  | Color scheme (reflected to host)                       |
| `active`   | `active`     | `boolean`          | `true`     | Set to `false` to defer fetching until ready           |

**Events**

| Event           | Detail                   | When                           |
|-----------------|--------------------------|--------------------------------|
| `mes-pdf-ready` | `{ blobUrl: string }`    | PDF fetched and ready to display |
| `mes-pdf-error` | —                        | Fetch failed                   |

Both events bubble and are composed (pierce shadow DOM).

---

## API helpers

Exported for consumers who need to build custom UI on top of the same API calls.

```ts
import { fetchReportMeta, fetchReportPdfBytes, downloadReportPdf } from '@mise-en-scene/cadre';

// Fetch report metadata (title, subtitle, page count, …)
const meta = await fetchReportMeta(reportId, abortSignal);

// Fetch raw PDF bytes
const bytes = await fetchReportPdfBytes(reportId, abortSignal);

// Trigger a browser download directly (no modal)
await downloadReportPdf(reportId, 'my-report.pdf');
```

All API calls include an `X-Cadre-Version` header so the backend can serve the DSL structure expected by the installed version.

## Types

```ts
import type { ReportMetaData, Theme } from '@mise-en-scene/cadre';
```

## License

Apache 2.0
