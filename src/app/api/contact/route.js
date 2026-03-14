import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * POST /api/contact
 * Saves a contact form submission to the database.
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, subject, message } = body;

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Name, email, and message are required' },
                { status: 400 }
            );
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('contact_messages')
            .insert({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                subject: (subject || '').trim(),
                message: message.trim(),
                is_read: false,
            })
            .select()
            .single();

        if (error) {
            console.error('[Contact] Supabase error:', error.message);
            return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
        }

        return NextResponse.json({
            result: true,
            message: 'Message sent successfully. We\'ll get back to you within 24 hours.',
            data: { id: data.id },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
