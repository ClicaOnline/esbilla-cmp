import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n, SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '../i18n';
import {
  LayoutDashboard,
  Users,
  Search,
  Settings,
  LogOut,
  ChevronRight,
  Globe,
  Globe2,
  Link2,
  Building2,
  ClipboardList,
  UserCog
} from 'lucide-react';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

type NavKey = 'dashboard' | 'organizations' | 'sites' | 'users' | 'distributors' | 'footprint' | 'urlStats' | 'waitingList' | 'settings';

const navigation: { key: NavKey; href: string; icon: typeof LayoutDashboard; adminOnly?: boolean; superAdminOnly?: boolean }[] = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard },
  { key: 'organizations', href: '/organizations', icon: Building2, adminOnly: true },
  { key: 'sites', href: '/sites', icon: Globe2, adminOnly: true },
  { key: 'urlStats', href: '/url-stats', icon: Link2 },
  { key: 'users', href: '/users', icon: Users, adminOnly: true },
  { key: 'distributors', href: '/distributors', icon: UserCog, superAdminOnly: true },
  { key: 'footprint', href: '/footprint', icon: Search },
  { key: 'waitingList', href: '/waitlist', icon: ClipboardList, superAdminOnly: true },
  { key: 'settings', href: '/settings', icon: Settings, adminOnly: true },
];

export function Layout({ children }: LayoutProps) {
  const { user, userData, signOut, isAdmin, isSuperAdmin } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const location = useLocation();

  const filteredNav = navigation.filter(item => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        {/* Logo */}
        <div className="sidebar-header">
          <span className="sidebar-logo">🌽</span>
          <div>
            <h1 className="sidebar-title">Esbilla CMP</h1>
            <p className="sidebar-subtitle">{t.nav.controlPanel}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            const name = t.nav[item.key];

            return (
              <Link
                key={item.key}
                to={item.href}
                className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                <Icon size={20} />
                <span>{name}</span>
                {isActive && <ChevronRight size={16} className="nav-arrow" />}
              </Link>
            );
          })}
        </nav>

        {/* Language selector */}
        <div className="sidebar-lang">
          <Globe size={16} />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as typeof language)}
            className="lang-select"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_LABELS[lang]}
              </option>
            ))}
          </select>
        </div>

        {/* User section */}
        <div className="sidebar-user">
          <div className="user-info">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || ''}
                className="user-avatar"
              />
            )}
            <div className="user-details">
              <p className="user-name">{user?.displayName}</p>
              <p className="user-role">{userData?.role}</p>
            </div>
          </div>
          <button onClick={signOut} className="logout-btn">
            <LogOut size={18} />
            <span>{t.nav.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
