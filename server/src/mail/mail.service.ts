import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export class MailDeliveryError extends Error {
  constructor(
    readonly smtpCode: string | undefined,
    message = 'Email delivery failed',
  ) {
    super(message);
    this.name = 'MailDeliveryError';
  }
}

@Injectable()
export class MailService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string | undefined;
  private readonly disabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.disabled = config.get<boolean>('MAIL_DISABLED') ?? true;
    this.from = config.get<string>('SMTP_FROM')?.trim();
    if (this.disabled) {
      this.transporter = null;
      return;
    }

    const port = config.get<number>('SMTP_PORT') ?? 587;
    const options: SMTPTransport.Options = {
      host: config.getOrThrow<string>('SMTP_HOST'),
      port,
      secure: config.get<boolean>('SMTP_SECURE') ?? false,
      requireTLS: port === 587,
      auth: {
        user: config.getOrThrow<string>('SMTP_USER'),
        pass: config
          .getOrThrow<string>('SMTP_PASSWORD')
          .replaceAll(' ', ''),
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    };
    this.transporter = nodemailer.createTransport(options);
  }

  async onApplicationBootstrap(): Promise<void> {
    if (this.disabled) {
      if (this.config.get<string>('NODE_ENV') !== 'test') {
        throw new Error(
          'Email is disabled. Set MAIL_DISABLED=false and configure Google SMTP before starting the API.',
        );
      }
      return;
    }
    await this.verifyConnection();
  }

  get isEnabled(): boolean {
    return this.transporter !== null;
  }

  async verifyConnection(): Promise<void> {
    const transporter = this.getTransporter();
    try {
      await transporter.verify();
      this.logger.log('SMTP connection verified');
    } catch (error) {
      const code = this.getErrorCode(error);
      this.logger.error(`SMTP verification failed${code ? ` (${code})` : ''}`);
      throw new MailDeliveryError(code, 'SMTP verification failed');
    }
  }

  async sendActivationMail(to: string, link: string): Promise<void> {
    await this.send({
      to,
      subject: 'Подтвердите email в BNR Music',
      text: `Подтвердите email: ${link}`,
      html: `<div><h1>Подтвердите email в BNR Music</h1><p>Ссылка действует 24 часа.</p><a href="${link}">Активировать аккаунт</a></div>`,
    });
  }

  async sendPasswordResetMail(to: string, link: string): Promise<void> {
    await this.send({
      to,
      subject: 'Сброс пароля BNR Music',
      text: `Сбросить пароль: ${link}`,
      html: `<div><h1>Сброс пароля BNR Music</h1><p>Ссылка действует 30 минут.</p><a href="${link}">Задать новый пароль</a></div>`,
    });
  }

  async sendTestMail(to: string): Promise<void> {
    await this.send({
      to,
      subject: 'BNR Music — проверка Google SMTP',
      text: 'Google SMTP настроен корректно.',
      html: '<div><h1>BNR Music</h1><p>Google SMTP настроен корректно.</p></div>',
    });
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      throw new MailDeliveryError(undefined, 'Email transport is disabled');
    }
    return this.transporter;
  }

  private async send(
    message: Pick<nodemailer.SendMailOptions, 'to' | 'subject' | 'text' | 'html'>,
  ): Promise<void> {
    try {
      await this.getTransporter().sendMail({ from: this.from, ...message });
    } catch (error) {
      if (error instanceof MailDeliveryError) throw error;
      const code = this.getErrorCode(error);
      this.logger.warn(`Email delivery failed${code ? ` (${code})` : ''}`);
      throw new MailDeliveryError(code);
    }
  }

  private getErrorCode(error: unknown): string | undefined {
    if (!error || typeof error !== 'object' || !('code' in error)) return;
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
}
