import { useState, useEffect } from 'react';
import {
  Flame, Star, Award, BookOpen, Clock, TrendingUp, Target, CheckCircle,
  Play, Lock, BarChart3, Bookmark, Heart, FileText, Download, ChevronRight,
  Layers, GraduationCap, Briefcase, User, Calendar, Zap, Building2,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import type { Course, Enrollment, Certificate, CareerPath, Bookmark as BookmarkType, StudentStats, Portfolio } from '../types';
import type { TranslationKey as TKey } from '../i18n/translations';

type Tab = 'overview' | 'my_paths' | 'explore_paths' | 'certificates' | 'bookmarks' | 'wishlist' | 'portfolio';

interface BookmarkWithRelations extends BookmarkType {
  lesson?: { id: string; title: string };
  course?: { id: string; title: string };
}
interface WishlistWithPath {
  id: string;
  career_path_id: string;
  path?: CareerPath;
}

export default function StudentDashboard() {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const { profile, session } = useAuth();

  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);

  // data
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certCourses, setCertCourses] = useState<Record<string, Course | undefined>>({});
  const [bookmarks, setBookmarks] = useState<BookmarkWithRelations[]>([]);
  const [wishlist, setWishlist] = useState<WishlistWithPath[]>([]);
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const userId = session?.user?.id;

  // Load everything
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);

      // 1. student_stats (create default row if missing)
      let { data: statsData, error: statsErr } = await supabase
        .from('student_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!statsData && !statsErr) {
        const { data: created } = await supabase
          .from('student_stats')
          .insert({
            user_id: userId,
            xp_points: 0,
            streak_days: 0,
            last_activity_date: null,
            total_learning_hours: 0,
            achievements: [],
          })
          .select()
          .single();
        statsData = created;
      }
      if (statsData) setStats(statsData as StudentStats);

      // 2. enrollments + enrolled courses
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false });
      const enrollmentsList = (enrollData as Enrollment[]) || [];
      setEnrollments(enrollmentsList);
      if (enrollmentsList.length > 0) {
        const courseIds = enrollmentsList.map((e) => e.course_id);
        const { data: courses } = await supabase.from('courses').select('*').in('id', courseIds);
        if (courses) setEnrolledCourses(courses as Course[]);
      }

      // 3. certificates + their courses
      const { data: certData } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      const certList = (certData as Certificate[]) || [];
      setCertificates(certList);
      if (certList.length > 0) {
        const certCourseIds = [...new Set(certList.map((c) => c.course_id))];
        const { data: cc } = await supabase.from('courses').select('*').in('id', certCourseIds);
        const map: Record<string, Course | undefined> = {};
        (cc as Course[])?.forEach((c) => (map[c.id] = c));
        setCertCourses(map);
      }

      // 4. bookmarks with lesson + course titles
      const { data: bmData } = await supabase
        .from('bookmarks')
        .select('*, lesson:lessons(id, title), course:courses(id, title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (bmData) setBookmarks(bmData as BookmarkWithRelations[]);

      // 5. wishlist + career paths
      const { data: wishData } = await supabase
        .from('wishlist')
        .select('*, path:career_paths(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      const wishList = (wishData as WishlistWithPath[]) || [];
      setWishlist(wishList);
      setWishlistIds(wishList.map((w) => w.career_path_id));

      // 6. career paths for explore tab
      const { data: pathsData } = await supabase
        .from('career_paths')
        .select('*')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true });
      if (pathsData) setCareerPaths(pathsData as CareerPath[]);

      // 7. portfolio
      const { data: portData } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (portData) setPortfolio(portData as Portfolio);

      setLoading(false);
    })();
  }, [userId]);

  // ---- helpers ----
  const studentName = profile?.nom || profile?.email?.split('@')[0] || '';
  const categories = ['all', ...Array.from(new Set(careerPaths.map((p) => p.category).filter(Boolean)))];

  const toggleWishlist = async (pathId: string) => {
    if (!userId) return;
    if (wishlistIds.includes(pathId)) {
      await supabase.from('wishlist').delete().eq('user_id', userId).eq('career_path_id', pathId);
      setWishlistIds((prev) => prev.filter((id) => id !== pathId));
      setWishlist((prev) => prev.filter((w) => w.career_path_id !== pathId));
    } else {
      const { data } = await supabase
        .from('wishlist')
        .insert({ user_id: userId, career_path_id: pathId })
        .select('*, path:career_paths(*)')
        .single();
      if (data) {
        setWishlistIds((prev) => [...prev, pathId]);
        setWishlist((prev) => [data as WishlistWithPath, ...prev]);
      }
    }
  };

  const removeWishlist = async (pathId: string) => {
    if (!userId) return;
    await supabase.from('wishlist').delete().eq('user_id', userId).eq('career_path_id', pathId);
    setWishlistIds((prev) => prev.filter((id) => id !== pathId));
    setWishlist((prev) => prev.filter((w) => w.career_path_id !== pathId));
  };

  // ---- sidebar ----
  const sidebarItems = [
    { icon: <BarChart3 className="w-5 h-5" />, labelKey: 'student.overview' as TKey, active: tab === 'overview', onClick: () => setTab('overview') },
    { icon: <BookOpen className="w-5 h-5" />, labelKey: 'student.my_paths' as TKey, active: tab === 'my_paths', onClick: () => setTab('my_paths') },
    { icon: <Layers className="w-5 h-5" />, labelKey: 'student.explore_paths' as TKey, active: tab === 'explore_paths', onClick: () => setTab('explore_paths') },
    { icon: <Award className="w-5 h-5" />, labelKey: 'student.certificates' as TKey, active: tab === 'certificates', onClick: () => setTab('certificates') },
    { icon: <Bookmark className="w-5 h-5" />, labelKey: 'student.bookmarks' as TKey, active: tab === 'bookmarks', onClick: () => setTab('bookmarks') },
    { icon: <Heart className="w-5 h-5" />, labelKey: 'student.wishlist' as TKey, active: tab === 'wishlist', onClick: () => setTab('wishlist') },
    { icon: <Briefcase className="w-5 h-5" />, labelKey: 'student.portfolio' as TKey, active: tab === 'portfolio', onClick: () => setTab('portfolio') },
    { icon: <Building2 className="w-5 h-5" />, labelKey: 'nav.employer' as TKey, active: false, onClick: () => navigate('/employer') },
  ];

  if (!profile) return null;

  return (
    <DashboardLayout
      title={`${t('dashboard.welcome')}, ${studentName}`}
      items={sidebarItems}
      currentRoute="/dashboard"
      userRole={profile.role}
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {tab === 'overview' && (
            <OverviewTab
              studentName={studentName}
              stats={stats}
              enrollments={enrollments}
              enrolledCourses={enrolledCourses}
              certificatesCount={certificates.length}
              onContinue={(courseId) => navigate(`/course/${courseId}`)}
              onExplore={() => setTab('explore_paths')}
            />
          )}

          {tab === 'my_paths' && (
            <MyPathsTab
              enrollments={enrollments}
              enrolledCourses={enrolledCourses}
              onContinue={(courseId) => navigate(`/course/${courseId}`)}
              onExplore={() => setTab('explore_paths')}
            />
          )}

          {tab === 'explore_paths' && (
            <ExplorePathsTab
              careerPaths={careerPaths}
              categories={categories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              wishlistIds={wishlistIds}
              toggleWishlist={toggleWishlist}
              onView={(slug) => navigate(`/career-path/${slug}`)}
            />
          )}

          {tab === 'certificates' && (
            <CertificatesTab
              certificates={certificates}
              certCourses={certCourses}
              onDownload={(cert) => navigate(`/certificate/${cert.id}`)}
            />
          )}

          {tab === 'bookmarks' && (
            <BookmarksTab
              bookmarks={bookmarks}
              onOpenCourse={(courseId) => navigate(`/course/${courseId}`)}
            />
          )}

          {tab === 'wishlist' && (
            <WishlistTab
              wishlist={wishlist}
              onView={(slug) => navigate(`/career-path/${slug}`)}
              onRemove={removeWishlist}
            />
          )}

          {tab === 'portfolio' && (
            <PortfolioTab
              portfolio={portfolio}
              userId={userId || ''}
              onViewPublic={(uid) => navigate(`/portfolio/${uid}`)}
              onEdit={() => navigate('/portfolio/edit')}
            />
          )}
        </>
      )}
    </DashboardLayout>
  );
}

