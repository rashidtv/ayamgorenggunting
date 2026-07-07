const { Resend } = require('resend');
const dotenv = require('dotenv');
dotenv.config();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@chickoryhub.com';
const FROM_NAME = process.env.FROM_NAME || 'Chickory Hub';

/**
 * Send email using Resend
 */
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
    if (error.response) {
      console.error('Response:', error.response);
    }
    return null;
  }
}

/**
 * Send Registration Received email
 */
async function sendRegistrationReceived(email, companyName, contactPerson) {
  const subject = 'Registration Received - Chickory Hub';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #F94908;">Thank You for Registering!</h2>
      <p>Dear ${contactPerson},</p>
      <p>We have received your registration request for <strong>${companyName}</strong>.</p>
      <p>Your request is now pending review. You will receive an email once your registration is approved.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Company:</strong> ${companyName}</p>
        <p style="margin: 0;"><strong>Contact:</strong> ${contactPerson}</p>
        <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
      </div>
      <p>If you have any questions, please contact our support team.</p>
      <p>Regards,<br><strong>Chickory Hub Team</strong></p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send Registration Approved email with credentials
 */
async function sendRegistrationApproved(email, companyName, contactPerson, username, tempPassword, loginUrl) {
  const subject = `Welcome to Chickory Hub - ${companyName} Approved!`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10b981;">🎉 Welcome to Chickory Hub!</h2>
      <p>Dear ${contactPerson},</p>
      <p>Your company <strong>${companyName}</strong> has been approved!</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Login Credentials</h3>
        <p style="margin: 0;"><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
        <p style="margin: 0;"><strong>Username:</strong> ${username}</p>
        <p style="margin: 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; color: #92400e;">⚠️ <strong>Important:</strong> You will be required to change your password on first login.</p>
      </div>
      <p>Regards,<br><strong>Chickory Hub Team</strong></p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send Registration Rejected email
 */
// backend/emails/resend.js
// ✅ ONLY this function changes - everything else stays exactly the same

async function sendRegistrationRejected(email, companyName, contactPerson, reason) {
  // ✅ Safe fallbacks
  const name = contactPerson || 'Customer';
  const rejectionReason = reason || 'No reason provided';
  
  const subject = `Registration Update - ${companyName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 2rem;">🍗</span>
        <h1 style="color: #F94908; font-weight: 700; margin: 0;">Chickory Hub</h1>
      </div>
      <h2 style="color: #ef4444;">Registration Update</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>We regret to inform you that your registration request for <strong>${companyName}</strong> has been declined.</p>
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${rejectionReason}</p>
      </div>
      <p>If you have any questions, please contact our support team.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">Regards,<br><strong style="color: #F94908;">Chickory Hub Team</strong></p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send New User Created email
 */
async function sendNewUserCreated(email, username, fullName, tempPassword, loginUrl) {
  const subject = 'Welcome to Chickory Hub - Your Account';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #3b82f6;">Welcome to Chickory Hub!</h2>
      <p>Dear ${fullName},</p>
      <p>An account has been created for you on Chickory Hub.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Login Credentials</h3>
        <p style="margin: 0;"><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
        <p style="margin: 0;"><strong>Username:</strong> ${username}</p>
        <p style="margin: 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; color: #92400e;">⚠️ <strong>Important:</strong> You will be required to change your password on first login.</p>
      </div>
      <p>Regards,<br><strong>Chickory Hub Team</strong></p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send Password Reset email
 */
async function sendPasswordReset(email, username, fullName, tempPassword) {
  const subject = 'Your Password Has Been Reset - Chickory Hub';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #f59e0b;">Password Reset</h2>
      <p>Dear ${fullName},</p>
      <p>Your password for <strong>${username}</strong> has been reset.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">New Temporary Password</h3>
        <p style="margin: 0; font-size: 18px; font-weight: bold;">${tempPassword}</p>
      </div>
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; color: #92400e;">⚠️ <strong>Important:</strong> You will be required to change your password on next login.</p>
      </div>
      <p>If you did not request this reset, please contact support immediately.</p>
      <p>Regards,<br><strong>Chickory Hub Team</strong></p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send Password Reset email
 */
async function sendPasswordReset(email, username, resetUrl) {
  const subject = 'Reset Your Password - Chickory Hub';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #F94908;">Reset Your Password</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>We received a request to reset your password for your Chickory Hub account.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;">Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 15px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background: #F94908; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Reset Password
          </a>
        </div>
        <p style="margin: 0; font-size: 0.8rem; color: #64748b;">This link will expire in 1 hour.</p>
      </div>
      <p style="font-size: 0.85rem; color: #64748b;">If you didn't request this, please ignore this email or contact support.</p>
      <p>Regards,<br><strong>Chickory Hub Team</strong></p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send Password Reset email
 */
async function sendPasswordResetEmail(email, username, resetUrl) {
  const subject = 'Reset Your Password - Chickory Hub';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 2rem;">🍗</span>
        <h1 style="color: #F94908; font-weight: 700; margin: 0;">Chickory Hub</h1>
      </div>
      <h2 style="color: #1e293b;">Reset Your Password</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>We received a request to reset your password for your Chickory Hub account.</p>
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0 0 15px 0;">Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background: #F94908; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Reset Password
        </a>
        <p style="margin: 15px 0 0 0; font-size: 0.8rem; color: #64748b;">This link will expire in 1 hour.</p>
      </div>
      <p style="font-size: 0.85rem; color: #64748b;">If you didn't request this, please ignore this email or contact support.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">Regards,<br><strong style="color: #F94908;">Chickory Hub Team</strong></p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send Password Reset Confirmation email
 */
async function sendPasswordResetConfirmation(email) {
  const subject = 'Your Password Has Been Reset - Chickory Hub';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 2rem;">🍗</span>
        <h1 style="color: #F94908; font-weight: 700; margin: 0;">Chickory Hub</h1>
      </div>
      <h2 style="color: #10b981;">✅ Password Reset Successful</h2>
      <p>Hi there,</p>
      <p>Your password has been successfully reset.</p>
      <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0; color: #065f46;">If you didn't request this change, please contact support immediately.</p>
      </div>
      <p style="font-size: 0.85rem; color: #64748b;">You can now log in with your new password.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 0.8rem; color: #94a3b8; text-align: center;">Regards,<br><strong style="color: #F94908;">Chickory Hub Team</strong></p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

module.exports = {
  sendEmail,
  sendRegistrationReceived,
  sendRegistrationApproved,
  sendRegistrationRejected,
  sendNewUserCreated,
  sendPasswordReset,
  sendPasswordResetEmail,      // ← Add this
  sendPasswordResetConfirmation // ← Add this
};