import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, BarChart3, Users, Clock, CheckCircle, XCircle, X, ChevronDown, ChevronRight, Trash2, Edit3, Star, Send, HelpCircle, Video, FileText, Wallet, DollarSign, TrendingUp, Layers, MessageSquare, Megaphone, Building2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/upload';
import DashboardLayout from '../components/DashboardLayout';
import type { Course, Lesson, Review, Category, TrainerEarning, PayoutRequest } from '../types';
import type { TranslationKey as TKey } from '../i18n/translations';

const LEVELS = ['Débutant', 'Intermédiaire', 'Avancé'];
const LEVEL_KEYS: Record<string, string> = { 'Débutant': 'level.beginner', 'Intermédiaire': 'level.intermediate', 'Avancé': 'level.advanced' };

export default function TrainerDashboard() {
  const { t } = useLanguage();
  const { profile, session } = useAuth();

  if (!profile || profile.role !== 'trainer') {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-alert-100 dark:bg-alert-600/20 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-alert-500" />
          </div>
          <p className="text-secondary-600 dark:text-white font-semibold mb-2">{t('trainer.access_denied')}</p>
          <p className="text-sm text-secondary-400 dark:text-neutral-100">{t('trainer.access_denied_msg')}</p>
        </div>
      </div>
    );
  }

  return <TrainerContent profile={profile} session={session} t={t} />;
}

