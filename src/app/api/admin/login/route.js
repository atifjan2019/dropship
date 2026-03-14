import { checkPassword, generateToken } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

/**
 * POST /api/admin/login
 * Body: { password: string }
 * Returns: { token: string } on success
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { password } = body;

        if (!password) {
            return NextResponse.json({ error: 'Password required' }, { status: 400 });
        }

        if (!checkPassword(password)) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        const token = generateToken();

        return NextResponse.json({
            result: true,
            token,
            message: 'Login successful',
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
