import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RouterProvider, useRouter } from './router/Router';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import CoursesPage from './pages/CoursesPage';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import StudentDashboard from './pages/StudentDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CourseDetailPage from './pages/CourseDetailPage';
import { AboutPage, ContactPage, TermsPage, PrivacyPage, FaqPage } from './pages/FooterPages';
import type { Session } from '@supabase/supabase-js';
import type { UserRole } from './types';

function AppRoutes() {
  const { path } = useRouter();
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-light dark:bg-secondary-700">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAuthPage = path === '/login' || path === '/signup';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">{renderPage(path, session, profile?.role)}</div>
      {!isAuthPage && <Footer />}
    </div>
  );
}

function renderPage(path: string, session: Session | null, role: UserRole | undefined) {
  if (path.startsWith('/course/')) {
    const courseId = path.replace('/course/', '');
    return <CourseDetailPage courseId={courseId} />;
  }

  switch (path) {
    case '/':
      return <LandingPage />;
    case '/courses':
      return <CoursesPage />;
    case '/pricing':
      return <PricingPage />;
    case '/about':
      return <AboutPage />;
    case '/contact':
      return <ContactPage />;
    case '/terms':
      return <TermsPage />;
    case '/privacy':
      return <PrivacyPage />;
    case '/faq':
      return <FaqPage />;
    case '/login':
      return session ? <RoleDashboard role={role} /> : <LoginPage />;
    case '/signup':
      return session ? <RoleDashboard role={role} /> : <SignupPage />;
    case '/dashboard':
      return session ? <RoleDashboard role={role} /> : <LoginPage />;
    case '/trainer':
      if (!session) return <LoginPage />;
      if (role !== 'trainer' && role !== 'super_admin') return <RoleDashboard role={role} />;
      return <TrainerDashboard />;
    case '/super-admin':
      if (!session) return <LoginPage />;
      if (role !== 'super_admin') return <RoleDashboard role={role} />;
      return <AdminDashboard />;
    default:
      return <LandingPage />;
  }
}

function RoleDashboard({ role }: { role: UserRole | undefined }) {
  switch (role) {
    case 'trainer':
      return <TrainerDashboard />;
    case 'super_admin':
      return <AdminDashboard />;
    default:
      return <StudentDashboard />;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <RouterProvider>
            <AppRoutes />
          </RouterProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
