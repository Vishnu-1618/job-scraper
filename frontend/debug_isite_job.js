const https = require('https');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL || 'your_supabase_url_here';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'your_supabase_key_here';

// We'll search for 'Ian' (case insensitive) in any text field
const url = `${SUPABASE_URL}/rest/v1/jobs?select=*&description=ilike.%25Ian%25&limit=5`;

const options = {
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
    }
};

https.get(url, options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const jobs = JSON.parse(data);
            console.log(`Fetched ${jobs.length} jobs.`);
            fs.writeFileSync('debug_isite.json', JSON.stringify(jobs, null, 2));
            console.log('Written to debug_isite.json');
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw data:', data);
        }
    });

}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
