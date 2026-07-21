import { Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import type { TranslationKey } from '../i18n/translations';

export default function PricingPage() {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const { session } = useAuth();

  const plans = [
    {
      id: 'starter',
      name: 'pricing.starter' as TranslationKey,
      price: 14,
      desc: 'pricing.starter.desc' as TranslationKey,
      features: [
        'pricing.feature.basic',
        'pricing.feature.hd',
        'pricing.feature.pdf',
        'pricing.feature.quiz',
        'pricing.feature.progress',
      ] as TranslationKey[],
      highlighted: false,
    },
    {
      id: 'premium',
      name: 'pricing.premium' as TranslationKey,
      price: 29,
      desc: 'pricing.premium.desc' as TranslationKey,
      features: [
        'pricing.feature.all_courses',
        'pricing.feature.certificates',
        'pricing.feature.projects',
        'pricing.feature.community',
        'pricing.feature.hd',
        'pricing.feature.progress',
      ] as TranslationKey[],
      highlighted: true,
    },
    {
      id: 'enterprise',
      name: 'pricing.enterprise' as TranslationKey,
      price: 89,
      desc: 'pricing.enterprise.desc' as TranslationKey,
      features: [
        'pricing.feature.team',
        'pricing.feature.manage_employees',
        'pricing.feature.advanced_stats',
        'pricing.feature.priority_support',
        'pricing.feature.all_courses',
        'pricing.feature.certificates',
      ] as TranslationKey[],
      highlighted: false,
    },
  ];

  return (
    <div className="pt-16 min-h-screen bg-neutral-light dark:bg-secondary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-secondary-600 dark:text-white mb-4">{t('pricing.title')}</h1>
          <p className="text-lg text-secondary-400 dark:text-neutral-100">{t('pricing.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`card p-8 relative ${plan.highlighted ? 'ring-2 ring-primary-500 scale-105' : ''}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary-500 text-white text-sm font-semibold">
                  {t('pricing.popular')}
                </div>
              )}
              <h2 className="text-xl font-heading font-bold text-secondary-600 dark:text-white mb-1">{t(plan.name)}</h2>
              <p className="text-sm text-secondary-400 dark:text-neutral-100 mb-4">{t(plan.desc)}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-secondary-600 dark:text-white">${plan.price}</span>
                <span className="text-secondary-400 dark:text-neutral-100">{t('pricing.month')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-secondary-600 dark:text-neutral-100">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0" />
                    {t(feat)}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate(session ? '/dashboard' : '/signup')}
                className={`w-full ${plan.highlighted ? 'btn-primary' : 'btn-outline'}`}
              >
                {t('pricing.cta')}
              </button>
              <p className="text-center text-xs text-secondary-400 dark:text-neutral-100 mt-3">{t('pricing.trial')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
