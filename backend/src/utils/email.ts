import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@unistay.com';

export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
): Promise<boolean> {
  try {
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify your UniStay account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h1 style="color: #2563eb; margin-bottom: 20px;">Welcome to UniStay! 🎓</h1>
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for registering with UniStay! We're excited to help you find the perfect accommodation for your study abroad journey.
              </p>
              <p style="font-size: 16px; margin-bottom: 30px;">
                Please verify your email address by clicking the button below:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #2563eb; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 14px; color: #2563eb; word-break: break-all;">
                ${verificationUrl}
              </p>
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                This verification link will expire in 24 hours.
              </p>
            </div>
            <div style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
              <p>If you didn't create an account with UniStay, you can safely ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} UniStay. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return false;
    }

    console.log('Verification email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> {
  try {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset your UniStay password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h1 style="color: #2563eb; margin-bottom: 20px;">Reset Your Password</h1>
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                We received a request to reset your password for your UniStay account.
              </p>
              <p style="font-size: 16px; margin-bottom: 30px;">
                Click the button below to reset your password:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #2563eb; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 14px; color: #2563eb; word-break: break-all;">
                ${resetUrl}
              </p>
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                This password reset link will expire in 1 hour.
              </p>
            </div>
            <div style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
              <p>&copy; ${new Date().getFullYear()} UniStay. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }

    console.log('Password reset email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}
