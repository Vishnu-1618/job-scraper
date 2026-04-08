
const fetch = require('node-fetch');

async function trigger() {
    console.log('Triggering Scrape...');
    try {
        const res = await fetch('http://localhost:3000/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                platform: 'linkedin',
                keyword: 'software engineer',
                location: 'Remote'
            })
        });
        const data = await res.json();
        console.log('Response:', data);
    } catch (e) {
        console.error('Trigger Failed:', e.message);
    }
}

trigger();
