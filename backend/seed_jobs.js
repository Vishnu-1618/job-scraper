const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'your_supabase_url_here';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_role_key_here';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const sampleJobs = [
    {
        title: 'Senior React Developer',
        company: 'TechCorp Inc.',
        location: 'Remote',
        description: 'We are looking for an experienced React developer to join our team. Skills: React, TypeScript, Next.js, Node.js.',
        url: 'https://linkedin.com/jobs/view/1234567890',
        posted_date: new Date().toISOString(),
        source_id: 1 // Assuming 1 exists, if not we'll leave it null or create it
    },
    {
        title: 'Full Stack Engineer',
        company: 'StartupX',
        location: 'New York, NY',
        description: 'Join a fast-paced startup building the future of finance. Stack: Python, Django, React, AWS.',
        url: 'https://indeed.com/viewjob?jk=abcdef123456',
        posted_date: new Date().toISOString(),
        source_id: 2
    },
    {
        title: 'Backend Developer (Node.js)',
        company: 'CloudSystems',
        location: 'San Francisco, CA',
        description: 'Scale our backend systems using Node.js and Kubernetes. Experience with microservices is a plus.',
        url: 'https://glassdoor.com/job/listing/987654321',
        posted_date: new Date().toISOString(),
        source_id: 1
    },
    {
        title: 'AI/ML Engineer',
        company: 'DataMinds',
        location: 'Remote',
        description: 'Build state-of-the-art NLP models. Python, PyTorch, Transformers, HuggingFace experience required.',
        url: 'https://naukri.com/job-listings-ai-ml-engineer-112233',
        posted_date: new Date().toISOString(),
        source_id: 3
    },
    {
        title: 'Frontend Engineer',
        company: 'Creative Studio',
        location: 'London, UK (Hybrid)',
        description: 'Create pixel-perfect UIs for our global clients. HTML, CSS, JavaScript, Vue.js.',
        url: 'https://linkedin.com/jobs/view/555666777',
        posted_date: new Date().toISOString(),
        source_id: 1
    }
];

async function seed() {
    console.log('Seeding jobs...');

    // 1. Ensure sources exist
    await supabase.from('job_sources').upsert([
        { id: 1, name: 'LinkedIn', base_url: 'https://linkedin.com' },
        { id: 2, name: 'Indeed', base_url: 'https://indeed.com' },
        { id: 3, name: 'Glassdoor', base_url: 'https://glassdoor.com' }
    ]);

    // 2. Insert jobs
    const { data, error } = await supabase
        .from('jobs')
        .upsert(sampleJobs, { onConflict: 'url' })
        .select();

    if (error) {
        console.error('Error seeding jobs:', error);
    } else {
        console.log(`Successfully seeded ${data.length} sample jobs.`);
    }
}

seed();
