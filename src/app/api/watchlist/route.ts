import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/watchlist - Fetch user's watchlist groups and their items
export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // 1. Fetch all groups for the user
        let { data: groups, error: groupsError } = await supabase
            .from('watchlist_groups')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: true });

        if (groupsError) throw groupsError;

        // Ensure users have exactly 5 default numbered groups
        if (!groups || groups.length === 0) {
            const defaultGroups = [
                { user_id: session.user.id, name: '1' },
                { user_id: session.user.id, name: '2' },
                { user_id: session.user.id, name: '3' },
                { user_id: session.user.id, name: '4' },
                { user_id: session.user.id, name: '5' }
            ];
            const { data: insertedGroups, error: insertError } = await supabase
                .from('watchlist_groups')
                .insert(defaultGroups)
                .select();

            if (insertError) throw insertError;
            groups = insertedGroups;
        } else if (groups.length === 1 && groups[0].name === 'My Watchlist') {
            // Migration: rename existing "My Watchlist" to "1" and create 2-5
            await supabase.from('watchlist_groups').update({ name: '1' }).eq('id', groups[0].id);
            groups[0].name = '1';

            const additionalGroups = [
                { user_id: session.user.id, name: '2' },
                { user_id: session.user.id, name: '3' },
                { user_id: session.user.id, name: '4' },
                { user_id: session.user.id, name: '5' }
            ];
            const { data: newGroups } = await supabase.from('watchlist_groups').insert(additionalGroups).select();
            if (newGroups) groups = [...groups, ...newGroups];
        }

        // 2. Fetch all watchlist items for the user
        const { data: items, error: itemsError } = await supabase
            .from('watchlists')
            .select('id, symbol, list_name, group_id')
            .eq('user_id', session.user.id);

        if (itemsError) throw itemsError;

        // Migrate legacy items without a group_id to the first group
        const defaultGroupId = groups[0].id;
        const itemsToMigrate = items?.filter(item => !item.group_id) || [];

        if (itemsToMigrate.length > 0) {
            for (const item of itemsToMigrate) {
                await supabase.from('watchlists').update({ group_id: defaultGroupId }).eq('id', item.id);
                item.group_id = defaultGroupId;
            }
        }

        // 3. Assemble the payload
        const formattedData = groups.map(group => {
            const groupItems = (items || []).filter(item => item.group_id === group.id).map(i => i.symbol);
            return {
                id: group.id,
                name: group.name,
                symbols: groupItems
            };
        });

        return NextResponse.json(formattedData);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/watchlist - Add to watchlist OR create new group
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { action } = body;

        // CREATE A NEW GROUP
        if (action === 'create_group') {
            const { name } = body;
            if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

            const { data, error } = await supabase
                .from('watchlist_groups')
                .insert({ user_id: session.user.id, name })
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, group: data });
        }

        // ADD SYMBOL TO GROUP
        if (action === 'add_symbol') {
            const { symbol, group_id } = body;
            if (!symbol || !group_id) return NextResponse.json({ error: 'Symbol and group_id required' }, { status: 400 });

            // Check if already in group
            const { data: existing } = await supabase
                .from('watchlists')
                .select('id')
                .eq('user_id', session.user.id)
                .eq('symbol', symbol)
                .eq('group_id', group_id)
                .maybeSingle();

            if (existing) return NextResponse.json({ success: true, message: 'Already in group' });

            const { error } = await supabase
                .from('watchlists')
                .insert({ user_id: session.user.id, symbol, group_id, list_name: 'legacy' });

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/watchlist - Remove from watchlist OR delete group
export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { action } = body;

        // DELETE A GROUP
        if (action === 'delete_group') {
            const { group_id } = body;
            if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 });

            const { error } = await supabase
                .from('watchlist_groups')
                .delete()
                .eq('user_id', session.user.id)
                .eq('id', group_id);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        // REMOVE SYMBOL FROM GROUP
        if (action === 'remove_symbol') {
            const { symbol, group_id } = body;
            if (!symbol || !group_id) return NextResponse.json({ error: 'Symbol and group_id required' }, { status: 400 });

            const { error } = await supabase
                .from('watchlists')
                .delete()
                .eq('user_id', session.user.id)
                .eq('symbol', symbol)
                .eq('group_id', group_id);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
