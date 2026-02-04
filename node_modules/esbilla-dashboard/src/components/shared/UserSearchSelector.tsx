import { useState, useRef, useEffect } from 'react';
import { Search, User as UserIcon } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import type { DashboardUser } from '../../types';

interface UserSearchSelectorProps {
  users: DashboardUser[];
  onSelect: (user: DashboardUser) => void;
  excludeUserIds?: string[];
  placeholder?: string;
  className?: string;
}

export function UserSearchSelector({
  users,
  onSelect,
  excludeUserIds = [],
  placeholder = 'Buscar usuario por email...',
  className = ''
}: UserSearchSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter users based on search term and exclusions
  const filteredUsers = users.filter(user => {
    // Exclude users in the exclusion list
    if (excludeUserIds.includes(user.id)) return false;

    // If no search term, don't show any results
    if (!debouncedSearchTerm.trim()) return false;

    // Search in email and displayName
    const searchLower = debouncedSearchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.displayName?.toLowerCase().includes(searchLower)
    );
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show dropdown when there are results
  useEffect(() => {
    setShowDropdown(filteredUsers.length > 0 && searchTerm.trim() !== '');
  }, [filteredUsers.length, searchTerm]);

  function handleSelect(user: DashboardUser) {
    onSelect(user);
    setSearchTerm('');
    setShowDropdown(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search size={18} className="text-stone-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (filteredUsers.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Dropdown with results */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {filteredUsers.slice(0, 5).map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-amber-50 transition-colors text-left"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
                  <UserIcon size={20} className="text-stone-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">
                  {user.displayName || user.email}
                </p>
                <p className="text-xs text-stone-500 truncate">{user.email}</p>
                {user.globalRole === 'superadmin' && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                    Superadmin
                  </span>
                )}
              </div>
            </button>
          ))}

          {filteredUsers.length === 0 && debouncedSearchTerm.trim() !== '' && (
            <div className="px-4 py-8 text-center text-stone-500 text-sm">
              No se encontraron usuarios
            </div>
          )}
        </div>
      )}
    </div>
  );
}
