import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, createContext, useContext } from 'react';
import { type Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import './index.css';

import Layout from './components/Layout';
import { LayoutProvider } from './context/LayoutContext';
import Welcome from './components/Welcome';
import SheetView from './components/SheetView';
import DailyView from './components/DailyView';
import Onboarding from './components/Onboarding';

// --- Auth Context ---
interface AuthContextType {
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ session: null, loading: true });

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    }).catch((err) => {
      // If it fails (e.g. invalid URL), we just assume no session
      console.warn('Supabase session check failed:', err);
      setSession(null);
    }).finally(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Also ensure loading is false when state changes (e.g. after sign in)
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Protected Route Wrapper ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Onboarding />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <LayoutProvider>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Welcome />} />
                    <Route path="/sheets/:id" element={<SheetView />} />
                    <Route path="/daily/:date" element={<DailyView />} />
                  </Routes>
                </Layout>
              </LayoutProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
