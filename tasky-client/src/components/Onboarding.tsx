import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Login from './Login';

const Onboarding: React.FC = () => {
    // Check if user has already seen onboarding
    const [step, setStep] = useState(() => {
        const hasSeen = localStorage.getItem('tasky_has_seen_onboarding');
        return hasSeen ? 3 : 0; // If seen, jump to step 3 (Login), else start at 0
    });

    const handleNext = () => {
        if (step === steps.length - 1) {
            // User is completing the onboarding flow
            localStorage.setItem('tasky_has_seen_onboarding', 'true');
        }
        setStep(step + 1);
    };

    const steps = [
        {
            title: "Welcome to Tasky",
            description: "The simplest way to organize your tasks and notes.",
            icon: <img src="/src/assets/logo.svg" alt="Tasky Logo" style={{ width: '48px', height: '48px' }} />
        },
        {
            title: "Stay Organized",
            description: "Keep track of your daily to-dos and project ideas in one place.",
            icon: <div style={{ fontSize: '3rem' }}>📝</div>
        },
        {
            title: "Get Started",
            description: "Sign in to sync your tasks across all your devices.",
            icon: <div style={{ fontSize: '3rem' }}>🚀</div>
        }
    ];

    if (step >= steps.length) {
        return <Login />;
    }

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            padding: '2rem',
            textAlign: 'center',
            overflow: 'hidden'
        }}>
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                maxWidth: '400px'
            }}>
                <div style={{
                    marginBottom: '2rem',
                    width: '96px',
                    height: '96px',
                    backgroundColor: '#f5f5f7',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    animation: 'fadeInUp 0.5s ease-out'
                }}>
                    {steps[step].icon}
                </div>

                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#1d1d1f',
                    marginBottom: '1rem',
                    animation: 'fadeInUp 0.5s ease-out 0.1s backwards'
                }}>
                    {steps[step].title}
                </h1>

                <p style={{
                    fontSize: '1.1rem',
                    color: '#86868b',
                    lineHeight: '1.6',
                    marginBottom: '3rem',
                    maxWidth: '300px',
                    animation: 'fadeInUp 0.5s ease-out 0.2s backwards'
                }}>
                    {steps[step].description}
                </p>

                {/* Dots indicator */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '3rem' }}>
                    {steps.map((_, i) => (
                        <div key={i} style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: i === step ? '#1d1d1f' : '#d2d2d7',
                            transition: 'background-color 0.3s'
                        }} />
                    ))}
                </div>
            </div>

            <button
                onClick={handleNext}
                style={{
                    width: '100%',
                    maxWidth: '320px',
                    backgroundColor: '#1d1d1f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '16px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'transform 0.2s'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                {step === steps.length - 1 ? 'Get Started' : 'Next'}
                {step < steps.length - 1 && <ArrowRight size={20} />}
            </button>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Onboarding;
