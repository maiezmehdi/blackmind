// Vercel Edge Function — the only server-side code in this app. RESEND_API_KEY
// must stay here, never in vite.config.ts's `define` block: that inlines
// values into the client bundle, which is fine for the free-tier keys
// elsewhere in this app but not for an email-sending credential.
export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'not_configured' }), { status: 501 });
  }

  let body: {
    to?: string;
    subject?: string;
    text?: string;
    html?: string;
    // Resend's attachment shape: content is base64 (no data: URI prefix).
    attachments?: { filename: string; content: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { to, subject, text, html, attachments } = body;
  if (!to || !subject) {
    return new Response(JSON.stringify({ error: 'Missing to/subject' }), { status: 400 });
  }

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      // From the resend.dev test domain until a real domain is verified in
      // Resend — that domain can only deliver to the Resend account's own
      // signup email, by Resend's design (anti-spam), not a bug here.
      body: JSON.stringify({
        from: 'Blackmind <onboarding@resend.dev>',
        to: [to],
        subject,
        text,
        // html/attachments are optional — callers that don't build a styled
        // template or don't attach a file still work as before.
        ...(html ? { html } : {}),
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
      }),
    });

    const data = await resendRes.json().catch(() => ({}));
    if (!resendRes.ok) {
      return new Response(JSON.stringify({ error: data?.message || 'resend_failed' }), { status: resendRes.status });
    }
    return new Response(JSON.stringify({ ok: true, id: data?.id }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'unexpected_error' }), { status: 500 });
  }
}
