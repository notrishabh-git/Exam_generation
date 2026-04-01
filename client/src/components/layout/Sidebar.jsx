import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../../store';
import {
  LayoutDashboard, FileText, BookOpen, PlusCircle,
  Database, Settings, ChevronLeft, LogOut,
  GraduationCap, Users, BarChart3, Bell
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  {
    label: 'MAIN',
    items: [
      { path: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/generate',     icon: PlusCircle,      label: 'Generate Paper',  accent: true },
      { path: '/papers',       icon: FileText,        label: 'My Papers' },
      { path: '/question-bank',icon: Database,        label: 'Question Bank' },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { path: '/analytics',    icon: BarChart3,       label: 'Analytics' },
      { path: '/students',     icon: Users,           label: 'Students',        badge: 'Soon' },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { path: '/settings',     icon: Settings,        label: 'Settings' },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const location = useLocation();

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <GraduationCap size={20} />
        </div>
        {!sidebarCollapsed && (
          <div className="logo-text">
            <span className="logo-name">ExamGen</span>
            <span className="logo-tagline">AI Question Studio</span>
          </div>
        )}
        <button className="sidebar-collapse-btn" onClick={toggleSidebar} title={sidebarCollapsed ? 'Expand' : 'Collapse'}>
          <ChevronLeft size={15} />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((group) => (
          <div key={group.label} className="nav-group">
            {!sidebarCollapsed && <span className="nav-group-label">{group.label}</span>}
            {group.items.map(({ path, icon: Icon, label, accent, badge }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''} ${accent ? 'accent' : ''}`
                }
                title={sidebarCollapsed ? label : undefined}
              >
                <span className="nav-item-icon"><Icon size={17} /></span>
                {!sidebarCollapsed && (
                  <>
                    <span className="nav-item-label">{label}</span>
                    {badge && (
                      <span className={`nav-badge ${isNaN(badge) ? 'nav-badge-text' : 'nav-badge-count'}`}>
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.[0]?.toUpperCase() || 'P'}
          </div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <span className="user-name">{user?.name || 'Professor'}</span>
              <span className="user-role">{user?.department || 'Faculty'}</span>
            </div>
          )}
          {!sidebarCollapsed && (
            <button className="logout-btn" onClick={logout} title="Logout">
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
