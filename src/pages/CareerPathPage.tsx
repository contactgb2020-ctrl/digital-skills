import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock, BarChart3, DollarSign, CheckCircle, Lock, Star, Briefcase,
  Award, BookOpen, Layers, Heart, ArrowRight, ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { CareerPath, CareerPathCourse, Course } from '../types';

type Tab = 'overview' | 'curriculum' | 'projects' | 'opportunities' | 'instructor' | 'reviews' | 'faq';

interface ModuleGroup {
  module_name: string;
  module_order: number;
  courses: (Course & { course_order: number })[];
}

const DEFAULT_PROJECTS = [
  'Capstone project: build a production-ready application from scratch',
  'Hands-on lab assignments with real-world datasets',
  'Portfolio piece demonstrating end-to-end skills',
];

const DEFAULT_FAQ = [
  {
    q: 'Do I need prior experience to start this path?',
    a: 'No. This career path is designed to take you from your current level to job-ready. Beginner paths start from the fundamentals.',
  },
  {
    q: 'How long do I have access to the materials?',
    a: 'You get lifetime access to all courses, projects, and updates included in this career path.',
  },
  {
    q: 'Will I receive a certificate?',
    a: 'Yes. Upon completing all modules and the capstone project, you receive a verified certificate of completion.',
  },
  {
    q: 'Is there instructor support?',
    a: 'Yes. You can ask questions in the community and instructors respond within 48 hours on business days.',
  },
];

