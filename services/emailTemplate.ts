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
    <span style="font-weight:800;font-size:18px;color:#111111;letter-spacing:-0.02em;">Blackmind</span>
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
