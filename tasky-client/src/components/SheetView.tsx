import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor, { type EditorHandle } from './Editor';
import DailyPill from './DailyPill';
import { api, type Sheet } from '../lib/api';
import { useLayout } from '../context/LayoutContext';

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
    const navigate = useNavigate();
    const { setHeaderTitle, setHeaderElements, setIsHeaderCollapsed } = useLayout();

    // State
    const [sheet, setSheet] = useState<Sheet | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, done: 0 });

    // Virtual State: If true, we are "pretending" to be on a new day, but haven't saved yet
    const [isVirtualToday, setIsVirtualToday] = useState(false);
    // Determine the effective date we are showing
    const [displayDate, setDisplayDate] = useState<string>('');

    const editorRef = React.useRef<EditorHandle>(null);
    const headerRef = React.useRef<HTMLDivElement>(null);

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
            setIsVirtualToday(false);

            api.getSheet(Number(id))
                .then(data => {
                    const today = new Date().toISOString().split('T')[0];
                    const sheetDate = data.target_date || data.created_at.split('T')[0];

                    if (sheetDate < today) {
                        // Rollover time!
                        // We keep the old sheet data for reference (title, color, id for history),
                        // but we clear content and set date to today for the UI.
                        setIsVirtualToday(true);
                        setDisplayDate(today);

                        // Show "fresh" slate stats
                        setStats({ total: 0, done: 0 });

                        // We intentionally DON'T set 'sheet' to the old data directly for everything,
                        // or we shadow it. Let's store the *base* sheet.
                        setSheet(data);
                    } else {
                        // Current day sheet, load normally
                        setSheet(data);
                        setDisplayDate(sheetDate);
                        calculateStats(data.content || '');
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching sheet:', err);
                    setLoading(false);
                });
        }
    }, [id]);

    // Helper to "Realize" the virtual sheet (Create it in DB)
    const realizeSheet = async (initialTitle: string, initialContent: string, initialColor: string) => {
        if (!sheet) return null;

        // Use the API to create a NEW sheet in the same group
        try {
            const today = new Date().toISOString().split('T')[0];
            // If no group ID existed on the old sheet, the API might need to handle creating a new group ID?
            // Actually, we should probably ensure the OLD sheet has a group ID first if it's missing?
            // Or just rely on our createSheet logic that assigns one if passed?
            // Our api.createSheet handles new sheets. We need a way to 'continue' a group.

            // Let's modify usage of api.createSheet or add a new method?
            // Actually, best to update `api.ts` to strictly support "Create Next in Group" or we do it efficiently here.
            // Let's assume we can pass group_id to createSheet (we'll need to update api signature if not present, 
            // but for now let's check what `createSheet` accepts).
            // Looking at api.ts, createSheet takes (title). 
            // We need to update api.ts to accept optional params.

            // For this step, I'll update api.createSheet call assuming I will update the API signature in next step.
            // OR I can use supabase directly here if really needed, but cleaner to update API.
            // I'll call `api.createNextSheet(sheet.id, ...)`? 

            // Let's implement `api.continueSheet(baseSheetId, ...)` or similar.
            // For now, let's call a new method we will add: `api.createDailyFollowUp(baseSheetId, title, content)`

            const newSheet = await api.createDailyFollowUp(sheet.id, initialTitle, initialContent, initialColor);

            setSheet(newSheet);
            setIsVirtualToday(false);
            setDisplayDate(newSheet.target_date || today);

            // Update URL
            navigate(`/sheets/${newSheet.id}`, { replace: true });
            return newSheet;
        } catch (e) {
            console.error("Failed to create daily sheet", e);
            return null;
        }
    };

    // Create a debounced save function
    const saveContent = useCallback(
        debounce(async (newContent: string, currentSheet: Sheet) => {
            try {
                await api.updateSheet(currentSheet.id, { content: newContent });
            } catch (err) {
                console.error('Error saving content:', err);
            }
        }, 1000),
        []
    );

    const handleContentChange = async (newContent: string) => {
        if (!sheet) return;

        calculateStats(newContent);

        if (isVirtualToday) {
            // First edit on a virtual day! Create the sheet.
            await realizeSheet(sheet.title, newContent, sheet.color);
        } else {
            // Normal save
            saveContent(newContent, sheet);
        }
    };

    const handleTitleChange = async (newTitle: string) => {
        if (!sheet) return;

        // Optimistic update
        setSheet({ ...sheet, title: newTitle });

        if (isVirtualToday) {
            await realizeSheet(newTitle, '', sheet.color);
        } else {
            try {
                if (sheet.group_id) {
                    await api.updateSheetGroup(sheet.group_id, { title: newTitle });
                } else {
                    await api.updateSheet(sheet.id, { title: newTitle });
                }
            } catch (err) {
                console.error('Error saving title:', err);
            }
        }
    }

    const handleColorChange = async (newColor: string) => {
        if (!sheet) return;

        setSheet({ ...sheet, color: newColor });

        if (isVirtualToday) {
            await realizeSheet(sheet.title, '', newColor);
        } else {
            try {
                // Only update THIS sheet's color, not the group. 
                // Each day can have its own vibe.
                await api.updateSheet(sheet.id, { color: newColor });
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

    // Sync header info with LayoutContext
    useEffect(() => {
        if (sheet) {
            setHeaderTitle(sheet.title || 'Untitled');
            setHeaderElements(
                <DailyPill
                    // If virtual, we show Today. If real, we show sheet date.
                    date={displayDate || new Date().toISOString().split('T')[0]}
                    stats={stats}
                    color={sheet.color || '#d8b4fe'}
                    onChangeColor={handleColorChange}
                    // IMPORTANT: History uses the ID. 
                    // If virtual, we pass the OLD ID. Accessing history from the old ID is valid (same group).
                    // If real, we pass the current ID.
                    sheetId={sheet.id}
                />
            );
        }
    }, [sheet, stats, displayDate, isVirtualToday]);

    // Setup Intersection Observer for sticky header
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // If the header row is not intersecting (scrolled out of view), show the sticky header (collapse main)
                // We use a small threshold or negative margin to trigger it slightly before it's fully gone if desired
                // or just when it leaves.
                // boundingClientRect.top < 100 checks if it's scrolled *above* the viewport (accounting for top bar offset)
                const isScrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 100;
                setIsHeaderCollapsed(isScrolledPast);
            },
            {
                threshold: 0, // Trigger when even 1px is out? Actually when 0% is visible means it's gone.
                // If threshold is 0.0, the callback is invoked when the target enters or exits the visibility.
                rootMargin: "-20px 0px 0px 0px" // Trigger slightly before it's completely gone/ or after?
                // Let's stick to default for now, verify iteratively.
            }
        );

        if (headerRef.current) {
            observer.observe(headerRef.current);
        }

        return () => {
            observer.disconnect();
            // Cleanup: ensure sticky header is hidden when unmounting
            setIsHeaderCollapsed(false);
            setHeaderTitle('');
            setHeaderElements(null);
        };
    }, []);

    if (loading) return <div style={{ padding: '2rem', color: '#888' }}>Loading...</div>;
    if (!sheet) return <div style={{ padding: '2rem', color: '#888' }}>Select a note to view</div>;

    // Computed content to render: Empty if virtual, otherwise sheet content
    const contentToRender = isVirtualToday ? '' : (sheet.content || '');

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header: Title + DailyPill Row */}
            <div
                ref={headerRef}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                    gap: '1rem',
                    minHeight: '40px' // Ensure height for the absolute back button alignment
                }}>
                {/* Title Input ... */}
                {/* Title Input (Pushed right to avoid back button) */}
                <input
                    value={sheet.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Untitled"
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        border: 'none',
                        outline: 'none',
                        flex: 1,
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-main)',
                        fontFamily: 'var(--font-inter)',
                        padding: 0,
                        minWidth: 0
                    }}
                />

                {/* DailyPill */}
                <div style={{ flexShrink: 0 }}>
                    <DailyPill
                        date={displayDate}
                        stats={stats}
                        color={sheet.color || '#d8b4fe'}
                        onChangeColor={handleColorChange}
                        sheetId={sheet.id}
                    />
                </div>
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1 }}>
                <Editor
                    ref={editorRef}
                    content={contentToRender}
                    onChange={handleContentChange}
                    color={sheet.color}
                />
            </div>
        </div>
    );
};

export default SheetView;
