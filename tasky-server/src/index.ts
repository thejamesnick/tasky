import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

import { query, run } from './db';

app.get('/', (req, res) => {
    res.send('Tasky API is running');
});

// Get all sheets (grouped by group_id, showing latest)
app.get('/api/sheets', async (req, res) => {
    try {
        const sheets = await query(`
            SELECT * FROM sheets 
            WHERE id IN (
                SELECT MAX(id) 
                FROM sheets 
                GROUP BY group_id
            )
            ORDER BY id DESC
        `);
        res.json(sheets);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// Get single sheet
app.get('/api/sheets/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const sheets = await query('SELECT * FROM sheets WHERE id = ?', [id]);
        if (sheets.length === 0) {
            return res.status(404).json({ error: 'Sheet not found' });
        }
        res.json(sheets[0]);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// Get sheet history (by group_id)
app.get('/api/sheets/:id/history', async (req, res) => {
    const { id } = req.params;
    try {
        // First get the group_id of the requested sheet
        const currentSheet = await query('SELECT group_id FROM sheets WHERE id = ?', [id]);
        if (currentSheet.length === 0) {
            return res.status(404).json({ error: 'Sheet not found' });
        }
        const groupId = currentSheet[0].group_id;

        // Then get all sheets with that group_id
        const history = await query('SELECT * FROM sheets WHERE group_id = ? ORDER BY target_date DESC, id DESC LIMIT 50', [groupId]);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// Create a new sheet
app.post('/api/sheets', async (req, res) => {
    const { title, color, targetDate, groupId } = req.body;
    const finalTitle = title || 'Untitled';
    const finalColor = color || '#d8b4fe';

    // Generate a random group ID if not provided (new note)
    const finalGroupId = groupId || Math.random().toString(36).substring(2, 15);

    try {
        const result = await run(
            'INSERT INTO sheets (title, content, color, target_date, group_id) VALUES (?, ?, ?, ?, ?)',
            [finalTitle, '', finalColor, targetDate || null, finalGroupId]
        );
        res.json({
            id: result.id,
            title: finalTitle,
            content: '',
            color: finalColor,
            target_date: targetDate,
            group_id: finalGroupId
        });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// Update sheet content (Auto-save)
app.patch('/api/sheets/:id', async (req, res) => {
    const { id } = req.params;
    const { content, title, color, targetDate } = req.body;

    try {
        if (content !== undefined) {
            await run('UPDATE sheets SET content = ? WHERE id = ?', [content, id]);
        }
        if (title !== undefined) {
            await run('UPDATE sheets SET title = ? WHERE id = ?', [title, id]);
        }
        if (color !== undefined) {
            await run('UPDATE sheets SET color = ? WHERE id = ?', [color, id]);
        }
        if (targetDate !== undefined) {
            await run('UPDATE sheets SET target_date = ? WHERE id = ?', [targetDate, id]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// Delete a sheet
app.delete('/api/sheets/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await run('DELETE FROM tasks WHERE sheet_id = ?', [id]);
        await run('DELETE FROM sheets WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// Get tasks for a specific sheet (optional date filter)
app.get('/api/sheets/:sheetId/tasks', async (req, res) => {
    const { sheetId } = req.params;
    const { date } = req.query;

    try {
        let sql = 'SELECT * FROM tasks WHERE sheet_id = ?';
        const params = [sheetId];

        if (date) {
            sql += ' AND target_date = ?';
            params.push(date as string);
        }

        const tasks = await query(sql, params);
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// Get daily tasks (sheet_id IS NULL)
app.get('/api/tasks/daily', async (req, res) => {
    const { date } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];

    try {
        const tasks = await query(
            'SELECT * FROM tasks WHERE sheet_id IS NULL AND target_date = ?',
            [targetDate]
        );
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// Get daily task stats
app.get('/api/tasks/daily/stats', async (req, res) => {
    const { date } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];

    try {
        const tasks = await query(
            'SELECT is_done FROM tasks WHERE sheet_id IS NULL AND target_date = ?',
            [targetDate]
        );
        const total = tasks.length;
        const done = tasks.filter((t: any) => t.is_done).length;
        res.json({ total, done });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
    const { sheetId, content, targetDate } = req.body;
    try {
        const result = await run(
            'INSERT INTO tasks (sheet_id, content, target_date) VALUES (?, ?, ?)',
            [sheetId, content, targetDate || new Date().toISOString().split('T')[0]]
        );
        res.json({ id: result.id, sheetId, content, is_done: 0 });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// Toggle task status
app.patch('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { isDone } = req.body;
    try {
        await run('UPDATE tasks SET is_done = ? WHERE id = ?', [isDone ? 1 : 0, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await run('DELETE FROM tasks WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
