# Embed AuditAI Widget

AuditAI includes a lightweight iframe-first widget at `/embed`.

Example embed snippet:

```html
<iframe
  src="https://YOUR_DEPLOYED_URL/embed"
  width="100%"
  height="720"
  style="border:0;border-radius:16px;overflow:hidden"
  loading="lazy"
></iframe>
```

## Notes

- Replace `YOUR_DEPLOYED_URL` with your production app URL.
- The embed widget runs a deterministic local calculation using the same core audit engine (`generateAuditReport()`).
- The embed keeps scope intentionally small:
  - no lead capture
  - no Supabase persistence
  - no AI summary generation
  - no email workflows
  - no PDF/share controls
- Full report sharing and the full product experience are available in the main app (`/audit`, `/results`, `/report/[id]`).
