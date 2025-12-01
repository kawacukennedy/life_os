import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Email } from './email.entity';

@Injectable()
export class EmailService {
  private gmail = google.gmail('v1');

  constructor(
    @InjectRepository(Email)
    private emailRepository: Repository<Email>,
    private httpService: HttpService,
  ) {}

  async syncEmails(userId: string, accessToken: string): Promise<Email[]> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        auth,
        maxResults: 10,
        q: 'is:unread',
      });

      const emails: Email[] = [];

      for (const message of response.data.messages || []) {
        const emailData = await this.getEmailDetails(message.id!, auth);
        if (emailData) {
          const existingEmail = await this.emailRepository.findOne({
            where: { userId, messageId: message.id! },
          });

          if (!existingEmail) {
            const email = this.emailRepository.create({
              ...emailData,
              userId,
            });
            emails.push(await this.emailRepository.save(email));
          }
        }
      }

      return emails;
    } catch (error) {
      throw new Error(`Failed to sync emails: ${error.message}`);
    }
  }

  private async getEmailDetails(messageId: string, auth: any): Promise<Partial<Email> | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        auth,
      });

      const payload = response.data.payload;
      const headers = payload?.headers || [];

      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const sender = headers.find(h => h.name === 'From')?.value || '';
      const to = headers.find(h => h.name === 'To')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';

      let body = '';
      if (payload?.body?.data) {
        body = Buffer.from(payload.body.data, 'base64').toString();
      } else if (payload?.parts) {
        for (const part of payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString();
            break;
          }
        }
      }

      return {
        messageId,
        threadId: response.data.threadId || '',
        subject,
        body,
        sender,
        recipients: to.split(',').map(r => r.trim()),
        receivedAt: new Date(date),
        isRead: !response.data.labelIds?.includes('UNREAD'),
        labels: response.data.labelIds || [],
      };
    } catch (error) {
      console.error(`Failed to get email details for ${messageId}:`, error);
      return null;
    }
  }

  async getEmails(userId: string, options?: { limit?: number; offset?: number; isRead?: boolean }): Promise<Email[]> {
    const query = this.emailRepository
      .createQueryBuilder('email')
      .where('email.userId = :userId', { userId });

    if (options?.isRead !== undefined) {
      query.andWhere('email.isRead = :isRead', { isRead: options.isRead });
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    query.orderBy('email.receivedAt', 'DESC');

    return query.getMany();
  }

  async markAsRead(emailId: string): Promise<Email> {
    await this.emailRepository.update(emailId, { isRead: true });
    return this.emailRepository.findOne({ where: { id: emailId } });
  }

  async archiveEmail(emailId: string): Promise<Email> {
    await this.emailRepository.update(emailId, { isArchived: true });
    return this.emailRepository.findOne({ where: { id: emailId } });
  }

  async generateSummary(emailId: string, accessToken: string): Promise<string> {
    const email = await this.emailRepository.findOne({ where: { id: emailId } });
    if (!email) {
      throw new Error('Email not found');
    }

    try {
      const aiResponse = await firstValueFrom(
        this.httpService.post(
          `${process.env.AI_SERVICE_URL || 'http://localhost:3006'}/ai/summarize`,
          {
            userId: email.userId,
            content: `Subject: ${email.subject}\nFrom: ${email.sender}\nBody: ${email.body}`,
            type: 'email',
          },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        ),
      );

      const summary = aiResponse.data.summary || `Summary of email from ${email.sender} about ${email.subject}`;
      await this.emailRepository.update(emailId, { summary });
      return summary;
    } catch (error) {
      // Fallback to simple summary
      const summary = `Summary of email from ${email.sender} about ${email.subject}`;
      await this.emailRepository.update(emailId, { summary });
      return summary;
    }
  }

  async suggestActions(emailId: string): Promise<any[]> {
    const email = await this.emailRepository.findOne({ where: { id: emailId } });
    if (!email) {
      throw new Error('Email not found');
    }

    try {
      const aiResponse = await firstValueFrom(
        this.httpService.post(
          `${process.env.AI_SERVICE_URL || 'http://localhost:3006'}/ai/suggest-actions`,
          {
            userId: email.userId,
            context: `Email from ${email.sender} about ${email.subject}: ${email.body.substring(0, 500)}`,
            type: 'email',
          },
        ),
      );

      const suggestions = aiResponse.data.suggestions || [
        { type: 'reply', description: 'Reply to sender' },
        { type: 'schedule', description: 'Schedule follow-up' },
        { type: 'archive', description: 'Archive email' },
      ];

      await this.emailRepository.update(emailId, { suggestedActions: suggestions });
      return suggestions;
    } catch (error) {
      // Fallback to mock suggestions
      const suggestions = [
        { type: 'reply', description: 'Reply to sender' },
        { type: 'schedule', description: 'Schedule follow-up' },
        { type: 'archive', description: 'Archive email' },
      ];

      await this.emailRepository.update(emailId, { suggestedActions: suggestions });
      return suggestions;
    }
  }

  async executeQuickAction(
    emailId: string,
    actionType: string,
    accessToken: string,
    userId: string,
    additionalData?: any,
  ): Promise<any> {
    const email = await this.emailRepository.findOne({ where: { id: emailId } });
    if (!email) {
      throw new Error('Email not found');
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    switch (actionType) {
      case 'archive':
        await this.gmail.users.messages.modify({
          userId: 'me',
          id: email.messageId,
          auth,
          requestBody: {
            removeLabelIds: ['INBOX'],
          },
        });
        return this.archiveEmail(emailId);

      case 'reply':
        const replyBody = additionalData?.body || 'Thank you for your email.';
        await this.gmail.users.messages.send({
          userId: 'me',
          auth,
          requestBody: {
            threadId: email.threadId,
            raw: Buffer.from(
              `To: ${email.sender}\nSubject: Re: ${email.subject}\n\n${replyBody}`,
            ).toString('base64'),
          },
        });
        return { success: true, message: 'Reply sent' };

      case 'schedule':
        // Create a task for follow-up
        await firstValueFrom(
          this.httpService.post(
            `${process.env.TASK_SERVICE_URL || 'http://localhost:3008'}/tasks`,
            {
              userId,
              title: `Follow up on email: ${email.subject}`,
              description: `Follow up on email from ${email.sender}`,
              dueAt: additionalData?.dueAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
              context: 'email_followup',
            },
          ),
        );
        return { success: true, message: 'Follow-up task created' };

      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }
}