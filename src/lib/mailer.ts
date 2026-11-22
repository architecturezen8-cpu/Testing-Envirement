import nodemailer from "nodemailer";

/**
 * Ticket delivery email.
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
  qr: string;
};

function transport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 465);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    // 465 = implicit TLS, 587 = STARTTLS. nodemailer picks the right one from
    // this flag, so the same code works with Gmail, Resend, Brevo or SendGrid.
    secure: port === 465,
    auth: { user, pass },
    // Never let a slow/unreachable mail server hold up an order. Networks
    // without outbound access to the mail port would otherwise hang for 30s+.
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
    dnsTimeout: 5000,
  });
}

export async function sendTicketEmail({
  to,
  orderNumber,
  buyerName,
  tickets,
}: {
  to: string;
  orderNumber: string;
  buyerName: string;
  tickets: Ticket[];
}) {
  const tx = transport();

  const rows = tickets
    .map(
      (t) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">
          <p style="margin:0 0 6px;font:600 16px Georgia,serif;color:#111827;">${t.eventName}</p>
          <p style="margin:0 0 3px;font:400 13px Arial,sans-serif;color:#4b5563;">
            <strong style="color:#111827;">${t.ticketCode}</strong>
          </p>
          <p style="margin:0 0 3px;font:400 13px Arial,sans-serif;color:#4b5563;">${t.eventDate || "Date TBA"}</p>
          <p style="margin:0 0 3px;font:400 13px Arial,sans-serif;color:#4b5563;">${t.venue || ""}</p>
          <p style="margin:0;font:400 13px Arial,sans-serif;color:#4b5563;">
            ${t.tier} · ${t.quantity} ${t.quantity === 1 ? "person" : "people"} · ${t.attendeeName}
          </p>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;text-align:right;">
          <img src="${t.qr}" alt="QR ${t.ticketCode}" width="120" height="120"
               style="display:inline-block;border:1px solid #e5e7eb;border-radius:6px;" />
        </td>
      </tr>`,
    )
    .join("");

  const html = `
  <div style="background:#f3f4f6;padding:32px 16px;font-family:Arial,sans-serif;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <div style="background:#0b1220;padding:24px;text-align:center;">
        <p style="margin:0;color:#ffffff;font:600 20px Georgia,serif;letter-spacing:.2em;">ST. THOMAS' COLLEGE</p>
        <p style="margin:6px 0 0;color:#9ca3af;font:400 11px Arial,sans-serif;letter-spacing:.18em;">MATALE · EST. 1873</p>
      </div>
      <div style="padding:28px;">
        <p style="margin:0 0 6px;font:400 13px Arial,sans-serif;color:#6b7280;">Hi ${buyerName},</p>
        <h1 style="margin:0 0 14px;font:600 24px Georgia,serif;color:#111827;">Your tickets are confirmed</h1>
        <p style="margin:0 0 20px;font:400 14px Arial,sans-serif;color:#4b5563;line-height:1.6;">
          Order <strong style="color:#111827;">${orderNumber}</strong> — show the QR code at the gate.
          You can also download your tickets from your account at any time.
        </p>
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <p style="margin:24px 0 0;font:400 12px Arial,sans-serif;color:#9ca3af;">
          Each QR code is unique to your booking and can be scanned once. Please don't share it.
        </p>
      </div>
    </div>
  </div>`;

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
  });

  return { sent: true };
}
