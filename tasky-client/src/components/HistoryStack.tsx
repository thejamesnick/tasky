import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { api, type Sheet } from '../lib/api';

interface HistoryStackProps {
    isOpen: boolean;
    onClose: () => void;
    currentSheetId: number;
    currentColor: string;
    onColorChange?: (color: string) => void;
}

const HistoryStack: React.FC<HistoryStackProps> = ({ isOpen, onClose, currentSheetId, currentColor, onColorChange }) => {
    const [history, setHistory] = useState<Sheet[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && currentSheetId) {
            setLoading(true);
            api.getSheetHistory(currentSheetId)
                .then(data => {
                    setHistory(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching history:', err);
                    setLoading(false);
                });
        }
    }, [isOpen, currentSheetId]);

    const handleCardClick = (sheetId: number) => {
        navigate(`/sheets/${sheetId}`);
        onClose();
    };

    // Calculate stats helper
    const getStats = (html: string) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const checkboxes = doc.querySelectorAll('li[data-type="taskItem"]');
        const total = checkboxes.length;
        const done = doc.querySelectorAll('li[data-type="taskItem"][data-checked="true"]').length;
        return { total, done };
    };

    const handleColorSelect = (color: string) => {
        // Update local state immediately for responsiveness
        // In a real app, we'd want to update the *group* color or the current sheet's color
        // For now, let's assume we update the current sheet's color via the parent callback if provided,
        // or we could add a callback to HistoryStackProps.
        // But wait, HistoryStack is just a viewer. 
        // The user wants to change color "too".
        // Let's add an onColorChange prop to HistoryStack.
        if (onColorChange) {
            onColorChange(color);
        }
    };

    const COLORS = [
        '#d8b4fe', '#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#93c5fd', '#c4b5fd', '#f0abfc', '#cbd5e1'
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="History & Settings"
            footer={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    {/* Settings Area */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666' }}>Color</label>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => handleColorSelect(c)}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        backgroundColor: c,
                                        border: currentColor === c ? '2px solid #444' : '2px solid transparent',
                                        cursor: 'pointer',
                                        transition: 'transform 0.1s'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <button onClick={onClose} style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: '#f5f5f7',
                        color: '#1d1d1f',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}>
                        Close
                    </button>
                </div>
            }
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem 0.5rem',
                minHeight: history.length > 1 ? '300px' : 'auto', // Only enforce height if we have a stack
                maxHeight: '60vh',
                overflowY: 'auto',
                overflowX: 'visible',
                transition: 'min-height 0.3s'
            }}>
                {loading ? (
                    <div style={{ color: '#888', textAlign: 'center' }}>Loading history...</div>
                ) : (
                    history.map((item, index) => {
                        const stats = getStats(item.content);
                        const isCurrent = item.id === currentSheetId;
                        const dateObj = new Date(item.target_date || new Date());
                        const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                        // Stack calculations
                        const zIndex = history.length - index;
                        // Compact Accordion: Overlap significantly, leaving header visible
                        const marginTop = index === 0 ? 0 : '-82px';

                        // Apple-style subtle depth: minimal scaling, natural perspective
                        const scale = 1 - (index * 0.01);

                        // Very subtle opacity for depth (Apple keeps things crisp)
                        const opacity = Math.max(1 - (index * 0.02), 0.92);

                        return (
                            <div
                                key={item.id}
                                onClick={() => handleCardClick(item.id)}
                                style={{
                                    backgroundColor: item.color || '#d8b4fe',
                                    borderRadius: '16px',
                                    padding: '1rem',
                                    color: 'white',
                                    cursor: 'pointer',
                                    // Apple-style shadow: soft, natural depth
                                    boxShadow: `0 ${2 + index * 0.5}px ${12 + index * 2}px rgba(0,0,0,${0.08 + index * 0.015})`,
                                    width: '100%',
                                    maxWidth: '300px',
                                    height: '100px',
                                    zIndex: zIndex,
                                    marginTop: marginTop,
                                    position: 'relative',
                                    // Apple's spring timing: 0.4s with natural deceleration
                                    transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    border: isCurrent ? '2px solid rgba(255,255,255,0.95)' : '1px solid rgba(255,255,255,0.12)',
                                    boxSizing: 'border-box',
                                    transformOrigin: 'center center',
                                    transform: `scale(${scale})`,
                                    opacity: opacity,
                                    willChange: 'transform',
                                    // Apple uses backdrop-filter for depth
                                    backdropFilter: 'blur(0px)'
                                }}
                                onMouseEnter={e => {
                                    // Apple-style: subtle, purposeful motion
                                    e.currentTarget.style.transform = 'translateY(-50px) scale(1.02) translateZ(0)';
                                    e.currentTarget.style.zIndex = '1000';
                                    // Elevated shadow, still natural
                                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                                    e.currentTarget.style.opacity = '1';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = `scale(${scale}) translateZ(0)`;
                                    e.currentTarget.style.zIndex = zIndex.toString();
                                    e.currentTarget.style.boxShadow = `0 ${2 + index * 0.5}px ${12 + index * 2}px rgba(0,0,0,${0.08 + index * 0.015})`;
                                    e.currentTarget.style.opacity = opacity.toString();
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>{formattedDate}</span>
                                    <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{item.title}</span>
                                </div>
                                <div style={{
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    fontWeight: 600
                                }}>
                                    {stats.done}/{stats.total}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </Modal>
    );
};

export default HistoryStack;
