
import { BrowserManager } from '../core/browser';
import logger from '../utils/logger';

async function testBrowser() {
    console.log('Starting browser test...');
    const manager = new BrowserManager();

    try {
        console.log('Initializing browser...');
        const page = await manager.newPage();
        console.log('Browser initialized. Navigating to google.com...');

        await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
        console.log('Navigation successful!');

        const title = await page.title();
        console.log('Page title:', title);

        await manager.close();
        console.log('Browser closed.');
    } catch (error) {
        console.error('Browser test failed:', error);
        await manager.close();
    }
}

testBrowser();
