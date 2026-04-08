import { BaseScraper, JobData } from './base';
import logger from '../utils/logger';

export class LinkedInScraper extends BaseScraper {
    constructor() {
        super('LinkedIn');
    }

    async scrape(keywords: string[], location: string): Promise<JobData[]> {
        await this.init();
        if (!this.page) {
            throw new Error('Page not initialized');
        }

        const jobs: JobData[] = [];
        const keywordString = keywords.join('%20');
        // Using guest search URL to avoid immediate login wall
        const url = `https://www.linkedin.com/jobs/search?keywords=${keywordString}&location=${location}`;

        try {
            // Navigate to homepage first to establish session/cookies
            logger.info('Navigating to LinkedIn homepage...');

            // Retry logic for navigation
            let retries = 3;
            while (retries > 0) {
                try {
                    await this.page.goto('https://www.linkedin.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
                    break; // Success
                } catch (e: any) {
                    retries--;
                    logger.warn(`LinkedIn homepage navigation failed: ${e.message}. Retries left: ${retries}`);
                    if (retries === 0) throw e;
                    await this.delay(5000, 10000);
                }
            }

            await this.delay(2000, 4000);

            logger.info(`Navigating to ${url}`);

            // Retry logic for search page
            retries = 3;
            while (retries > 0) {
                try {
                    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                    break;
                } catch (e: any) {
                    retries--;
                    logger.warn(`LinkedIn search navigation failed: ${e.message}. Retries left: ${retries}`);
                    if (retries === 0) throw e;
                    await this.delay(5000, 10000);
                }
            }

            // Random delay after navigation
            await this.delay(2000, 5000);

            // Handle infinite scroll to load more jobs
            let previousHeight = 0;
            // Scroll more aggressively to load more jobs (try 4-5 times)
            for (let i = 0; i < 50; i++) {
                previousHeight = await this.page.evaluate('document.body.scrollHeight');
                await this.autoScroll(this.page);
                await this.delay(1000, 2000);

                // Click "See more jobs" if it exists
                try {
                    const seeMoreButton = await this.page.$('button[aria-label="See more jobs"]');
                    if (seeMoreButton) {
                        logger.info('Clicking "See more jobs" button');
                        await seeMoreButton.click();
                        await this.delay(2000, 3000);
                    }
                } catch (e) {
                    // Ignore if button not found
                }

                const newHeight = await this.page.evaluate('document.body.scrollHeight');
                if (newHeight === previousHeight) break; // Stop if no new content
            }

            // Handle infinite scroll to load more jobs
            let previousHeight2 = 0; // Renamed to avoid redeclaration
            // Scroll more aggressively to load more jobs (try 4-5 times)
            for (let i = 0; i < 50; i++) {
                previousHeight2 = await this.page.evaluate('document.body.scrollHeight');
                await this.autoScroll(this.page);
                await this.delay(1000, 2000);

                // Click "See more jobs" if it exists
                try {
                    const seeMoreButton = await this.page.$('button[aria-label="See more jobs"]');
                    if (seeMoreButton) {
                        logger.info('Clicking "See more jobs" button');
                        await seeMoreButton.click();
                        await this.delay(2000, 3000);
                    }
                } catch (e) {
                    // Ignore if button not found
                }

                const newHeight = await this.page.evaluate('document.body.scrollHeight');
                if (newHeight === previousHeight2) break; // Stop if no new content
            }

            try {
                // Wait for job cards
                await this.page.waitForSelector('.jobs-search__results-list li', { timeout: 15000 });
            } catch (e) {
                logger.warn('LinkedIn: Job cards not found.');

                // Detection Logic for AuthWall
                const content = await this.page.content();
                const title = await this.page.title();

                if (title.includes('Sign In') || title.includes('Login') || content.includes('authwall') || content.includes('challenge')) {
                    logger.warn('LinkedIn: Hit AuthWall/Login Screen. IP or Browser fingerprint likely flagged.');
                } else if (title.includes('Security')) {
                    logger.warn('LinkedIn: Hit Security Check (Captcha).');
                } else {
                    logger.warn(`LinkedIn: Unknown state. Title: ${title}`);
                }

                return [];
            }

            // Extract job cards
            const jobCards = await this.page.$$('.jobs-search__results-list li');
            // Log specifically how many we found
            logger.info(`Found ${jobCards.length} job cards on LinkedIn after scrolling`);
            logger.info(`Found ${jobCards.length} job cards on LinkedIn after scrolling`);

            for (const card of jobCards) {
                try {
                    // Extract basic info from card with multiple selector fallbacks
                    const title = await card.$eval('.base-search-card__title, .job-search-card__title, h3', el => el.textContent?.trim() || '').catch(() => '');
                    const company = await card.$eval('.base-search-card__subtitle, .job-search-card__subtitle, .base-card__subtitle, h4', el => el.textContent?.trim() || '').catch(() => '');
                    const loc = await card.$eval('.job-search-card__location, .base-search-card__metadata, .job-search-card__location', el => el.textContent?.trim() || '').catch(() => '');
                    const link = await card.$eval('a.base-card__full-link, a.base-search-card__full-link', el => el.getAttribute('href') || '').catch(() => '');

                    // Check for obfuscated data (LinkedIn sometimes shows stars to guests)
                    if (title.includes('***') || company.includes('***')) {
                        logger.warn(`LinkedIn: Detected obfuscated data for job: ${title} @ ${company}. Skipping.`);
                        continue;
                    }

                    // Check for "Closed" or "No longer accepting applications" text in the card
                    const cardText = await card.innerText();
                    if (cardText.includes('No longer accepting applications') || cardText.includes('Closed') || cardText.includes('No longer accepting')) {
                        logger.warn(`LinkedIn: Job appears closed/expired: ${title} @ ${company}. Skipping.`);
                        continue;
                    }

                    if (link && title) {
                        const cleanUrl = link.split('?')[0];

                        // Date Extraction
                        let postedDate = new Date().toISOString();
                        const dateText = await card.$eval('time', el => el.getAttribute('datetime') || el.textContent?.trim()).catch(() => '');
                        if (dateText) {
                            // If it's a specific date YYYY-MM-DD
                            if (dateText.match(/^\d{4}-\d{2}-\d{2}/)) {
                                postedDate = new Date(dateText).toISOString();
                            } else {
                                // Calculate relative date (e.g. "1 day ago", "2 weeks ago")
                                const now = new Date();
                                if (dateText.includes('minute') || dateText.includes('hour')) {
                                    // Keep as today/now
                                } else if (dateText.includes('day')) {
                                    const days = parseInt(dateText.match(/\d+/)?.[0] || '1');
                                    now.setDate(now.getDate() - days);
                                    postedDate = now.toISOString();
                                } else if (dateText.includes('week')) {
                                    const weeks = parseInt(dateText.match(/\d+/)?.[0] || '1');
                                    now.setDate(now.getDate() - (weeks * 7));
                                    postedDate = now.toISOString();
                                } else if (dateText.includes('month')) {
                                    const months = parseInt(dateText.match(/\d+/)?.[0] || '1');
                                    now.setMonth(now.getMonth() - months);
                                    postedDate = now.toISOString();
                                }
                            }
                        }

                        // Metadata Extraction
                        const metadataText = await card.$eval('.job-search-card__metadata-wrapper', el => el.textContent || '').catch(() => '');
                        const isRemote = title.toLowerCase().includes('remote') || loc.toLowerCase().includes('remote') || metadataText.toLowerCase().includes('remote');

                        // Salary Parser (basic)
                        let salary_min, salary_max, currency;
                        const salaryMatch = metadataText.match(/([\£\$\€])\s*(\d{1,3}(?:,\d{3})*)(?:\s*-\s*(\d{1,3}(?:,\d{3})*))?/);
                        if (salaryMatch) {
                            currency = salaryMatch[1] === '$' ? 'USD' : salaryMatch[1] === '€' ? 'EUR' : 'GBP'; // Simplification
                            salary_min = parseInt(salaryMatch[2].replace(/,/g, ''), 10);
                            if (salaryMatch[3]) {
                                salary_max = parseInt(salaryMatch[3].replace(/,/g, ''), 10);
                            } else {
                                salary_max = salary_min;
                            }
                        }

                        // Experience Level & Job Type are hard to get from card view without clicking.
                        // We will infer commonly found tags or set defaults.
                        let job_type = 'full-time'; // Default
                        if (metadataText.toLowerCase().includes('intern')) job_type = 'internship';
                        if (metadataText.toLowerCase().includes('contract')) job_type = 'contract';
                        if (metadataText.toLowerCase().includes('part-time')) job_type = 'part-time';

                        jobs.push({
                            title,
                            company,
                            location: loc,
                            description: `Job at ${company} in ${loc}. View full details on LinkedIn.`,
                            url: cleanUrl,
                            is_remote: isRemote,
                            salary_min,
                            salary_max,
                            currency,
                            job_type,
                            experience_level: title.toLowerCase().includes('senior') ? 'senior' : 'mid', // Rough heuristic
                            posted_date: postedDate, // INCLUDE THE CALCULATED DATE!
                        });
                        logger.info(`Extracted: ${title} @ ${company}`);
                    }
                } catch (err) {
                    logger.debug(`Error extracting card: ${err}`);
                    continue;
                }
            }

            logger.info(`Extracted ${jobs.length} jobs. Starting Deep Verification (checking individual pages)...`);

            const verifiedJobs: JobData[] = [];
            // Verify each job by visiting its page
            // We limit to first 10-15 to avoid excessive banning, or we can do all if the user accepts slowness.
            // Given "fix it properly", we do all but with delays.

            for (const job of jobs) {
                try {
                    logger.info(`Verifying job: ${job.title} @ ${job.company}`);

                    // Navigate to job page
                    // Use a new page or reuse? Reusing is faster but carries state.
                    // We'll reuse 'this.page'
                    await this.page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 20000 });

                    // Random delay to mimic human reading
                    await this.delay(2000, 4000);

                    // Check for closed status
                    const content = await this.page.content();
                    const isClosed = content.includes('No longer accepting applications') ||
                        content.includes('This job has been closed') ||
                        // Check for specific banner elements if possible (generic catch-all text is safer)
                        (await this.page.$('.jobs-details-top-card__apply-error') !== null) ||
                        (await this.page.$('.artdeco-inline-feedback--error') !== null);

                    if (isClosed) {
                        logger.warn(`Deep Check: Job is CLOSED/EXPIRED: ${job.title}. Marking for removal.`);
                        job.is_active = false;
                        verifiedJobs.push(job);
                        continue;
                    }

                    job.is_active = true;
                    verifiedJobs.push(job);
                } catch (e: any) {
                    logger.warn(`Verification failed for ${job.url}: ${e.message}. Keeping job as fallback.`);
                    // If we can't load the page (auth wall etc), keep it?
                    // "Fail Open" usually safer than "Fail Closed" for scraping, unless strictly required.
                    verifiedJobs.push(job);
                }
            }

            logger.info(`Deep Verification Complete. Kept ${verifiedJobs.length} / ${jobs.length} jobs.`);
            return verifiedJobs;

        } catch (error: any) {
            logger.error(`LinkedIn scrape failed: ${error.message}`);
            return jobs; // Return whatever we found if verification crashes
        } finally {
            await this.close();
        }

        return jobs;
    }
}
