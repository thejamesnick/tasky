import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Editor, { type EditorHandle } from './Editor';
import DailyPill from './DailyPill';
import { api, type Sheet } from '../lib/api';

// Simple debounce function
const debounce = (func: Function, wait: number) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const SheetView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [sheet, setSheet] = useState<Sheet | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, done: 0 });
    const editorRef = React.useRef<EditorHandle>(null);

    // Calculate stats from HTML content
    const calculateStats = (html: string) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const checkboxes = doc.querySelectorAll('li[data-type="taskItem"]');
        const total = checkboxes.length;
        const done = doc.querySelectorAll('li[data-type="taskItem"][data-checked="true"]').length;
        setStats({ total, done });
    };

    useEffect(() => {
        if (id) {
            setLoading(true);
            api.getSheet(Number(id))
                .then(data => {
                    setSheet(data);
                    calculateStats(data.content || '');
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching sheet:', err);
                    setLoading(false);
                });
        }
    }, [id]);

    // Create a debounced save function
    const saveContent = useCallback(
        debounce(async (newContent: string, sheetId: number) => {
            try {
                await api.updateSheet(sheetId, { content: newContent });
            } catch (err) {
                console.error('Error saving content:', err);
            }
        }, 1000),
        [id]
    );

    const handleContentChange = (newContent: string) => {
        if (sheet && id) {
            calculateStats(newContent);
            saveContent(newContent, Number(id));
        }
    };

    const handleTitleChange = async (newTitle: string) => {
        if (sheet && id) {
            setSheet({ ...sheet, title: newTitle });
            try {
                await api.updateSheet(Number(id), { title: newTitle });
            } catch (err) {
                console.error('Error saving title:', err);
            }
        }
    }

    const handleColorChange = async (newColor: string) => {
        if (sheet && id) {
            setSheet({ ...sheet, color: newColor });
            try {
                await api.updateSheet(Number(id), { color: newColor });
            } catch (err) {
                console.error('Error saving color:', err);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            editorRef.current?.focus();
        }
    };

    if (loading) return <div style={{ padding: '2rem', color: '#888' }}>Loading...</div>;
    if (!sheet) return <div style={{ padding: '2rem', color: '#888' }}>Select a note to view</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header: Title + DailyPill */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <input
                    value={sheet.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Untitled"
                    style={{
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        border: 'none',
                        outline: 'none',
                        flex: 1,
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-main)',
                        fontFamily: 'var(--font-inter)',
                        marginRight: '1rem'
                    }}
                />
                <DailyPill
                    date={sheet.target_date || new Date().toISOString().split('T')[0]}
                    stats={stats}
                    color={sheet.color || '#d8b4fe'}
                    onChangeColor={handleColorChange}
                    sheetId={sheet.id}
                />
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1 }}>
                <Editor ref={editorRef} content={sheet.content || ''} onChange={handleContentChange} />
            </div>
        </div>
    );
};

export default SheetView;
