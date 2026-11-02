import nodemailer from 'nodemailer';

/**
 * Sends security alerts by e-mail. Without SMTP_HOST / ALERT_EMAIL_TO it only logs to the console,
 * so the API works the same with alerts disabled.
 */
export class Notifier {
  #config;
  #transport;

  constructor(config, transport = null) {
    this.#config = config;
    this.#transport =
      transport ??
      (this.enabled
        ? nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.secure,
            auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined
          })
        : null);
  }

  get enabled() {
    return Boolean(this.#config.smtp.host && this.#config.alertEmails.length);
  }

  async loginFromNewIp({ username, ip, userAgent, at }) {
    const subject = `[CosmoPolish] Logowanie z nowego adresu IP: ${username}`;
    const text = [
      `Konto "${username}" zalogowało się do panelu admina z adresu IP, którego wcześniej nie używało.`,
      '',
      `Czas:        ${at}`,
      `Adres IP:    ${ip}`,
      `Przeglądarka: ${userAgent ?? '-'}`,
      `Strona:      ${this.#config.siteUrl}`,
      '',
      'Jeśli to Ty lub drugi administrator - nic nie trzeba robić.',
      '',
      'Jeśli NIE - na serwerze, w katalogu API:',
      `  npm run create-admin -- ${username}      # zmiana hasła`,
      '  npm run revoke-sessions                  # natychmiastowe wylogowanie wszystkich',
      'a potem w panelu: Historia wersji -> Przywróć, oraz sprawdź Dziennik zdarzeń.'
    ].join('\n');

    return this.#send(subject, text);
  }

  async #send(subject, text) {
    if (!this.#transport) {
      console.log(`[alert, e-mail disabled] ${subject}`);
      return false;
    }

    await this.#transport.sendMail({
      from: this.#config.smtp.from,
      to: this.#config.alertEmails.join(', '),
      subject,
      text
    });
    return true;
  }
}
