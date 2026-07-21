import { useState, useEffect } from 'react';
import { BookOpen, Lock, Play, Search, Star, Users } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Course, Subscription, Review } from '../types';
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

export default function CoursesPage() {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const { session } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [courseRatings, setCourseRatings] = useState<Record<string, { avg: number; count: number }>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('courses').select('*').eq('status', 'published').order('created_at', { ascending: false });
      if (data) {
        setCourses(data as Course[]);
        // Load ratings for each course
        for (const course of data as Course[]) {
          const { data: reviews } = await supabase.from('reviews').select('rating').eq('course_id', course.id);
          if (reviews && reviews.length > 0) {
            const avg = (reviews as Review[]).reduce((s, r) => s + r.rating, 0) / reviews.length;
            setCourseRatings((prev) => ({ ...prev, [course.id]: { avg, count: reviews.length } }));
          }
        }
      }

      if (session?.user) {
        const { data: subData } = await supabase.from('subscriptions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (subData) setSubscription(subData as Subscription);
      }
      setLoading(false);
    })();
  }, [session]);

  const plan = subscription?.plan || 'starter';
  const isPremium = plan === 'premium' || plan === 'enterprise';

  const filtered = courses.filter((c) => {
    const matchesSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || c.category === activeCategory;
    const matchesLevel = !activeLevel || c.level === activeLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div className="pt-16 min-h-screen bg-neutral-light dark:bg-secondary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-secondary-600 dark:text-white mb-2">{t('section.popular')}</h1>
        <p className="text-secondary-400 dark:text-neutral-100 mb-8">{t('section.popular.subtitle')}</p>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('dashboard.search')} className="input-field pl-10" />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setActiveCategory(null)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!activeCategory ? 'bg-primary-500 text-white' : 'bg-white dark:bg-secondary-600 text-secondary-600 dark:text-neutral-100'}`}>
            Toutes
          </button>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-primary-500 text-white' : 'bg-white dark:bg-secondary-600 text-secondary-600 dark:text-neutral-100'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Level filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setActiveLevel(null)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!activeLevel ? 'bg-secondary-600 dark:bg-secondary-800 text-white' : 'bg-white dark:bg-secondary-600 text-secondary-400 dark:text-neutral-100'}`}>
            Tous niveaux
          </button>
          {LEVELS.map((lvl) => (
            <button key={lvl} onClick={() => setActiveLevel(lvl)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeLevel === lvl ? 'bg-secondary-600 dark:bg-secondary-800 text-white' : 'bg-white dark:bg-secondary-600 text-secondary-400 dark:text-neutral-100'}`}>
              {lvl}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-secondary-400 dark:text-neutral-100">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
            <p className="text-secondary-400 dark:text-neutral-100">{t('dashboard.no_courses')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => {
              const locked = !isPremium && course.level === 'Avancé';
              const rating = courseRatings[course.id];
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
                    <div className="flex items-center gap-3 text-xs text-secondary-400 dark:text-neutral-100 mb-2">
                      <span>{course.level}</span>
                      {rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-primary-400 text-primary-400" /> {rating.avg.toFixed(1)} ({rating.count})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-400 dark:text-neutral-100 line-clamp-1">{course.description}</span>
                      <span className="flex items-center gap-1 text-primary-500 font-medium flex-shrink-0">
                        <Play className="w-4 h-4" /> {t('dashboard.start')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
