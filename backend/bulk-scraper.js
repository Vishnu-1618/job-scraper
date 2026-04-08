const axios = require('axios');

const API_URL = 'http://localhost:3001/api/scrape';

// Comprehensive search queries covering ALL job roles
const searchQueries = [
    // ── Engineering & Development ──
    { platform: 'linkedin', keywords: 'software engineer', location: 'Remote' },
    { platform: 'linkedin', keywords: 'full stack developer', location: 'Bangalore' },
    { platform: 'linkedin', keywords: 'backend developer', location: 'Hyderabad' },
    { platform: 'linkedin', keywords: 'frontend developer', location: 'Mumbai' },

    { platform: 'indeed', keywords: 'java developer', location: 'Chennai' },
    { platform: 'indeed', keywords: 'python developer', location: 'Delhi' },
    { platform: 'indeed', keywords: 'devops engineer', location: 'Pune' },

    // ── Data & AI ──
    { platform: 'glassdoor', keywords: 'data scientist', location: 'Bangalore' },
    { platform: 'glassdoor', keywords: 'data analyst', location: 'Hyderabad' },
    { platform: 'glassdoor', keywords: 'machine learning engineer', location: 'Remote' },
    { platform: 'glassdoor', keywords: 'data engineer', location: 'Mumbai' },

    { platform: 'linkedin', keywords: 'ai engineer', location: 'Bangalore' },
    { platform: 'linkedin', keywords: 'business analyst', location: 'Delhi' },

    // ── Design & Creative ──
    { platform: 'naukri', keywords: 'ui ux designer', location: 'Bangalore' },
    { platform: 'naukri', keywords: 'graphic designer', location: 'Mumbai' },
    { platform: 'naukri', keywords: 'product designer', location: 'Pune' },

    { platform: 'indeed', keywords: 'content writer', location: 'Remote' },
    { platform: 'indeed', keywords: 'video editor', location: 'Chennai' },

    // ── Management & Business ──
    { platform: 'linkedin', keywords: 'product manager', location: 'Bangalore' },
    { platform: 'linkedin', keywords: 'project manager', location: 'Hyderabad' },
    { platform: 'linkedin', keywords: 'scrum master', location: 'Pune' },

    { platform: 'glassdoor', keywords: 'operations manager', location: 'Delhi' },
    { platform: 'glassdoor', keywords: 'business development', location: 'Mumbai' },

    // ── Marketing & Sales ──
    { platform: 'naukri', keywords: 'digital marketing', location: 'Remote' },
    { platform: 'naukri', keywords: 'seo executive', location: 'Bangalore' },
    { platform: 'naukri', keywords: 'sales executive', location: 'Chennai' },
    { platform: 'naukri', keywords: 'marketing manager', location: 'Mumbai' },

    // ── Finance & Accounting ──
    { platform: 'indeed', keywords: 'accountant', location: 'Delhi' },
    { platform: 'indeed', keywords: 'financial analyst', location: 'Mumbai' },
    { platform: 'indeed', keywords: 'audit executive', location: 'Bangalore' },

    // ── HR & Operations ──
    { platform: 'linkedin', keywords: 'hr manager', location: 'Pune' },
    { platform: 'linkedin', keywords: 'recruiter', location: 'Remote' },
    { platform: 'linkedin', keywords: 'talent acquisition', location: 'Hyderabad' },

    // ── Healthcare & Non-Tech ──
    { platform: 'naukri', keywords: 'medical coding', location: 'Chennai' },
    { platform: 'naukri', keywords: 'clinical research', location: 'Bangalore' },
    { platform: 'naukri', keywords: 'pharmacist', location: 'Hyderabad' },
    { platform: 'naukri', keywords: 'customer support', location: 'Remote' },

    // ── Internships & Entry Level (Mixed) ──
    { platform: 'linkedin', keywords: 'internship', location: 'India' },
    { platform: 'indeed', keywords: 'fresher', location: 'Bangalore' },
    { platform: 'glassdoor', keywords: 'trainee', location: 'Pune' }
];

async function triggerScrape(query) {
    try {
        console.log(`🔍 Scraping ${query.platform} for "${query.keywords}" in ${query.location}...`);
        const response = await axios.post(API_URL, query);
        console.log(`✅ ${query.platform}: ${response.data.message || 'Scrape triggered'}`);
        return true;
    } catch (error) {
        console.error(`❌ ${query.platform} failed:`, error.message);
        return false;
    }
}

async function bulkScrape() {
    console.log('🚀 Starting SUPER bulk scrape for all job categories...\n');
    console.log(`📊 Total queries: ${searchQueries.length}`);
    console.log(`⏱️  Estimated time: ${searchQueries.length * 2} minutes\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < searchQueries.length; i++) {
        const query = searchQueries[i];
        const success = await triggerScrape(query);

        if (success) successCount++;
        else failCount++;

        // Progress update
        if ((i + 1) % 5 === 0) {
            console.log(`\n📈 Progress: ${i + 1}/${searchQueries.length} queries completed`);
            console.log(`✅ Success: ${successCount} | ❌ Failed: ${failCount}\n`);
        }

        // Wait 5 seconds between requests to avoid overwhelming the server
        if (i < searchQueries.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    console.log('\n🎉 Bulk scrape completed!');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`\n💡 Tip: Refresh your frontend to see the new jobs!`);
}

// Run the bulk scraper
bulkScrape().catch(console.error);
