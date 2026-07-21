import { type ReactNode } from 'react';
import { BookOpen, GraduationCap, Shield, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useRouter } from '../router/Router';
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

export default function DashboardLayout({ children, title, items, currentRoute, userRole }: DashboardLayoutProps) {
  const { t } = useLanguage();
  const { navigate } = useRouter();

  // Role-based dashboard navigation: show all dashboards the user can access
  const dashboards: { route: string; labelKey: TranslationKey; icon: ReactNode; roles: UserRole[] }[] = [
    { route: '/dashboard', labelKey: 'nav.dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['student', 'trainer', 'super_admin'] },
    { route: '/trainer', labelKey: 'trainer.my_courses', icon: <GraduationCap className="w-5 h-5" />, roles: ['trainer', 'super_admin'] },
    { route: '/super-admin', labelKey: 'admin.title', icon: <Shield className="w-5 h-5" />, roles: ['super_admin'] },
  ];

  const accessibleDashboards = dashboards.filter((d) => d.roles.includes(userRole));

  return (
    <div className="pt-16 min-h-screen bg-neutral-light dark:bg-secondary-700 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-secondary-600 dark:bg-secondary-800 text-white fixed left-0 top-16 bottom-0 overflow-y-auto">
        <div className="p-4 space-y-1">
          {/* Dashboard switcher */}
          {accessibleDashboards.length > 1 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-secondary-300">
                {t('nav.dashboard')}
              </div>
              {accessibleDashboards.map((dash) => (
                <button
                  key={dash.route}
                  onClick={() => navigate(dash.route)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentRoute === dash.route
                      ? 'bg-primary-500 text-white'
                      : 'text-secondary-200 hover:bg-secondary-500 dark:hover:bg-secondary-600'
                  }`}
                >
                  {dash.icon}
                  <span className="text-sm font-medium">{t(dash.labelKey)}</span>
                </button>
              ))}
              <div className="my-2 border-t border-secondary-500"></div>
            </>
          )}

          {/* Dashboard-specific items */}
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-secondary-300">
            {title}
          </div>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                item.active
                  ? 'bg-primary-500 text-white'
                  : 'text-secondary-200 hover:bg-secondary-500 dark:hover:bg-secondary-600'
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{t(item.labelKey)}</span>
            </button>
          ))}

          {/* Home link */}
          <div className="my-2 border-t border-secondary-500"></div>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-secondary-200 hover:bg-secondary-500 dark:hover:bg-secondary-600 transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-sm font-medium">{t('nav.home')}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-4 sm:p-8">
        <h1 className="text-2xl font-bold text-secondary-600 dark:text-white mb-6">{title}</h1>
        {children}
      </main>
    </div>
  );
}
