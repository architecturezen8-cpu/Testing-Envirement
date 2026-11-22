import nodemailer from "nodemailer";

/**
 * Ticket delivery email.
 *
 * Dark, on-brand layout matching the storefront, with each pass rendered as
 * an attached image (so it survives email clients that strip base64) and a
 * download link pointing at the site.
 *
 * Uses SMTP when SMTP_USER/SMTP_PASS are configured. When they are not (local
 * development, or before credentials are added) the mail is logged and skipped
 * so placing an order still works.
 */

type Ticket = {
  ticketCode: string;
  eventName: string;
  eventDate: string;
  venue: string;
  tier: string;
  attendeeName: string;
  quantity: number;
  /** Full ticket pass (artwork + QR composited) as PNG bytes. */
  pass: Buffer;
};

function transport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 465);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
    dnsTimeout: 5000,
  });
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/** Builds the dark, mobile-friendly HTML body. */
function buildHtml(params: {
  buyerName: string;
  orderNumber: string;
  tickets: Ticket[];
}): string {
  const { buyerName, orderNumber, tickets } = params;
  const site = siteUrl();

  const card = (t: Ticket) => `
    <tr>
      <td style="padding:0 16px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;">
          <tr>
            <td style="padding:18px 18px 0;">
              <p style="margin:0;font:600 11px Arial,sans-serif;color:#f4be38;
                        letter-spacing:2px;text-transform:uppercase;">
                ${t.tier || "General"} &#183; Admit ${t.quantity}
              </p>
              <p style="margin:8px 0 0;font:600 19px Georgia,serif;color:#f9fafb;line-height:1.3;">
                ${t.eventName}
              </p>
              <p style="margin:6px 0 0;font:400 13px Arial,sans-serif;color:#6b7280;">
                ${t.eventDate || "Date TBA"}${t.venue ? " &#183; " + t.venue : ""}
              </p>
              <p style="margin:10px 0 0;font:400 13px Arial,sans-serif;color:#9ca3af;">
                <span style="color:#f4be38;">&#9679;</span> ${t.attendeeName}
              </p>
              <p style="margin:4px 0 0;font:600 15px 'Courier New',monospace;color:#f9fafb;
                        letter-spacing:1px;">
                ${t.ticketCode}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 18px 18px;" align="center">
              <a href="${site}/tickets/view/${t.ticketCode}"
                 style="text-decoration:none;display:block;">
                <img src="cid:${t.ticketCode}" alt="Ticket ${t.ticketCode}" width="260"
                     style="display:block;width:100%;max-width:260px;height:auto;
                            border-radius:8px;border:1px solid #1f2937;" />
              </a>
              <a href="${site}/api/tickets/${t.ticketCode}/image"
                 style="display:inline-block;margin-top:12px;padding:11px 22px;
                        background:#f4be38;color:#0a0b0f;text-decoration:none;
                        border-radius:999px;font:700 11px Arial,sans-serif;
                        letter-spacing:1.5px;text-transform:uppercase;">
                Download ticket &#8595;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;

  return `
  <div style="margin:0;padding:0;background:#030407;">
    <div style="display:none;max-height:0;overflow:hidden;">
      Your tickets for ${tickets.map((t) => t.eventName).join(", ")} are confirmed.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:#030407;padding:24px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="max-width:600px;background:#0b1220;border-radius:16px;
                        border:1px solid #1f2937;overflow:hidden;">
            <tr>
              <td align="center" style="padding:28px 16px 20px;background:#0b1220;">
                <img src="cid:college-crest" alt="College crest" width="66" height="66"
                     style="display:block;margin:0 auto;border-radius:50%;
                            background:#ffffff;padding:6px;" />
                <p style="margin:14px 0 0;font:600 20px Georgia,serif;color:#f9fafb;
                          letter-spacing:3px;">
                  ST. THOMAS&#39; COLLEGE
                </p>
                <p style="margin:6px 0 0;font:400 11px Arial,sans-serif;color:#6b7280;
                          letter-spacing:2.5px;">
                  MATALE &#183; EST. 1873
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 16px;">
                <p style="margin:0 0 6px;font:400 13px Arial,sans-serif;color:#6b7280;">
                  Hi ${buyerName},
                </p>
                <h1 style="margin:0 0 12px;font:400 26px Georgia,serif;color:#f9fafb;
                           line-height:1.25;">
                  Your tickets are confirmed
                </h1>
                <p style="margin:0 0 6px;font:400 14px Arial,sans-serif;color:#9ca3af;
                          line-height:1.6;">
                  Order <strong style="color:#f4be38;">${orderNumber}</strong> &#8212; show the
                  QR at the gate. Each code scans once, so please don&#39;t share it.
                </p>
              </td>
            </tr>

            ${tickets.map(card).join("")}

            <tr>
              <td style="padding:4px 16px 26px;" align="center">
                <a href="${site}/account/tickets"
                   style="display:inline-block;padding:12px 24px;border-radius:999px;
                          border:1px solid #f4be38;color:#f4be38;text-decoration:none;
                          font:700 11px Arial,sans-serif;letter-spacing:1.5px;
                          text-transform:uppercase;">
                  All my tickets
                </a>
                <p style="margin:18px 0 0;font:400 11px Arial,sans-serif;color:#4b5563;
                          line-height:1.6;">
                  Questions? School office &#183;
                  <a href="tel:+94662220173" style="color:#9ca3af;text-decoration:none;">
                    +94 66 222 0173
                  </a>
                </p>
                <p style="margin:8px 0 0;font:italic 12px Georgia,serif;color:#4b5563;">
                  &ldquo;Animo Et Fide&rdquo; &mdash; Courage &amp; Faith
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

export async function sendTicketEmail({
  to,
  orderNumber,
  buyerName,
  tickets,
  crestPng,
}: {
  to: string;
  orderNumber: string;
  buyerName: string;
  tickets: Ticket[];
  /** College crest rendered as PNG bytes, embedded via cid:college-crest. */
  crestPng?: Buffer;
}) {
  const tx = transport();

  const html = buildHtml({ buyerName, orderNumber, tickets });

  const attachments = [
    ...(crestPng
      ? [
          {
            filename: "crest.png",
            content: crestPng,
            cid: "college-crest",
            contentType: "image/png",
          },
        ]
      : []),
    ...tickets.map((t) => ({
      filename: `${t.ticketCode}.png`,
      content: t.pass,
      cid: t.ticketCode,
      contentType: "image/png",
    })),
  ];

  if (!tx) {
    console.log(
      `[mailer] SMTP not configured — skipping email to ${to} (${tickets.length} ticket(s), order ${orderNumber})`,
    );
    return { sent: false };
  }

  await tx.sendMail({
    from: process.env.SMTP_FROM || `"St. Thomas' College Store" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your tickets — order ${orderNumber}`,
    html,
    attachments,
  });

  return { sent: true };
}
