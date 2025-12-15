import React, { useState } from 'react';
import HistoryStack from './HistoryStack';

interface DailyPillProps {
    date: string;
    stats: { total: number; done: number };
    color: string;
    onChangeColor: (color: string) => void;
    sheetId: number; // Need this for history
}

const DailyPill: React.FC<DailyPillProps> = ({ date, stats, color, onChangeColor, sheetId }) => {
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Format date: "Tue/ 11/ 25"
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const month = dateObj.toLocaleDateString('en-US', { month: '2-digit' });
    const day = dateObj.toLocaleDateString('en-US', { day: '2-digit' });
    const formattedDate = `${dayName}/ ${month}/ ${day}`;

    return (
        <>
            <div
                onClick={() => setIsHistoryOpen(true)}
                style={{
                    backgroundColor: color,
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '12px 12px 0 0', // Rounded top, square bottom
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'transform 0.1s',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <span>{formattedDate}</span>
                <span style={{ opacity: 0.9 }}>{stats.done}/{stats.total}</span>
            </div>

            <HistoryStack
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                currentSheetId={sheetId}
                currentColor={color}
                onColorChange={onChangeColor}
            />
        </>
    );
};

export default DailyPill;
