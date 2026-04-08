import { BaseScraper, JobData } from './base';
import logger from '../utils/logger';

export class GlassdoorScraper extends BaseScraper {
    constructor() {
        super('Glassdoor');
    }

    async scrape(keywords: string[], location: string): Promise<JobData[]> {
        await this.init();
        if (!this.page) throw new Error('Page not initialized');

        const jobs: JobData[] = [];
        const q = encodeURIComponent(keywords.join(' ') + ' ' + (location || 'remote'));

        // Use the sc.keyword endpoint — Glassdoor redirects this to the correct regional /Job page
        const url = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${q}`;

        try {
            logger.info(`[Glassdoor] Navigating to ${url}`);
            await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await this.delay(5000, 8000);

            logger.info(`[Glassdoor] Landed on: ${this.page.url()}`);

            // Dismiss any modals or cookie consent
            try {
                await this.page.click('[alt="Close"], [data-test="modal-close-btn"], button[class*="CloseButton"]', { timeout: 2000 });
                await this.delay(500, 1000);
            } catch { /* no modal, continue */ }

            // Click Load More multiple times to fetch more jobs
            for (let i = 0; i < 15; i++) {
                try {
                    const loadMore = await this.page.$('[data-test="load-more"]');
                    if (loadMore) {
                        logger.info(`[Glassdoor] Clicking Load More (${i + 1})`);
                        await loadMore.click();
                        await this.delay(2000, 4000);
                    } else {
                        break;
                    }
                } catch (e) {
                    break;
                }
            }

            // Confirmed working selectors (from live DOM capture)
            const jobCards = await this.page.$$('[data-test="jobListing"]');
            logger.info(`[Glassdoor] Found ${jobCards.length} job cards`);

            for (const card of jobCards) {
                try {
                    // Title + link — Glassdoor wraps in an <a> with data-test="job-title"
                    const titleEl = await card.$('[data-test="job-title"], a[href*="/Job/"], h2 a, h3 a');
                    const title = titleEl ? (await titleEl.textContent())?.trim() || '' : '';
                    const link = titleEl ? (await titleEl.getAttribute('href')) || '' : '';

                    // Company name
                    const company = await card.$eval(
                        '[data-test="employer-short-name"], [class*="EmployerProfile"], [class*="employerName"]',
                        (el: Element) => el.textContent?.trim() || ''
                    ).catch(() => '');

                    // Location
                    const loc = await card.$eval(
                        '[data-test="location"], [class*="location"], [class*="Location"], [class*="jobLocation"]',
                        (el: Element) => el.textContent?.trim() || ''
                    ).catch(() => location);

                    // Salary (optional)
                    const salary = await card.$eval(
                        '[data-test="detailSalary"], [class*="salary"], [class*="Salary"]',
                        (el: Element) => el.textContent?.trim() || ''
                    ).catch(() => '');

                    if (title && link) {
                        const cleanUrl = link.startsWith('http') ? link : `https://www.glassdoor.com${link}`;
                        jobs.push({
                            title,
                            company,
                            location: loc || location,
                            description: `${title} at ${company} in ${loc}. ${salary ? 'Salary: ' + salary + '.' : ''} Full details on Glassdoor.`,
                            url: cleanUrl,
                            postedDate: new Date().toISOString(),
                        });
                        logger.info(`[Glassdoor] ✓ ${title} @ ${company}`);
                    }
                } catch (err) {
                    logger.debug(`[Glassdoor] Error extracting card: ${err}`);
                }
            }

            // Fallback: if card selectors gave nothing, parse all job-title anchors from DOM
            if (jobs.length === 0) {
                logger.warn('[Glassdoor] Card extraction gave 0 results, running DOM fallback...');
                const fallback = await this.page.evaluate(() => {
                    const results: any[] = [];
                    const anchors = Array.from(document.querySelectorAll('a[data-test="job-title"], a[href*="/Job/"][class*="JobCard"]'));
                    anchors.forEach((a: any) => {
                        const title = a.textContent?.trim();
                        const href = a.href;
                        const card = a.closest('[data-test="jobListing"]') || a.closest('.jobCard') || a.parentElement;
                        const company = card?.querySelector('[class*="employerName"], [data-test="employer-short-name"]')?.textContent?.trim() || '';
                        const loc = card?.querySelector('[data-test="location"], [class*="location"]')?.textContent?.trim() || '';
                        if (title && href) results.push({ title, company, location: loc, url: href });
                    });
                    return results;
                });
                fallback.forEach(j => jobs.push({
                    title: j.title, company: j.company, location: j.location || location,
                    description: `${j.title} at ${j.company}`,
                    url: j.url, postedDate: new Date().toISOString()
                }));
                logger.info(`[Glassdoor] Fallback found ${fallback.length} jobs`);
            }

            logger.info(`[Glassdoor] Total extracted: ${jobs.length} jobs`);
        } catch (error: any) {
            logger.error(`[Glassdoor] Scrape failed: ${error.message}`);
        } finally {
            await this.close();
        }

        return jobs;
    }
}
