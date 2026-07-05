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
async function sendRegistrationRejected(email, companyName, contactPerson, reason) {
  const subject = `Registration Update - ${companyName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #ef4444;">Registration Update</h2>
      <p>Dear ${contactPerson},</p>
      <p>We regret to inform you that your registration request for <strong>${companyName}</strong> has been declined.</p>
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${reason}</p>
      </div>
      <p>If you have any questions, please contact our support team.</p>
      <p>Regards,<br><strong>Chickory Hub Team</strong></p>
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

module.exports = {
  sendEmail,
  sendRegistrationReceived,
  sendRegistrationApproved,
  sendRegistrationRejected,
  sendNewUserCreated,
  sendPasswordReset,
};