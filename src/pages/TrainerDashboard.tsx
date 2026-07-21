import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, BarChart3, Users, Clock, CheckCircle, XCircle, ChevronDown, ChevronRight, Trash2, Edit3, Star, Eye, Send, HelpCircle, Video, FileText } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import type { Course, Lesson, Quiz, Enrollment, Review } from '../types';
import type { TranslationKey as TKey } from '../i18n/translations';

const CATEGORIES = [
  'Développement web & mobile',
  'Marketing digital',
  'Data & IA',
  'Design graphique',
  'Bureautique & productivité',
  'Beauté & Style',
];
const LEVELS = ['Débutant', 'Intermédiaire', 'Avancé'];

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
          <p className="text-secondary-600 dark:text-white font-semibold mb-2">Accès refusé</p>
          <p className="text-sm text-secondary-400 dark:text-neutral-100">Votre compte n'a pas le rôle formateur. Contactez l'administrateur.</p>
        </div>
      </div>
    );
  }

  return <TrainerContent profile={profile} session={session} t={t} />;
}

function TrainerContent({ profile, session, t }: { profile: NonNullable<ReturnType<typeof useAuth>['profile']>; session: ReturnType<typeof useAuth>['session']; t: (k: TKey) => string }) {
  const [tab, setTab] = useState<'courses' | 'create' | 'stats'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courseLessons, setCourseLessons] = useState<Record<string, Lesson[]>>({});
  const [courseEnrollments, setCourseEnrollments] = useState<Record<string, number>>({});
  const [courseReviews, setCourseReviews] = useState<Record<string, Review[]>>({});

  const [formData, setFormData] = useState({
    title: '', description: '', category: CATEGORIES[0], level: 'Débutant', image: '',
  });

  const [lessonForm, setLessonForm] = useState({ courseId: '', title: '', video_url: '', document_url: '', duration: 0, order_number: 0 });
  const [showLessonForm, setShowLessonForm] = useState(false);

  const [quizForm, setQuizForm] = useState({ lessonId: '', question: '', answers: '', correct_answer: 0, explanation: '' });
  const [showQuizForm, setShowQuizForm] = useState(false);

  const loadCourses = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase.from('courses').select('*').eq('created_by', session.user.id).order('created_at', { ascending: false });
    if (data) {
      setCourses(data as Course[]);
      // Load lessons, enrollments, reviews for each course
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
  }, [session]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    if (editingCourse) {
      const { data } = await supabase.from('courses').update({
        title: formData.title, description: formData.description,
        category: formData.category, level: formData.level, image: formData.image,
      }).eq('id', editingCourse.id).select().single();
      if (data) {
        setCourses(courses.map((c) => (c.id === editingCourse.id ? data as Course : c)));
        setEditingCourse(null);
      }
    } else {
      const { data } = await supabase.from('courses').insert({
        title: formData.title, description: formData.description, category: formData.category,
        level: formData.level, image: formData.image, created_by: session.user.id, status: 'pending_review',
      }).select().single();
      if (data) {
        setCourses([data as Course, ...courses]);
        setCourseLessons({ ...courseLessons, [(data as Course).id]: [] });
      }
    }
    setFormData({ title: '', description: '', category: CATEGORIES[0], level: 'Débutant', image: '' });
    setShowForm(false);
    setTab('courses');
  }, [session, editingCourse, formData, courses, courseLessons]);

  const handleEdit = useCallback((course: Course) => {
    setEditingCourse(course);
    setFormData({ title: course.title, description: course.description, category: course.category, level: course.level, image: course.image });
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
    const { data } = await supabase.from('lessons').insert({
      course_id: lessonForm.courseId, title: lessonForm.title, video_url: lessonForm.video_url,
      document_url: lessonForm.document_url, duration: lessonForm.duration, order_number: lessonForm.order_number,
    }).select().single();
    if (data) {
      setCourseLessons({
        ...courseLessons,
        [lessonForm.courseId]: [...(courseLessons[lessonForm.courseId] || []), data as Lesson].sort((a, b) => a.order_number - b.order_number),
      });
      setLessonForm({ courseId: '', title: '', video_url: '', document_url: '', duration: 0, order_number: 0 });
      setShowLessonForm(false);
    }
  }, [lessonForm, courseLessons]);

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
    { icon: <BarChart3 className="w-5 h-5" />, labelKey: 'trainer.stats' as TKey, active: tab === 'stats', onClick: () => setTab('stats') },
  ];

  const totalStudents = Object.values(courseEnrollments).reduce((s, n) => s + n, 0);
  const allReviews = Object.values(courseReviews).flat();
  const avgRating = allReviews.length > 0 ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length : 0;

  return (
    <DashboardLayout title={`${t('dashboard.welcome')}, ${profile.nom}`} items={sidebarItems} currentRoute="/trainer" userRole={profile.role}>
      {loading ? (
        <div className="text-center py-12 text-secondary-400 dark:text-neutral-100">{t('common.loading')}</div>
      ) : (
        <>
          {/* Courses list with expandable lessons */}
          {tab === 'courses' && (
            <div className="space-y-4">
              {courses.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                  <p className="text-secondary-400 dark:text-neutral-100 mb-4">{t('dashboard.no_courses')}</p>
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
                  <div key={course.id} className="card overflow-hidden">
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
                            <span className="text-secondary-400 dark:text-neutral-100">{lessons.length} {t('course.lessons').toLowerCase()}</span>
                            <span className="text-secondary-400 dark:text-neutral-100">{enrollCount} {t('course.students')}</span>
                            {rating > 0 && (
                              <span className="flex items-center gap-1 text-secondary-400 dark:text-neutral-100">
                                <Star className="w-3 h-3 fill-primary-400 text-primary-400" /> {rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => handleEdit(course)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-600 text-secondary-400" title={t('trainer.edit_course')}>
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(course.id)} className="p-2 rounded-lg hover:bg-alert-50 dark:hover:bg-alert-600/20 text-alert-500" title={t('trainer.delete_course')}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setExpandedCourse(isExpanded ? null : course.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-600 text-secondary-400">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded: lessons management */}
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
                                  <button onClick={() => { setQuizForm({ ...quizForm, lessonId: lesson.id }); setShowQuizForm(true); }} className="p-1.5 rounded hover:bg-primary-50 dark:hover:bg-primary-600/20 text-primary-500" title={t('trainer.add_quiz')}>
                                    <HelpCircle className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteLesson(lesson.id, course.id)} className="p-1.5 rounded hover:bg-alert-50 dark:hover:bg-alert-600/20 text-alert-500">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.category')}</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field">
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.level')}</label>
                  <select value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })} className="input-field">
                    {LEVELS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.image')} (URL)</label>
                <input type="url" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="input-field" placeholder="https://..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary">{t('trainer.save')}</button>
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
                  <input type="url" value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} className="input-field" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('trainer.document_url')}</label>
                  <input type="url" value={lessonForm.document_url} onChange={(e) => setLessonForm({ ...lessonForm, document_url: e.target.value })} className="input-field" placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <button type="submit" className="btn-primary">{t('trainer.save')}</button>
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
                  <textarea required rows={4} value={quizForm.answers} onChange={(e) => setQuizForm({ ...quizForm, answers: e.target.value })} className="input-field" placeholder="Réponse 1&#10;Réponse 2&#10;Réponse 3&#10;Réponse 4" />
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

          {/* Stats */}
          {tab === 'stats' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<BookOpen className="w-6 h-6" />} label={t('trainer.my_courses')} value={courses.length} />
                <StatCard icon={<Users className="w-6 h-6" />} label={t('trainer.total_students')} value={totalStudents} />
                <StatCard icon={<CheckCircle className="w-6 h-6" />} label={t('trainer.published')} value={courses.filter((c) => c.status === 'published').length} />
                <StatCard icon={<Star className="w-6 h-6" />} label={t('trainer.avg_rating')} value={Number(avgRating.toFixed(1))} />
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
                          <span>{enrollCount} {t('course.students')}</span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-primary-400 text-primary-400" /> {rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

function StatusBadge({ status, t }: { status: string; t: (k: TKey) => string }) {
  const styles: Record<string, string> = {
    published: 'bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400',
    pending_review: 'bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400',
    rejected: 'bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400',
  };
  const labels: Record<string, TKey> = {
    published: 'trainer.published',
    pending_review: 'trainer.pending',
    rejected: 'trainer.rejected',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending_review}`}>
      {t(labels[status] || 'trainer.pending')}
    </span>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card p-6">
      <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center text-primary-500 mb-3">{icon}</div>
      <div className="text-2xl font-bold text-secondary-600 dark:text-white">{value.toLocaleString()}</div>
      <div className="text-sm text-secondary-400 dark:text-neutral-100">{label}</div>
    </div>
  );
}
