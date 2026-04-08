
async function checkApi() {
    try {
        console.log('Querying API: http://localhost:3001/api/jobs');
        const res = await fetch('http://localhost:3001/api/jobs');
        console.log('Response Status:', res.status);
        
        if (!res.ok) {
            const text = await res.text();
            console.error('API Error Response:', text);
            return;
        }

        const data = await res.json();
        if (data && data.jobs) {
            console.log(`Total jobs returned from API: ${data.jobs.length}`);
            if (data.jobs.length > 0) {
                console.log('Sample job title:', data.jobs[0].title);
            }
        } else {
            console.log('Unexpected response structure:', data);
        }
    } catch (err) {
        console.error('Fetch Error:', err.message);
    }
}

checkApi();
