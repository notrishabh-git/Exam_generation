import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';

import Dashboard    from './pages/Dashboard';
import Generate     from './pages/Generate';
import Papers       from './pages/Papers';
import QuestionBank from './pages/QuestionBank';
import Analytics    from './pages/Analytics';
import Settings     from './pages/Settings';
import { Login, Register } from './pages/Auth';

import './styles/globals.css';
import './styles/components.css';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a2234',
            color: '#e8edf5',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            fontSize: '13.5px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1a2234' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1a2234' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<PublicRoute><Login/></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register/></PublicRoute>} />

        {/* Protected */}
        <Route path="/dashboard"     element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
        <Route path="/generate"      element={<ProtectedRoute><Generate/></ProtectedRoute>} />
        <Route path="/papers"        element={<ProtectedRoute><Papers/></ProtectedRoute>} />
        <Route path="/question-bank" element={<ProtectedRoute><QuestionBank/></ProtectedRoute>} />
        <Route path="/analytics"     element={<ProtectedRoute><Analytics/></ProtectedRoute>} />
        <Route path="/settings"      element={<ProtectedRoute><Settings/></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
