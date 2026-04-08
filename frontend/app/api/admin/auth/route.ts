import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === correctPassword) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('ADMIN_TOKEN', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
    // Logout
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.set('ADMIN_TOKEN', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });
    return response;
}
