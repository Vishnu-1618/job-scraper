
import { LinkedInScraper } from '../scrapers/linkedin';
import logger from '../utils/logger';

async function testScraper() {
    console.log('Starting LinkedIn scraper test...');
    const scraper = new LinkedInScraper();

    try {
        const jobs = await scraper.scrape(['software engineer'], 'remote');
        console.log(`Successfully scraped ${jobs.length} jobs`);

        // Debugging empty results
        if (jobs.length === 0) {
            // Access the private page object if possible, or we need to modify the scraper to expose it.
            // Since we can't easily access the internal page state from here without modifying the class,
            // we will assume the scraper's logs (which we should see) provide clues.
            // But actually, let's modify the scraper to be more verbose if 0 jobs.
        }

        jobs.forEach((job, i) => {
            console.log(`${i + 1}. ${job.title} at ${job.company}`);
        });
    } catch (error) {
        console.error('Scraping failed:', error);
    }
}

testScraper();
