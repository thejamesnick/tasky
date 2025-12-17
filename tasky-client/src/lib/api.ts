import { supabase } from './supabase';

export interface Sheet {
    id: number;
    user_id: string;
    title: string;
    content: string;
    color: string;
    target_date: string | null;
    group_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: number;
    user_id: string;
    sheet_id: number | null;
    content: string;
    is_done: boolean;
    reminder_at?: string;
    target_date: string;
    created_at: string;
}

export const api = {
    // --- Sheets ---
    getSheets: async () => {
        const { data, error } = await supabase
            .from('sheets')
            .select('*')
            .order('updated_at', { ascending: false }); // Keep this order for initial fetch

        if (error) throw error;
        const sheets = data as Sheet[];

        const uniqueSheets = new Map<string, Sheet>(); // To store the latest sheet for each group_id
        const plainSheets: Sheet[] = []; // Sheets without a group_id

        sheets.forEach(s => {
            if (s.group_id) {
                const existing = uniqueSheets.get(s.group_id);
                // Since we ordered by updated_at desc, we prioritize the first one we see?
                // Or we should order by target_date? Usually "Latest" means target_date or created_at.
                // Let's sort the data array first by target_date desc to be sure.

                // Better approach: Let's do client side sorting to be safe
                if (!existing) {
                    uniqueSheets.set(s.group_id, s);
                } else {
                    // If we have an existing one, check if current 's' is newer in terms of target_date
                    // (Handle case where updated_at might be misleading if we edited an old note)
                    if ((s.target_date || '') > (existing.target_date || '')) {
                        uniqueSheets.set(s.group_id, s);
                    }
                }
            } else {
                plainSheets.push(s);
            }
        });

        // Combine unique grouped sheets and plain sheets
        const result = [...Array.from(uniqueSheets.values()), ...plainSheets];

        // Re-sort by updated_at or created_at to keep sidebar fresh
        result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        return result;
    },

    getSheet: async (id: number) => {
        const { data, error } = await supabase
            .from('sheets')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Sheet;
    },

    createDailyFollowUp: async (baseSheetId: number, title: string, content: string = '', color: string = '') => {
        // Fetch base sheet to match group_id
        const { data: baseSheet } = await supabase.from('sheets').select('*').eq('id', baseSheetId).single();
        if (!baseSheet) throw new Error("Base sheet not found");

        let groupId = baseSheet.group_id;
        if (!groupId) {
            // If this sheet has no group ID, it's the progenitor.
            // We need to check if we already minted a group ID? 
            // BE CAREFUL: If parallel requests come in, they might all try to mint a new GUID.
            // Best to just mint one and save it.
            // If we already have multiple sheets for today (race condition result), they will have invalid group IDs or diff group IDs.
            // We can't easily fix the group ID race here without a transaction or lock, but the client side lock 'isCreatingRef' helps significantly.
            groupId = crypto.randomUUID();
            await supabase.from('sheets').update({ group_id: groupId }).eq('id', baseSheetId);
        }

        const today = new Date().toISOString().split('T')[0];

        // Ensure no duplicate exists just in case
        const { data: existing } = await supabase
            .from('sheets')
            .select('*')
            .eq('group_id', groupId)
            .eq('target_date', today)
            .single();

        if (existing) return existing as Sheet;

        const { data, error } = await supabase
            .from('sheets')
            .insert([{
                title, // Should match or be what user typed
                group_id: groupId,
                target_date: today,
                color: color || baseSheet.color,
                content: content
                // user_id handled by RLS, created_at handled by default
            }])
            .select()
            .single();

        if (error) throw error;
        return data as Sheet;
    },

    // Cleanup helper for the user's issue
    cleanupDuplicates: async () => {
        // Find all sheets created TODAY
        const today = new Date().toISOString().split('T')[0];

        // Fetch all sheets for today
        const { data: sheets, error } = await supabase
            .from('sheets')
            .select('*')
            .eq('target_date', today);

        if (error || !sheets) return;

        // Group by group_id (or title if group_id is messy)
        // Since the bug causes multiple sheets with potentially DIFFERENT group_ids (if base had none),
        // we might need togroup by Created Time + Title?
        // Let's assume most have the same group_id if the base sheet had one.
        // If the base sheet didn't have one, we have a mess of new group IDs.

        // Strategy: Group by Title + Content length?
        // Simple strategy: Group by Title. Keep the one with the LATEST created_at. Delete others.
        // This is destructive but effective for "phantom pills".

        const groups = new Map<string, Sheet[]>();

        sheets.forEach(s => {
            const key = s.title; // Group by title for today
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)?.push(s);
        });

        const idsToDelete: number[] = [];

        for (const [_title, groupSheets] of groups.entries()) {
            if (groupSheets.length > 1) {
                // Sort by created_at descending (keep latest)
                // Or keep the one with most content?
                groupSheets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                // Keep the first one (latest)
                // Delete the rest
                for (let i = 1; i < groupSheets.length; i++) {
                    idsToDelete.push(groupSheets[i].id);
                }
            }
        }

        if (idsToDelete.length > 0) {
            console.log("Cleaning up duplicate sheets:", idsToDelete);
            await supabase.from('sheets').delete().in('id', idsToDelete);
        }
    },

    getSheetHistory: async (id: number) => {
        // First get the group_id of the requested sheet from Supabase (or we could pass it in, but let's fetch)
        const { data: currentSheet, error: sheetError } = await supabase
            .from('sheets')
            .select('group_id')
            .eq('id', id)
            .single();

        if (sheetError) throw sheetError;
        if (!currentSheet) return []; // Should not happen if ID exists

        if (!currentSheet.group_id) {
            // If no group_id, this sheet has no history history other than itself.
            // Return it so the user at least sees the current card.
            return [currentSheet as Sheet];
        }

        const { data, error } = await supabase
            .from('sheets')
            .select('*')
            .eq('group_id', currentSheet.group_id)
            .order('target_date', { ascending: false, nullsFirst: false })
            .order('id', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data as Sheet[];
    },

    createSheet: async (title: string = 'Untitled') => {
        const today = new Date().toISOString().split('T')[0];
        const groupId = crypto.randomUUID();

        const { data, error } = await supabase
            .from('sheets')
            .insert([{
                title,
                target_date: today,
                group_id: groupId
            }])
            .select()
            .single();

        if (error) throw error;
        return data as Sheet;
    },

    updateSheet: async (id: number, updates: Partial<Sheet>) => {
        const { error } = await supabase
            .from('sheets')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    // Update ALL sheets in the same group (e.g. for renaming the whole "Journal")
    updateSheetGroup: async (groupId: string, updates: Partial<Sheet>) => {
        const { error } = await supabase
            .from('sheets')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('group_id', groupId);

        if (error) throw error;
    },

    deleteSheet: async (id: number) => {
        const { error } = await supabase
            .from('sheets')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Tasks ---
    getDailyTasks: async (date: string) => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .is('sheet_id', null) // Daily tasks have no sheet
            .eq('target_date', date)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as Task[];
    },

    createTask: async (content: string, targetDate: string, sheetId?: number, reminderAt?: string) => {
        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                content,
                target_date: targetDate,
                sheet_id: sheetId || null,
                reminder_at: reminderAt || null
            }])
            .select()
            .single();

        if (error) throw error;
        return data as Task;
    },

    updateTask: async (id: number, updates: Partial<Task>) => {
        const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    deleteTask: async (id: number) => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
