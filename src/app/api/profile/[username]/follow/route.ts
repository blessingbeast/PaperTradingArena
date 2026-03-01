import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const supabase = await createClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify target exists
        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .single();

        if (!targetProfile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        if (targetProfile.id === session.user.id) {
            return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
        }

        // Check current follow state
        const { data: existingFollow } = await supabase
            .from('friends')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('friend_id', targetProfile.id)
            .single();

        if (existingFollow) {
            // Unfollow
            const { error } = await supabase
                .from('friends')
                .delete()
                .eq('id', existingFollow.id);

            if (error) throw error;
            return NextResponse.json({ following: false });
        } else {
            // Follow
            const { error } = await supabase
                .from('friends')
                .insert({
                    user_id: session.user.id,
                    friend_id: targetProfile.id
                });

            if (error) throw error;
            return NextResponse.json({ following: true });
        }

    } catch (error: any) {
        console.error('Follow API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
    }
}