function TrainerContent({ profile, session, t }: { profile: NonNullable<ReturnType<typeof useAuth>['profile']>; session: ReturnType<typeof useAuth>['session']; t: (k: TKey) => string }) {
  const [tab, setTab] = useState<'courses' | 'create' | 'stats' | 'earnings' | 'messages' | 'announcements'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [earnings, setEarnings] = useState<TrainerEarning[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'mobile_money' | 'bank_transfer'>('mobile_money');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutSubmitted, setPayoutSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courseLessons, setCourseLessons] = useState<Record<string, Lesson[]>>({});
  const [courseEnrollments, setCourseEnrollments] = useState<Record<string, number>>({});
  const [courseReviews, setCourseReviews] = useState<Record<string, Review[]>>({});

  const [formData, setFormData] = useState({
    title: '', description: '', category: '', category_id: '', level: 'Débutant', imageFile: null as File | null, image: '',
  });

  const [lessonForm, setLessonForm] = useState({ courseId: '', title: '', videoFile: null as File | null, duration: 0, order_number: 0 });
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [quizForm, setQuizForm] = useState({ lessonId: '', question: '', answers: '', correct_answer: 0, explanation: '' });
  const [showQuizForm, setShowQuizForm] = useState(false);

  // Analytics overview state
  const [analytics, setAnalytics] = useState({ studentCount: 0, revenue: 0, completionRate: 0, avgRating: 0 });

  // Announcements state
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; content: string; created_at: string }[]>([]);
  const [annForm, setAnnForm] = useState({ title: '', content: '' });
  const [annPosting, setAnnPosting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!session?.user) return;
      const { data: catData } = await supabase.from('categories').select('*').order('name', { ascending: true });
      if (catData) {
        setCategories(catData as Category[]);
        if (catData.length > 0) {
          setFormData((prev) => prev.category ? prev : { ...prev, category: (catData[0] as Category).name, category_id: (catData[0] as Category).id });
        }
      }

      const { data: earnData } = await supabase.from('trainer_earnings').select('*').eq('trainer_id', session.user.id).order('created_at', { ascending: false });
      if (earnData) setEarnings(earnData as TrainerEarning[]);

      const { data: payoutData } = await supabase.from('payout_requests').select('*').eq('trainer_id', session.user.id).order('created_at', { ascending: false });
      if (payoutData) setPayoutRequests(payoutData as PayoutRequest[]);

      const { data } = await supabase.from('courses').select('*').eq('created_by', session.user.id).order('created_at', { ascending: false });
      if (data) {
        setCourses(data as Course[]);
        for (const course of data as Course[]) {
          const { data: lessons } = await supabase.from('lessons').select('*').eq('course_id', course.id).order('order_number', { ascending: true });
          if (lessons) setCourseLessons((prev) => ({ ...prev, [course.id]: lessons as Lesson[] }));

          const { count } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', course.id);
          setCourseEnrollments((prev) => ({ ...prev, [course.id]: count || 0 }));

          const { data: reviews } = await supabase.from('reviews').select('*').eq('course_id', course.id);
          if (reviews) setCourseReviews((prev) => ({ ...prev, [course.id]: reviews as Review[] }));
        }
      }
      setLoading(false);
    })();
  }, [session]);

  // Load analytics overview: enrollment count, earnings sum, avg completion, avg rating
  useEffect(() => {
    (async () => {
      if (!session?.user) return;
      const { data: coursesData } = await supabase.from('courses').select('id').eq('created_by', session.user.id);
      const courseIds = (coursesData || []).map((c) => c.id);
      if (courseIds.length === 0) { setAnalytics({ studentCount: 0, revenue: 0, completionRate: 0, avgRating: 0 }); return; }

      const { count: studentCount } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).in('course_id', courseIds);

      const { data: enrollRows } = await supabase.from('enrollments').select('progress_pct').in('course_id', courseIds);
      const completionRate = enrollRows && enrollRows.length > 0 ? enrollRows.reduce((s, e) => s + Number(e.progress_pct || 0), 0) / enrollRows.length : 0;

      const { data: earnRows } = await supabase.from('trainer_earnings').select('amount_due').eq('trainer_id', session.user.id);
      const revenue = (earnRows || []).reduce((s, e) => s + Number(e.amount_due || 0), 0);

      const { data: reviewRows } = await supabase.from('reviews').select('rating').in('course_id', courseIds);
      const avgRating = reviewRows && reviewRows.length > 0 ? reviewRows.reduce((s, r) => s + Number(r.rating || 0), 0) / reviewRows.length : 0;

      setAnalytics({ studentCount: studentCount || 0, revenue, completionRate, avgRating });
    })();
  }, [session]);

  // Load announcements for this trainer
  useEffect(() => {
    (async () => {
      if (!session?.user) return;
      const { data } = await supabase.from('announcements').select('*').eq('trainer_id', session.user.id).order('created_at', { ascending: false });
      if (data) setAnnouncements(data as { id: string; title: string; content: string; created_at: string }[]);
    })();
  }, [session]);

  const handlePostAnnouncement = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !annForm.title.trim() || !annForm.content.trim()) return;
    setAnnPosting(true);
    const { data } = await supabase.from('announcements').insert({
      trainer_id: session.user.id, title: annForm.title.trim(), content: annForm.content.trim(),
    }).select().single();
    setAnnPosting(false);
    if (data) {
      setAnnouncements([data as { id: string; title: string; content: string; created_at: string }, ...announcements]);
      setAnnForm({ title: '', content: '' });
    }
  }, [session, annForm, announcements]);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;

    let imageUrl = formData.image;
    if (formData.imageFile) {
      setUploading(true);
      const { url, error: upErr } = await uploadFile('course-images', formData.imageFile, session.user.id);
      setUploading(false);
      if (upErr) { alert(upErr); return; }
      imageUrl = url || '';
    }

    if (editingCourse) {
      const { data } = await supabase.from('courses').update({
        title: formData.title, description: formData.description,
        category: formData.category, category_id: formData.category_id, level: formData.level, image: imageUrl,
      }).eq('id', editingCourse.id).select().single();
      if (data) {
        setCourses(courses.map((c) => (c.id === editingCourse.id ? data as Course : c)));
        setEditingCourse(null);
      }
    } else {
      const { data } = await supabase.from('courses').insert({
        title: formData.title, description: formData.description, category: formData.category,
        category_id: formData.category_id || null,
        level: formData.level, image: imageUrl, created_by: session.user.id, status: 'pending_review',
      }).select().single();
      if (data) {
        setCourses([data as Course, ...courses]);
        setCourseLessons({ ...courseLessons, [(data as Course).id]: [] });
      }
    }
    setFormData({ title: '', description: '', category: categories.length > 0 ? categories[0].name : '', category_id: categories.length > 0 ? categories[0].id : '', level: 'Débutant', imageFile: null, image: '' });
    setShowForm(false);
    setTab('courses');
  }, [session, editingCourse, formData, courses, courseLessons, categories]);

  const handleEdit = useCallback((course: Course) => {
    setEditingCourse(course);
    setFormData({ title: course.title, description: course.description, category: course.category, category_id: course.category_id || '', level: course.level, imageFile: null, image: course.image });
    setShowForm(true);
    setTab('create');
  }, []);

  const handleDelete = useCallback(async (courseId: string) => {
    if (!confirm(t('trainer.confirm_delete'))) return;
    await supabase.from('courses').delete().eq('id', courseId);
    setCourses(courses.filter((c) => c.id !== courseId));
  }, [courses, t]);

  const handleSubmitForReview = useCallback(async (courseId: string) => {
    await supabase.from('courses').update({ status: 'pending_review' }).eq('id', courseId);
    setCourses(courses.map((c) => (c.id === courseId ? { ...c, status: 'pending_review' } : c)));
  }, [courses]);

  const handleAddLesson = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;

    let videoUrl = '';
    if (lessonForm.videoFile) {
      setUploading(true);
      const { url, error: upErr } = await uploadFile('course-videos', lessonForm.videoFile, session.user.id);
      setUploading(false);
      if (upErr) { alert(upErr); return; }
      videoUrl = url || '';
    }

    const { data } = await supabase.from('lessons').insert({
      course_id: lessonForm.courseId, title: lessonForm.title, video_url: videoUrl,
      document_url: '', duration: lessonForm.duration, order_number: lessonForm.order_number,
    }).select().single();
    if (data) {
      setCourseLessons({
        ...courseLessons,
        [lessonForm.courseId]: [...(courseLessons[lessonForm.courseId] || []), data as Lesson].sort((a, b) => a.order_number - b.order_number),
      });
      setLessonForm({ courseId: '', title: '', videoFile: null, duration: 0, order_number: 0 });
      setShowLessonForm(false);
    }
  }, [lessonForm, courseLessons, session]);

  const handleDeleteLesson = useCallback(async (lessonId: string, courseId: string) => {
    await supabase.from('lessons').delete().eq('id', lessonId);
    setCourseLessons({
      ...courseLessons,
      [courseId]: (courseLessons[courseId] || []).filter((l) => l.id !== lessonId),
    });
  }, [courseLessons]);

  const handleAddQuiz = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const answers = quizForm.answers.split('\n').filter((a) => a.trim());
    const { data } = await supabase.from('quizzes').insert({
      lesson_id: quizForm.lessonId, question: quizForm.question,
      answers: JSON.stringify(answers), correct_answer: quizForm.correct_answer,
      explanation: quizForm.explanation, passing_score: 70,
    }).select().single();
    if (data) {
      setQuizForm({ lessonId: '', question: '', answers: '', correct_answer: 0, explanation: '' });
      setShowQuizForm(false);
    }
  }, [quizForm]);

  const sidebarItems = [
    { icon: <BookOpen className="w-5 h-5" />, labelKey: 'trainer.my_courses' as TKey, active: tab === 'courses', onClick: () => setTab('courses') },
    { icon: <Plus className="w-5 h-5" />, labelKey: 'trainer.create_course' as TKey, active: tab === 'create', onClick: () => { setTab('create'); if (!editingCourse) setShowForm(true); } },
    { icon: <Wallet className="w-5 h-5" />, labelKey: 'trainer.earnings' as TKey, active: tab === 'earnings', onClick: () => setTab('earnings') },
    { icon: <MessageSquare className="w-5 h-5" />, labelKey: 'trainer.messages' as TKey, active: tab === 'messages', onClick: () => setTab('messages') },
    { icon: <Megaphone className="w-5 h-5" />, labelKey: 'trainer.announcements' as TKey, active: tab === 'announcements', onClick: () => setTab('announcements') },
    { icon: <BarChart3 className="w-5 h-5" />, labelKey: 'trainer.stats' as TKey, active: tab === 'stats', onClick: () => setTab('stats') },
    { icon: <Building2 className="w-5 h-5" />, labelKey: 'nav.employer' as TKey, active: false, onClick: () => { window.location.hash = '/employer'; } },
  ];

  const totalStudents = Object.values(courseEnrollments).reduce((s, n) => s + n, 0);
  const allReviews = Object.values(courseReviews).flat();
  const avgRating = allReviews.length > 0 ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length : 0;
  const publishedCount = courses.filter((c) => c.status === 'published').length;
  const pendingCount = courses.filter((c) => c.status === 'pending_review').length;
  const totalLessons = Object.values(courseLessons).flat().length;
  const totalWatchHours = earnings.reduce((s, e) => s + Number(e.total_watch_hours), 0);
  const pendingPayment = earnings.filter((e) => e.status === 'pending').reduce((s, e) => s + Number(e.amount_due), 0);
  const paidAmount = earnings.filter((e) => e.status === 'paid').reduce((s, e) => s + Number(e.amount_due), 0);
  // Available balance = what the trainer has earned but not yet been paid (pending),
  // minus anything already requested (pending or paid payout requests), so the
  // same earnings can't be withdrawn twice.
  const alreadyRequested = payoutRequests.filter((p) => p.status !== 'rejected').reduce((s, p) => s + Number(p.amount), 0);
  const availableBalance = Math.max(0, pendingPayment - alreadyRequested);

  const handleRequestPayout = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0 || amount > availableBalance || !payoutDetails.trim()) return;
    setPayoutSubmitting(true);
    const { data, error } = await supabase.from('payout_requests').insert({
      trainer_id: session.user.id,
      amount,
      method: payoutMethod,
      account_details: payoutDetails.trim(),
    }).select().single();
    setPayoutSubmitting(false);
    if (!error && data) {
      setPayoutRequests([data as PayoutRequest, ...payoutRequests]);
      setPayoutSubmitted(true);
      setPayoutAmount('');
      setPayoutDetails('');
    }
  }, [session, payoutAmount, payoutMethod, payoutDetails, availableBalance, payoutRequests]);

  return (
    <DashboardLayout title={`${t('dashboard.welcome')}, ${profile.nom}`} items={sidebarItems} currentRoute="/trainer" userRole={profile.role}>
      {/* Free dashboard banner */}
      <div className="mb-6 p-4 rounded-xl bg-success-50 dark:bg-success-600/20 border border-success-200 dark:border-success-600 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-success-500" />
        <span className="text-sm text-success-600 dark:text-success-400">{t('trainer.free_dashboard')}</span>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <QuickStat icon={<BookOpen className="w-5 h-5" />} label={t('trainer.my_courses')} value={courses.length} color="primary" />
        <QuickStat icon={<Users className="w-5 h-5" />} label={t('trainer.total_students')} value={totalStudents} color="success" />
        <QuickStat icon={<Star className="w-5 h-5" />} label={t('trainer.avg_rating')} value={Number(avgRating.toFixed(1))} color="accent" />
        <QuickStat icon={<Wallet className="w-5 h-5" />} label={t('trainer.amount_due')} value={`${pendingPayment.toFixed(2)}`} color="warning" />
      </div>

      {/* Modern analytics overview */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-400 dark:text-neutral-100 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> {t('trainer.analytics')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Users className="w-6 h-6" />} label={t('trainer.student_count')} value={String(analytics.studentCount)} color="primary" />
          <StatCard icon={<DollarSign className="w-6 h-6" />} label={t('trainer.revenue')} value={`${analytics.revenue.toFixed(2)}`} color="success" />
          <StatCard icon={<CheckCircle className="w-6 h-6" />} label={t('trainer.completion_rate')} value={`${analytics.completionRate.toFixed(0)}%`} color="accent" />
          <StatCard icon={<Star className="w-6 h-6" />} label={t('trainer.ratings')} value={analytics.avgRating.toFixed(1)} color="warning" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-secondary-400 dark:text-neutral-100">{t('common.loading')}</div>
      ) : (
        <>
          {/* Courses list with expandable lessons */}
          {tab === 'courses' && (
            <div className="space-y-4">
              {courses.length === 0 && (
                <div className="card p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-primary-500" />
                  </div>
                  <p className="text-secondary-600 dark:text-white font-semibold mb-1">{t('dashboard.no_courses')}</p>
                  <p className="text-sm text-secondary-400 dark:text-neutral-100 mb-4">Créez votre premier cours et partagez votre expertise</p>
                  <button onClick={() => { setTab('create'); setShowForm(true); }} className="btn-primary inline-flex items-center gap-2">
                    <Plus className="w-5 h-5" /> {t('trainer.create_course')}
                  </button>
                </div>
              )}

              {courses.map((course) => {
                const lessons = courseLessons[course.id] || [];
                const enrollCount = courseEnrollments[course.id] || 0;
                const reviews = courseReviews[course.id] || [];
                const rating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
                const isExpanded = expandedCourse === course.id;

                return (
                  <div key={course.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                          {course.image ? (
                            <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-1">{course.title}</h3>
                          <p className="text-sm text-secondary-400 dark:text-neutral-100 line-clamp-2 mb-2">{course.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <StatusBadge status={course.status} t={t} />
                            <span className="text-secondary-400 dark:text-neutral-100 flex items-center gap-1"><Layers className="w-3 h-3" /> {lessons.length} {t('course.lessons').toLowerCase()}</span>
                            <span className="text-secondary-400 dark:text-neutral-100 flex items-center gap-1"><Users className="w-3 h-3" /> {enrollCount} {t('course.students')}</span>
                            {rating > 0 && (
                              <span className="flex items-center gap-1 text-secondary-400 dark:text-neutral-100">
                                <Star className="w-3 h-3 fill-primary-400 text-primary-400" /> {rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => handleEdit(course)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-600 text-secondary-400 transition-colors" title={t('trainer.edit_course')}>
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(course.id)} className="p-2 rounded-lg hover:bg-alert-50 dark:hover:bg-alert-600/20 text-alert-500 transition-colors" title={t('trainer.delete_course')}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setExpandedCourse(isExpanded ? null : course.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-600 text-secondary-400 transition-colors">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-secondary-500 animate-fade-in">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-secondary-600 dark:text-white">{t('trainer.lessons_tab')}</h4>
                            <button onClick={() => { setLessonForm({ ...lessonForm, courseId: course.id, order_number: lessons.length }); setShowLessonForm(true); }} className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1">
                              <Plus className="w-4 h-4" /> {t('trainer.add_lesson')}
                            </button>
                          </div>

                          {lessons.length === 0 ? (
                            <p className="text-sm text-secondary-400 dark:text-neutral-100">{t('trainer.no_lessons')}</p>
                          ) : (
                            <div className="space-y-2">
                              {lessons.map((lesson, i) => (
                                <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-secondary-600">
                                  <span className="text-xs text-secondary-400 w-6">#{i + 1}</span>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm text-secondary-600 dark:text-white font-medium">{lesson.title}</span>
                                    <div className="flex items-center gap-2 text-xs text-secondary-400 mt-0.5">
                                      {lesson.video_url && <Video className="w-3 h-3" />}
                                      {lesson.document_url && <FileText className="w-3 h-3" />}
                                      <span>{lesson.duration}s</span>
                                    </div>
                                  </div>
                                  <button onClick={() => { setQuizForm({ ...quizForm, lessonId: lesson.id }); setShowQuizForm(true); }} className="p-1.5 rounded hover:bg-primary-50 dark:hover:bg-primary-600/20 text-primary-500 transition-colors" title={t('trainer.add_quiz')}>
                                    <HelpCircle className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteLesson(lesson.id, course.id)} className="p-1.5 rounded hover:bg-alert-50 dark:hover:bg-alert-600/20 text-alert-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {course.status === 'rejected' && (
                            <button onClick={() => handleSubmitForReview(course.id)} className="btn-outline mt-3 flex items-center gap-2 text-sm">
                              <Send className="w-4 h-4" /> {t('trainer.submit_for_review')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create/Edit form */}
          {tab === 'create' && showForm && (
            <form onSubmit={handleCreate} className="card p-6 max-w-2xl space-y-4 animate-fade-in">
              <h2 className="text-xl font-bold text-secondary-600 dark:text-white">{editingCourse ? t('trainer.edit_course') : t('trainer.create_course')}</h2>
              <div>
                <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.title')}</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.description')}</label>
                <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.category')}</label>
                  <select value={formData.category_id} onChange={(e) => {
                    const cat = categories.find((c) => c.id === e.target.value);
                    setFormData({ ...formData, category_id: e.target.value, category: cat?.name || '' });
                  }} className="input-field">
                    <option value="">{t('trainer.category_required')}</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.level')}</label>
                  <select value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })} className="input-field">
                    {LEVELS.map((lvl) => <option key={lvl} value={lvl}>{t(LEVEL_KEYS[lvl] as TKey)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.image')}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, imageFile: e.target.files?.[0] || null })}
                  className="input-field file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary-50 file:text-primary-600"
                />
                {formData.imageFile && <p className="text-xs text-success-500 mt-1">{formData.imageFile.name}</p>}
                {formData.image && !formData.imageFile && <p className="text-xs text-secondary-400 mt-1">{formData.image}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={uploading} className="btn-primary disabled:opacity-60">{uploading ? t('auth.loading') : t('trainer.save')}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingCourse(null); setTab('courses'); }} className="btn-outline">{t('trainer.cancel')}</button>
              </div>
            </form>
          )}

          {/* Lesson form modal */}
          {showLessonForm && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowLessonForm(false)}>
              <form onSubmit={handleAddLesson} className="bg-white dark:bg-secondary-700 rounded-2xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-secondary-600 dark:text-white">{t('trainer.add_lesson')}</h2>
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.add_lesson_title')}</label>
                  <input type="text" required value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.video_url')}</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setLessonForm({ ...lessonForm, videoFile: e.target.files?.[0] || null })}
                    className="input-field file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary-50 file:text-primary-600"
                  />
                  {lessonForm.videoFile && <p className="text-xs text-success-500 mt-1">{lessonForm.videoFile.name}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.duration')}</label>
                    <input type="number" min={0} value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 0 })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.order')}</label>
                    <input type="number" min={0} value={lessonForm.order_number} onChange={(e) => setLessonForm({ ...lessonForm, order_number: parseInt(e.target.value) || 0 })} className="input-field" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={uploading} className="btn-primary disabled:opacity-60">{uploading ? t('auth.loading') : t('trainer.save')}</button>
                  <button type="button" onClick={() => setShowLessonForm(false)} className="btn-outline">{t('trainer.cancel')}</button>
                </div>
              </form>
            </div>
          )}

          {/* Quiz form modal */}
          {showQuizForm && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowQuizForm(false)}>
              <form onSubmit={handleAddQuiz} className="bg-white dark:bg-secondary-700 rounded-2xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-secondary-600 dark:text-white">{t('trainer.add_quiz')}</h2>
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.question')}</label>
                  <input type="text" required value={quizForm.question} onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.answers')}</label>
                  <textarea required rows={4} value={quizForm.answers} onChange={(e) => setQuizForm({ ...quizForm, answers: e.target.value })} className="input-field" placeholder={t('trainer.answers_placeholder')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.correct_answer')}</label>
                  <input type="number" min={0} value={quizForm.correct_answer} onChange={(e) => setQuizForm({ ...quizForm, correct_answer: parseInt(e.target.value) || 0 })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.explanation')}</label>
                  <input type="text" value={quizForm.explanation} onChange={(e) => setQuizForm({ ...quizForm, explanation: e.target.value })} className="input-field" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary">{t('trainer.save')}</button>
                  <button type="button" onClick={() => setShowQuizForm(false)} className="btn-outline">{t('trainer.cancel')}</button>
                </div>
              </form>
            </div>
          )}

          {/* Earnings */}
          {tab === 'earnings' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-600/20 border border-primary-200 dark:border-primary-600 flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-primary-500" />
                <span className="text-sm text-secondary-600 dark:text-neutral-100">{t('trainer.commission_rate')}</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-6">
                <StatCard icon={<Clock className="w-6 h-6" />} label={t('trainer.watch_hours')} value={`${totalWatchHours}h`} color="primary" />
                <StatCard icon={<Wallet className="w-6 h-6" />} label={t('trainer.amount_due')} value={`$${pendingPayment.toFixed(2)}`} color="warning" />
                <StatCard icon={<CheckCircle className="w-6 h-6" />} label={t('trainer.amount_paid')} value={`$${paidAmount.toFixed(2)}`} color="success" />
              </div>

              <div className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-secondary-400 dark:text-neutral-100">Solde disponible pour retrait</p>
                  <p className="text-2xl font-bold text-secondary-600 dark:text-white">${availableBalance.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => { setShowPayoutModal(true); setPayoutSubmitted(false); setPayoutAmount(''); setPayoutDetails(''); }}
                  disabled={availableBalance <= 0}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wallet className="w-4 h-4" /> Demander un retrait
                </button>
              </div>

              {payoutRequests.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4">Mes demandes de retrait</h3>
                  <div className="space-y-2">
                    {payoutRequests.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-secondary-600">
                        <div className="text-sm">
                          <span className="text-secondary-600 dark:text-white font-medium">${Number(p.amount).toFixed(2)}</span>
                          <span className="text-xs text-secondary-400 dark:text-neutral-100 ml-2">{p.method === 'mobile_money' ? 'Mobile Money' : 'Virement bancaire'} — {new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'paid' ? 'bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400' : p.status === 'rejected' ? 'bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400' : 'bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400'}`}>
                          {p.status === 'paid' ? 'Payé' : p.status === 'rejected' ? 'Rejeté' : 'En attente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card p-6">
                <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4">{t('trainer.earnings_history')}</h3>
                {earnings.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                    <p className="text-sm text-secondary-400 dark:text-neutral-100">{t('trainer.no_earnings')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {earnings.map((e) => (
                      <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-secondary-600">
                        <div className="text-sm">
                          <span className="text-secondary-600 dark:text-white">{e.period_start} → {e.period_end}</span>
                          <span className="text-xs text-secondary-400 dark:text-neutral-100 ml-2">{e.total_watch_hours}h</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-primary-500">${Number(e.amount_due).toFixed(2)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${e.status === 'paid' ? 'bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400' : 'bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400'}`}>
                            {e.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          {tab === 'stats' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<BookOpen className="w-6 h-6" />} label={t('trainer.my_courses')} value={String(courses.length)} color="primary" />
                <StatCard icon={<Users className="w-6 h-6" />} label={t('trainer.total_students')} value={String(totalStudents)} color="success" />
                <StatCard icon={<CheckCircle className="w-6 h-6" />} label={t('trainer.published')} value={String(publishedCount)} color="accent" />
                <StatCard icon={<Star className="w-6 h-6" />} label={t('trainer.avg_rating')} value={avgRating.toFixed(1)} color="warning" />
              </div>

              <div className="grid sm:grid-cols-3 gap-6">
                <StatCard icon={<Layers className="w-6 h-6" />} label={t('course.lessons')} value={String(totalLessons)} color="primary" />
                <StatCard icon={<TrendingUp className="w-6 h-6" />} label={t('trainer.pending')} value={String(pendingCount)} color="warning" />
                <StatCard icon={<Clock className="w-6 h-6" />} label={t('trainer.watch_hours')} value={`${totalWatchHours}h`} color="success" />
              </div>

              <div className="card p-6">
                <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4">{t('trainer.my_courses')}</h3>
                <div className="space-y-3">
                  {courses.map((course) => {
                    const enrollCount = courseEnrollments[course.id] || 0;
                    const reviews = courseReviews[course.id] || [];
                    const rating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
                    return (
                      <div key={course.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-secondary-600">
                        <span className="text-sm font-medium text-secondary-600 dark:text-white truncate">{course.title}</span>
                        <div className="flex items-center gap-4 text-xs text-secondary-400 dark:text-neutral-100">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {enrollCount}</span>
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-primary-400 text-primary-400" /> {rating.toFixed(1)}</span>
                          <StatusBadge status={course.status} t={t} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {tab === 'messages' && (
            <div className="card p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-primary-500" />
              </div>
              <p className="text-secondary-600 dark:text-white font-semibold mb-1">{t('trainer.messages')}</p>
              <p className="text-sm text-secondary-400 dark:text-neutral-100">No messages</p>
            </div>
          )}

          {/* Announcements */}
          {tab === 'announcements' && (
            <div className="space-y-6">
              <form onSubmit={handlePostAnnouncement} className="card p-6 max-w-2xl space-y-4 animate-fade-in">
                <h2 className="text-xl font-bold text-secondary-600 dark:text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5" /> {t('trainer.announcements')}
                </h2>
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.title')}</label>
                  <input type="text" required value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.description')}</label>
                  <textarea required rows={4} value={annForm.content} onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })} className="input-field" />
                </div>
                <button type="submit" disabled={annPosting} className="btn-primary disabled:opacity-60 flex items-center gap-2">
                  <Send className="w-4 h-4" /> {t('trainer.save')}
                </button>
              </form>

              <div className="card p-6">
                <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4">{t('trainer.announcements')}</h3>
                {announcements.length === 0 ? (
                  <div className="text-center py-8">
                    <Megaphone className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                    <p className="text-sm text-secondary-400 dark:text-neutral-100">No announcements</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((a) => (
                      <div key={a.id} className="p-4 rounded-lg bg-gray-50 dark:bg-secondary-600">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-secondary-600 dark:text-white">{a.title}</h4>
                          <span className="text-xs text-secondary-400 dark:text-neutral-100">{new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-secondary-400 dark:text-neutral-100 whitespace-pre-wrap">{a.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowPayoutModal(false)}>
          <div className="card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-secondary-600 dark:text-white">Demander un retrait</h3>
              <button onClick={() => setShowPayoutModal(false)} className="text-secondary-400 hover:text-secondary-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {payoutSubmitted ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-success-100 dark:bg-success-600/20 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-success-500" />
                </div>
                <p className="font-semibold text-secondary-600 dark:text-white mb-1">Demande envoyée</p>
                <p className="text-sm text-secondary-400 dark:text-neutral-100 mb-4">
                  Notre équipe traite votre demande manuellement et vous contactera pour le versement.
                </p>
                <button onClick={() => setShowPayoutModal(false)} className="btn-primary w-full">Fermer</button>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                <p className="text-sm text-secondary-400 dark:text-neutral-100">
                  Solde disponible : <span className="font-semibold text-secondary-600 dark:text-white">${availableBalance.toFixed(2)}</span>
                </p>

                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">Montant à retirer ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={availableBalance}
                    step="0.01"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">Méthode</label>
                  <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value as 'mobile_money' | 'bank_transfer')} className="input-field">
                    <option value="mobile_money">Mobile Money (Orange, MTN, Wave)</option>
                    <option value="bank_transfer">Virement bancaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">
                    {payoutMethod === 'mobile_money' ? 'Numéro Mobile Money' : 'IBAN / coordonnées bancaires'}
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={payoutDetails}
                    onChange={(e) => setPayoutDetails(e.target.value)}
                    placeholder={payoutMethod === 'mobile_money' ? 'Ex: +225 07 00 00 00 00' : 'Nom de la banque, IBAN, titulaire du compte'}
                    className="input-field"
                  />
                </div>

                <button
                  type="submit"
                  disabled={payoutSubmitting || availableBalance <= 0}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {payoutSubmitting ? 'Envoi...' : 'Envoyer la demande'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatusBadge({ status, t }: { status: string; t: (k: TKey) => string }) {
  const styles: Record<string, string> = {
    published: 'bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400',
    pending_review: 'bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400',
    rejected: 'bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400',
    draft: 'bg-gray-100 dark:bg-secondary-600 text-secondary-400',
  };
  const labels: Record<string, TKey> = {
    published: 'trainer.published',
    pending_review: 'trainer.pending',
    rejected: 'trainer.rejected',
    draft: 'trainer.draft',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending_review}`}>
      {t(labels[status] || 'trainer.pending')}
    </span>
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