export default function CareerPathPage({ pathSlug }: { pathSlug: string }) {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const { session } = useAuth();

  const [path, setPath] = useState<CareerPath | null>(null);
  const [modules, setModules] = useState<ModuleGroup[]>([]);
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);

      const { data: pathData } = await supabase
        .from('career_paths')
        .select('*')
        .eq('slug', pathSlug)
        .maybeSingle();

      if (cancelled) return;
      if (!pathData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const careerPath = pathData as CareerPath;
      setPath(careerPath);

      // Load linked courses grouped by module
      const { data: links } = await supabase
        .from('career_path_courses')
        .select('*')
        .eq('career_path_id', careerPath.id)
        .order('module_order', { ascending: true })
        .order('course_order', { ascending: true });

      if (cancelled) return;
      const linkRows = (links || []) as CareerPathCourse[];
      const courseIds = linkRows.map((l) => l.course_id);
      let courseMap: Record<string, Course> = {};
      if (courseIds.length > 0) {
        const { data: courses } = await supabase
          .from('courses')
          .select('*')
          .in('id', courseIds);
        if (!cancelled && courses) {
          courseMap = (courses as Course[]).reduce<Record<string, Course>>((acc, c) => {
            acc[c.id] = c;
            return acc;
          }, {});
        }
      }

      if (cancelled) return;
      const grouped: ModuleGroup[] = [];
      const moduleIndex: Record<string, number> = {};
      for (const link of linkRows) {
        const key = `${link.module_order}:${link.module_name}`;
        if (moduleIndex[key] === undefined) {
          moduleIndex[key] = grouped.length;
          grouped.push({ module_name: link.module_name, module_order: link.module_order, courses: [] });
        }
        const course = courseMap[link.course_id];
        if (course) {
          grouped[moduleIndex[key]].courses.push({ ...course, course_order: link.course_order });
        }
      }
      grouped.sort((a, b) => a.module_order - b.module_order);
      setModules(grouped);

      // Wishlist state
      if (session?.user) {
        const { data: wish } = await supabase
          .from('wishlist_items')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('career_path_id', careerPath.id)
          .maybeSingle();
        if (!cancelled) setInWishlist(!!wish);
      }

      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [pathSlug, session]);

  const priceFormatted = useMemo(() => {
    if (!path) return '';
    if (path.price_cents === 0) return 'Free';
    return `$${(path.price_cents / 100).toFixed(2)}`;
  }, [path]);

  const totalCourses = useMemo(() => modules.reduce((sum, m) => sum + m.courses.length, 0), [modules]);

  const handleToggleWishlist = useCallback(async () => {
    if (!session?.user || !path) return;
    if (inWishlist) {
      await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', session.user.id)
        .eq('career_path_id', path.id);
      setInWishlist(false);
    } else {
      await supabase
        .from('wishlist_items')
        .insert({ user_id: session.user.id, career_path_id: path.id });
      setInWishlist(true);
    }
  }, [session, path, inWishlist]);

  const handleEnroll = useCallback(() => {
    if (!session) {
      navigate('/login');
      return;
    }
    // Enrollment/checkout flow handled elsewhere; navigate to checkout or dashboard.
    navigate(`/checkout?path=${pathSlug}`);
  }, [session, navigate, pathSlug]);

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-sage-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="h-4 w-24 rounded bg-slate-200 animate-pulse mb-6" />
          <div className="rounded-3xl bg-white shadow-sm overflow-hidden">
            <div className="h-56 bg-gradient-to-br from-sage-100 to-sage-200 animate-pulse" />
            <div className="p-8 space-y-4">
              <div className="h-8 w-2/3 rounded bg-slate-200 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse" />
              <div className="flex gap-3 mt-4">
                <div className="h-10 w-32 rounded-xl bg-slate-200 animate-pulse" />
                <div className="h-10 w-32 rounded-xl bg-slate-200 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-48 rounded-2xl bg-white shadow-sm animate-pulse" />
              <div className="h-48 rounded-2xl bg-white shadow-sm animate-pulse" />
            </div>
            <div className="h-72 rounded-2xl bg-white shadow-sm animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !path) {
    return (
      <div className="pt-16 min-h-screen bg-sage-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-medium text-secondary-600 mb-2">Career path not found</h2>
          <p className="text-slate-500 mb-6">The career path you're looking for doesn't exist or has been moved.</p>
          <button onClick={() => navigate('/')} className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: t('career.overview') },
    { id: 'curriculum', label: t('career.curriculum') },
    { id: 'projects', label: t('career.projects') },
    { id: 'opportunities', label: t('career.opportunities') },
    { id: 'instructor', label: t('career.instructor') },
    { id: 'reviews', label: t('career.reviews') },
    { id: 'faq', label: t('career.faq') },
  ];

  return (
    <div className="pt-16 min-h-screen bg-sage-50">
      {/* Back button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </button>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <div className="rounded-3xl bg-white shadow-sm overflow-hidden">
          <div className="grid lg:grid-cols-3">
            <div className="lg:col-span-2 p-8 lg:p-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block px-3 py-1 rounded-full bg-primary-500 text-white text-sm font-medium">
                  {path.category}
                </span>
                {path.is_featured && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sage-100 text-slate-600 text-sm font-medium">
                    <Star className="w-3 h-3 fill-primary-500 text-primary-500" /> Featured
                  </span>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-medium text-secondary-600 font-heading mb-3">
                {path.title}
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed mb-6">{path.description}</p>

              <div className="flex flex-wrap items-center gap-5 text-sm">
                <span className="flex items-center gap-2 text-secondary-600">
                  <Clock className="w-4 h-4 text-primary-500" />
                  {path.duration_weeks} {t('career.weeks')}
                </span>
                <span className="flex items-center gap-2 text-secondary-600">
                  <BarChart3 className="w-4 h-4 text-primary-500" />
                  {path.level}
                </span>
                {path.salary_range && (
                  <span className="flex items-center gap-2 text-secondary-600">
                    <DollarSign className="w-4 h-4 text-primary-500" />
                    {path.salary_range}
                  </span>
                )}
                <span className="flex items-center gap-2 text-secondary-600">
                  <Layers className="w-4 h-4 text-primary-500" />
                  {modules.length} {t('career.modules')} · {totalCourses} {t('career.courses')}
                </span>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-sage-100 to-sage-200 min-h-[200px] lg:min-h-full">
              {path.image ? (
                <img src={path.image} alt={path.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Briefcase className="w-20 h-20 text-slate-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white rounded-t-2xl px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-slate-500 hover:text-primary-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="card p-6 lg:p-8 animate-fade-in space-y-6">
              <section>
                <h2 className="text-xl font-heading font-medium text-secondary-600 mb-3">
                  {t('career.overview')}
                </h2>
                <p className="text-slate-500 leading-relaxed whitespace-pre-line">
                  {path.long_description || path.description}
                </p>
              </section>

              {path.required_skills?.length > 0 && (
                <section>
                  <h3 className="font-medium text-secondary-600 mb-3">{t('career.skills')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {path.required_skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 rounded-lg bg-sage-100 text-slate-600 text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {path.learning_outcomes?.length > 0 && (
                <section>
                  <h3 className="font-medium text-secondary-600 mb-3">{t('career.outcomes')}</h3>
                  <ul className="space-y-2">
                    {path.learning_outcomes.map((outcome, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-500">
                        <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {/* Curriculum */}
          {activeTab === 'curriculum' && (
            <div className="space-y-4 animate-fade-in">
              {modules.length === 0 ? (
                <div className="card p-8 text-center">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No curriculum has been published yet for this path.</p>
                </div>
              ) : (
                modules.map((mod, mi) => (
                  <div key={`${mod.module_order}-${mod.module_name}`} className="card overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 bg-sage-50 border-b border-slate-100">
                      <div className="w-9 h-9 rounded-lg bg-primary-500 text-white flex items-center justify-center font-medium text-sm flex-shrink-0">
                        {mi + 1}
                      </div>
                      <h3 className="font-medium text-secondary-600">{mod.module_name}</h3>
                      <span className="ml-auto text-xs text-slate-500">
                        {mod.courses.length} {t('career.courses')}
                      </span>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {mod.courses.map((course, ci) => (
                        <li key={course.id} className="flex items-center gap-3 px-5 py-3">
                          <BookOpen className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-secondary-600 truncate">{course.title}</p>
                            <p className="text-xs text-slate-500">{course.level}</p>
                          </div>
                          <Lock className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          <span className="text-xs text-slate-400">#{ci + 1}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Projects */}
          {activeTab === 'projects' && (
            <div className="space-y-3 animate-fade-in">
              {DEFAULT_PROJECTS.map((project, i) => (
                <div key={i} className="card p-5 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-500 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-secondary-600 mb-1">Project {i + 1}</h3>
                    <p className="text-slate-500 text-sm">{project}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Career opportunities */}
          {activeTab === 'opportunities' && (
            <div className="card p-6 lg:p-8 animate-fade-in">
              <h2 className="text-xl font-heading font-medium text-secondary-600 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary-500" />
                {t('career.opportunities')}
              </h2>
              {path.career_opportunities?.length > 0 ? (
                <ul className="space-y-3">
                  {path.career_opportunities.map((opp, i) => (
                    <li key={i} className="flex items-start gap-3 p-4 rounded-xl bg-sage-50">
                      <ArrowRight className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">{opp}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">Career opportunity details will be added soon.</p>
              )}
            </div>
          )}

          {/* Instructor */}
          {activeTab === 'instructor' && (
            <div className="card p-6 lg:p-8 animate-fade-in text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-medium mx-auto mb-4">
                DSA
              </div>
              <h3 className="font-medium text-secondary-600 text-lg">Digital Skills Team</h3>
              <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
                This career path is curated and maintained by the Digital Skills team of industry
                practitioners and educators.
              </p>
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <div className="card p-6 lg:p-8 animate-fade-in text-center">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Reviews coming soon. Be the first to review this career path!</p>
            </div>
          )}

          {/* FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-3 animate-fade-in">
              {DEFAULT_FAQ.map((item, i) => (
                <div key={i} className="card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="font-medium text-secondary-600">{item.q}</span>
                    <span className={`text-primary-500 text-xl transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>
                      +
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-slate-500 text-sm leading-relaxed">{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky sidebar */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-20">
            <div className="mb-4">
              <div className="text-3xl font-medium text-secondary-600">{priceFormatted}</div>
              {path.price_cents > 0 && (
                <p className="text-sm text-slate-500 mt-1">One-time payment · lifetime access</p>
              )}
            </div>

            <button
              onClick={handleEnroll}
              className="btn-primary w-full mb-3 flex items-center justify-center gap-2"
            >
              {t('career.enroll')} <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleToggleWishlist}
              disabled={!session}
              className={`w-full mb-6 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                inWishlist
                  ? 'border-primary-500 bg-primary-50 text-primary-500'
                  : 'border-slate-200 text-slate-600 hover:border-primary-500 hover:text-primary-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${inWishlist ? 'fill-primary-500' : ''}`} />
              {inWishlist ? t('career.in_wishlist') : t('career.add_to_wishlist')}
            </button>

            <div className="space-y-3 text-sm border-t border-slate-100 pt-4">
              <SidebarInfo icon={<Clock className="w-4 h-4" />} label={t('career.duration')} value={`${path.duration_weeks} ${t('career.weeks')}`} />
              <SidebarInfo icon={<BarChart3 className="w-4 h-4" />} label={t('career.level')} value={path.level} />
              <SidebarInfo icon={<Award className="w-4 h-4" />} label={t('career.certificate')} value="Yes" />
              <SidebarInfo icon={<Layers className="w-4 h-4" />} label={t('career.projects')} value={String(DEFAULT_PROJECTS.length)} />
            </div>

            {path.salary_range && (
              <div className="mt-4 p-3 rounded-xl bg-sage-50 flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-primary-500" />
                <span className="text-slate-600">{path.salary_range}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-primary-500 flex-shrink-0">{icon}</span>
      <div className="flex-1 flex items-center justify-between">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-secondary-600">{value}</span>
      </div>
    </div>
  );
}
