import React, { useState } from 'react';
import Modal from './Modal';

interface DateSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: string;
    onDateChange?: (date: string) => void;
    currentColor?: string;
    onColorChange?: (color: string) => void;
}

const COLORS = [
    '#d8b4fe', // Purple (Default)
    '#fca5a5', // Red
    '#fdba74', // Orange
    '#fcd34d', // Yellow
    '#86efac', // Green
    '#93c5fd', // Blue
    '#c4b5fd', // Indigo
    '#f0abfc', // Pink
    '#cbd5e1', // Slate
];

const DateSelectorModal: React.FC<DateSelectorModalProps> = ({
    isOpen,
    onClose,
    currentDate,
    onDateChange,
    currentColor,
    onColorChange
}) => {
    const [selectedDate, setSelectedDate] = useState(currentDate);
    const [selectedColor, setSelectedColor] = useState(currentColor || COLORS[0]);

    const handleSave = () => {
        if (onDateChange) onDateChange(selectedDate);
        if (onColorChange) onColorChange(selectedColor);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Sheet Settings"
            footer={
                <>
                    <button onClick={onClose} style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: '#f5f5f7',
                        color: '#1d1d1f',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}>
                        Cancel
                    </button>
                    <button onClick={handleSave} style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: selectedColor,
                        color: 'white',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}>
                        Save
                    </button>
                </>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Date Picker */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#444' }}>Target Date</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                            padding: '0.75rem',
                            borderRadius: '12px',
                            border: '1px solid #e5e5e5',
                            fontSize: '1rem',
                            width: '100%',
                            boxSizing: 'border-box',
                            outline: 'none'
                        }}
                    />
                </div>

                {/* Color Picker */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#444' }}>Color</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: color,
                                    border: selectedColor === color ? '2px solid #444' : '2px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'transform 0.1s'
                                }}
                                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default DateSelectorModal;
