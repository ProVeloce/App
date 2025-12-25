import nodemailer from 'nodemailer';
import { config } from '../config/index';

// Create transporter
const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
    },
});

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

/**
 * Send email using configured SMTP
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    try {
        await transporter.sendMail({
            from: config.smtp.from,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ''),
        });
        console.log(`✉️ Email sent to: ${options.to}`);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return false;
    }
};

/**
 * Send OTP verification email
 */
export const sendOTPEmail = async (
    email: string,
    otp: string,
    type: 'email_verification' | 'password_reset'
): Promise<boolean> => {
    const subjects = {
        email_verification: 'Verify Your Email - ProVeloce',
        password_reset: 'Reset Your Password - ProVeloce',
    };

    const messages = {
        email_verification: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">ProVeloce</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1a1a2e;">Verify Your Email</h2>
          <p>Welcome to ProVeloce! Use the following OTP to verify your email address:</p>
          <div style="background: #1a1a2e; color: white; font-size: 32px; padding: 20px; text-align: center; letter-spacing: 8px; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666;">This OTP will expire in ${config.otpExpiryMinutes} minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
        password_reset: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">ProVeloce</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1a1a2e;">Reset Your Password</h2>
          <p>You requested to reset your password. Use the following OTP:</p>
          <div style="background: #1a1a2e; color: white; font-size: 32px; padding: 20px; text-align: center; letter-spacing: 8px; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666;">This OTP will expire in ${config.otpExpiryMinutes} minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please secure your account immediately.</p>
        </div>
      </div>
    `,
    };

    return sendEmail({
        to: email,
        subject: subjects[type],
        html: messages[type],
    });
};

/**
 * Send welcome email after signup
 */
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
    return sendEmail({
        to: email,
        subject: 'Welcome to ProVeloce!',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">ProVeloce</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1a1a2e;">Welcome, ${name}!</h2>
          <p>Thank you for joining ProVeloce. We're excited to have you on board.</p>
          <p>Here's what you can do next:</p>
          <ul style="color: #333;">
            <li>Complete your profile</li>
            <li>Apply to become an expert</li>
            <li>Explore our platform features</li>
          </ul>
          <a href="${config.frontendUrl}/login" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Login to Your Account</a>
        </div>
      </div>
    `,
    });
};

/**
 * Send application status update email
 */
export const sendApplicationStatusEmail = async (
    email: string,
    name: string,
    status: 'approved' | 'rejected',
    reason?: string
): Promise<boolean> => {
    const subject = status === 'approved'
        ? 'Congratulations! Your Expert Application is Approved'
        : 'Expert Application Status Update';

    const message = status === 'approved'
        ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎉 Congratulations!</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1a1a2e;">Welcome to the Expert Team, ${name}!</h2>
          <p>Your expert application has been approved. You now have access to the Expert Portal.</p>
          <p>As an expert, you can:</p>
          <ul style="color: #333;">
            <li>Manage your portfolio</li>
            <li>Accept assigned tasks</li>
            <li>Track your earnings</li>
          </ul>
          <a href="${config.frontendUrl}/login" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Access Expert Portal</a>
        </div>
      </div>
    `
        : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Application Update</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1a1a2e;">Hello ${name},</h2>
          <p>We have reviewed your expert application and unfortunately, we are unable to approve it at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>You can update your application and resubmit for review.</p>
          <a href="${config.frontendUrl}/customer/application" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Update Application</a>
        </div>
      </div>
    `;

    return sendEmail({
        to: email,
        subject,
        html: message,
    });
};
