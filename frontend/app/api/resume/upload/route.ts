import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    console.log('=== Resume Upload API Called ===');

    try {
        // Use hardcoded fallbacks for testing
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase credentials in environment variables.");
        }

        console.log('Using Supabase URL:', supabaseUrl);
        console.log('Using Service Key:', supabaseServiceKey ? 'Loaded' : 'Missing');

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const formData = await request.formData();
        const file = formData.get('resume') as File;

        if (!file) {
            console.error('No file in request');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log('Processing resume file:', file.name);

        // Validate file type
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Please upload PDF or DOCX' }, { status: 400 });
        }

        const fileExt = file.name.split('.').pop();
        const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const fileName = `${userId}.${fileExt}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('Attempting to upload to Supabase storage bucket: resumes');

        // Upload to Supabase Storage
        const { data, error } = await supabaseAdmin
            .storage
            .from('resumes')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (error) {
            console.error('❌ Supabase Storage Error:', error);

            // Check if it's a bucket not found error
            if ((error as any).message?.includes('not found') || (error as any).message?.includes('does not exist')) {
                return NextResponse.json({
                    error: 'Storage bucket "resumes" not found. Please create it in Supabase Dashboard → Storage → New Bucket → Name: "resumes"',
                    details: (error as any).message
                }, { status: 500 });
            }

            return NextResponse.json({
                error: `Storage error: ${(error as any).message}`,
                details: error
            }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage.from('resumes').getPublicUrl(fileName);
        console.log('✅ Resume upload success, URL:', publicUrl);

        // Forward to backend processing API
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
            fetch(`${BACKEND_URL}/process-resume`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: publicUrl, path: fileName, userId })
            }).catch(e => console.error('Background processing trigger failed:', e));

            console.log('✅ Resume processing webhook triggered for user:', userId);
        } catch (queueError: any) {
            console.error('⚠️ Failed to trigger resume processing webhook:', queueError.message);
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: fileName,
            userId: userId,
            message: 'Resume uploaded successfully. AI matching in progress...'
        });

    } catch (error: any) {
        console.error('❌ Unhandled Server Error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
