'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { BookOpen, LayoutDashboard, BookMarked, CheckSquare, Heart, LogOut, Settings, Moon, Sun } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['student', 'partner'] },
    { href: '/subjects', label: 'Subjects', icon: BookMarked, roles: ['student', 'partner'] },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare, roles: ['student', 'partner'] },
    { href: '/notes', label: 'Notes', icon: Heart, roles: ['student', 'partner'] },
    { href: '/manage', label: 'Manage', icon: Settings, roles: ['partner'] },
  ];

  const visibleNavItems = navItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center min-w-0">
            <Link href="/dashboard" className="flex items-center min-w-0">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="font-bold text-base sm:text-xl text-gray-900 dark:text-gray-100">
                <span className="hidden min-[400px]:inline">AFK Study Buddy</span>
                <span className="min-[400px]:hidden">Study Buddy</span>
              </span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-manipulation"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
            {user && (
              <>
                <div className="hidden md:block text-sm">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                  <div className="text-gray-500 dark:text-gray-400 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
                {/* Mobile Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="sm:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors touch-manipulation"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex justify-around py-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center px-2 py-2 text-xs font-medium rounded-lg transition-colors min-w-[60px] touch-manipulation ${
                  isActive 
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' 
                    : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
                }`}
              >
                <Icon className={`w-6 h-6 mb-0.5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

