
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';
import { FileExplorer } from './components/FileExplorer';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/ThemeToggle';
import NotFound from './pages/NotFound';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Public route that redirects authenticated users away
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={
              <PublicRoute>
                <Auth />
              </PublicRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <FileExplorer />
                </Layout>
              </ProtectedRoute>
            } />
            {/* Add a specific 404 route */}
            <Route path="/404" element={<NotFound />} />
            {/* Catch all unmatched routes and show the 404 page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
