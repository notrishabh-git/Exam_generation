import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUIStore, useAuthStore } from '../../store';
import { Search, Bell, Plus, ChevronRight } from 'lucide-react';
import './Header.css';

const PAGE_META = {
  '/dashboard':     { title: 'Dashboard',      subtitle: 'Overview of your exam activity' },
  '/generate':      { title: 'Generate Paper',  subtitle: 'AI-powered question generation' },
  '/papers':        { title: 'My Papers',       subtitle: 'All your saved exam papers' },
  '/question-bank': { title: 'Question Bank',   subtitle: 'Searchable question repository' },
  '/analytics':     { title: 'Analytics',       subtitle: 'Performance insights' },
  '/settings':      { title: 'Settings',        subtitle: 'Account & preferences' },
  '/notifications': { title: 'Notifications',   subtitle: 'Activity & alerts' },
};

export default function Header() {
  const { sidebarCollapsed } = useUIStore();
  const { user } = useAuthStore();
  const location = useLocation();
  const [searchFocused, setSearchFocused] = useState(false);

  const meta = PAGE_META[location.pathname] || { title: 'ExamGen', subtitle: '' };

  return (
    <header className={`app-header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Breadcrumb + title */}
      <div className="header-left">
        <div className="header-breadcrumb">
          <span>ExamGen</span>
          <ChevronRight size={13} />
          <span className="breadcrumb-active">{meta.title}</span>
        </div>
        <h1 className="header-title">{meta.title}</h1>
      </div>

      {/* Search + actions */}
      <div className="header-right">
        <div className={`header-search ${searchFocused ? 'focused' : ''}`}>
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search papers, questions..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <span className="search-kbd"><kbd>⌘K</kbd></span>
        </div>

        <button className="header-icon-btn" aria-label="Notifications">
          <Bell size={17} />
          <span className="header-notif-dot" />
        </button>

        <a href="/generate" className="btn btn-primary btn-sm" style={{ gap: 5 }}>
          <Plus size={14} />
          New Paper
        </a>
      </div>
    </header>
  );
}
