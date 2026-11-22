/**
 * Sends one test email through the configured SMTP transport.
 *
 * Usage:
 *   npx tsx scripts/test-email.mjs your-email@gmail.com
 *
 * Set SMTP_USER / SMTP_PASS in .env first (Gmail requires an App Password,
 * not the account password — see README).
 */
import "dotenv/config";
import nodemailer from "nodemailer";

const to = process.argv[2];

if (!to) {
  console.error("\nUsage: npx tsx scripts/test-email.mjs <your-email>\n");
  console.error("Example: npx tsx scripts/test-email.mjs malli@gmail.com\n");
  process.exit(1);
}

const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

console.log("\n--- SMTP test ---");
console.log("SMTP_HOST :", process.env.SMTP_HOST || "smtp.gmail.com (default)");
console.log("SMTP_PORT :", process.env.SMTP_PORT || "465 (default)");
console.log("SMTP_USER :", user || "(empty)");
console.log("SMTP_PASS :", pass ? "(set)" : "(empty)");

if (!user || !pass) {
  console.error(
    "\nX SMTP not configured.\n" +
      "  Add SMTP_USER and SMTP_PASS to .env.\n" +
      "  Gmail needs an App Password (16 chars, no spaces) - see README.\n",
  );
  process.exit(1);
}

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: Number(process.env.SMTP_PORT || 465) === 465,
  auth: { user, pass },
});

console.log("\nVerifying connection...");

try {
  await transport.verify();
  console.log("OK - connection + auth accepted\n");

  const info = await transport.sendMail({
    from: process.env.SMTP_FROM || `"St. Thomas' College Store" <${user}>`,
    to,
    subject: "SMTP test - St. Thomas' College Store",
    text: "If you can read this, ticket emails will reach your customers.",
    html: `<div style="font-family:Arial,sans-serif;padding:24px;">
      <h2 style="color:#111827;">SMTP is working</h2>
      <p style="color:#4b5563;">Ticket emails will be delivered to this address.</p>
    </div>`,
  });

  console.log("OK - test email sent to", to);
  console.log("  Message ID:", info.messageId, "\n");
  process.exit(0);
} catch (e) {
  console.error("\nFAILED:", e.message, "\n");

  const msg = e.message || "";
  if (msg.includes("Invalid login") || msg.includes("not accepted")) {
    console.error("  -> Your SMTP_USER / SMTP_PASS is wrong.");
    console.error("     Gmail needs an App Password from");
    console.error("     https://myaccount.google.com/apppasswords");
    console.error("     (16 characters, remove the spaces).");
  } else if (msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED")) {
    console.error("  -> Could not reach the SMTP host. Check SMTP_HOST / SMTP_PORT,");
    console.error("     and whether your network allows outbound port 465.");
  }
  process.exit(1);
}
