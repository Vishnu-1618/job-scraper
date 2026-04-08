import { BaseScraper, JobData } from './base';
import logger from '../utils/logger';

export class IndeedScraper extends BaseScraper {
    constructor() {
        super('Indeed');
    }

    async scrape(keywords: string[], location: string): Promise<JobData[]> {
        await this.init();
        if (!this.page) throw new Error('Page not initialized');

        const jobs: JobData[] = [];
        const q = keywords.join('+');
        const l = location;
        let url = `https://www.indeed.com/jobs?q=${q}&l=${l}`;

        try {
            logger.info(`Navigating to ${url}`);
            await this.page.goto(url, { waitUntil: 'domcontentloaded' });

            for (let page = 0; page < 30; page++) { // Scrape up to 30 pages
                logger.info(`Scraping Indeed Page ${page + 1}`);
                await this.delay(2000, 4000);
                await this.autoScroll(this.page);

                try {
                    await this.page.waitForSelector('.jobsearch-ResultsList, #mosaic-jobResults', { timeout: 15000 });
                } catch (e) {
                    logger.warn('Indeed might have blocked the request or no jobs found.');
                    break;
                }

                const jobCards = await this.page.$$('.result, .job_seen_beacon, [data-testid="latest-job-card"]');
                logger.info(`Found ${jobCards.length} job cards on Indeed Page ${page + 1}`);

                for (const card of jobCards) {
                    try {
                        const title = await card.$eval('h2.jobTitle, .jcs-JobTitle', el => el.textContent?.trim() || '').catch(() => '');
                        const company = await card.$eval('[data-testid="company-name"], .companyName', el => el.textContent?.trim() || '').catch(() => '');
                        const loc = await card.$eval('[data-testid="text-location"], .companyLocation', el => el.textContent?.trim() || '').catch(() => '');
                        const link = await card.$eval('a[data-jk], a.jcs-JobTitle', el => el.getAttribute('href') || '').catch(() => '');

                        if (title && link) {
                            const cleanUrl = link.startsWith('http') ? link.split('&')[0] : `https://www.indeed.com${link.split('&')[0]}`;

                            // Metadata Extraction
                            const metadataElement = await card.$('.salary-snippet-container, .metadata');
                            const metadataText = metadataElement ? await metadataElement.textContent() : '';

                            const isRemote = location.toLowerCase().includes('remote') || title.toLowerCase().includes('remote');

                            // Salary Parser
                            let salary_min, salary_max, currency = 'USD';
                            if (metadataText && metadataText.includes('$')) {
                                const numbers = metadataText.match(/(\d{1,3}(?:,\d{3})*)/g);
                                if (numbers && numbers.length > 0) {
                                    salary_min = parseInt(numbers[0].replace(/,/g, ''), 10);
                                    salary_max = numbers.length > 1 ? parseInt(numbers[1].replace(/,/g, ''), 10) : salary_min;
                                }
                            }

                            let job_type = 'full-time';
                            const typeElement = await card.$('.jobMetaDataGroup');
                            const typeText = typeElement ? await typeElement.textContent() : '';
                            if (typeText?.toLowerCase().includes('contract')) job_type = 'contract';
                            if (typeText?.toLowerCase().includes('intern')) job_type = 'internship';

                            // Date Parsing
                            let postedDate = new Date().toISOString();
                            const dateElement = await card.$('.date');
                            const dateText = dateElement ? await dateElement.textContent() : '';

                            if (dateText) {
                                let days = 0;
                                const cleanDate = dateText.replace('Posted', '').replace('Employer', '').trim();
                                if (cleanDate.includes('today') || cleanDate.includes('just now')) {
                                    days = 0;
                                } else if (cleanDate.includes('day')) {
                                    days = parseInt(cleanDate.match(/\d+/)?.[0] || '1');
                                } else if (cleanDate.includes('30+')) {
                                    days = 31;
                                }

                                const dateObj = new Date();
                                dateObj.setDate(dateObj.getDate() - days);
                                postedDate = dateObj.toISOString();
                            }

                            jobs.push({
                                title,
                                company,
                                location: loc,
                                description: `Job at ${company} in ${loc}. View details on Indeed.`,
                                url: cleanUrl,
                                postedDate,
                                is_remote: isRemote,
                                salary_min,
                                salary_max,
                                currency,
                                job_type
                            });
                        }
                    } catch (err) {
                        continue;
                    }
                }

                // Check for Next Button and Click
                try {
                    // Close potential popups
                    const closePopup = await this.page.$('button[aria-label="close"], .icl-CloseButton');
                    if (closePopup) await closePopup.click();

                    const nextButton = await this.page.$('a[data-testid="pagination-page-next"], a[aria-label="Next"]');
                    if (nextButton) {
                        logger.info('Clicking Indeed Next Page...');
                        await nextButton.click();
                        await this.page.waitForLoadState('domcontentloaded');
                    } else {
                        logger.info('No Next button found on Indeed. Stopping.');
                        break;
                    }
                } catch (navErr) {
                    logger.warn('Indeed navigation failed or finished.');
                    break;
                }
            }
            logger.info(`Extracted total ${jobs.length} jobs from Indeed.`);
        } catch (error: any) {
            logger.error(`Indeed scrape failed: ${error.message}`);
        } finally {
            await this.close();
        }
        return jobs;
    }
}
