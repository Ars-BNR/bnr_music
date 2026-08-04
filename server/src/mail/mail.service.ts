import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter | null;

  constructor(private readonly config: ConfigService) {
    if (config.get<string>('MAIL_DISABLED') === 'true') {
      this.transporter = null;
      return;
    }

    const options: SMTPTransport.Options = {
      host: config.get<string>('SMTP_HOST'),
      port: Number(config.get<string>('SMTP_PORT') ?? 587),
      secure: config.get<string>('SMTP_SECURE') === 'true',
      auth: config.get<string>('SMTP_USER')
        ? {
            user: config.get<string>('SMTP_USER'),
            pass: config.get<string>('SMTP_PASSWORD'),
          }
        : undefined,
    };
    this.transporter = nodemailer.createTransport(options);
  }

  async sendActivationMail(to: string, link: string): Promise<void> {
    if (!this.transporter) return;
    const apiUrl = this.config.getOrThrow<string>('API_URL');
    await this.transporter.sendMail({
      from:
        this.config.get<string>('SMTP_FROM') ??
        this.config.get<string>('SMTP_USER'),
      to,
      subject: `Activate your ${apiUrl} account`,
      text: `Activate your account: ${link}`,
      html: `<div><h1>Activate your account</h1><a href="${link}">${link}</a></div>`,
    });
  }
}
