import { BaseScraper, JobData } from './base';
import logger from '../utils/logger';

export class NaukriScraper extends BaseScraper {
    constructor() {
        super('Naukri');
    }

    async scrape(keywords: string[], location: string): Promise<JobData[]> {
        await this.init();
        if (!this.page) throw new Error('Page not initialized');

        const jobs: JobData[] = [];
        const q = keywords.join('-').toLowerCase().replace(/\s+/g, '-');

        // Build Naukri URL properly — handle remote and regular locations
        let url: string;
        const cleanLocation = (location || '').trim().toLowerCase();
        if (!cleanLocation || cleanLocation === 'remote' || cleanLocation === 'anywhere') {
            url = `https://www.naukri.com/${q}-jobs`;
        } else {
            const locSlug = cleanLocation.replace(/\s+/g, '-');
            url = `https://www.naukri.com/${q}-jobs-in-${locSlug}`;
        }

        try {
            logger.info(`[Naukri] Navigating to ${url}`);
            await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            await this.delay(3000, 6000);
            for (let i = 0; i < 20; i++) {
                await this.autoScroll(this.page);
                await this.delay(1000, 2000);
            }

            // Wait for job card container
            try {
                await this.page.waitForSelector(
                    '.srp-jobtuple-wrapper, article.job, .jobTuple, [class*="jobTuple"], [class*="list-container"] > article',
                    { timeout: 12000 }
                );
            } catch {
                logger.warn('[Naukri] Timeout waiting for job cards — trying anyway');
            }

            // Try multiple selector combos used by Naukri (they change them often)
            const jobCardSelectors = [
                '.srp-jobtuple-wrapper',
                'article.job',
                '.jobTuple',
                'article[class*="tuple"]',
                'div[class*="SerCard"]',
            ];

            let jobCards: any[] = [];
            for (const sel of jobCardSelectors) {
                jobCards = await this.page.$$(sel);
                if (jobCards.length > 0) {
                    logger.info(`[Naukri] Got ${jobCards.length} cards with selector: ${sel}`);
                    break;
                }
            }

            if (jobCards.length === 0) {
                // Fallback: find all job-title anchors from `a.title` or `a[href*="naukri.com"]`
                logger.warn('[Naukri] No card selectors matched, trying fallback');
                const fallbackJobs = await this.page.evaluate(() => {
                    const results: any[] = [];
                    const anchors = Array.from(document.querySelectorAll('a[title][href*="naukri.com"], a[class*="title"][href*="naukri.com"]'));
                    anchors.forEach(a => {
                        const title = (a as HTMLAnchorElement).title || a.textContent?.trim() || '';
                        const href = (a as HTMLAnchorElement).href;
                        const card = a.closest('article') || a.closest('li') || a.parentElement;
                        const company = card?.querySelector('[class*="comp-name"], [class*="company"]')?.textContent?.trim() || '';
                        const loc = card?.querySelector('[class*="locWdth"], [class*="location"]')?.textContent?.trim() || '';
                        if (title && href) results.push({ title, company, location: loc, url: href });
                    });
                    return results;
                });
                fallbackJobs.forEach(j => jobs.push({
                    title: j.title, company: j.company, location: j.location || location,
                    description: `${j.title} at ${j.company}. View details on Naukri.`,
                    url: j.url, postedDate: new Date().toISOString()
                }));
            } else {
                for (const card of jobCards) {
                    try {
                        // Title selector — Naukri uses `a.title` in older design, `a[class*="title"]` in newer
                        const title = await card.$eval(
                            'a.title, a[class*="title"], .role-name, h2 a',
                            (el: Element) => el.textContent?.trim() || ''
                        ).catch(() => '');

                        const link = await card.$eval(
                            'a.title, a[class*="title"], a.role-name, h2 a',
                            (el: Element) => (el as HTMLAnchorElement).href || ''
                        ).catch(() => '');

                        const company = await card.$eval(
                            '.comp-name, .comp-name-link, a.comp-name, [class*="comp-name"], [class*="companyName"]',
                            (el: Element) => el.textContent?.trim() || ''
                        ).catch(() => '');

                        const loc = await card.$eval(
                            '.locWdth, .loc-wrap span, .ni-job-tuple-icon-location + span, [class*="location"]',
                            (el: Element) => el.textContent?.trim() || ''
                        ).catch(() => '');

                        const exp = await card.$eval(
                            '.expwdth, [class*="exp"], [class*="experience"]',
                            (el: Element) => el.textContent?.trim() || ''
                        ).catch(() => '');

                        if (title && link) {
                            jobs.push({
                                title,
                                company,
                                location: loc || location,
                                description: `${title} at ${company} in ${loc || location}. Experience: ${exp || 'N/A'}`,
                                url: link,
                                job_type: 'full-time',
                                postedDate: new Date().toISOString()
                            });
                            logger.info(`[Naukri] Extracted: ${title} @ ${company}`);
                        }
                    } catch (err) {
                        logger.debug(`[Naukri] Error extracting card: ${err}`);
                    }
                }
            }

            logger.info(`[Naukri] Total extracted: ${jobs.length} jobs`);
        } catch (error: any) {
            logger.error(`[Naukri] Scrape failed: ${error.message}`);
        } finally {
            await this.close();
        }

        return jobs;
    }
}
