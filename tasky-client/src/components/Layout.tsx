import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Plus, ChevronLeft, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { api } from '../lib/api';
import logo from '../assets/logo.svg';

interface LayoutProps {
    children: React.ReactNode;
}

interface Sheet {
    id: number;
    title: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sheets, setSheets] = useState<Sheet[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [sheetToDelete, setSheetToDelete] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // Optional: Auto-close sidebar when switching to mobile? 
            // Or auto-open when switching to desktop? 
            // For now, let's leave it as is, user state persists.
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch sheets for sidebar
    const fetchSheets = async () => {
        try {
            const data = await api.getSheets();
            setSheets(data);
        } catch (err) {
            console.error('Error fetching sheets:', err);
        }
    };

    useEffect(() => {
        fetchSheets();
        // Poll for updates every few seconds to keep list fresh (simple solution)
        const interval = setInterval(fetchSheets, 5000);
        return () => clearInterval(interval);
    }, []);

    const createSheet = async () => {
        try {
            const newSheet = await api.createSheet();

            // Update local state immediately
            setSheets(prev => [newSheet, ...prev]);

            // Navigate to the new sheet
            navigate(`/sheets/${newSheet.id}`);
            if (isMobile) setIsSidebarOpen(false);
        } catch (err) {
            console.error('Error creating sheet:', err);
            alert('Failed to create new note. Please try again.');
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        setSheetToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (sheetToDelete === null) return;

        try {
            await api.deleteSheet(sheetToDelete);

            setSheets(prev => prev.filter(sheet => sheet.id !== sheetToDelete));

            // If we deleted the current sheet, navigate away
            if (location.pathname === `/sheets/${sheetToDelete}`) {
                navigate('/');
            }
        } catch (err) {
            console.error('Error deleting sheet:', err);
            alert('Failed to delete note.');
        } finally {
            setDeleteModalOpen(false);
            setSheetToDelete(null);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'white' }}>
            {/* Sidebar */}
            <aside style={{
                width: isSidebarOpen ? (isMobile ? '100vw' : '280px') : '0px',
                backgroundColor: '#f7f7f5', // Apple Notes-ish gray
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                transition: isMobile ? 'none' : 'width 0.3s ease', // Disable transition on mobile for snappy feel
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                position: isMobile && isSidebarOpen ? 'absolute' : 'relative',
                zIndex: 10,
                height: '100%'
            }}>
                {/* Sidebar Header */}
                <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    {isMobile ? (
                        <>
                            <button onClick={() => setIsSidebarOpen(false)} style={{
                                background: 'none', border: 'none', cursor: 'pointer', color: '#666',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                zIndex: 20
                            }}>
                                <ChevronLeft size={24} />
                            </button>
                            <div style={{
                                position: 'absolute',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: 600,
                                color: '#444'
                            }}>
                                <img src={logo} alt="Tasky Logo" style={{ width: '20px', height: '20px' }} />
                                <span>Tasky</span>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#444' }}>
                            <img src={logo} alt="Tasky Logo" style={{ width: '20px', height: '20px' }} />
                            <span>Tasky</span>
                        </div>
                    )}
                    <button onClick={createSheet} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#666',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 20
                    }}>
                        <Plus size={24} />
                    </button>
                </div>

                {/* Notes List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
                    {sheets.map(sheet => (
                        <div
                            key={sheet.id}
                            style={{
                                position: 'relative',
                                marginBottom: '2px',
                            }}
                        >
                            <Link
                                to={`/sheets/${sheet.id}`}
                                onClick={() => isMobile && setIsSidebarOpen(false)}
                                style={{
                                    display: 'block',
                                    padding: '0.75rem 1rem',
                                    paddingRight: '2.5rem', // Make room for delete button
                                    borderRadius: '6px',
                                    color: location.pathname === `/sheets/${sheet.id}` ? 'black' : '#555',
                                    backgroundColor: location.pathname === `/sheets/${sheet.id}` ? '#e5e5e0' : 'transparent',
                                    fontWeight: location.pathname === `/sheets/${sheet.id}` ? 600 : 400,
                                    fontSize: '0.95rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                {sheet.title || 'Untitled'}
                            </Link>
                            <button
                                onClick={(e) => handleDeleteClick(e, sheet.id)}
                                style={{
                                    position: 'absolute',
                                    right: '0.5rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#999',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px',
                                    borderRadius: '4px',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-red-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
                                title="Delete note"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                display: (isMobile && isSidebarOpen) ? 'none' : 'flex',
                flexDirection: 'column',
                minWidth: 0
            }}>
                {/* Top Bar (Toggle Sidebar) */}
                <div style={{ padding: '1rem', borderBottom: '1px solid transparent' }}>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#888'
                    }}>
                        {isSidebarOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 2rem 2rem 2rem' }}>
                    {children}
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Note"
                footer={
                    <>
                        <button onClick={() => setDeleteModalOpen(false)} style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: '#f5f5f7',
                            color: '#1d1d1f',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e5e7'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f7'}
                        >
                            Cancel
                        </button>
                        <button onClick={confirmDelete} style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: 'var(--color-red-primary)',
                            color: 'white',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            Delete
                        </button>
                    </>
                }
            >
                Are you sure you want to delete this note? This action cannot be undone.
            </Modal>
        </div>
    );
};

export default Layout;
