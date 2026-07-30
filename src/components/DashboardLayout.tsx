import { type ReactNode, useState } from 'react';
import { GraduationCap, Shield, LayoutDashboard, LogOut, Menu, X, Home } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import type { TranslationKey } from '../i18n/translations';
import type { UserRole } from '../types';

interface SidebarItem {
  icon: ReactNode;
  labelKey: TranslationKey;
  active?: boolean;
  onClick?: () => void;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  items: SidebarItem[];
  currentRoute: string;
  userRole: UserRole;
}

const ROLE_STYLES: Record<UserRole, { bg: string; text: string; label: string }> = {
  student: { bg: 'bg-primary-100 dark:bg-primary-600/20', text: 'text-primary-600 dark:text-primary-400', label: 'Étudiant' },
  trainer: { bg: 'bg-success-100 dark:bg-success-600/20', text: 'text-success-600 dark:text-success-400', label: 'Formateur' },
  super_admin: { bg: 'bg-alert-100 dark:bg-alert-600/20', text: 'text-alert-600 dark:text-alert-400', label: 'Super Admin' },
};

export default function DashboardLayout({ children, title, items, currentRoute, userRole }: DashboardLayoutProps) {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboards: { route: string; labelKey: TranslationKey; icon: ReactNode; roles: UserRole[] }[] = [
    { route: '/dashboard', labelKey: 'nav.dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['student', 'trainer', 'super_admin'] },
    { route: '/trainer', labelKey: 'trainer.my_courses', icon: <GraduationCap className="w-5 h-5" />, roles: ['trainer', 'super_admin'] },
    { route: '/super-admin', labelKey: 'admin.title', icon: <Shield className="w-5 h-5" />, roles: ['super_admin'] },
  ];

  const accessibleDashboards = dashboards.filter((d) => d.roles.includes(userRole));
  const roleStyle = ROLE_STYLES[userRole];

  const sidebarContent = (
    <>
      {/* User info card */}
      <div className="p-4 border-b border-sage-200 dark:border-secondary-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
            {profile?.nom?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-secondary-600 dark:text-white truncate">{profile?.nom || profile?.email}</p>
            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${roleStyle.bg} ${roleStyle.text}`}>
              {roleStyle.label}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Dashboard switcher */}
        {accessibleDashboards.length > 1 && (
          <>
            <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {t('nav.dashboard')}
            </div>
            {accessibleDashboards.map((dash) => (
              <button
                key={dash.route}
                onClick={() => { navigate(dash.route); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-all ${
                  currentRoute === dash.route
                    ? 'bg-primary-500 text-white'
                    : 'text-slate-500 hover:bg-sage-100 dark:hover:bg-secondary-600'
                }`}
              >
                {dash.icon}
                <span className="text-sm font-medium">{t(dash.labelKey)}</span>
              </button>
            ))}
            <div className="my-2 border-t border-sage-200 dark:border-secondary-500"></div>
          </>
        )}

        {/* Dashboard-specific items */}
        <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {title}
        </div>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => { item.onClick?.(); setMobileOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-all ${
              item.active
                ? 'bg-primary-500 text-white'
                : 'text-slate-500 hover:bg-sage-100 dark:hover:bg-secondary-600'
            }`}
          >
            {item.icon}
            <span className="text-sm font-medium">{t(item.labelKey)}</span>
          </button>
        ))}

        <div className="my-2 border-t border-sage-200 dark:border-secondary-500"></div>

        <button
          onClick={() => { navigate('/'); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left text-slate-500 hover:bg-sage-100 dark:hover:bg-secondary-600 transition-all"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium">{t('nav.home')}</span>
        </button>

        <button
          onClick={() => { signOut(); navigate('/'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left text-alert-500 hover:bg-alert-50 dark:hover:bg-alert-600/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">{t('nav.logout')}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="pt-16 min-h-screen bg-sage-50 dark:bg-secondary-700 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-secondary-800 border-r border-sage-200 dark:border-secondary-500 fixed left-0 top-16 bottom-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setMobileOpen(false)}>
          <aside className="flex flex-col w-72 bg-white dark:bg-secondary-800 border-r border-sage-200 dark:border-secondary-500 h-full animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-sage-200 dark:border-secondary-500">
              <span className="font-heading font-medium text-lg text-secondary-600 dark:text-white">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-[10px] hover:bg-sage-100 dark:hover:bg-secondary-600">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile header bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-secondary-700 border-b border-slate-100 dark:border-secondary-600 sticky top-16 z-20">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-[10px] hover:bg-sage-100 dark:hover:bg-secondary-600">
            <Menu className="w-5 h-5 text-secondary-600 dark:text-white" />
          </button>
          <h1 className="text-base font-medium text-secondary-600 dark:text-white truncate">{title}</h1>
          <div className="w-9"></div>
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <h1 className="hidden md:block text-2xl font-medium text-secondary-600 dark:text-white mb-6 tracking-tight">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