/* ============================================================ */
/*  OVERVIEW                                                    */
/* ============================================================ */

interface OverviewProps {
  studentName: string;
  stats: StudentStats | null;
  enrollments: Enrollment[];
  enrolledCourses: Course[];
  certificatesCount: number;
  onContinue: (courseId: string) => void;
  onExplore: () => void;
}

function OverviewTab({
  studentName, stats, enrollments, enrolledCourses, certificatesCount, onContinue, onExplore,
}: OverviewProps) {
  const { t } = useLanguage();
  const streak = stats?.streak_days ?? 0;
  const xp = stats?.xp_points ?? 0;
  const hours = stats?.total_learning_hours ?? 0;
  const achievements = stats?.achievements ?? [];

  // resume learning = enrolled courses with progress > 0, most recent first
  const inProgress = enrollments
    .filter((e) => e.progress_pct > 0 && e.progress_pct < 100)
    .slice(0, 3)
    .map((e) => ({
      enrollment: e,
      course: enrolledCourses.find((c) => c.id === e.course_id),
    }))
    .filter((x) => x.course);

  // upcoming lessons placeholder
  const upcoming = enrolledCourses.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-6 sm:p-8 text-white">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 top-10 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
            {t('dashboard.welcome')}, {studentName} 👋
          </h2>
          <p className="text-white/80 text-sm sm:text-base max-w-md">
            {t('student.resume')} — {inProgress.length > 0 ? `${inProgress.length} ${t('student.my_paths').toLowerCase()}` : t('student.no_paths_desc')}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Flame className="w-6 h-6" />} value={`${streak}`} label={`${t('student.learning_streak')} (${t('student.days')})`} color="primary" />
        <StatCard icon={<Zap className="w-6 h-6" />} value={xp.toLocaleString()} label={t('student.total_xp')} color="accent" />
        <StatCard icon={<Award className="w-6 h-6" />} value={certificatesCount} label={t('student.cert_earned')} color="warning" />
        <StatCard icon={<Clock className="w-6 h-6" />} value={`${hours}h`} label={t('student.hours_learned')} color="success" />
      </div>

      {/* Resume learning */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-secondary-600 dark:text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-primary-500" /> {t('student.resume')}
          </h3>
        </div>
        {inProgress.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary-500" />
            </div>
            <p className="text-secondary-600 dark:text-white font-semibold mb-1">{t('student.no_paths')}</p>
            <p className="text-sm text-slate-500 dark:text-neutral-100 mb-4">{t('student.no_paths_desc')}</p>
            <button onClick={onExplore} className="btn-primary text-sm">{t('student.explore_paths')}</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {inProgress.map(({ enrollment, course }) => (
              <div key={course!.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-28 overflow-hidden">
                  {course!.image ? (
                    <img src={course!.image} alt={course!.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-secondary-600 dark:text-white line-clamp-1 mb-2">{course!.title}</h4>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-neutral-100">{t('dashboard.progress')}</span>
                    <span className="text-primary-500 font-semibold">{enrollment.progress_pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-secondary-600 mb-3">
                    <div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${enrollment.progress_pct}%` }} />
                  </div>
                  <button onClick={() => onContinue(course!.id)} className="btn-primary w-full text-sm py-2">
                    {t('student.continue_learning')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming lessons */}
      <section>
        <h3 className="text-lg font-bold text-secondary-600 dark:text-white flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary-500" /> {t('student.upcoming')}
        </h3>
        {upcoming.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-500 dark:text-neutral-100">
            {t('student.no_paths')}
          </div>
        ) : (
          <div className="card divide-y divide-sage-100 dark:divide-secondary-600">
            {upcoming.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-secondary-600 dark:text-white truncate">{c.title}</p>
                  <p className="text-xs text-slate-500 dark:text-neutral-100">{c.level} · {c.category}</p>
                </div>
                <span className="text-xs text-slate-400 dark:text-neutral-100">Lesson {i + 1}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent achievements */}
      <section>
        <h3 className="text-lg font-bold text-secondary-600 dark:text-white flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-primary-500" /> {t('student.achievements')}
        </h3>
        {achievements.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-500 dark:text-neutral-100">
            {t('student.badges_earned')}: 0
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {achievements.map((a, i) => (
              <div key={i} className="pill-badge flex items-center gap-2 bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400 px-4 py-2">
                <Award className="w-4 h-4" />
                <span className="text-sm font-medium">{a}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ============================================================ */
/*  MY PATHS                                                    */
/* ============================================================ */

interface MyPathsProps {
  enrollments: Enrollment[];
  enrolledCourses: Course[];
  onContinue: (courseId: string) => void;
  onExplore: () => void;
}

function MyPathsTab({ enrollments, enrolledCourses, onContinue, onExplore }: MyPathsProps) {
  const { t } = useLanguage();

  if (enrolledCourses.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-primary-500" />
        </div>
        <p className="text-secondary-600 dark:text-white font-semibold mb-1">{t('student.no_paths')}</p>
        <p className="text-sm text-slate-500 dark:text-neutral-100 mb-4">{t('student.no_paths_desc')}</p>
        <button onClick={onExplore} className="btn-primary">{t('student.explore_paths')}</button>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {enrolledCourses.map((course) => {
        const enroll = enrollments.find((e) => e.course_id === course.id);
        const progress = enroll?.progress_pct ?? 0;
        const completed = progress === 100;
        return (
          <div key={course.id} className="card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="h-40 overflow-hidden relative">
              {course.image ? (
                <img src={course.image} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
              )}
              {completed && (
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-success-500 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="p-5">
              <span className="text-xs font-medium text-primary-500">{course.category}</span>
              <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-2 line-clamp-2">{course.title}</h3>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 dark:text-neutral-100">{t('dashboard.progress')}</span>
                  <span className="text-primary-500 font-semibold">{progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-secondary-600">
                  <div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <button onClick={() => onContinue(course.id)} className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-1">
                <Play className="w-4 h-4" /> {progress > 0 ? t('student.continue_learning') : t('student.start_path')}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================ */
/*  EXPLORE PATHS                                               */
/* ============================================================ */

interface ExploreProps {
  careerPaths: CareerPath[];
  categories: string[];
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  wishlistIds: string[];
  toggleWishlist: (pathId: string) => void;
  onView: (slug: string) => void;
}

function ExplorePathsTab({
  careerPaths, categories, activeCategory, setActiveCategory, wishlistIds, toggleWishlist, onView,
}: ExploreProps) {
  const { t } = useLanguage();
  const filtered = activeCategory === 'all' ? careerPaths : careerPaths.filter((p) => p.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`pill-badge px-4 py-2 text-sm font-medium transition-all capitalize ${
              activeCategory === cat
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-secondary-600 text-secondary-600 dark:text-neutral-100 hover:bg-sage-100 dark:hover:bg-secondary-500'
            }`}
          >
            {cat === 'all' ? t('dashboard.catalog') : cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
            <Layers className="w-10 h-10 text-primary-500" />
          </div>
          <p className="text-secondary-600 dark:text-white font-semibold">{t('student.no_paths')}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((path) => {
            const inWishlist = wishlistIds.includes(path.id);
            return (
              <div key={path.id} className="card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col">
                <div className="h-40 overflow-hidden relative">
                  {path.image ? (
                    <img src={path.image} alt={path.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                      <Briefcase className="w-12 h-12 text-white" />
                    </div>
                  )}
                  {path.is_featured && (
                    <span className="absolute top-3 left-3 pill-badge bg-primary-500 text-white px-2.5 py-1 text-xs flex items-center gap-1">
                      <Star className="w-3 h-3" /> Featured
                    </span>
                  )}
                  <button
                    onClick={() => toggleWishlist(path.id)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-secondary-700/90 flex items-center justify-center hover:scale-110 transition-transform"
                    aria-label="Add to wishlist"
                  >
                    <Heart className={`w-5 h-5 ${inWishlist ? 'fill-primary-500 text-primary-500' : 'text-slate-500 dark:text-neutral-100'}`} />
                  </button>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-xs font-medium text-primary-500 mb-1">{path.category}</span>
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-1 line-clamp-1">{path.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-neutral-100 line-clamp-2 mb-3">{path.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-neutral-100 mb-4">
                    <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {path.level}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {path.duration_weeks}w</span>
                    {path.salary_range && <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {path.salary_range}</span>}
                  </div>
                  <button onClick={() => onView(path.slug)} className="btn-primary w-full text-sm py-2 mt-auto flex items-center justify-center gap-1">
                    {t('student.explore_paths')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/*  CERTIFICATES                                                */
/* ============================================================ */

interface CertificatesProps {
  certificates: Certificate[];
  certCourses: Record<string, Course | undefined>;
  onDownload: (cert: Certificate) => void;
}

function CertificatesTab({ certificates, certCourses, onDownload }: CertificatesProps) {
  const { t } = useLanguage();

  if (certificates.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
          <Award className="w-10 h-10 text-primary-500" />
        </div>
        <p className="text-secondary-600 dark:text-white font-semibold mb-1">{t('student.cert_earned')}</p>
        <p className="text-sm text-slate-500 dark:text-neutral-100">{t('student.no_certificates')}</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {certificates.map((cert) => {
        const course = certCourses[cert.course_id];
        return (
          <div key={cert.id} className="card p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-1 line-clamp-1">
              {course?.title || t('student.formation')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-100 mb-1">
              {t('student.cert_number')} {cert.certificate_number}
            </p>
            <p className="text-xs text-slate-400 dark:text-neutral-100 mb-4">
              {new Date(cert.created_at).toLocaleDateString()}
            </p>
            <button onClick={() => onDownload(cert)} className="btn-outline w-full text-sm py-2 flex items-center justify-center gap-1">
              <Download className="w-4 h-4" /> {t('portfolio.download_cv')}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================ */
/*  BOOKMARKS                                                   */
/* ============================================================ */

interface BookmarksProps {
  bookmarks: BookmarkWithRelations[];
  onOpenCourse: (courseId: string) => void;
}

function BookmarksTab({ bookmarks, onOpenCourse }: BookmarksProps) {
  const { t } = useLanguage();

  if (bookmarks.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
          <Bookmark className="w-10 h-10 text-primary-500" />
        </div>
        <p className="text-secondary-600 dark:text-white font-semibold mb-1">{t('student.bookmarks')}</p>
        <p className="text-sm text-slate-500 dark:text-neutral-100">No bookmarks yet. Save lessons while learning to find them here.</p>
      </div>
    );
  }

  return (
    <div className="card divide-y divide-sage-100 dark:divide-secondary-600">
      {bookmarks.map((bm) => (
        <div key={bm.id} className="flex items-start gap-3 p-4 hover:bg-sage-50 dark:hover:bg-secondary-600/50 transition-colors cursor-pointer" onClick={() => bm.course_id && onOpenCourse(bm.course_id)}>
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center flex-shrink-0">
            <Bookmark className="w-5 h-5 text-primary-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-secondary-600 dark:text-white truncate">
              {bm.lesson?.title || t('student.formation')}
            </p>
            <p className="text-xs text-slate-500 dark:text-neutral-100 truncate">{bm.course?.title}</p>
            {bm.note && <p className="text-sm text-slate-400 dark:text-neutral-100 mt-1 line-clamp-2">{bm.note}</p>}
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-2" />
        </div>
      ))}
    </div>
  );
}

/* ============================================================ */
/*  WISHLIST                                                    */
/* ============================================================ */

interface WishlistProps {
  wishlist: WishlistWithPath[];
  onView: (slug: string) => void;
  onRemove: (pathId: string) => void;
}

function WishlistTab({ wishlist, onView, onRemove }: WishlistProps) {
  const { t } = useLanguage();

  if (wishlist.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
          <Heart className="w-10 h-10 text-primary-500" />
        </div>
        <p className="text-secondary-600 dark:text-white font-semibold mb-1">{t('student.wishlist')}</p>
        <p className="text-sm text-slate-500 dark:text-neutral-100">No wishlisted paths yet. Tap the heart on a career path to save it.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {wishlist.map((w) => {
        const path = w.path;
        if (!path) return null;
        return (
          <div key={w.id} className="card overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
            <div className="h-32 overflow-hidden">
              {path.image ? (
                <img src={path.image} alt={path.title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                  <Briefcase className="w-10 h-10 text-white" />
                </div>
              )}
            </div>
            <div className="p-5 flex flex-col flex-1">
              <span className="text-xs font-medium text-primary-500 mb-1">{path.category}</span>
              <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-3 line-clamp-1">{path.title}</h3>
              <div className="flex gap-2 mt-auto">
                <button onClick={() => onView(path.slug)} className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1">
                  {t('student.explore_paths')} <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRemove(path.id)}
                  className="btn-outline px-3 text-sm py-2 text-alert-500 border-alert-200 hover:bg-alert-50 dark:border-alert-600/40"
                  aria-label="Remove"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================ */
/*  PORTFOLIO                                                   */
/* ============================================================ */

interface PortfolioProps {
  portfolio: Portfolio | null;
  userId: string;
  onViewPublic: (uid: string) => void;
  onEdit: () => void;
}

function PortfolioTab({ portfolio, userId, onViewPublic, onEdit }: PortfolioProps) {
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-secondary-600 dark:text-white">{t('portfolio.title')}</h3>
            <p className="text-sm text-slate-500 dark:text-neutral-100">
              {portfolio ? portfolio.headline || t('portfolio.bio') : t('portfolio.no_projects')}
            </p>
          </div>
        </div>

        {portfolio ? (
          <div className="space-y-4">
            {portfolio.bio && (
              <p className="text-sm text-slate-500 dark:text-neutral-100">{portfolio.bio}</p>
            )}
            {portfolio.skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{t('portfolio.skills')}</p>
                <div className="flex flex-wrap gap-2">
                  {portfolio.skills.map((s, i) => (
                    <span key={i} className="pill-badge bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400 px-3 py-1 text-sm">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-neutral-100">{t('student.status')}:</span>
              <span className={`pill-badge px-3 py-1 text-xs ${portfolio.is_public ? 'bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400' : 'bg-gray-100 dark:bg-secondary-600 text-slate-500'}`}>
                {portfolio.is_public ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-neutral-100">{t('portfolio.no_projects')}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => onViewPublic(userId)} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <User className="w-4 h-4" /> {t('portfolio.view_public')}
        </button>
        <button onClick={onEdit} className="btn-outline flex-1 flex items-center justify-center gap-2">
          <GraduationCap className="w-4 h-4" /> {t('portfolio.edit')}
        </button>
      </div>
    </div>
  );
}

/* ============================================================ */
/*  SHARED COMPONENTS                                           */
/* ============================================================ */

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary-100 dark:bg-primary-600/20', text: 'text-primary-500' },
  success: { bg: 'bg-success-100 dark:bg-success-600/20', text: 'text-success-500' },
  accent: { bg: 'bg-accent-100 dark:bg-accent-600/20', text: 'text-accent-500' },
  warning: { bg: 'bg-warning-100 dark:bg-warning-600/20', text: 'text-warning-500' },
};

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  const c = COLOR_MAP[color] || COLOR_MAP.primary;
  return (
    <div className="card p-5">
      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center ${c.text} mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-secondary-600 dark:text-white">{value}</div>
      <div className="text-sm text-slate-500 dark:text-neutral-100">{label}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-32 rounded-2xl bg-gray-200 dark:bg-secondary-600" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card p-5">
            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-secondary-600 mb-3" />
            <div className="h-6 w-16 bg-gray-200 dark:bg-secondary-600 rounded mb-2" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-secondary-600 rounded" />
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card overflow-hidden">
            <div className="h-32 bg-gray-200 dark:bg-secondary-600" />
            <div className="p-5 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-secondary-600 rounded" />
              <div className="h-2 w-full bg-gray-200 dark:bg-secondary-600 rounded" />
              <div className="h-8 w-full bg-gray-200 dark:bg-secondary-600 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
