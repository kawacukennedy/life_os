import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bull";
import * as nodemailer from "nodemailer";

@Injectable()
@Processor("email")
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    super();
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.debug(`Processing email job ${job.id}`);

    const { to, subject, template, context } = job.data;

    try {
      // Generate email content based on template
      const html = this.generateEmailTemplate(template, context);

      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent successfully to ${to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job) {
    this.logger.debug(`Email job ${job.id} completed`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job, err: Error) {
    this.logger.error(`Email job ${job.id} failed:`, err);
  }

  private generateEmailTemplate(template: string, context: any): string {
    const templates = {
      welcome: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to LifeOS!</h1>
          <p>Hi ${context.name},</p>
          <p>Thank you for joining LifeOS. We're excited to help you manage your digital life!</p>
          <p>Get started by connecting your accounts and setting up your preferences.</p>
          <a href="${context.loginUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a>
        </div>
      `,
      passwordReset: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Password Reset</h1>
          <p>You requested a password reset for your LifeOS account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${context.resetUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
        </div>
      `,
      notification: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>${context.title}</h1>
          <p>${context.message}</p>
          ${context.actionUrl ? `<a href="${context.actionUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a>` : ""}
        </div>
      `,
    };

    return templates[template] || templates.notification;
  }
}
