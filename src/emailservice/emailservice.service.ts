import { BadRequestException, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config'; // If you are using environment variables

const configService = new ConfigService();
const BRAND_NAME = 'Ilmify Tech Agency';
const SUPPORT_EMAIL =
  configService.get<string>('SUPPORT_EMAIL') || 'support@ilmifytech.com';
const WEBSITE_URL =
  configService.get<string>('WEBSITE_URL') || 'https://ilmifytech.com';
const PRIVACY_URL =
  configService.get<string>('PRIVACY_URL') || `${WEBSITE_URL}/privacy-policy`;
const TERMS_URL =
  configService.get<string>('TERMS_URL') || `${WEBSITE_URL}/terms`;

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: configService.get<string>('SMTP_USER'),
        pass: configService.get<string>('SMTP_PASS'),
      },
    });
  }

  // Function to send OTP email
  async sendOtpEmail(to: string, otp: string, userName: string) {
    const htmlTemplate = this.getOtpHtmlTemplate(userName, otp);

    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject: `${BRAND_NAME} email verification code`,
      html: htmlTemplate,
    };
    try {
      console.log('OTP Email Sent');
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending OTP email', error);
      throw new BadRequestException('Email is not available!');
    }
  }

  // Function to generate the HTML template with the OTP embedded
  private getOtpHtmlTemplate(userName: string, otp: string): string {
    const safeUserName = this.escapeHtml(userName || 'there');
    const safeOtp = this.escapeHtml(otp);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body {
                  font-family: Arial, Helvetica, sans-serif;
                  margin: 0;
                  padding: 24px 12px;
                  background-color: #f4f7fc;
                  color: #172033;
              }
              .email-container {
                  width: 100%;
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 8px;
                  overflow: hidden;
                  border: 1px solid #e6eaf2;
              }
              .email-header {
                  text-align: center;
                  padding: 28px 24px;
                  background-color: #101828;
              }
              .email-header h1 {
                  color: #ffffff;
                  font-size: 24px;
                  margin: 0;
                  letter-spacing: 0;
              }
              .email-body {
                  font-size: 16px;
                  line-height: 1.6;
                  color: #344054;
                  padding: 28px 24px 8px;
              }
              .email-body p {
                  margin-bottom: 15px;
              }
              .email-body .otp-container {
                  text-align: center;
                  background-color: #f8fafc;
                  border: 1px solid #d0d5dd;
                  padding: 18px;
                  border-radius: 8px;
                  font-size: 30px;
                  font-weight: bold;
                  color: #101828;
                  letter-spacing: 6px;
                  margin: 24px 0;
              }
              .email-footer {
                  text-align: center;
                  padding: 20px 24px 28px;
                  font-size: 12px;
                  color: #667085;
              }
              .email-footer a {
                  color: #175cd3;
                  text-decoration: none;
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="email-header">
                  <h1>${BRAND_NAME}</h1>
              </div>
  
              <div class="email-body">
                  <p>Hi <strong>${safeUserName}</strong>,</p>
                  <p>Use this one-time verification code to finish securing your ${BRAND_NAME} account:</p>
                  <div class="otp-container">
                      <strong>${safeOtp}</strong>
                  </div>
                  <p>This code expires in 3 minutes. If you did not request it, you can safely ignore this email.</p>
                  <p>Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
              </div>
  
              <div class="email-footer">
                  <p>The <strong>${BRAND_NAME}</strong> team</p>
                  <p><a href="${WEBSITE_URL}" target="_blank">Visit ${BRAND_NAME}</a> | <a href="${PRIVACY_URL}" target="_blank">Privacy Policy</a> | <a href="${TERMS_URL}" target="_blank">Terms of Service</a></p>
                  <p>This is an automated email, please do not reply directly to this message.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
