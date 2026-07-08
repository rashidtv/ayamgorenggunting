// backend/emails/resend.js
const { Resend } = require('resend');
const dotenv = require('dotenv');
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@chickoryhub.com';
const FROM_NAME = process.env.FROM_NAME || 'Chickory Hub';
const LOGIN_URL = process.env.LOGIN_URL || 'https://chickoryhub.com/#/login';

// ============================================
// UNIFIED EMAIL TEMPLATE - CLEAN VERSION
// No header, no banner, just clean content
// ============================================

function createEmailTemplate({
  title,
  greeting,
  content,
  highlightBox = null,
  credentials = null,
  ctaButton = null,
  footerMessage = null
}) {
  const brandColor = '#F94908';
  const textColor = '#1e293b';
  const textSecondary = '#64748b';
  const bgColor = '#ffffff';
  const borderColor = '#e2e8f0';

  // Highlight Box
  let highlightHtml = '';
  if (highlightBox) {
    highlightHtml = `
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${brandColor};">
        ${highlightBox}
      </div>
    `;
  }

  // Credentials Box
  let credentialsHtml = '';
  if (credentials) {
    credentialsHtml = `
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="color: ${textColor}; margin-top: 0; font-size: 14px;">🔑 Login Credentials</h3>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Username:</strong> ${credentials.username}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Password:</strong> <span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${credentials.password}</span></p>
        ${credentials.note ? `<p style="color: ${textSecondary}; font-size: 12px; margin-top: 8px;">${credentials.note}</p>` : ''}
        ${ctaButton ? `<div style="text-align: center; margin-top: 16px;">${ctaButton}</div>` : ''}
      </div>
    `;
  }

  // CTA Button (without credentials)
  let ctaHtml = '';
  if (ctaButton && !credentials) {
    ctaHtml = `
      <div style="text-align: center; margin: 16px 0;">
        <a href="${ctaButton.url}" style="display: inline-block; background: ${brandColor}; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
          ${ctaButton.text}
        </a>
      </div>
    `;
  }

  // CTA Button inside credentials (already handled above)
  const buttonInsideCredentials = (ctaButton && credentials) ? `
    <div style="text-align: center; margin-top: 16px;">
      <a href="${ctaButton.url}" style="display: inline-block; background: ${brandColor}; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
        ${ctaButton.text}
      </a>
    </div>
  ` : '';

  // Replace the credentials HTML if we have a button inside
  if (credentials && ctaButton) {
    credentialsHtml = `
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="color: ${textColor}; margin-top: 0; font-size: 14px;">🔑 Login Credentials</h3>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Username:</strong> ${credentials.username}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Password:</strong> <span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${credentials.password}</span></p>
        ${credentials.note ? `<p style="color: ${textSecondary}; font-size: 12px; margin-top: 8px;">${credentials.note}</p>` : ''}
        ${buttonInsideCredentials}
      </div>
    `;
  }

  const finalFooterMessage = footerMessage || 'If you have any questions, please contact our support team.';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: ${bgColor}; border-radius: 12px;">
      
      <!-- Title -->
      <h2 style="color: ${brandColor}; font-size: 20px; margin: 0 0 16px 0; font-weight: 600; border-bottom: 2px solid ${brandColor}; padding-bottom: 8px;">
        ${title}
      </h2>

      <!-- Greeting -->
      <p style="font-size: 15px; color: ${textColor}; margin: 0 0 8px 0;">
        ${greeting}
      </p>

      <!-- Main Content -->
      <div style="font-size: 15px; color: ${textColor}; line-height: 1.6;">
        ${content}
      </div>

      <!-- Highlight Box -->
      ${highlightHtml}

      <!-- Credentials Box -->
      ${credentialsHtml}

      <!-- CTA Button (without credentials) -->
      ${ctaHtml}

      <!-- Footer -->
      <hr style="border: none; border-top: 1px solid ${borderColor}; margin: 24px 0 16px 0;" />
      <p style="font-size: 13px; color: ${textSecondary}; text-align: center; margin: 0;">
        ${finalFooterMessage}
      </p>
      <p style="font-size: 13px; color: ${textSecondary}; text-align: center; margin: 4px 0 0 0;">
        Regards,<br />
        <strong style="color: ${brandColor};">Chickory Hub Team</strong>
      </p>

      <!-- Copyright -->
      <div style="text-align: center; padding-top: 16px; margin-top: 16px; border-top: 1px solid ${borderColor};">
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">
          &copy; ${new Date().getFullYear()} Chickory Hub. All rights reserved.
        </p>
      </div>

    </div>
  `;
}

// ============================================
// SEND EMAIL FUNCTION
// ============================================

async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('⚠️ Resend API key not set. Email not sent.');
    console.log('📧 To:', to);
    console.log('📧 Subject:', subject);
    return null;
  }

  try {
    const response = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: subject,
      html: html || text,
      text: text || html?.replace(/<[^>]*>/g, ''),
    });

    console.log(`✅ Email sent to ${to}`, response);
    return response;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return null;
  }
}

// ============================================
// REGISTRATION RECEIVED
// ============================================

async function sendRegistrationReceived(email, companyName, contactPerson) {
  const html = createEmailTemplate({
    title: 'Thank You for Registering!',
    greeting: `Dear ${contactPerson},`,
    content: `
      <p>We have received your registration request for <strong>${companyName}</strong>.</p>
      <p>Your request is now pending review. You will receive an email once your registration is approved.</p>
    `,
    highlightBox: `
      <p style="margin: 0; font-size: 14px;"><strong>Company:</strong> ${companyName}</p>
      <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Contact:</strong> ${contactPerson}</p>
      <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Email:</strong> ${email}</p>
    `,
    footerMessage: 'We will review your application and get back to you soon.'
  });

  return sendEmail({
    to: email,
    subject: 'Registration Received - Chickory Hub',
    html
  });
}

// ============================================
// REGISTRATION APPROVED
// ============================================

async function sendRegistrationApproved(email, companyName, contactPerson, username, tempPassword, loginUrl) {
  const html = createEmailTemplate({
    title: '🎉 Welcome to Chickory Hub!',
    greeting: `Dear ${contactPerson},`,
    content: `
      <p>We are excited to inform you that your registration for <strong>${companyName}</strong> has been approved!</p>
      <p>You can now log in to your account using the credentials below.</p>
    `,
    credentials: {
      username: username,
      password: tempPassword,
      note: 'Please change your password after your first login.'
    },

    ctaButton: {
  url: loginUrl || LOGIN_URL,
  text: '🔑 Login Now'
},
    footerMessage: 'Welcome aboard! We\'re excited to have you.'
  });

  return sendEmail({
    to: email,
    subject: '🎉 Welcome to Chickory Hub! Your Registration is Approved',
    html
  });
}

// ============================================
// REGISTRATION REJECTED
// ============================================

async function sendRegistrationRejected(email, companyName, contactPerson, reason) {
  const name = contactPerson || 'Customer';
  const rejectionReason = reason || 'No reason provided';

  const html = createEmailTemplate({
    title: 'Registration Update',
    greeting: `Dear ${name},`,
    content: `
      <p>We regret to inform you that your registration request for <strong>${companyName}</strong> has been declined.</p>
    `,
    highlightBox: `
      <p style="margin: 0; font-size: 14px; color: #991b1b;">
        <strong>Reason:</strong> ${rejectionReason}
      </p>
    `,
    footerMessage: 'If you have any questions, please contact our support team.'
  });

  return sendEmail({
    to: email,
    subject: `Registration Update - ${companyName}`,
    html
  });
}

// ============================================
// PASSWORD RESET
// ============================================

async function sendPasswordResetEmail(email, username, resetUrl) {
  const html = createEmailTemplate({
    title: 'Reset Your Password',
    greeting: `Hi ${username},`,
    content: `
      <p>We received a request to reset your password for your Chickory Hub account.</p>
      <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
    `,
    ctaButton: {
      url: resetUrl,
      text: '🔑 Reset Password'
    },
    footerMessage: 'If you didn\'t request this, please ignore this email or contact support.'
  });

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - Chickory Hub',
    html
  });
}

// ============================================
// PASSWORD RESET CONFIRMATION
// ============================================

async function sendPasswordResetConfirmation(email) {
  const html = createEmailTemplate({
    title: '✅ Password Reset Successful',
    greeting: 'Hi there,',
    content: `
      <p>Your password has been successfully reset.</p>
      <div style="background: #f0fdf4; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #10b981;">
        <p style="margin: 0; color: #065f46; font-size: 14px;">If you didn't request this change, please contact support immediately.</p>
      </div>
      <p style="margin-top: 12px;">You can now log in with your new password.</p>
    `,
    footerMessage: 'Your account security is important to us.'
  });

  return sendEmail({
    to: email,
    subject: 'Your Password Has Been Reset - Chickory Hub',
    html
  });
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  sendEmail,
  sendRegistrationReceived,
  sendRegistrationApproved,
  sendRegistrationRejected,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation
};