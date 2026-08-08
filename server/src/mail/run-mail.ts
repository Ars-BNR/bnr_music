import { ConfigService } from '@nestjs/config';
import { config as loadEnvironment } from 'dotenv';
import { validateEnvironment } from 'src/config/env.validation';
import { MailService } from './mail.service';

async function main(): Promise<void> {
  loadEnvironment({ path: `.${process.env.NODE_ENV ?? 'development'}.env` });
  const environment = validateEnvironment(process.env);
  const mail = new MailService(new ConfigService(environment));
  await mail.verifyConnection();

  if (process.argv[2] === 'test') {
    const recipient = environment.MAIL_TEST_TO;
    if (!recipient) throw new Error('MAIL_TEST_TO is required for mail:test');
    await mail.sendTestMail(recipient);
    console.log('Test email accepted by Google SMTP');
  }
}

void main();
