// utils/email.js
const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host   : process.env.EMAIL_HOST || 'smtp.gmail.com',
  port   : process.env.EMAIL_PORT || 587,
  secure : false,
  auth   : {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const baseStyle = `
  font-family: 'Segoe UI', Arial, sans-serif;
  background: #f5f0e8;
  margin: 0; padding: 0;
`;
const card = `
  background: #ffffff;
  border-radius: 12px;
  padding: 32px;
  max-width: 560px;
  margin: 32px auto;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
`;
const accent = '#ff3d00';
const logo = `<div style="font-size:28px;font-weight:900;letter-spacing:2px;margin-bottom:24px;">
  Print<span style="color:${accent}">Zone</span>
</div>`;
const divider = `<hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>`;
const footer = `<p style="text-align:center;color:#999;font-size:12px;margin-top:24px;">
  PrintZone · Lucknow, Uttar Pradesh · +91 98765 43210
</p>`;

// ── Order Confirmation ─────────────────────────
exports.sendOrderConfirmation = async (order) => {
  if (!process.env.EMAIL_USER) return;
  const transporter = createTransporter();

  const itemsHtml = order.items.map(i => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${i.totalPrice}</td>
    </tr>
  `).join('');

  const html = `<body style="${baseStyle}">
    <div style="${card}">
      ${logo}
      <h2 style="color:#0a0a0f;margin:0 0 8px;">Order Confirmed! 🎉</h2>
      <p style="color:#666;">Hi ${order.customer.name}, your order has been received.</p>
      ${divider}
      <p><strong>Order #:</strong> ${order.orderNumber}</p>
      <p><strong>Status:</strong> <span style="color:${accent};font-weight:700;">Pending Confirmation</span></p>
      <p><strong>Delivery:</strong> ${order.deliveryInfo.type}</p>
      ${divider}
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f5f0e8;">
            <th style="padding:8px;text-align:left;">Item</th>
            <th style="padding:8px;text-align:center;">Qty</th>
            <th style="padding:8px;text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px 8px;font-weight:700;">Total</td>
            <td style="padding:12px 8px;text-align:right;font-weight:700;font-size:18px;color:${accent};">₹${order.pricing.total}</td>
          </tr>
        </tfoot>
      </table>
      ${divider}
      <p style="color:#666;font-size:14px;">We will call you on <strong>${order.customer.phone}</strong> within 30 minutes to confirm your order.</p>
      ${footer}
    </div>
  </body>`;

  await transporter.sendMail({
    from   : process.env.EMAIL_FROM,
    to     : order.customer.email,
    subject: `Order Confirmed — ${order.orderNumber} | PrintZone`,
    html,
  });
};

// ── Order Status Update ────────────────────────
exports.sendStatusUpdate = async (order) => {
  if (!process.env.EMAIL_USER || !order.customer.email) return;
  const transporter = createTransporter();

  const statusMessages = {
    confirmed  : { emoji: '✅', msg: 'Your order has been confirmed and is being prepared.' },
    processing : { emoji: '⚙️', msg: 'Your order is currently being processed.' },
    ready      : { emoji: '📦', msg: 'Your order is ready! You can pick it up from the shop.' },
    dispatched : { emoji: '🚚', msg: 'Your order has been dispatched and is on the way.' },
    delivered  : { emoji: '🎉', msg: 'Your order has been delivered. Thank you for choosing PrintZone!' },
    cancelled  : { emoji: '❌', msg: `Your order has been cancelled. ${order.cancelReason || ''}` },
  };
  const info = statusMessages[order.status] || { emoji: '📋', msg: `Order status: ${order.status}` };

  const html = `<body style="${baseStyle}">
    <div style="${card}">
      ${logo}
      <h2 style="font-size:32px;margin:0 0 4px;">${info.emoji} Order Update</h2>
      <p style="color:#666;">Hi ${order.customer.name},</p>
      <p>${info.msg}</p>
      ${divider}
      <p><strong>Order #:</strong> ${order.orderNumber}</p>
      <p><strong>New Status:</strong> <span style="color:${accent};font-weight:700;text-transform:uppercase;">${order.status}</span></p>
      <p><strong>Total:</strong> ₹${order.pricing.total}</p>
      ${footer}
    </div>
  </body>`;

  await transporter.sendMail({
    from   : process.env.EMAIL_FROM,
    to     : order.customer.email,
    subject: `Order ${info.emoji} ${order.status.toUpperCase()} — ${order.orderNumber} | PrintZone`,
    html,
  });
};

// ── Contact Alert to Admin ────────────────────
exports.sendContactAlert = async (contact) => {
  if (!process.env.EMAIL_USER) return;
  const transporter = createTransporter();

  const html = `<body style="${baseStyle}">
    <div style="${card}">
      ${logo}
      <h2>📩 New Contact Message</h2>
      ${divider}
      <p><strong>Name:</strong> ${contact.name}</p>
      <p><strong>Phone:</strong> ${contact.phone || 'N/A'}</p>
      <p><strong>Email:</strong> ${contact.email || 'N/A'}</p>
      <p><strong>Subject:</strong> ${contact.subject || 'N/A'}</p>
      ${divider}
      <p><strong>Message:</strong></p>
      <p style="background:#f5f0e8;padding:16px;border-radius:8px;color:#333;">${contact.message}</p>
      ${footer}
    </div>
  </body>`;

  await transporter.sendMail({
    from   : process.env.EMAIL_FROM,
    to     : process.env.EMAIL_USER,
    subject: `New Contact: ${contact.subject || contact.name} | PrintZone`,
    html,
  });
};
