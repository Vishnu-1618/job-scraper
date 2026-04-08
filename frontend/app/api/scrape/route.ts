import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Ensure backend URL matches Render deployment inside environment vars
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

        console.log(`Forwarding scrape request to backend: ${BACKEND_URL}/scrape`);

        const response = await fetch(`${BACKEND_URL}/scrape`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error((errorData && errorData.error) || 'Backend scraping service failed');
        }

        const data = await response.json();
        return NextResponse.json({ success: true, message: 'Scraping triggered successfully', result: data });
    } catch (error: any) {
        console.error('API Forwarding Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
