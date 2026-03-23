import { Resend } from "resend";

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

/**
 * Email delivery via [Resend](https://resend.com).
 * Same public API as before (sendEmail → boolean) so auth, project, user, and version services stay unchanged.
 */
export class EmailService {
  private readonly resend: Resend | null;
  private readonly sendEmailEnabled: boolean;
  private readonly fromEmail: string;

  constructor(
    resendApiKey: string,
    fromEmail: string,
    sendEmailEnabled: boolean
  ) {
    this.sendEmailEnabled = sendEmailEnabled;
    this.fromEmail = fromEmail.trim();
    const key = resendApiKey.trim();
    this.resend = key.length > 0 ? new Resend(key) : null;
  }

  async sendEmail(options: SendMailOptions): Promise<boolean> {
    const { to, subject, htmlBody, attachements = [] } = options;

    if (!this.sendEmailEnabled) return true;

    if (!this.resend) {
      console.error(
        "[EmailService] SEND_EMAIL is enabled but RESEND_API_KEY is empty."
      );
      return false;
    }

    if (!this.fromEmail) {
      console.error("[EmailService] RESEND_FROM_EMAIL is not configured.");
      return false;
    }

    try {
      const recipients = Array.isArray(to) ? to : [to];

      const attachments =
        attachements.length > 0
          ? attachements.map((a) => ({
              filename: a.filename,
              path: a.path,
            }))
          : undefined;

      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: recipients,
        subject,
        html: htmlBody,
        ...(attachments ? { attachments } : {}),
      });

      if (error) {
        console.error("[EmailService] Resend API error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("[EmailService] Send error", error);
      return false;
    }
  }
}
