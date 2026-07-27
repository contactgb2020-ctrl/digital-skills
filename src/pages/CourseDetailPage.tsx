import { useState, useEffect, useCallback, useMemo } from 'react';
import { BookOpen, Play, Star, Clock, Users, Lock, CheckCircle, ChevronLeft, ChevronRight, Award, FileText, Video, HelpCircle, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Course, Lesson, Quiz, Review, Enrollment, Progress, Certificate, Subscription } from '../types';
import type { TranslationKey as TKey } from '../i18n/translations';

export default function CourseDetailPage({ courseId }: { courseId: string }) {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const { session } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [instructorName, setInstructorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    (async () => {
      const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).maybeSingle();
      if (courseData) {
        setCourse(courseData as Course);
        const { data: instructor } = await supabase.from('profiles').select('nom').eq('id', (courseData as Course).created_by).maybeSingle();
        if (instructor) setInstructorName((instructor as { nom: string }).nom);
      }

      const { data: lessonData } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order_number', { ascending: true });
      if (lessonData) setLessons(lessonData as Lesson[]);

      const { data: quizData } = await supabase.from('quizzes').select('*').in('lesson_id', (lessonData || []).map((l: Lesson) => l.id));
      if (quizData) setQuizzes(quizData as Quiz[]);

      const { data: reviewData } = await supabase.from('reviews').select('*').eq('course_id', courseId).order('created_at', { ascending: false });
      if (reviewData) setReviews(reviewData as Review[]);

      if (session?.user) {
        const { data: enrollData } = await supabase.from('enrollments').select('*').eq('course_id', courseId).eq('user_id', session.user.id).maybeSingle();
        if (enrollData) setEnrollment(enrollData as Enrollment);

        const { data: progressData } = await supabase.from('progress').select('*').eq('user_id', session.user.id).in('lesson_id', (lessonData || []).map((l: Lesson) => l.id));
        if (progressData) setProgress(progressData as Progress[]);

        const { data: certData } = await supabase.from('certificates').select('*').eq('course_id', courseId).eq('user_id', session.user.id).maybeSingle();
        if (certData) setCertificate(certData as Certificate);

        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (subData) setSubscription(subData as Subscription);
      }

      setLoading(false);
    })();
  }, [courseId, session]);

  const isEnrolled = !!enrollment;
  // Trainers/admins have no subscription row and get full access.
  // Students only get full access once their subscription is 'active'
  // (payment confirmed) — otherwise they get a preview of lesson 1 only.
  const hasFullAccess = !subscription || subscription.status === 'active';
  const completedLessonIds = useMemo(
    () => new Set(progress.filter((p) => p.completed).map((p) => p.lesson_id)),
    [progress]
  );
  const completedCount = completedLessonIds.size;
  const totalLessons = lessons.length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const handleEnroll = useCallback(async () => {
    if (!session?.user || !course) return;
    const { data } = await supabase.from('enrollments').insert({
      user_id: session.user.id,
      course_id: course.id,
    }).select().single();
    if (data) setEnrollment(data as Enrollment);
  }, [session, course]);

  const handleMarkComplete = useCallback(async (lessonId: string) => {
    if (!session?.user) return;
    const existing = progress.find((p) => p.lesson_id === lessonId);
    if (existing) {
      await supabase.from('progress').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', existing.id);
      setProgress(progress.map((p) => (p.lesson_id === lessonId ? { ...p, completed: true, completed_at: new Date().toISOString() } : p)));
    } else {
      const { data } = await supabase.from('progress').insert({
        user_id: session.user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      }).select().single();
      if (data) setProgress([...progress, data as Progress]);
    }

    // Update enrollment progress
    if (enrollment) {
      const newCompleted = completedLessonIds.has(lessonId) ? completedCount : completedCount + 1;
      const newPct = totalLessons > 0 ? Math.round((newCompleted / totalLessons) * 100) : 0;
      await supabase.from('enrollments').update({ progress_pct: newPct, completed_at: newPct === 100 ? new Date().toISOString() : null }).eq('id', enrollment.id);
    }
  }, [session, progress, enrollment, completedCount, totalLessons, completedLessonIds]);

  const handleNextLesson = useCallback(() => {
    if (!activeLesson) return;
    const idx = lessons.findIndex((l) => l.id === activeLesson.id);
    if (idx < lessons.length - 1) setActiveLesson(lessons[idx + 1]);
  }, [activeLesson, lessons]);

  const handlePrevLesson = useCallback(() => {
    if (!activeLesson) return;
    const idx = lessons.findIndex((l) => l.id === activeLesson.id);
    if (idx > 0) setActiveLesson(lessons[idx - 1]);
  }, [activeLesson, lessons]);

  const handleQuizSubmit = useCallback(async (quiz: Quiz) => {
    if (!session?.user) return;
    const userAnswer = quizAnswers[quiz.id] ?? -1;
    const score = userAnswer === quiz.correct_answer ? 100 : 0;
    const passed = score >= quiz.passing_score;

    await supabase.from('quiz_attempts').insert({
      user_id: session.user.id,
      quiz_id: quiz.id,
      score,
      passed,
    });

    setQuizResult({ score, passed });
  }, [session, quizAnswers]);

  const handleGenerateCertificate = useCallback(async () => {
    if (!session?.user || !course) return;
    const certNumber = `DSA-${courseId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const { data } = await supabase.from('certificates').insert({
      user_id: session.user.id,
      course_id: course.id,
      certificate_number: certNumber,
    }).select().single();
    if (data) setCertificate(data as Certificate);
  }, [session, course, courseId]);

  const handleSubmitReview = useCallback(async () => {
    if (!session?.user || !course) return;
    const { data } = await supabase.from('reviews').insert({
      user_id: session.user.id,
      course_id: course.id,
      rating: reviewRating,
      comment: reviewComment,
    }).select().single();
    if (data) {
      setReviews([data as Review, ...reviews]);
      setReviewComment('');
      setReviewRating(5);
    }
  }, [session, course, reviewRating, reviewComment, reviews]);

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center bg-neutral-light dark:bg-secondary-700">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <p className="text-secondary-400 dark:text-neutral-100">{t('course.not_found')}</p>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-neutral-light dark:bg-secondary-700">
      {/* Back button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button onClick={() => navigate('/courses')} className="flex items-center gap-2 text-sm text-secondary-400 dark:text-neutral-100 hover:text-primary-500 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </button>
      </div>

      {/* Course header */}
      <div className="bg-secondary-600 dark:bg-secondary-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-primary-500 text-sm font-medium">{course.category}</span>
            <h1 className="text-3xl lg:text-4xl font-bold">{course.title}</h1>
            <p className="text-secondary-200 text-lg">{course.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-200">
              {avgRating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-primary-400 text-primary-400" />
                  {avgRating.toFixed(1)} ({reviews.length})
                </span>
              )}
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {t('course.by')} {instructorName || 'DSA'}</span>
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {totalLessons} {t('course.lessons').toLowerCase()}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">{course.level}</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              {course.image ? (
                <img src={course.image} alt={course.title} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200 dark:border-secondary-500">
            {(['overview', 'curriculum', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-secondary-400 dark:text-neutral-100 hover:text-primary-500'
                }`}
              >
                {t(`course.${tab}` as TKey)}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="card p-6 animate-fade-in">
              <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-3">{t('course.overview')}</h2>
              <p className="text-secondary-400 dark:text-neutral-100 leading-relaxed">{course.description || t('course.no_description')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                <InfoBox icon={<BookOpen className="w-5 h-5" />} label={t('course.lessons')} value={String(totalLessons)} />
                <InfoBox icon={<BarChartIcon />} label={t('course.duration')} value={`${lessons.reduce((s, l) => s + l.duration, 0)}s`} />
                <InfoBox icon={<Star className="w-5 h-5" />} label={t('course.reviews')} value={String(reviews.length)} />
              </div>
            </div>
          )}

          {/* Curriculum */}
          {activeTab === 'curriculum' && (
            <div className="space-y-3 animate-fade-in">
              {lessons.length === 0 ? (
                <div className="card p-8 text-center">
                  <BookOpen className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                  <p className="text-secondary-400 dark:text-neutral-100">{t('course.no_lessons')}</p>
                </div>
              ) : (
                lessons.map((lesson, i) => {
                  const isCompleted = completedLessonIds.has(lesson.id);
                  const lessonQuizzes = quizzes.filter((q) => q.lesson_id === lesson.id);
                  const isPreviewLesson = i === 0;
                  const unlocked = isEnrolled && (isPreviewLesson || hasFullAccess);
                  return (
                    <div key={lesson.id} className="card overflow-hidden">
                      <button
                        onClick={() => unlocked ? setActiveLesson(lesson) : null}
                        className={`w-full flex items-center gap-4 p-4 text-left ${unlocked ? 'hover:bg-gray-50 dark:hover:bg-secondary-600 cursor-pointer' : 'cursor-not-allowed'}`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-success-100 dark:bg-success-600/20 text-success-500' : 'bg-primary-100 dark:bg-primary-600/20 text-primary-500'}`}>
                          {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-secondary-400">#{i + 1}</span>
                            <h3 className="font-medium text-secondary-600 dark:text-white truncate">{lesson.title}</h3>
                            {isEnrolled && !hasFullAccess && isPreviewLesson && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400">Aperçu</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-secondary-400 mt-1">
                            {lesson.video_url && <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {t('course.video')}</span>}
                            {lesson.document_url && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {t('course.document')}</span>}
                            {lessonQuizzes.length > 0 && <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3" /> {t('course.quiz')}</span>}
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.duration}s</span>
                          </div>
                        </div>
                        {!unlocked && <Lock className="w-5 h-5 text-secondary-400 flex-shrink-0" />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-fade-in">
              {/* Submit review */}
              {isEnrolled && session && (
                <div className="card p-6">
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4">{t('course.rate')}</h3>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setReviewRating(star)}>
                        <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-primary-400 text-primary-400' : 'text-gray-300 dark:text-secondary-500'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3} className="input-field mb-3" placeholder={t('course.review_placeholder')} />
                  <button onClick={handleSubmitReview} className="btn-primary">{t('course.submit_review')}</button>
                </div>
              )}

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <div className="card p-8 text-center">
                  <Star className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                  <p className="text-secondary-400 dark:text-neutral-100">{t('course.no_reviews')}</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="card p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                        {(review.user_id as string).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-primary-400 text-primary-400' : 'text-gray-300 dark:text-secondary-500'}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-secondary-400 dark:text-neutral-100">{review.comment}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sidebar: enrollment + lesson player */}
        <div className="space-y-4">
          {/* Enrollment card */}
          <div className="card p-6 sticky top-20">
            {isEnrolled ? (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-secondary-400 dark:text-neutral-100">{t('dashboard.progress')}</span>
                    <span className="text-primary-500 font-semibold">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-secondary-600">
                    <div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
                {progressPct === 100 && !certificate && (
                  <button onClick={handleGenerateCertificate} className="btn-primary w-full mb-3 flex items-center justify-center gap-2">
                    <Award className="w-5 h-5" /> {t('course.get_certificate')}
                  </button>
                )}
                {certificate && (
                  <div className="p-4 rounded-xl bg-success-50 dark:bg-success-600/20 border border-success-200 dark:border-success-600 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-success-500" />
                    <span className="text-sm text-success-600 dark:text-success-400">{t('course.cert_generated')}</span>
                  </div>
                )}
                {certificate && (
                  <div className="text-xs text-secondary-400 dark:text-neutral-100 mb-3">
                    {t('course.cert_number')} {certificate.certificate_number}
                  </div>
                )}
              </>
            ) : (
              <button onClick={handleEnroll} className="btn-primary w-full mb-3">
                {session ? t('course.enroll') : t('nav.login')}
              </button>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-secondary-400 dark:text-neutral-100">
                <BookOpen className="w-4 h-4 text-primary-500" /> {totalLessons} {t('course.lessons').toLowerCase()}
              </div>
              <div className="flex items-center gap-2 text-secondary-400 dark:text-neutral-100">
                <BarChartIcon /> {course.level}
              </div>
              <div className="flex items-center gap-2 text-secondary-400 dark:text-neutral-100">
                <Users className="w-4 h-4 text-primary-500" /> {t('course.by')} {instructorName || 'DSA'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson player modal */}
      {activeLesson && isEnrolled && (hasFullAccess || lessons.findIndex((l) => l.id === activeLesson.id) === 0) && (
        <LessonPlayer
          lesson={activeLesson}
          quizzes={quizzes.filter((q) => q.lesson_id === activeLesson.id)}
          isCompleted={completedLessonIds.has(activeLesson.id)}
          onClose={() => setActiveLesson(null)}
          onComplete={() => handleMarkComplete(activeLesson.id)}
          onNext={handleNextLesson}
          onPrev={handlePrevLesson}
          hasNext={lessons.findIndex((l) => l.id === activeLesson.id) < lessons.length - 1}
          hasPrev={lessons.findIndex((l) => l.id === activeLesson.id) > 0}
          showQuiz={showQuiz}
          setShowQuiz={setShowQuiz}
          quizAnswers={quizAnswers}
          setQuizAnswers={setQuizAnswers}
          onQuizSubmit={handleQuizSubmit}
          quizResult={quizResult}
          setQuizResult={setQuizResult}
          t={t}
          userId={session?.user.id}
        />
      )}
    </div>
  );
}

function LessonPlayer({
  lesson, quizzes, isCompleted, onClose, onComplete, onNext, onPrev, hasNext, hasPrev,
  showQuiz, setShowQuiz, quizAnswers, setQuizAnswers, onQuizSubmit, quizResult, setQuizResult, t, userId
}: {
  lesson: Lesson;
  quizzes: Quiz[];
  isCompleted: boolean;
  onClose: () => void;
  onComplete: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  showQuiz: boolean;
  setShowQuiz: (v: boolean) => void;
  quizAnswers: Record<string, number>;
  setQuizAnswers: (v: Record<string, number>) => void;
  onQuizSubmit: (q: Quiz) => void;
  quizResult: { score: number; passed: boolean } | null;
  setQuizResult: (v: { score: number; passed: boolean } | null) => void;
  t: (k: TKey) => string;
  userId?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-secondary-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-bold text-secondary-600 dark:text-white">{lesson.title}</h2>
            <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 dark:hover:text-white text-2xl">&times;</button>
          </div>

          {/* Video */}
          {lesson.video_url && (
            <div className="mb-4 rounded-xl overflow-hidden bg-black aspect-video">
              <video
                src={lesson.video_url}
                controls
                className="w-full h-full"
                onTimeUpdate={(e) => {
                  const video = e.currentTarget;
                  const seconds = Math.floor(video.currentTime);
                  // Track every 30 seconds of viewing
                  if (seconds > 0 && seconds % 30 === 0 && video.paused === false) {
                    supabase.from('watch_sessions').insert({
                      user_id: userId,
                      lesson_id: lesson.id,
                      course_id: lesson.course_id,
                      watched_seconds: 30,
                    }).then(() => {});
                  }
                }}
              />
            </div>
          )}

          {/* Document */}
          {lesson.document_url && (
            <a href={lesson.document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg bg-primary-50 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400 mb-4 hover:bg-primary-100 transition-colors">
              <FileText className="w-5 h-5" /> {t('course.document')} — PDF
            </a>
          )}

          {/* Quiz */}
          {quizzes.length > 0 && (
            <div className="mb-4">
              <button onClick={() => { setShowQuiz(!showQuiz); setQuizResult(null); }} className="btn-outline flex items-center gap-2">
                <HelpCircle className="w-5 h-5" /> {t('course.take_quiz')}
              </button>
            </div>
          )}

          {showQuiz && quizzes.map((quiz) => (
            <div key={quiz.id} className="card p-5 mb-4">
              <h3 className="font-semibold text-secondary-600 dark:text-white mb-3">{quiz.question}</h3>
              <div className="space-y-2">
                {(quiz.answers as string[]).map((answer, i) => (
                  <label key={i} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${quizAnswers[quiz.id] === i ? 'bg-primary-50 dark:bg-primary-600/20 border-2 border-primary-500' : 'bg-gray-50 dark:bg-secondary-600 border-2 border-transparent'}`}>
                    <input type="radio" name={`quiz-${quiz.id}`} checked={quizAnswers[quiz.id] === i} onChange={() => setQuizAnswers({ ...quizAnswers, [quiz.id]: i })} />
                    <span className="text-sm text-secondary-600 dark:text-white">{answer}</span>
                  </label>
                ))}
              </div>
              {quizResult && (
                <div className={`mt-3 p-3 rounded-lg ${quizResult.passed ? 'bg-success-50 dark:bg-success-600/20 text-success-600 dark:text-success-400' : 'bg-alert-50 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400'}`}>
                  {quizResult.passed ? t('course.quiz_passed') : t('course.quiz_failed')} — {t('course.quiz_score')}: {quizResult.score}%
                </div>
              )}
              <button onClick={() => onQuizSubmit(quiz)} className="btn-primary mt-3" disabled={quizAnswers[quiz.id] === undefined}>
                {t('course.quiz_submit')}
              </button>
            </div>
          ))}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-secondary-500">
            <button onClick={onPrev} disabled={!hasPrev} className="btn-outline flex items-center gap-2 disabled:opacity-40">
              <ChevronLeft className="w-5 h-5" /> {t('course.prev_lesson')}
            </button>
            <button onClick={onComplete} className={`px-4 py-2 rounded-lg font-medium transition-colors ${isCompleted ? 'bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400' : 'btn-primary'}`}>
              {isCompleted ? t('course.completed') : t('course.mark_complete')}
            </button>
            <button onClick={onNext} disabled={!hasNext} className="btn-outline flex items-center gap-2 disabled:opacity-40">
              {t('course.next_lesson')} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-gray-50 dark:bg-secondary-600">
      <div className="flex items-center gap-2 text-primary-500 mb-1">{icon}</div>
      <div className="text-lg font-bold text-secondary-600 dark:text-white">{value}</div>
      <div className="text-xs text-secondary-400 dark:text-neutral-100">{label}</div>
    </div>
  );
}

function BarChartIcon() {
  return <span className="text-primary-500">&#9650;</span>;
}
