import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Search,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Usuarios', href: '/users', icon: Users, adminOnly: true },
  { name: 'Buscar Footprint', href: '/footprint', icon: Search },
  { name: 'Configuración', href: '/settings', icon: Settings, adminOnly: true },
];

export function Layout({ children }: LayoutProps) {
  const { user, userData, signOut, isAdmin } = useAuth();
  const location = useLocation();

  const filteredNav = navigation.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-stone-900 text-white">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-stone-700">
          <span className="text-2xl">🌽</span>
          <div>
            <h1 className="font-bold text-lg">Esbilla CMP</h1>
            <p className="text-xs text-stone-400">Panel de Control</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-stone-900 font-medium'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
                {isActive && <ChevronRight size={16} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-700">
          <div className="flex items-center gap-3 mb-3">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || ''}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.displayName}</p>
              <p className="text-xs text-stone-400 truncate">{userData?.role}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
