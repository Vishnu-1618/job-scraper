import { chromium, Browser, BrowserContext, Page } from 'playwright';
import logger from '../utils/logger';

export class BrowserManager {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;

    private readonly userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0'
    ];

    async init() {
        if (!this.browser) {
            logger.info('Launching Native Browser (Chromium)...');
            this.browser = await chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox'
                ]
            });
        }
    }

    async newPage(): Promise<Page> {
        await this.init();

        if (!this.browser) throw new Error('Browser failed to launch');

        const randomUA = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];

        this.context = await this.browser.newContext({
            userAgent: randomUA,
            viewport: {
                width: 1366 + Math.floor(Math.random() * 554), // Random width between 1366 and 1920
                height: 768 + Math.floor(Math.random() * 312) // Random height between 768 and 1080
            },
            locale: 'en-US',
            timezoneId: 'America/New_York',
            extraHTTPHeaders: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'sec-ch-ua': '"Google Chrome";v="124", "Chromium";v="124", "Not-A.Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'Upgrade-Insecure-Requests': '1',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Cache-Control': 'max-age=0'
            }
        });

        const page = await this.context.newPage();

        // Comprehensive anti-detection stealth script
        await page.addInitScript(() => {
            // 1. Hide webdriver
            Object.defineProperty(navigator, 'webdriver', { get: () => false });

            // 2. Realistic browser metadata
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 + Math.floor(Math.random() * 4) });
            // @ts-ignore
            Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });

            // 3. Simulate real Chrome window.chrome
            // @ts-ignore
            if (!window.chrome) {
                // @ts-ignore
                window.chrome = {
                    runtime: {
                        onConnect: null, onMessage: null,
                        connect: () => { }, sendMessage: () => { },
                    },
                    loadTimes: () => ({}),
                    csi: () => ({}),
                    app: { isInstalled: false, getDetails: () => { }, getIsInstalled: () => { } }
                };
            }

            // 4. Realistic battery API
            // @ts-ignore
            navigator.getBattery = () => Promise.resolve({
                level: 0.85 + Math.random() * 0.15,
                charging: true, chargingTime: 0, dischargingTime: Infinity,
                addEventListener: () => { }
            });

            // 5. Mock plugins (headless has none, real Chrome has several)
            const mockPlugin = (name: string, filename: string, desc: string) => ({ name, filename, description: desc, length: 1 });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [
                    mockPlugin('Chrome PDF Plugin', 'internal-pdf-viewer', 'Portable Document Format'),
                    mockPlugin('Chrome PDF Viewer', 'mhjfbmdgcfjbbpaeojofohoefgiehjai', ''),
                    mockPlugin('Native Client', 'internal-nacl-plugin', ''),
                ],
            });
            Object.defineProperty(navigator, 'mimeTypes', { get: () => ['application/pdf', 'application/x-google-chrome-pdf'] });

            // 6. Spoof canvas
            const origGetContext = HTMLCanvasElement.prototype.getContext;
            // @ts-ignore
            HTMLCanvasElement.prototype.getContext = function (type: string, ...args: any[]) {
                // @ts-ignore
                const ctx = origGetContext.apply(this, [type, ...args] as any) as CanvasRenderingContext2D | null;
                if (ctx && type === '2d') {
                    const origFill = ctx.fillText.bind(ctx);
                    ctx.fillText = (...callArgs: Parameters<CanvasRenderingContext2D['fillText']>) => {
                        origFill(...callArgs);
                    };
                }
                return ctx;
            };

            // 7. Fix permissions query
            const origPermsQuery = navigator.permissions.query.bind(navigator.permissions);
            navigator.permissions.query = (params: any) => {
                if (params.name === 'notifications') return Promise.resolve({ state: (window as any).Notification?.permission || 'default' } as PermissionStatus);
                return origPermsQuery(params);
            };
        });

        // Block unnecessary resource types to speed up loading and reduce fingerprint
        await page.route('**/*', (route) => {
            const resourceType = route.request().resourceType();
            const url = route.request().url();
            if (
                resourceType === 'image' ||
                resourceType === 'font' ||
                resourceType === 'media' ||
                url.includes('google-analytics') ||
                url.includes('doubleclick.net') ||
                url.includes('ads.') ||
                url.includes('fb.com')
            ) {
                route.abort();
            } else {
                route.continue();
            }
        });

        return page;
    }

    async close() {
        if (this.context) {
            await this.context.close();
            this.context = null;
        }
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
