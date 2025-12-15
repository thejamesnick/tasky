import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Trash2, Plus, Check } from 'lucide-react';
import { api, type Task } from '../lib/api';

const DailyView: React.FC = () => {
    const { date } = useParams<{ date: string }>();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskContent, setNewTaskContent] = useState('');
    const [reminderTime, setReminderTime] = useState('');
    const [loading, setLoading] = useState(true);

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Format date for display
    const dateObj = new Date(targetDate);
    const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await api.getDailyTasks(targetDate);
            setTasks(data);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [targetDate]);

    const addTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskContent.trim()) return;

        try {
            // Combine targetDate and reminderTime if present
            let reminderAt = undefined;
            if (reminderTime) {
                reminderAt = `${targetDate}T${reminderTime}:00`;
            }

            const newTask = await api.createTask(newTaskContent, targetDate, undefined, reminderAt);
            setTasks([...tasks, newTask]);
            setNewTaskContent('');
            setReminderTime('');
        } catch (err) {
            console.error('Error adding task:', err);
        }
    };

    const toggleTask = async (id: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        // Optimistic update
        setTasks(tasks.map(t => t.id === id ? { ...t, is_done: newStatus } : t));

        try {
            await api.updateTask(id, { is_done: newStatus });
        } catch (err) {
            console.error('Error toggling task:', err);
            // Revert on error
            setTasks(tasks.map(t => t.id === id ? { ...t, is_done: currentStatus } : t));
        }
    };

    const deleteTask = async (id: number) => {
        if (!window.confirm('Delete this task?')) return;

        try {
            await api.deleteTask(id);
            setTasks(tasks.filter(t => t.id !== id));
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    };

    if (loading) return <div style={{ padding: '2rem', color: '#888' }}>Loading tasks...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                marginBottom: '1.5rem',
                color: 'var(--color-text-main)',
                fontFamily: 'var(--font-inter)'
            }}>
                {displayDate}
            </h1>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {tasks.length === 0 && (
                    <div style={{ color: '#888', fontStyle: 'italic', marginBottom: '1rem' }}>
                        No tasks for this day. Enjoy your clean slate!
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {tasks.map(task => {
                        // Format reminder time if exists
                        let reminderDisplay = '';
                        if (task.reminder_at) {
                            const d = new Date(task.reminder_at);
                            reminderDisplay = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        }

                        return (
                            <div key={task.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '0.75rem',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                transition: 'background-color 0.2s',
                                opacity: task.is_done ? 0.6 : 1
                            }}>
                                <button
                                    onClick={() => toggleTask(task.id, task.is_done)}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '6px',
                                        border: `2px solid ${task.is_done ? 'var(--color-green-primary)' : '#ccc'}`,
                                        backgroundColor: task.is_done ? 'var(--color-green-primary)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        padding: 0,
                                        flexShrink: 0
                                    }}
                                >
                                    {task.is_done ? <Check size={16} color="white" /> : null}
                                </button>

                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        fontSize: '1rem',
                                        textDecoration: task.is_done ? 'line-through' : 'none',
                                        color: task.is_done ? '#888' : 'inherit'
                                    }}>
                                        {task.content}
                                    </span>
                                    {reminderDisplay && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            backgroundColor: '#f0f9ff',
                                            color: '#0369a1',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontWeight: 500
                                        }}>
                                            {reminderDisplay}
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={() => deleteTask(task.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#ccc',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-red-primary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#ccc'}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add Task Input */}
            <form onSubmit={addTask} style={{
                marginTop: '1rem',
                display: 'flex',
                gap: '0.5rem',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                border: '1px solid var(--color-border)'
            }}>
                <input
                    type="text"
                    value={newTaskContent}
                    onChange={(e) => setNewTaskContent(e.target.value)}
                    placeholder="Add a new task..."
                    style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #e5e5e5',
                        fontSize: '1rem',
                        outline: 'none'
                    }}
                />
                <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #e5e5e5',
                        fontSize: '1rem',
                        outline: 'none',
                        color: '#666'
                    }}
                />
                <button type="submit" style={{
                    backgroundColor: 'var(--color-text-main)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    width: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                }}>
                    <Plus size={24} />
                </button>
            </form>
        </div>
    );
};

export default DailyView;
