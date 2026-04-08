import { LinkedInScraper } from './linkedin';
import { IndeedScraper } from './indeed';
import { GlassdoorScraper } from './glassdoor';
import { NaukriScraper } from './naukri';
import { BaseScraper } from './base';

export class ScraperFactory {
    static getScraper(platform: string): BaseScraper {
        switch (platform.toLowerCase()) {
            case 'linkedin':
                return new LinkedInScraper();
            case 'indeed':
                return new IndeedScraper();
            case 'glassdoor':
                return new GlassdoorScraper();
            case 'naukri':
                return new NaukriScraper();
            default:
                throw new Error(`Scraper for ${platform} not implemented`);
        }
    }
}
