import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);

  private readonly transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify SMTP connection and send test email
  async onModuleInit() {
    try {
      await this.transporter.verify();

      this.logger.log('SMTP connection successful');

      // Temporary test email
      // await this.testEmail();
    } catch (error) {
      this.logger.error(
        'SMTP initialization failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // Reusable email method
  async sendEmail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }) {
    return this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  }

  // Password reset email
  async sendResetPasswordEmail({
    email,
    name,
    url,
  }: {
    email: string;
    name: string;
    url: string;
  }) {
    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html: `
        <h2>Hello ${name || 'User'}</h2>
        <p>Click below to reset your password.</p>
        <a href="${url}">Reset Password</a>
        <p>This link expires in 30 minutes.</p>
      `,
    });
  }

  // Temporary test email
  async testEmail() {
    try {
      const info = await this.sendEmail({
        to: 'fcbiqbal14@gmail.com',
        subject: 'Yahoo SMTP Test',
        html: `
          <h2>Hello!</h2>
          <p>Yahoo SMTP is working successfully.</p>
        `,
      });

      this.logger.log(`Test email sent: ${info.messageId}`);

      return info;
    } catch (error) {
      const info = await this.sendEmail({
        to: 'fcbiqbal14@gmail.com',
        subject: 'Yahoo SMTP Test',
        html: '<h2>Yahoo SMTP is working.</h2>',
      });
      this.logger.error(
        JSON.stringify({
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected,
          response: info.response,
        }),
      );

      throw error;
    }
  }
}
