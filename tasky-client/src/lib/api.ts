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
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data as Sheet[];
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

    getSheetHistory: async (id: number) => {
        // First get the group_id of the requested sheet from Supabase (or we could pass it in, but let's fetch)
        const { data: currentSheet, error: sheetError } = await supabase
            .from('sheets')
            .select('group_id')
            .eq('id', id)
            .single();

        if (sheetError) throw sheetError;
        if (!currentSheet || !currentSheet.group_id) {
            // If no group_id, maybe it's just this sheet in history or error?
            // For now, let's return just this sheet if no group found, or empty array.
            // But valid flow implies group_id exists if we want history.
            return [];
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
        const { data, error } = await supabase
            .from('sheets')
            .insert([{ title }])
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
