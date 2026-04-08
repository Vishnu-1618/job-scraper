import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Move initialization inside handler to avoid build-time/module-load crashes if envs are missing
export async function POST(request: Request) {
    console.log('API Route /api/upload hit');

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase credentials in API route');
            return NextResponse.json({ error: 'Server misconfiguration: Missing credentials' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const userId = formData.get('userId') as string || '00000000-0000-0000-0000-000000000000';

        if (!file) {
            console.error('No file in request');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log('Processing file:', file.name);

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data, error } = await supabaseAdmin
            .storage
            .from('resumes')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Supabase Storage Error:', error);
            if ((error as any).message?.includes('not found') || (error as any).message?.includes('does not exist')) {
                return NextResponse.json({
                    error: 'Storage bucket "resumes" not found. Please create it in Supabase Dashboard → Storage → "New Bucket" → Name: "resumes"'
                }, { status: 404 });
            }
            return NextResponse.json({ error: (error as any).message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage.from('resumes').getPublicUrl(fileName);
        console.log('Upload success, URL:', publicUrl);

        const connection = new IORedis('redis://localhost:6379', { maxRetriesPerRequest: null });
        const resumeQueue = new Queue('resume-queue', { connection: connection as any });
        await resumeQueue.add('process-resume', {
            url: publicUrl,
            path: fileName,
            userId: userId
        });
        await resumeQueue.close();

        return NextResponse.json({ success: true, url: publicUrl, path: fileName });

    } catch (error: any) {
        console.error('Unhandled Server Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
