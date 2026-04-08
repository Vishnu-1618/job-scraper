import { LinkedInScraper } from '../src/scrapers/linkedin';
import { IndeedScraper } from '../src/scrapers/indeed';
import { NaukriScraper } from '../src/scrapers/naukri';
import logger from '../src/utils/logger';

async function testScrapers() {
    console.log('--- STARTING SCRAPER DIAGNOSTICS ---');

    // 1. Test LinkedIn
    try {
        console.log('\nTesting LinkedIn Scraper...');
        const linkedin = new LinkedInScraper();
        const jobs = await linkedin.scrape(['software', 'engineer'], 'remote');
        console.log(`✅ LinkedIn Status: Found ${jobs.length} jobs`);
        if (jobs.length > 0) console.log('Sample:', jobs[0]);
    } catch (e: any) {
        console.error('❌ LinkedIn Failed:', e.message);
    }

    // 2. Test Indeed
    try {
        console.log('\nTesting Indeed Scraper...');
        const indeed = new IndeedScraper();
        const jobs = await indeed.scrape(['software', 'engineer'], 'remote');
        console.log(`✅ Indeed Status: Found ${jobs.length} jobs`);
        if (jobs.length > 0) console.log('Sample:', jobs[0]);
    } catch (e: any) {
        console.error('❌ Indeed Failed:', e.message);
    }

    // 3. Test Naukri
    try {
        console.log('\nTesting Naukri Scraper...');
        const naukri = new NaukriScraper();
        const jobs = await naukri.scrape(['software', 'engineer'], 'remote');
        console.log(`✅ Naukri Status: Found ${jobs.length} jobs`);
        if (jobs.length > 0) console.log('Sample:', jobs[0]);
    } catch (e: any) {
        console.error('❌ Naukri Failed:', e.message);
    }

    console.log('\n--- DIAGNOSTICS COMPLETE ---');
    process.exit(0);
}

testScrapers();
