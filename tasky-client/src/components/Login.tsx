import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';


const Login: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Check if already logged in
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate('/');
            }
        };
        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                navigate('/');
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error logging in:', error);
            alert('Error logging in with Google');
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            padding: '2rem',
            textAlign: 'center'
        }}>
            <div style={{
                marginBottom: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: '#e8f5e9',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img src="/src/assets/logo.svg" alt="Tasky Logo" style={{ width: '32px', height: '32px' }} />
                </div>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#1d1d1f',
                    margin: 0
                }}>
                    Welcome to Tasky
                </h1>
                <p style={{
                    color: '#86868b',
                    fontSize: '1.1rem',
                    maxWidth: '300px',
                    lineHeight: '1.5'
                }}>
                    Organize your life with simple, beautiful tasks and notes.
                </p>
            </div>

            <button
                onClick={handleGoogleLogin}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    backgroundColor: 'white',
                    color: '#3c4043',
                    border: '1px solid #dadce0',
                    borderRadius: '24px',
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s, box-shadow 0.2s',
                    width: '100%',
                    maxWidth: '320px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                }}
            >
                <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google G"
                    style={{ width: '18px', height: '18px' }}
                />
                Sign in with Google
            </button>

            <div style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#86868b' }}>
                By continuing, you agree to our Terms of Service and Privacy Policy.
            </div>
        </div>
    );
};

export default Login;
