import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useUIStore } from '../../store';
import './AppLayout.css';

export default function AppLayout({ children }) {
  const { sidebarCollapsed } = useUIStore();
  return (
    <div className="app-layout">
      <Sidebar />
      <div className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header />
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}
