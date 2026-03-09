import nodemailer, { Transporter } from "nodemailer";

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  htmlBody: string;
  attachements?: Attachement[];
}

export interface Attachement {
  filename: string;
  path: string;
}

export class EmailService {
  private transporter: Transporter;

  private sendEmailEnabled: boolean;

  //para evitar la dependencia oculta las pido por el constructor asi no llamo directamente al env.
  constructor(
    mailerService: string,
    mailerEmail: string,
    mailerSecret: string,
    sendEmail: boolean
  ) {
    this.sendEmailEnabled = sendEmail;
    this.transporter = nodemailer.createTransport({
      service: mailerService,
      auth: {
        user: mailerEmail,
        pass: mailerSecret,
      },
    });
  }

  async sendEmail(options: SendMailOptions): Promise<boolean> {
    const { to, subject, htmlBody, attachements = [] } = options;

    if (!this.sendEmailEnabled) return true;
    try {
      await this.transporter.sendMail({
        to: to,
        subject: subject,
        html: htmlBody,
        attachments: attachements,
      });

      return true;
    } catch (error) {
      console.error("[EmailService] Send error", error);
      return false;
    }
  }
}
