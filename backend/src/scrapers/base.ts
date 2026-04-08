import { Page } from 'playwright';
import { BrowserManager } from '../core/browser';
import logger from '../utils/logger';

export interface JobData {
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    postedDate?: string; // ISO String
    posted_date?: string | Date; // DB column name compatibility
    salary_min?: number;
    salary_max?: number;
    currency?: string;
    job_type?: string;
    experience_level?: string;
    is_remote?: boolean;
    external_id?: string;
    is_active?: boolean; // New flag to signal if job is still open or should be deleted/marked closed
}

export abstract class BaseScraper {
    protected browserManager: BrowserManager;
    protected page: Page | null = null;
    protected platformName: string;

    constructor(platformName: string) {
        this.platformName = platformName;
        this.browserManager = new BrowserManager();
    }

    abstract scrape(keywords: string[], location: string): Promise<JobData[]>;

    protected async init() {
        this.page = await this.browserManager.newPage();
    }

    protected async close() {
        if (this.page) {
            await this.page.close();
        }
        await this.browserManager.close();
    }

    /**
     * Helper for random human-like delays
     */
    protected async delay(min: number = 1000, max: number = 3000) {
        const ms = Math.floor(Math.random() * (max - min + 1) + min);
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Improved auto-scroll to be less predictable
     */
    protected async autoScroll(page: Page) {
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let totalHeight = 0;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    const distance = Math.floor(Math.random() * 100) + 50; // Variable distance
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight || totalHeight > 5000) { // Limit scroll height
                        clearInterval(timer);
                        resolve();
                    }
                }, Math.floor(Math.random() * 200) + 100); // Variable interval
            });
        });
    }

    /**
     * Safe extraction helper
     */
    protected async getText(selector: string): Promise<string> {
        if (!this.page) return '';
        try {
            const element = await this.page.$(selector);
            return element ? (await element.innerText()).trim() : '';
        } catch (e) {
            return '';
        }
    }

    protected async getAttribute(selector: string, attribute: string): Promise<string> {
        if (!this.page) return '';
        try {
            const element = await this.page.$(selector);
            return element ? (await element.getAttribute(attribute)) || '' : '';
        } catch (e) {
            return '';
        }
    }
}
