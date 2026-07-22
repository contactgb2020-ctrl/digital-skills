import { useState, useEffect } from 'react';
import { BookOpen, Award, User, Lock, Play, CheckCircle, TrendingUp, Clock, Star, BarChart3, ShieldCheck, FileCheck } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getPrivateFileUrl } from '../lib/upload';
import DashboardLayout from '../components/DashboardLayout';
import type { Course, Progress, Subscription, Enrollment, Certificate, QuizAttempt } from '../types';
import type { TranslationKey as TKey } from '../i18n/translations';

export default function StudentDashboard() {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const { profile, session } = useAuth();
  const [tab, setTab] = useState<'my' | 'catalog' | 'progress' | 'analytics' | 'certificates' | 'profile'>('my');
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [watchSessions, setWatchSessions] = useState<{ course_id: string; watched_seconds: number }[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      const { data: enrollData } = await supabase.from('enrollments').select('*').eq('user_id', session.user.id);
      if (enrollData) {
        setEnrollments(enrollData as Enrollment[]);
        const courseIds = (enrollData as Enrollment[]).map((e) => e.course_id);
        if (courseIds.length > 0) {
          const { data: courses } = await supabase.from('courses').select('*').in('id', courseIds);
          if (courses) setEnrolledCourses(courses as Course[]);
        }
      }

      const { data: courseData } = await supabase.from('courses').select('*').eq('status', 'published').order('created_at', { ascending: false });
      if (courseData) setAllCourses(courseData as Course[]);

      const { data: progressData } = await supabase.from('progress').select('*').eq('user_id', session.user.id);
      if (progressData) setProgress(progressData as Progress[]);

      const { data: certData } = await supabase.from('certificates').select('*').eq('user_id', session.user.id);
      if (certData) setCertificates(certData as Certificate[]);

      const { data: quizData } = await supabase.from('quiz_attempts').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
      if (quizData) setQuizAttempts(quizData as QuizAttempt[]);

      const { data: watchData } = await supabase.from('watch_sessions').select('course_id, watched_seconds').eq('user_id', session.user.id);
      if (watchData) setWatchSessions(watchData as { course_id: string; watched_seconds: number }[]);

      const { data: subData } = await supabase.from('subscriptions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (subData) setSubscription(subData as Subscription);

      const { data: catData } = await supabase.from('categories').select('id, name').order('name');
      if (catData) setCategories(catData as { id: string; name: string }[]);

      setLoading(false);
    })();
  }, [session]);

  if (!profile) return null;

  const plan = subscription?.plan || 'starter';
  const isPremium = plan === 'premium' || plan === 'enterprise';

  const sidebarItems = [
    { icon: <BookOpen className="w-5 h-5" />, labelKey: 'dashboard.my_courses' as TKey, active: tab === 'my', onClick: () => setTab('my') },
    { icon: <BarChart3 className="w-5 h-5" />, labelKey: 'dashboard.catalog' as TKey, active: tab === 'catalog', onClick: () => setTab('catalog') },
    { icon: <TrendingUp className="w-5 h-5" />, labelKey: 'dashboard.progress' as TKey, active: tab === 'progress', onClick: () => setTab('progress') },
    { icon: <BarChart3 className="w-5 h-5" />, labelKey: 'student.analytics' as TKey, active: tab === 'analytics', onClick: () => setTab('analytics') },
    { icon: <Award className="w-5 h-5" />, labelKey: 'dashboard.certificates' as TKey, active: tab === 'certificates', onClick: () => setTab('certificates') },
    { icon: <User className="w-5 h-5" />, labelKey: 'dashboard.profile' as TKey, active: tab === 'profile', onClick: () => setTab('profile') },
  ];

  return (
    <DashboardLayout title={`${t('dashboard.welcome')}, ${profile.nom || profile.email}`} items={sidebarItems} currentRoute="/dashboard" userRole={profile.role}>
      {subscription?.status === 'trial' && (
        <div className="mb-6 p-4 rounded-xl bg-primary-50 dark:bg-primary-600/20 border border-primary-200 dark:border-primary-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary-500" />
            <span className="text-sm text-secondary-600 dark:text-neutral-100">{t('onboarding.trial')} — {t('student.plan_label')}: {plan}</span>
          </div>
          <button onClick={() => navigate('/pricing')} className="btn-primary text-sm px-4 py-2">{t('dashboard.unlock')}</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-secondary-400 dark:text-neutral-100">{t('common.loading')}</div>
      ) : (
        <>
          {/* My enrolled courses */}
          {tab === 'my' && (
            <div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((course) => {
                  const enroll = enrollments.find((e) => e.course_id === course.id);
                  return (
                    <div key={course.id} className="card overflow-hidden hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate(`/course/${course.id}`)}>
                      <div className="h-40 overflow-hidden">
                        {course.image ? (
                          <img src={course.image} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <span className="text-xs font-medium text-primary-500">{course.category}</span>
                        <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-2 line-clamp-2">{course.title}</h3>
                        {enroll && (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-secondary-400 dark:text-neutral-100">{t('dashboard.progress')}</span>
                              <span className="text-primary-500 font-semibold">{enroll.progress_pct}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-secondary-600">
                              <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${enroll.progress_pct}%` }} />
                            </div>
                          </div>
                        )}
                        <span className="flex items-center gap-1 text-primary-500 font-medium text-sm">
                          <Play className="w-4 h-4" /> {enroll && enroll.progress_pct > 0 ? t('dashboard.continue') : t('dashboard.start')}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {enrolledCourses.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <BookOpen className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                    <p className="text-secondary-400 dark:text-neutral-100 mb-4">{t('dashboard.no_courses')}</p>
                    <button onClick={() => setTab('catalog')} className="btn-primary">{t('dashboard.catalog')}</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Catalog */}
          {tab === 'catalog' && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setActiveCategory('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === 'all' ? 'bg-secondary-600 dark:bg-secondary-800 text-white' : 'bg-white dark:bg-secondary-600 text-secondary-400 dark:text-neutral-100'}`}>
                  {t('courses.all')}
                </button>
                {categories.map((cat) => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === cat.id ? 'bg-secondary-600 dark:bg-secondary-800 text-white' : 'bg-white dark:bg-secondary-600 text-secondary-400 dark:text-neutral-100'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allCourses
                .filter((course) => activeCategory === 'all' || course.category_id === activeCategory)
                .map((course) => {
                const locked = !isPremium && course.level === 'Avancé';
                return (
                  <div key={course.id} className="card overflow-hidden hover:scale-105 transition-transform relative cursor-pointer" onClick={() => !locked && navigate(`/course/${course.id}`)}>
                    {locked && (
                      <div className="absolute inset-0 bg-secondary-600/60 dark:bg-secondary-800/70 z-10 flex flex-col items-center justify-center gap-3">
                        <Lock className="w-10 h-10 text-white" />
                        <button onClick={(e) => { e.stopPropagation(); navigate('/pricing'); }} className="btn-primary text-sm">{t('dashboard.unlock')}</button>
                      </div>
                    )}
                    <div className="h-40 overflow-hidden">
                      {course.image ? (
                        <img src={course.image} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <span className="text-xs font-medium text-primary-500">{course.category}</span>
                      <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-2 line-clamp-2">{course.title}</h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-secondary-400 dark:text-neutral-100">{course.level}</span>
                        <span className="flex items-center gap-1 text-primary-500 font-medium">
                          <Play className="w-4 h-4" /> {t('dashboard.start')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          )}

          {/* Progress */}
          {tab === 'progress' && (
            <div className="space-y-4">
              {enrolledCourses.length === 0 ? (
                <div className="card p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                  <p className="text-secondary-400 dark:text-neutral-100">{t('dashboard.no_courses')}</p>
                </div>
              ) : (
                enrolledCourses.map((course) => {
                  const enroll = enrollments.find((e) => e.course_id === course.id);
                  return (
                    <div key={course.id} className="card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-heading font-semibold text-secondary-600 dark:text-white">{course.title}</h3>
                        <span className="text-primary-500 font-semibold">{enroll?.progress_pct || 0}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-secondary-600">
                        <div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${enroll?.progress_pct || 0}%` }} />
                      </div>
                      <button onClick={() => navigate(`/course/${course.id}`)} className="text-sm text-primary-500 hover:underline mt-3">
                        {t('dashboard.continue')}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Analytics */}
          {tab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatBox icon={<Clock className="w-6 h-6" />} label={t('student.total_learning_time')} value={`${Math.round(watchSessions.reduce((s, w) => s + w.watched_seconds, 0) / 60)}min`} />
                <StatBox icon={<CheckCircle className="w-6 h-6" />} label={t('student.completion_rate')} value={`${enrolledCourses.length > 0 ? Math.round(enrollments.reduce((s, e) => s + e.progress_pct, 0) / enrolledCourses.length) : 0}%`} />
                <StatBox icon={<Award className="w-6 h-6" />} label={t('student.avg_quiz_score')} value={`${quizAttempts.length > 0 ? Math.round(quizAttempts.reduce((s, q) => s + q.score, 0) / quizAttempts.length) : 0}%`} />
                <StatBox icon={<BookOpen className="w-6 h-6" />} label={t('dashboard.my_courses')} value={String(enrolledCourses.length)} />
              </div>

              <div className="card p-6">
                <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4">{t('student.quiz_history')}</h3>
                {quizAttempts.length === 0 ? (
                  <p className="text-sm text-secondary-400 dark:text-neutral-100">—</p>
                ) : (
                  <div className="space-y-2">
                    {quizAttempts.map((qa, i) => (
                      <div key={qa.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-secondary-600">
                        <span className="text-sm text-secondary-600 dark:text-white">{t('student.kyc_label')} #{i + 1}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-primary-500">{qa.score}%</span>
                          {qa.passed ? <CheckCircle className="w-4 h-4 text-success-500" /> : <Lock className="w-4 h-4 text-alert-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Certificates */}
          {tab === 'certificates' && (
            <div>
              {certificates.length === 0 ? (
                <div className="card p-8 text-center">
                  <Award className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
                  <p className="text-secondary-400 dark:text-neutral-100">{t('student.no_certificates')}</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {certificates.map((cert) => {
                    const course = enrolledCourses.find((c) => c.id === cert.course_id);
                    return (
                      <div key={cert.id} className="card p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                          <Award className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-1">{course?.title || t('student.formation')}</h3>
                        <p className="text-xs text-secondary-400 dark:text-neutral-100 mb-2">{t('student.cert_number')} {cert.certificate_number}</p>
                        <p className="text-xs text-secondary-400 dark:text-neutral-100">{new Date(cert.created_at).toLocaleDateString()}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Profile */}
          {tab === 'profile' && (
            <div className="card p-6 max-w-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                  {profile.nom?.charAt(0) || profile.email.charAt(0)}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-secondary-600 dark:text-white">{profile.nom || t('admin.user_default')}</h3>
                  <p className="text-sm text-secondary-400 dark:text-neutral-100">{profile.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400 text-xs font-medium">
                    {profile.role}
                  </span>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center"><span className="text-secondary-400 dark:text-neutral-100">{t('pricing.title')}</span><span className="text-secondary-600 dark:text-white capitalize">{plan}</span></div>
                <div className="flex justify-between items-center"><span className="text-secondary-400 dark:text-neutral-100">{t('student.status')}</span><span className="text-secondary-600 dark:text-white">{subscription?.status || '—'}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary-400 dark:text-neutral-100 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> {t('student.kyc_label')}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${profile.kyc_status === 'approved' ? 'bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400' : profile.kyc_status === 'pending' ? 'bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400' : profile.kyc_status === 'rejected' ? 'bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400' : 'bg-gray-100 dark:bg-secondary-600 text-secondary-400'}`}>
                    {profile.kyc_status || 'unverified'}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-secondary-400 dark:text-neutral-100">{t('dashboard.my_courses')}</span><span className="text-secondary-600 dark:text-white">{enrolledCourses.length}</span></div>
                <div className="flex justify-between"><span className="text-secondary-400 dark:text-neutral-100">{t('dashboard.certificates')}</span><span className="text-secondary-600 dark:text-white">{certificates.length}</span></div>
              </div>
              {profile.document_url && (
                <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-secondary-600 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-primary-500" />
                  <button onClick={async () => { const url = await getPrivateFileUrl('kyc-documents', profile.document_url!); if (url) window.open(url, '_blank'); }} className="text-sm text-primary-500 hover:underline">{t('kyc.document_type')}</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-6">
      <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center text-primary-500 mb-3">{icon}</div>
      <div className="text-2xl font-bold text-secondary-600 dark:text-white">{value}</div>
      <div className="text-sm text-secondary-400 dark:text-neutral-100">{label}</div>
    </div>
  );
}
