import { useState, useEffect } from 'react';
import { BookOpen, Award, User, Lock, Play, CheckCircle, XCircle, TrendingUp, Clock, Star, BarChart3, ShieldCheck, FileCheck, Target, Flame, Calendar } from 'lucide-react';
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
  const totalWatchMin = Math.round(watchSessions.reduce((s, w) => s + w.watched_seconds, 0) / 60);
  const completionRate = enrolledCourses.length > 0 ? Math.round(enrollments.reduce((s, e) => s + e.progress_pct, 0) / enrolledCourses.length) : 0;
  const avgQuizScore = quizAttempts.length > 0 ? Math.round(quizAttempts.reduce((s, q) => s + q.score, 0) / quizAttempts.length) : 0;
  const completedCourses = enrollments.filter((e) => e.progress_pct === 100).length;

  const sidebarItems = [
    { icon: <BookOpen className="w-5 h-5" />, labelKey: 'dashboard.my_courses' as TKey, active: tab === 'my', onClick: () => setTab('my') },
    { icon: <BarChart3 className="w-5 h-5" />, labelKey: 'dashboard.catalog' as TKey, active: tab === 'catalog', onClick: () => setTab('catalog') },
    { icon: <TrendingUp className="w-5 h-5" />, labelKey: 'dashboard.progress' as TKey, active: tab === 'progress', onClick: () => setTab('progress') },
    { icon: <Target className="w-5 h-5" />, labelKey: 'student.analytics' as TKey, active: tab === 'analytics', onClick: () => setTab('analytics') },
    { icon: <Award className="w-5 h-5" />, labelKey: 'dashboard.certificates' as TKey, active: tab === 'certificates', onClick: () => setTab('certificates') },
    { icon: <User className="w-5 h-5" />, labelKey: 'dashboard.profile' as TKey, active: tab === 'profile', onClick: () => setTab('profile') },
  ];

  return (
    <DashboardLayout title={`${t('dashboard.welcome')}, ${profile.nom || profile.email}`} items={sidebarItems} currentRoute="/dashboard" userRole={profile.role}>
      {/* Trial banner */}
      {subscription?.status === 'trial' && (
        <div className="mb-6 p-4 rounded-xl bg-primary-50 dark:bg-primary-600/20 border border-primary-200 dark:border-primary-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary-500" />
            <span className="text-sm text-secondary-600 dark:text-neutral-100">{t('onboarding.trial')} — {t('student.plan_label')}: {plan}</span>
          </div>
          <button onClick={() => navigate('/pricing')} className="btn-primary text-sm px-4 py-2">{t('dashboard.unlock')}</button>
        </div>
      )}

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <QuickStat icon={<BookOpen className="w-5 h-5" />} label={t('dashboard.my_courses')} value={enrolledCourses.length} color="primary" />
        <QuickStat icon={<Clock className="w-5 h-5" />} label={t('student.total_learning_time')} value={`${totalWatchMin}min`} color="success" />
        <QuickStat icon={<Target className="w-5 h-5" />} label={t('student.completion_rate')} value={`${completionRate}%`} color="accent" />
        <QuickStat icon={<Award className="w-5 h-5" />} label={t('dashboard.certificates')} value={certificates.length} color="warning" />
      </div>

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
                    <div key={course.id} className="card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer" onClick={() => navigate(`/course/${course.id}`)}>
                      <div className="h-40 overflow-hidden relative">
                        {course.image ? (
                          <img src={course.image} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-white" />
                          </div>
                        )}
                        {enroll && enroll.progress_pct === 100 && (
                          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-success-500 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <span className="text-xs font-medium text-primary-500">{course.category}</span>
                        <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-2 line-clamp-2">{course.title}</h3>
                        {enroll && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-secondary-400 dark:text-neutral-100">{t('dashboard.progress')}</span>
                              <span className="text-primary-500 font-semibold">{enroll.progress_pct}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-secondary-600">
                              <div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${enroll.progress_pct}%` }} />
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
                  <div className="col-span-full text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-primary-500" />
                    </div>
                    <p className="text-secondary-600 dark:text-white font-semibold mb-1">{t('dashboard.no_courses')}</p>
                    <p className="text-sm text-secondary-400 dark:text-neutral-100 mb-4">Explorez le catalogue et inscrivez-vous à votre première formation</p>
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
                <button onClick={() => setActiveCategory('all')} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === 'all' ? 'bg-primary-500 text-white shadow-sm' : 'bg-white dark:bg-secondary-600 text-secondary-600 dark:text-neutral-100 hover:bg-gray-50 dark:hover:bg-secondary-500'}`}>
                  {t('courses.all')}
                </button>
                {categories.map((cat) => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat.id ? 'bg-primary-500 text-white shadow-sm' : 'bg-white dark:bg-secondary-600 text-secondary-600 dark:text-neutral-100 hover:bg-gray-50 dark:hover:bg-secondary-500'}`}>
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
                      <div key={course.id} className="card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all relative cursor-pointer" onClick={() => !locked && navigate(`/course/${course.id}`)}>
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
                <div className="card p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-primary-500" />
                  </div>
                  <p className="text-secondary-600 dark:text-white font-semibold mb-1">{t('dashboard.no_courses')}</p>
                  <p className="text-sm text-secondary-400 dark:text-neutral-100">Inscrivez-vous à une formation pour suivre votre progression</p>
                </div>
              ) : (
                <>
                  {/* Overall progress ring */}
                  <div className="card p-6 mb-4">
                    <div className="flex items-center gap-6">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-secondary-600" />
                          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-primary-500 transition-all duration-700" strokeDasharray={`${2 * Math.PI * 42 * completionRate / 100} ${2 * Math.PI * 42}`} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold text-secondary-600 dark:text-white">{completionRate}%</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-secondary-600 dark:text-white mb-1">{t('dashboard.progress')}</h3>
                        <p className="text-sm text-secondary-400 dark:text-neutral-100">{completedCourses} / {enrolledCourses.length} {t('dashboard.completed').toLowerCase()}</p>
                      </div>
                    </div>
                  </div>

                  {enrolledCourses.map((course) => {
                    const enroll = enrollments.find((e) => e.course_id === course.id);
                    return (
                      <div key={course.id} className="card p-5 hover:shadow-md transition-shadow">
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
                  })}
                </>
              )}
            </div>
          )}

          {/* Analytics */}
          {tab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Clock className="w-6 h-6" />} label={t('student.total_learning_time')} value={`${totalWatchMin}min`} color="primary" />
                <StatCard icon={<CheckCircle className="w-6 h-6" />} label={t('student.completion_rate')} value={`${completionRate}%`} color="success" />
                <StatCard icon={<Target className="w-6 h-6" />} label={t('student.avg_quiz_score')} value={`${avgQuizScore}%`} color="accent" />
                <StatCard icon={<Flame className="w-6 h-6" />} label={t('dashboard.my_courses')} value={String(enrolledCourses.length)} color="warning" />
              </div>

              <div className="card p-6">
                <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4">{t('student.quiz_history')}</h3>
                {quizAttempts.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                    <p className="text-sm text-secondary-400 dark:text-neutral-100">Aucun quiz tenté pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {quizAttempts.map((qa, i) => (
                      <div key={qa.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-secondary-600">
                        <span className="text-sm text-secondary-600 dark:text-white">Quiz #{i + 1}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 rounded-full bg-gray-200 dark:bg-secondary-500">
                            <div className={`h-full rounded-full ${qa.passed ? 'bg-success-500' : 'bg-alert-500'}`} style={{ width: `${qa.score}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-primary-500 w-10 text-right">{qa.score}%</span>
                          {qa.passed ? <CheckCircle className="w-4 h-4 text-success-500" /> : <XCircle className="w-4 h-4 text-alert-500" />}
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
                <div className="card p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
                    <Award className="w-10 h-10 text-primary-500" />
                  </div>
                  <p className="text-secondary-600 dark:text-white font-semibold mb-1">{t('student.no_certificates')}</p>
                  <p className="text-sm text-secondary-400 dark:text-neutral-100">Terminez une formation pour obtenir votre certificat</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {certificates.map((cert) => {
                    const course = enrolledCourses.find((c) => c.id === cert.course_id);
                    return (
                      <div key={cert.id} className="card p-6 text-center hover:shadow-lg transition-shadow">
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

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary-100 dark:bg-primary-600/20', text: 'text-primary-500' },
  success: { bg: 'bg-success-100 dark:bg-success-600/20', text: 'text-success-500' },
  accent: { bg: 'bg-accent-100 dark:bg-accent-600/20', text: 'text-accent-500' },
  warning: { bg: 'bg-warning-100 dark:bg-warning-600/20', text: 'text-warning-500' },
};

function QuickStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const c = COLOR_MAP[color] || COLOR_MAP.primary;
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center ${c.text} flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-lg font-bold text-secondary-600 dark:text-white truncate">{value}</div>
        <div className="text-xs text-secondary-400 dark:text-neutral-100 truncate">{label}</div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const c = COLOR_MAP[color] || COLOR_MAP.primary;
  return (
    <div className="card p-6">
      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center ${c.text} mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-secondary-600 dark:text-white">{value}</div>
      <div className="text-sm text-secondary-400 dark:text-neutral-100">{label}</div>
    </div>
  );
}
