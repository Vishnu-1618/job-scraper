import { Resend } from 'resend';
import TelegramBot from 'node-telegram-bot-api';
import logger from '../utils/logger';

class NotificationService {
    private static instance: NotificationService;
    private resend: Resend | null = null;
    private telegram: TelegramBot | null = null;

    private constructor() {
        if (process.env.RESEND_API_KEY) {
            this.resend = new Resend(process.env.RESEND_API_KEY);
        }
        if (process.env.TELEGRAM_BOT_TOKEN) {
            this.telegram = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
        }
    }

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    async sendEmail(to: string, subject: string, html: string) {
        if (!this.resend) {
            logger.warn('Resend API Key missing. Skipping email.');
            return;
        }
        try {
            await this.resend.emails.send({
                from: 'Job Scraper <alerts@yourdomain.com>',
                to,
                subject,
                html,
            });
            logger.info(`Email sent to ${to}`);
        } catch (error: any) {
            logger.error(`Failed to send email: ${error.message}`);
        }
    }

    async sendTelegramMessage(chatId: string, message: string) {
        if (!this.telegram) {
            logger.warn('Telegram Token missing. Skipping message.');
            return;
        }
        try {
            await this.telegram.sendMessage(chatId, message);
            logger.info(`Telegram message sent to ${chatId}`);
        } catch (error: any) {
            logger.error(`Failed to send Telegram message: ${error.message}`);
        }
    }

    async notifyMatch(userEmail: string, jobTitle: string, jobUrl: string, score: number) {
        const subject = `New Job Match: ${jobTitle} (${Math.round(score * 100)}%)`;
        const html = `
      <h1>New Job Match Found!</h1>
      <p>We found a job that matches your resume with a score of <strong>${Math.round(score * 100)}%</strong>.</p>
      <p><strong>Job:</strong> ${jobTitle}</p>
      <p><a href="${jobUrl}">Apply Now</a></p>
    `;
        await this.sendEmail(userEmail, subject, html);
    }
}

export const notificationService = NotificationService.getInstance();
