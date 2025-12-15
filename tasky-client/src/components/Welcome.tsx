import React from 'react';
import { CheckSquare } from 'lucide-react';

const Welcome: React.FC = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#888',
            gap: '1rem'
        }}>
            <CheckSquare size={64} strokeWidth={1.5} color="#e5e5e5" />
            <div style={{ fontSize: '1.2rem', fontWeight: 500 }}>Select a note to view</div>
        </div>
    );
};

export default Welcome;
