import { useEffect, useState } from 'react';
import {
  Search, ArrowRight, Star, Users, Award, Briefcase, TrendingUp, Clock,
  CheckCircle, ShieldCheck, Building2, Quote, Sparkles, GraduationCap,
  BookOpen, Target, ChevronDown, Code2, Palette, Scissors, Wrench,
  Languages,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { CareerPath } from '../types';
import type { TranslationKey } from '../i18n/translations';

const CATEGORY_ICONS: Record<string, typeof Code2> = {
  Technology: Code2,
  Business: Briefcase,
  'Beauty & Fashion': Scissors,
  Creative: Palette,
  'Technical Trades': Wrench,
  Languages: Languages,
};

const STATS = [
  { icon: Users, value: '50K+', labelKey: 'stats.students' as TranslationKey },
  { icon: BookOpen, value: '27+', labelKey: 'stats.courses' as TranslationKey },
  { icon: Building2, value: '15+', labelKey: 'stats.countries' as TranslationKey },
  { icon: Award, value: '12K+', labelKey: 'stats.certificates' as TranslationKey },
  { icon: Briefcase, value: '50+', labelKey: 'stats.companies' as TranslationKey },
  { icon: TrendingUp, value: '94%', labelKey: 'stats.success_rate' as TranslationKey },
];

const CATEGORIES = [
  { icon: Code2, key: 'category.technology' as TranslationKey, count: 8 },
  { icon: Briefcase, key: 'category.business' as TranslationKey, count: 6 },
  { icon: Scissors, key: 'category.beauty' as TranslationKey, count: 5 },
  { icon: Palette, key: 'category.creative' as TranslationKey, count: 4 },
  { icon: Wrench, key: 'category.technical' as TranslationKey, count: 3 },
  { icon: Languages, key: 'category.languages' as TranslationKey, count: 2 },
];

const PROCESS_STEPS = [
  { icon: Target, titleKey: 'process.step1' as TranslationKey, descKey: 'process.step1_desc' as TranslationKey },
  { icon: BookOpen, titleKey: 'process.step2' as TranslationKey, descKey: 'process.step2_desc' as TranslationKey },
  { icon: Briefcase, titleKey: 'process.step3' as TranslationKey, descKey: 'process.step3_desc' as TranslationKey },
  { icon: Award, titleKey: 'process.step4' as TranslationKey, descKey: 'process.step4_desc' as TranslationKey },
  { icon: Briefcase, titleKey: 'process.step5' as TranslationKey, descKey: 'process.step5_desc' as TranslationKey },
];

const INSTRUCTORS = [
  { name: 'Sarah Mitchell', title: 'Senior Full-Stack Developer', rating: 4.9, students: 12400, avatar: 'SM' },
  { name: 'David Chen', title: 'Digital Marketing Lead', rating: 4.8, students: 9800, avatar: 'DC' },
  { name: 'Aisha Koné', title: 'Master Cosmetologist', rating: 5.0, students: 7600, avatar: 'AK' },
  { name: 'Marcus Johnson', title: 'UI/UX Design Director', rating: 4.9, students: 8200, avatar: 'MJ' },
];

const TESTIMONIALS = [
  {
    text: "Digital Skills completely transformed my career. Within 4 months of completing the Full-Stack path, I landed a developer role at a top tech company. The portfolio projects gave me real-world experience employers noticed.",
    name: 'Amara Diallo',
    role: 'Full-Stack Developer at TechCorp',
    avatar: 'AD',
  },
  {
    text: "The Beauty & Fashion path gave me everything I needed to open my own salon. The certification gave my clients confidence, and the business modules helped me actually run a profitable studio.",
    name: 'Fatou Bensouda',
    role: 'Salon Owner & Beauty Entrepreneur',
    avatar: 'FB',
  },
  {
    text: "I switched from a dead-end job to a digital marketing career thanks to Digital Skills. The instructors are industry pros, and the career support connected me with three hiring partners before I even finished.",
    name: 'Kwame Mensah',
    role: 'Marketing Specialist at MarketPro',
    avatar: 'KM',
  },
];

const COMPANIES = ['TechCorp', 'BeautyLab', 'CreativeStudio', 'DataFlow', 'MarketPro', 'DesignHub'];

const FAQ_KEYS: { q: TranslationKey; a: TranslationKey }[] = [
  { q: 'faq.q1', a: 'faq.a1' },
  { q: 'faq.q2', a: 'faq.a2' },
  { q: 'faq.q3', a: 'faq.a3' },
  { q: 'faq.q4', a: 'faq.a4' },
  { q: 'faq.q5', a: 'faq.a5' },
  { q: 'faq.q6', a: 'faq.a6' },
];

export default function LandingPage() {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const { session } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [paths, setPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('career_paths')
        .select('*')
        .eq('is_featured', true)
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .limit(6);
      if (!cancelled) {
        setPaths((data || []) as CareerPath[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSearch = () => {
    const q = searchQuery.trim();
    navigate(q ? `/paths?q=${encodeURIComponent(q)}` : '/paths');
  };

  const handleGetStarted = () => {
    navigate(session ? '/dashboard' : '/signup');
  };

  return (
    <div className="pt-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden hero-gradient dark:hero-gradient-dark">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary-200 dark:bg-primary-600 rounded-full opacity-20 dark:opacity-10 blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary-200 dark:bg-secondary-500 rounded-full opacity-20 dark:opacity-10 blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          <div className="pill-badge inline-flex animate-fade-in-down mb-6">
            <Sparkles className="w-4 h-4" />
            Nouveau: Parcours Professionnels
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-secondary-600 dark:text-white leading-tight max-w-4xl mx-auto animate-fade-in-up">
            {t('hero.title')}
          </h1>

          <p className="mt-6 text-lg text-slate-500 dark:text-neutral-300 max-w-2xl mx-auto animate-fade-in-up">
            {t('hero.subtitle')}
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 animate-fade-in-up">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('hero.search_placeholder')}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-secondary-700 border border-slate-200 dark:border-secondary-600 text-secondary-600 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              className="btn-primary flex items-center justify-center gap-2 px-8"
            >
              <Search className="w-5 h-5" />
              {t('hero.search_button')}
            </button>
          </div>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
            <button onClick={handleGetStarted} className="btn-primary flex items-center gap-2 group">
              {t('hero.cta')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => navigate('/paths')} className="btn-outline flex items-center gap-2">
              {t('hero.cta.secondary')}
              <ArrowRight className="w-5 h-5" />
            </button>
            <span className="text-sm text-slate-500 dark:text-neutral-400">{t('pricing.trial')}</span>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500 dark:text-neutral-400">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary-500" />
              {t('trust.secure_payments')}
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary-500" />
              {t('trust.money_back')}
            </span>
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary-500" />
              {t('trust.verified_certs')}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Stats Section */}
      <section className="py-16 bg-white dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-500" />
                  </div>
                  <div className="text-3xl lg:text-4xl font-medium text-secondary-600 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-neutral-400">{t(stat.labelKey)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Featured Career Paths */}
      <section className="py-20 bg-sage-50 dark:bg-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-medium text-secondary-600 dark:text-white mb-4">
              {t('section.featured')}
            </h2>
            <p className="text-slate-500 dark:text-neutral-300 max-w-2xl mx-auto">
              {t('section.popular.subtitle')}
            </p>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="h-48 bg-slate-200 dark:bg-secondary-600 animate-pulse" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 w-20 rounded bg-slate-200 dark:bg-secondary-600 animate-pulse" />
                    <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-secondary-600 animate-pulse" />
                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-secondary-600 animate-pulse" />
                    <div className="flex gap-2 pt-2">
                      <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-secondary-600 animate-pulse" />
                      <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-secondary-600 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : paths.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-neutral-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No featured paths available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paths.map((path) => {
                const CatIcon = CATEGORY_ICONS[path.category] || Briefcase;
                return (
                  <div
                    key={path.id}
                    className="card overflow-hidden hover:scale-[1.02] hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={() => navigate(`/path/${path.slug}`)}
                  >
                    <div className="h-48 overflow-hidden relative bg-gradient-to-br from-sage-100 to-sage-200 dark:from-secondary-600 dark:to-secondary-700">
                      {path.image ? (
                        <img
                          src={path.image}
                          alt={path.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CatIcon className="w-16 h-16 text-slate-400 dark:text-neutral-500" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 dark:bg-secondary-800/90 text-xs font-medium text-secondary-600 dark:text-white">
                        {path.category}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-heading font-medium text-lg text-secondary-600 dark:text-white mb-2 line-clamp-2">
                        {path.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-neutral-400 mb-4 line-clamp-2">
                        {path.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-neutral-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary-500" />
                          {path.duration_weeks} {t('career.weeks')}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
                          {path.level}
                        </span>
                      </div>
                      {path.salary_range && (
                        <div className="flex items-center gap-1.5 text-sm text-secondary-600 dark:text-white font-medium mb-4">
                          <Briefcase className="w-4 h-4 text-primary-500" />
                          {path.salary_range}
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/path/${path.slug}`);
                        }}
                        className="w-full btn-outline flex items-center justify-center gap-2 group/btn"
                      >
                        {t('career.view_path')}
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/paths')}
              className="btn-primary inline-flex items-center gap-2 group"
            >
              {t('career.all_paths')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Categories Section */}
      <section className="py-20 bg-white dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-medium text-secondary-600 dark:text-white mb-4">
              {t('section.categories')}
            </h2>
            <p className="text-slate-500 dark:text-neutral-300 max-w-2xl mx-auto">
              Explore paths across the industries shaping tomorrow's economy.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <button
                  key={i}
                  onClick={() => navigate(`/paths?category=${encodeURIComponent(t(cat.key))}`)}
                  className="card p-6 text-center hover:scale-105 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center group-hover:bg-primary-500 transition-colors">
                    <Icon className="w-7 h-7 text-primary-500 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-medium text-secondary-600 dark:text-white mb-1">
                    {t(cat.key)}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-neutral-400">
                    {cat.count} {cat.count > 1 ? 'paths' : 'path'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Learning Process */}
      <section className="py-20 bg-sage-50 dark:bg-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-medium text-secondary-600 dark:text-white mb-4">
              {t('section.process')}
            </h2>
            <p className="text-slate-500 dark:text-neutral-300 max-w-2xl mx-auto">
              Five clear steps from where you are now to where you want to be.
            </p>
          </div>

          {/* Desktop horizontal timeline */}
          <div className="hidden lg:block relative">
            <div className="absolute top-12 left-0 right-0 h-0.5 bg-slate-200 dark:bg-secondary-600"></div>
            <div className="grid grid-cols-5 gap-4 relative">
              {PROCESS_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="text-center">
                    <div className="relative w-12 h-12 mx-auto mb-4 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium z-10 ring-4 ring-sage-50 dark:ring-secondary-700">
                      {i + 1}
                    </div>
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white dark:bg-secondary-800 flex items-center justify-center shadow-sm">
                      <Icon className="w-7 h-7 text-primary-500" />
                    </div>
                    <h3 className="font-medium text-secondary-600 dark:text-white mb-2">
                      {t(step.titleKey)}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-neutral-400">
                      {t(step.descKey)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile vertical timeline */}
          <div className="lg:hidden space-y-8">
            {PROCESS_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                      {i + 1}
                    </div>
                    {i < PROCESS_STEPS.length - 1 && (
                      <div className="w-0.5 flex-1 bg-slate-200 dark:bg-secondary-600 mt-2"></div>
                    )}
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-5 h-5 text-primary-500" />
                      <h3 className="font-medium text-secondary-600 dark:text-white">
                        {t(step.titleKey)}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-neutral-400">
                      {t(step.descKey)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Popular Instructors */}
      <section className="py-20 bg-white dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-medium text-secondary-600 dark:text-white mb-4">
              {t('section.instructors')}
            </h2>
            <p className="text-slate-500 dark:text-neutral-300 max-w-2xl mx-auto">
              Learn from industry professionals with years of real-world experience.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {INSTRUCTORS.map((instr, i) => (
              <div key={i} className="card p-6 text-center hover:scale-105 hover:shadow-lg transition-all duration-300">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-medium">
                  {instr.avatar}
                </div>
                <h3 className="font-heading font-medium text-secondary-600 dark:text-white mb-1">
                  {instr.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-neutral-400 mb-3">{instr.title}</p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-secondary-600 dark:text-white">
                    <Star className="w-4 h-4 text-primary-500 fill-primary-500" />
                    {instr.rating}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 dark:text-neutral-400">
                    <Users className="w-4 h-4" />
                    {instr.students.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="py-20 bg-sage-50 dark:bg-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-medium text-secondary-600 dark:text-white mb-4">
              {t('section.testimonials')}
            </h2>
            <p className="text-slate-500 dark:text-neutral-300 max-w-2xl mx-auto">
              Real stories from graduates who built careers with Digital Skills.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((tm, i) => (
              <div key={i} className="card p-8 flex flex-col">
                <Quote className="w-10 h-10 text-primary-500 mb-4 opacity-80" />
                <p className="text-slate-600 dark:text-neutral-200 mb-6 flex-1 leading-relaxed">
                  "{tm.text}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-secondary-600">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                    {tm.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-secondary-600 dark:text-white">{tm.name}</div>
                    <div className="text-sm text-slate-500 dark:text-neutral-400">{tm.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Companies Hiring */}
      <section className="py-16 bg-white dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-medium text-secondary-600 dark:text-white mb-2">
              {t('section.companies')}
            </h2>
            <p className="text-slate-500 dark:text-neutral-400 text-sm">
              Our graduates work at companies across the globe.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {COMPANIES.map((name, i) => (
              <span
                key={i}
                className="text-2xl font-medium text-slate-400 dark:text-neutral-500 tracking-tight hover:text-slate-600 dark:hover:text-neutral-300 transition-colors cursor-default"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ Section */}
      <section className="py-20 bg-sage-50 dark:bg-secondary-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-medium text-secondary-600 dark:text-white mb-4">
              {t('section.faq')}
            </h2>
          </div>
          <div className="space-y-3">
            {FAQ_KEYS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="card overflow-hidden bg-white dark:bg-secondary-800"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-medium text-secondary-600 dark:text-white pr-4">
                      {t(faq.q)}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-primary-500 flex-shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                    <p className="px-5 pb-5 text-slate-500 dark:text-neutral-300 leading-relaxed">
                      {t(faq.a)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. CTA Section */}
      <section className="py-20 bg-primary-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GraduationCap className="w-14 h-14 text-white mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-white mb-4 tracking-tight">
            Ready to start your career journey?
          </h2>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Join 50,000+ students building in-demand skills and launching careers with Digital Skills.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-primary-500 font-medium hover:bg-primary-50 transition-colors shadow-lg group"
          >
            {t('hero.cta')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-4 text-sm text-primary-100">{t('pricing.trial')}</p>
        </div>
      </section>
    </div>
  );
}
