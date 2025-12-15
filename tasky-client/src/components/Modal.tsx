import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '24px', // Squircle-ish
                width: '90%',
                maxWidth: '360px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                animation: 'scaleIn 0.2s ease-out',
                display: 'flex',
                flexDirection: 'column',
                padding: '2rem'
            }} onClick={e => e.stopPropagation()}>

                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#111'
                    }}>{title}</h3>
                    <div style={{
                        fontSize: '0.95rem',
                        color: '#666',
                        lineHeight: 1.5
                    }}>
                        {children}
                    </div>
                </div>

                {/* Footer / Buttons */}
                {footer && (
                    <div style={{
                        display: 'flex',
                        gap: '0.75rem'
                    }}>
                        {footer}
                    </div>
                )}
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Modal;
