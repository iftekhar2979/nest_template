import { BadRequestException, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config'; // If you are using environment variables

const configService = new ConfigService()
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Or your chosen email service provider
      auth: {
        user: configService.get<string>('SMTP_USERNAME'), 
        pass: configService.get<string>('SMTP_PASSWORD'), 
      },
    });
  }


  // Function to send OTP email
  async sendOtpEmail(to: string, otp: string, userName: string) {
    const htmlTemplate = this.getOtpHtmlTemplate(userName, otp);

    const mailOptions = {
      from: process.env.SMTP_USERNAME,
      to,
      subject: 'Untold Secret OTP for Registration',
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
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Untold Secret - OTP for Registration</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #f4f7fc;
              }
              .email-container {
                  width: 100%;
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 8px;
                  padding: 20px;
                  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
              }
              .email-header {
                  text-align: center;
                  margin-bottom: 20px;
              }
              .email-header h1 {
                  color: #5a4fcf;
                  font-size: 32px;
                  margin: 0;
              }
              .email-body {
                  font-size: 16px;
                  line-height: 1.5;
                  color: #333;
              }
              .email-body p {
                  margin-bottom: 15px;
              }
              .email-body .otp-container {
                  text-align: center;
                  background-color: #f1f1f1;
                  padding: 15px;
                  border-radius: 5px;
                  font-size: 24px;
                  font-weight: bold;
                  color: #333;
                  margin-bottom: 20px;
              }
              .email-footer {
                  text-align: center;
                  margin-top: 20px;
                  font-size: 12px;
                  color: #999;
              }
              .email-footer a {
                  color: #5a4fcf;
                  text-decoration: none;
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="email-header">
                  <h1>Untold Secret OTP Verification</h1>
              </div>
  
              <div class="email-body">
                  <p>Dear <strong>${userName}</strong>,</p>
                  <p>Thank you for registering on Untold Secret! To complete your registration, please verify your email address by entering the One-Time Password (OTP) below:</p>
                  <div class="otp-container">
                      <strong>${otp}</strong>
                  </div>
                  <p>The OTP is valid for the next 10 minutes. If you didn't request this OTP, please ignore this email.</p>
                  <p>If you have any questions or need help, feel free to contact us at <a href="mailto:support@vibelyapp.com">support@vibelyapp.com</a>.</p>
              </div>
  
              <div class="email-footer">
                  <p>The <strong>Untold Secret Team</strong></p>
                  <p><a href="https://vibelyapp.com" target="_blank">Visit Untold Secret</a> | <a href="https://vibelyapp.com/privacy-policy" target="_blank">Privacy Policy</a> | <a href="https://vibelyapp.com/terms" target="_blank">Terms of Service</a></p>
                  <p>This is an automated email, please do not reply directly to this message.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }
}
