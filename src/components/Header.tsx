import { useState } from 'react';
import { Globe, Sun, Moon, Menu, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import type { TranslationKey } from '../i18n/translations';

export default function Header() {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { path, navigate } = useRouter();
  const { session, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { label: TranslationKey; to: string }[] = [
    { label: 'nav.home', to: '/' },
    { label: 'nav.courses', to: '/career-paths' },
    { label: 'nav.pricing', to: '/pricing' },
  ];

  const handleNav = (to: string) => {
    navigate(to);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMobileOpen(false);
  };

  const getDashboardPath = (role: string): string => {
    if (role === 'super_admin') return '/super-admin';
    if (role === 'trainer') return '/trainer';
    return '/dashboard';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 dark:bg-secondary-700/85 backdrop-blur-lg border-b border-slate-100 dark:border-secondary-500 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => handleNav('/')} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-[10px] bg-primary-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white font-heading font-extrabold text-lg">D</span>
            </div>
            <span className="font-heading font-extrabold text-lg text-secondary-600 dark:text-white hidden sm:block tracking-tight">
              Digital <span className="text-primary-500">Skills</span>
            </span>
          </button>

          {/* Desktop Nav — centered */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <button
                key={item.to}
                onClick={() => handleNav(item.to)}
                className={`nav-link text-sm ${path === item.to ? 'text-primary-500' : ''}`}
              >
                {t(item.label)}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language selector */}
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="flex items-center gap-1 px-2 py-2 rounded-[10px] hover:bg-slate-50 dark:hover:bg-secondary-600 transition-colors"
              aria-label="Change language"
            >
              <Globe className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-medium text-slate-500 uppercase">
                {lang}
              </span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-[10px] hover:bg-slate-50 dark:hover:bg-secondary-600 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-slate-500" />
              ) : (
                <Sun className="w-5 h-5 text-primary-400" />
              )}
            </button>

            {/* Auth buttons */}
            {session && profile ? (
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => handleNav(getDashboardPath(profile.role))}
                  className="btn-primary text-sm px-4 py-2"
                >
                  {t('nav.dashboard')}
                </button>
                <button
                  onClick={handleSignOut}
                  className="nav-link text-sm"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <button onClick={() => handleNav('/login')} className="nav-link text-sm">
                  {t('nav.login')}
                </button>
                <button onClick={() => handleNav('/signup')} className="btn-primary text-sm px-4 py-2">
                  {t('nav.signup')}
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-[10px] hover:bg-slate-50 dark:hover:bg-secondary-600 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? (
                <X className="w-6 h-6 text-secondary-600 dark:text-white" />
              ) : (
                <Menu className="w-6 h-6 text-secondary-600 dark:text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 dark:border-secondary-500 animate-fade-in-down">
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <button
                  key={item.to}
                  onClick={() => handleNav(item.to)}
                  className="nav-link text-left py-2"
                >
                  {t(item.label)}
                </button>
              ))}
              {session && profile ? (
                <>
                  <button
                    onClick={() => handleNav(getDashboardPath(profile.role))}
                    className="nav-link text-left py-2"
                  >
                    {t('nav.dashboard')}
                  </button>
                  <button onClick={handleSignOut} className="nav-link text-left py-2">
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleNav('/login')} className="nav-link text-left py-2">
                    {t('nav.login')}
                  </button>
                  <button onClick={() => handleNav('/signup')} className="btn-primary text-sm w-fit">
                    {t('nav.signup')}
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
