// Shared HTML template for course-sharing emails, used by every send path
// (the manual "Envoyer par email" modal, the post-generation automated-mode
// card, and the automated-mode wizard). Light background deliberately —
// email clients frequently strip or invert dark backgrounds, so a plain
// light template renders reliably everywhere rather than matching the
// app's own dark theme.
const escapeHtml = (s: string): string =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// The app's RabbitLogo mark (components/Layout/RabbitLogo.tsx), inlined as a
// data: URI instead of imported as a component: email clients can't run
// React, and there's no hosted static asset to link to (this app has no
// public/ folder or CDN — everything is client-only). Hardcoded colors
// instead of currentColor/CSS vars, which email clients don't support.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M5 2h4v8H5V2zm6 0h4v8h-4V2z" fill="#111111"/><path d="M2 9h20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" fill="#111111"/><rect x="15" y="15" width="4" height="4" rx="1.2" fill="#ffffff"/></svg>`;
const LOGO_DATA_URI = `data:image/svg+xml;base64,${typeof btoa === 'function' ? btoa(LOGO_SVG) : ''}`;

export const buildCourseEmailHtml = ({
  title,
  description,
  note,
  eyebrow,
  footer,
  programLabel,
  modules,
}: {
  title: string;
  description: string;
  note?: string;
  eyebrow: string;
  footer: string;
  // Both optional — callers without module data (or that don't want the
  // program section) just omit them and get the plain title+description card.
  programLabel?: string;
  modules?: { title: string; meta: string }[];
}): string => {
  const noteHtml = note?.trim()
    ? `<div style="margin:0 0 24px;padding:16px 18px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:10px;font-size:14px;line-height:1.6;color:#78350f;">${escapeHtml(note).replace(/\n/g, '<br/>')}</div>`
    : '';
  const modulesHtml = modules && modules.length > 0
    ? `<div style="margin-top:28px;padding-top:24px;border-top:1px solid #ececec;">
    <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#a3a3a3;">${escapeHtml(programLabel || '')}</p>
    ${modules.map((m, i) => `<div style="padding:12px 0;${i > 0 ? 'border-top:1px solid #f4f4f4;' : ''}">
      <span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:6px;background:#fef3c7;color:#d97706;font-size:11px;font-weight:800;vertical-align:top;margin-right:10px;">${i + 1}</span>
      <span style="display:inline-block;max-width:440px;vertical-align:top;">
        <span style="display:block;font-size:14px;font-weight:600;color:#111111;">${escapeHtml(m.title)}</span>
        <span style="display:block;font-size:12px;color:#a3a3a3;margin-top:2px;">${escapeHtml(m.meta)}</span>
      </span>
    </div>`).join('')}
  </div>`
    : '';
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;">
  <div style="padding:28px 32px;border-bottom:1px solid #ececec;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="vertical-align:middle;padding-right:8px;"><img src="${LOGO_DATA_URI}" width="24" height="24" alt="" style="display:block;border:0;"/></td>
      <td style="vertical-align:middle;"><span style="font-weight:800;font-size:18px;color:#111111;letter-spacing:-0.02em;">Blackmind</span></td>
    </tr></table>
  </div>
  <div style="padding:36px 32px;">
    ${noteHtml}
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#d97706;">${escapeHtml(eyebrow)}</p>
    <h1 style="margin:0 0 14px;font-size:24px;line-height:1.35;font-weight:800;color:#111111;">${escapeHtml(title)}</h1>
    <p style="margin:0;font-size:15px;line-height:1.65;color:#525252;">${escapeHtml(description)}</p>
    ${modulesHtml}
  </div>
  <div style="padding:22px 32px;background:#fafafa;border-top:1px solid #ececec;">
    <p style="margin:0;font-size:12px;color:#a3a3a3;">${escapeHtml(footer)}</p>
  </div>
</div>`;
};
