import { useEffect, useState } from 'react';
import { ArrowRight, Code, Palette, BarChart3, Monitor, Sparkles, Users, Award, Wifi, Lock, CheckCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useRouter } from '../router/Router';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useCountUp } from '../hooks/useCountUp';
import type { TranslationKey } from '../i18n/translations';

const COURSE_IMAGES = {
  web: 'https://images.pexels.com/photos/270404/pexels-photo-270404.jpeg?auto=compress&cs=tinysrgb&w=600',
  marketing: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=600',
  beauty: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=600',
  data: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=600',
};

export default function LandingPage() {
  const { t } = useLanguage();
  const { navigate } = useRouter();

  const stats = [
    { key: 'stats.students' as TranslationKey, value: 12500, suffix: '+' },
    { key: 'stats.courses' as TranslationKey, value: 180, suffix: '+' },
    { key: 'stats.countries' as TranslationKey, value: 24, suffix: '' },
    { key: 'stats.certificates' as TranslationKey, value: 8900, suffix: '+' },
  ];

  const features = [
    { icon: Award, key: 'feature.1.title' as TranslationKey, desc: 'feature.1.desc' as TranslationKey },
    { icon: Wifi, key: 'feature.2.title' as TranslationKey, desc: 'feature.2.desc' as TranslationKey },
    { icon: CheckCircle, key: 'feature.3.title' as TranslationKey, desc: 'feature.3.desc' as TranslationKey },
    { icon: Users, key: 'feature.4.title' as TranslationKey, desc: 'feature.4.desc' as TranslationKey },
  ];

  const categories = [
    { icon: Code, key: 'category.web' as TranslationKey, image: COURSE_IMAGES.web },
    { icon: BarChart3, key: 'category.marketing' as TranslationKey, image: COURSE_IMAGES.marketing },
    { icon: Sparkles, key: 'category.beauty' as TranslationKey, image: COURSE_IMAGES.beauty },
    { icon: Palette, key: 'category.design' as TranslationKey, image: COURSE_IMAGES.data },
    { icon: BarChart3, key: 'category.data' as TranslationKey, image: COURSE_IMAGES.data },
    { icon: Monitor, key: 'category.office' as TranslationKey, image: COURSE_IMAGES.web },
  ];

  const popularCourses = [
    { title: 'Développement Web Full-Stack', category: 'category.web', image: COURSE_IMAGES.web, level: 'Intermédiaire', students: 2400 },
    { title: 'Marketing Digital & Réseaux Sociaux', category: 'category.marketing', image: COURSE_IMAGES.marketing, level: 'Débutant', students: 3100 },
    { title: 'Maquillage Professionnel', category: 'category.beauty', image: COURSE_IMAGES.beauty, level: 'Débutant', students: 1800 },
    { title: 'Introduction à la Data Science', category: 'category.data', image: COURSE_IMAGES.data, level: 'Avancé', students: 1500 },
  ];

  const testimonials = [
    { name: 'Aminata K.', country: 'Sénégal', text: "Grâce à Digital Skills Africa, j'ai appris le marketing digital et lancé mon propre business." },
    { name: 'Kwame O.', country: 'Ghana', text: "La formation en développement web m'a permis de décrocher mon premier emploi." },
    { name: 'Fatou B.', country: 'Côte d\'Ivoire', text: "J'ai appris la coiffure professionnelle et ouvert mon salon. Merci DSA!" },
  ];

  const whyRef = useScrollReveal();
  const coursesRef = useScrollReveal();
  const testimonialsRef = useScrollReveal();

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient dark:hero-gradient-dark min-h-[90vh] flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary-200 dark:bg-primary-600 rounded-full opacity-20 dark:opacity-10 blur-3xl animate-float"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary-200 dark:bg-secondary-500 rounded-full opacity-20 dark:opacity-10 blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="pill-badge animate-fade-in-down">
              <Sparkles className="w-4 h-4" />
              {t('section.categories')}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-secondary-600 dark:text-white leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
              {t('hero.title')}
            </h1>
            <p className="text-lg text-secondary-400 dark:text-neutral-100 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-wrap items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
              <button onClick={() => navigate('/signup')} className="btn-primary flex items-center gap-2 group">
                {t('hero.cta')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <span className="text-sm text-slate-500 dark:text-neutral-100">{t('pricing.trial')}</span>
            </div>
          </div>

          <div className="relative animate-scale-in" style={{ animationDelay: '0.4s', opacity: 0 }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="card p-6 hover:scale-105 transition-transform">
                  <Code className="w-10 h-10 text-primary-500 mb-3" />
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white">{t('category.web')}</h3>
                </div>
                <div className="card p-6 hover:scale-105 transition-transform">
                  <Sparkles className="w-10 h-10 text-primary-500 mb-3" />
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white">{t('category.beauty')}</h3>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="card p-6 hover:scale-105 transition-transform">
                  <BarChart3 className="w-10 h-10 text-primary-500 mb-3" />
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white">{t('category.marketing')}</h3>
                </div>
                <div className="card p-6 hover:scale-105 transition-transform">
                  <Palette className="w-10 h-10 text-primary-500 mb-3" />
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white">{t('category.design')}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-secondary-600 dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <StatCounter key={i} stat={stat} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary-600 dark:text-white mb-4">
            {t('section.categories')}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <div
                key={i}
                className="card p-5 text-center hover:scale-105 hover:shadow-xl cursor-pointer group"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center group-hover:bg-primary-500 transition-colors">
                  <Icon className="w-6 h-6 text-primary-500 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium text-secondary-600 dark:text-neutral-100">{t(cat.key)}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Popular courses */}
      <section ref={coursesRef.ref} className={`py-20 bg-neutral-light dark:bg-secondary-800 reveal ${coursesRef.visible ? 'visible' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-secondary-600 dark:text-white mb-4">
              {t('section.popular')}
            </h2>
            <p className="text-secondary-400 dark:text-neutral-100">{t('section.popular.subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularCourses.map((course, i) => (
              <div key={i} className="card overflow-hidden hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
                <div className="h-48 overflow-hidden relative">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/90 dark:bg-secondary-700/90 text-xs font-semibold text-secondary-600 dark:text-white">
                    {course.level}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-2 line-clamp-2">{course.title}</h3>
                  <div className="flex items-center justify-between text-sm text-secondary-400 dark:text-neutral-100">
                    <span>{course.students.toLocaleString()} {t('stats.students').toLowerCase()}</span>
                    <span className="text-primary-500 font-medium">{t('dashboard.start')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section ref={whyRef.ref} className={`py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal ${whyRef.visible ? 'visible' : ''}`}>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary-600 dark:text-white mb-4">
            {t('section.why')}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="card p-8 text-center hover:scale-105 transition-transform">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-2">{t(feature.key)}</h3>
                <p className="text-sm text-secondary-400 dark:text-neutral-100">{t(feature.desc)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section ref={testimonialsRef.ref} className={`py-20 bg-neutral-light dark:bg-secondary-800 reveal ${testimonialsRef.visible ? 'visible' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-secondary-600 dark:text-white mb-4">
              {t('section.testimonials')}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="card p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-primary-500">&#9733;</span>
                  ))}
                </div>
                <p className="text-secondary-400 dark:text-neutral-100 mb-4 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-secondary-600 dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-secondary-400 dark:text-neutral-100">{testimonial.country}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary-600 to-secondary-800 p-12 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full opacity-10 blur-3xl"></div>
          <Lock className="w-12 h-12 text-primary-400 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('pricing.trial')}</h2>
          <p className="text-secondary-200 mb-8 max-w-2xl mx-auto">{t('pricing.subtitle')}</p>
          <button onClick={() => navigate('/signup')} className="btn-primary inline-flex items-center gap-2 group">
            {t('hero.cta')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
}

function StatCounter({ stat, t }: { stat: { key: TranslationKey; value: number; suffix: string }; t: (k: TranslationKey) => string }) {
  const [start, setStart] = useState(false);
  const ref = useScrollReveal();
  const count = useCountUp(stat.value, 2000, start || ref.visible);

  useEffect(() => {
    if (ref.visible) setStart(true);
  }, [ref.visible]);

  return (
    <div ref={ref.ref} className="text-center">
      <div className="text-4xl lg:text-5xl font-bold text-primary-400 mb-2">
        {count.toLocaleString()}{stat.suffix}
      </div>
      <div className="text-secondary-200 text-sm">{t(stat.key)}</div>
    </div>
  );
}
