import { useState } from 'react';
import {
  Check,
  X,
  Star,
  Shield,
  Zap,
  Crown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import type { TranslationKey } from '../i18n/translations';

type PlanId = 'starter' | 'professional' | 'expert' | 'bundle';

interface Plan {
  id: PlanId;
  name: TranslationKey;
  price: number;
  desc: TranslationKey;
  icon: typeof Star;
  features: TranslationKey[];
  highlighted?: boolean;
  badge?: TranslationKey;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'pricing.starter',
    price: 189,
    desc: 'pricing.starter.desc',
    icon: Zap,
    features: [
      'pricing.feature.one_path',
      'pricing.feature.certificates',
      'pricing.feature.projects',
      'pricing.feature.portfolio',
      'pricing.feature.community',
      'pricing.trial',
    ],
  },
  {
    id: 'professional',
    name: 'pricing.professional',
    price: 249,
    desc: 'pricing.professional.desc',
    icon: Star,
    highlighted: true,
    badge: 'pricing.popular',
    features: [
      'pricing.feature.three_paths',
      'pricing.feature.certificates',
      'pricing.feature.projects',
      'pricing.feature.portfolio',
      'pricing.feature.priority_support',
      'pricing.feature.mentorship',
      'pricing.feature.download_resources',
    ],
  },
  {
    id: 'expert',
    name: 'pricing.expert',
    price: 290,
    desc: 'pricing.expert.desc',
    icon: Shield,
    features: [
      'pricing.feature.five_paths',
      'pricing.feature.certificates',
      'pricing.feature.projects',
      'pricing.feature.portfolio',
      'pricing.feature.career_coaching',
      'pricing.feature.community',
      'pricing.feature.priority_support',
    ],
  },
  {
    id: 'bundle',
    name: 'pricing.bundle',
    price: 499,
    desc: 'pricing.bundle.desc',
    icon: Crown,
    badge: 'pricing.best_value',
    features: [
      'pricing.feature.all_paths',
      'pricing.feature.certificates',
      'pricing.feature.projects',
      'pricing.feature.portfolio',
      'pricing.feature.employer_access',
      'pricing.feature.career_coaching',
      'pricing.feature.community',
      'pricing.feature.priority_support',
      'pricing.feature.mentorship',
    ],
  },
];

const trustBadges: { icon: typeof Shield; key: TranslationKey }[] = [
  { icon: Shield, key: 'trust.secure_payments' },
  { icon: Check, key: 'trust.money_back' },
  { icon: Star, key: 'trust.verified_certs' },
];

// Comparison table: rows = features, columns = the 4 plans
const comparisonRows: { label: TranslationKey; values: (boolean | string)[] }[] = [
  {
    label: 'pricing.feature.one_path',
    values: ['1', '3', '5', '∞'],
  },
  {
    label: 'pricing.feature.certificates',
    values: [true, true, true, true],
  },
  {
    label: 'pricing.feature.projects',
    values: [true, true, true, true],
  },
  {
    label: 'pricing.feature.portfolio',
    values: [true, true, true, true],
  },
  {
    label: 'pricing.feature.community',
    values: [false, false, true, true],
  },
  {
    label: 'pricing.feature.priority_support',
    values: [false, true, true, true],
  },
  {
    label: 'pricing.feature.mentorship',
    values: [false, true, false, true],
  },
  {
    label: 'pricing.feature.download_resources',
    values: [false, true, true, true],
  },
  {
    label: 'pricing.feature.career_coaching',
    values: [false, false, true, true],
  },
  {
    label: 'pricing.feature.employer_access',
    values: [false, false, false, true],
  },
];

const faqKeys: TranslationKey[] = [
  'faq.q4',
  'faq.q6',
  'faq.q7',
  'faq.q1',
  'faq.q3',
];

export default function PricingPage() {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const { session } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleCta = () => {
    navigate(session ? '/dashboard' : '/signup');
  };

  return (
    <div className="pt-16 min-h-screen bg-sage-50 dark:bg-secondary-700">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 pill-badge mb-6">
          <Sparkles className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-medium text-secondary-600 dark:text-neutral-100">
            {t('pricing.one_time')}
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-secondary-600 dark:text-white mb-4">
          {t('pricing.title')}
        </h1>
        <p className="text-lg sm:text-xl text-secondary-400 dark:text-neutral-100 max-w-2xl mx-auto">
          {t('pricing.subtitle')}
        </p>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {trustBadges.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="flex items-center gap-2 text-sm font-medium text-secondary-600 dark:text-neutral-100"
            >
              <Icon className="w-5 h-5 text-primary-500" />
              {t(key)}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 items-start">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isHighlighted = plan.highlighted;
            return (
              <div
                key={plan.id}
                className={`card p-6 lg:p-7 relative flex flex-col transition-all duration-300 ${
                  isHighlighted
                    ? 'ring-2 ring-primary-500 lg:scale-105 shadow-xl bg-white dark:bg-secondary-600'
                    : 'hover:shadow-lg bg-white dark:bg-secondary-600'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      isHighlighted
                        ? 'bg-primary-500 text-white'
                        : 'bg-secondary-600 text-white dark:bg-primary-500'
                    }`}
                  >
                    {t(plan.badge)}
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    isHighlighted
                      ? 'bg-primary-500 text-white'
                      : 'bg-sage-100 text-primary-500 dark:bg-secondary-500'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Name + desc */}
                <h2 className="text-xl font-medium text-secondary-600 dark:text-white mb-1">
                  {t(plan.name)}
                </h2>
                <p className="text-sm text-secondary-400 dark:text-neutral-100 mb-5 min-h-[2.5rem]">
                  {t(plan.desc)}
                </p>

                {/* Price */}
                <div className="mb-1">
                  <span className="text-4xl font-medium text-secondary-600 dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-lg font-medium text-secondary-400 dark:text-neutral-100 ml-1">{t('pricing.month')}</span>
                </div>
                <p className="text-xs text-secondary-400 dark:text-neutral-100 mb-6">
                  {t('pricing.trial')}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-secondary-600 dark:text-neutral-100"
                    >
                      <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                      <span>{t(feat)}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={handleCta}
                  className={`w-full ${isHighlighted ? 'btn-primary' : 'btn-outline'}`}
                >
                  {t('pricing.cta')}
                  <ArrowRight className="inline-block w-4 h-4 ml-2" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Money-back note */}
        <p className="text-center text-sm text-secondary-400 dark:text-neutral-100 mt-10 flex items-center justify-center gap-2">
          <Shield className="w-4 h-4 text-primary-500" />
          {t('pricing.money_back')}
        </p>
      </section>

      {/* Comparison table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="card p-0 overflow-hidden bg-white dark:bg-secondary-600">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sage-200 dark:border-secondary-500">
                  <th className="text-left p-5 text-sm font-medium text-secondary-600 dark:text-white min-w-[200px]">
                    {t('pricing.title')}
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className={`p-5 text-center min-w-[140px] ${
                        plan.highlighted ? 'bg-primary-50 dark:bg-secondary-500' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium text-secondary-600 dark:text-white">
                          {t(plan.name)}
                        </span>
                        <span className="text-lg font-medium text-primary-500">
                          ${plan.price}<span className="text-xs font-normal text-secondary-400">{t('pricing.month')}</span>
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-sage-100 dark:border-secondary-500 last:border-0"
                  >
                    <td className="p-5 text-sm text-secondary-600 dark:text-neutral-100 font-medium">
                      {t(row.label)}
                    </td>
                    {row.values.map((val, i) => (
                      <td
                        key={i}
                        className={`p-5 text-center ${
                          plans[i].highlighted ? 'bg-primary-50 dark:bg-secondary-500' : ''
                        }`}
                      >
                        {typeof val === 'boolean' ? (
                          val ? (
                            <Check className="w-5 h-5 text-success-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-secondary-300 dark:text-secondary-400 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium text-secondary-600 dark:text-white">
                            {val}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* CTA row */}
                <tr>
                  <td className="p-5"></td>
                  {plans.map((plan) => (
                    <td
                      key={plan.id}
                      className={`p-5 text-center ${
                        plan.highlighted ? 'bg-primary-50 dark:bg-secondary-500' : ''
                      }`}
                    >
                      <button
                        onClick={handleCta}
                        className={`text-sm whitespace-nowrap ${
                          plan.highlighted ? 'btn-primary' : 'btn-outline'
                        }`}
                      >
                        {t('pricing.cta')}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-3xl font-medium text-secondary-600 dark:text-white text-center mb-10">
          {t('faq.title')}
        </h2>
        <div className="space-y-3">
          {faqKeys.map((qKey, idx) => {
            const aKey = (`faq.a${idx + 4}`) as TranslationKey;
            const isOpen = openFaq === idx;
            return (
              <div
                key={qKey}
                className="card p-0 overflow-hidden bg-white dark:bg-secondary-600"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-secondary-600 dark:text-white">
                    {t(qKey)}
                  </span>
                  <span
                    className={`text-primary-500 text-xl flex-shrink-0 ml-4 transition-transform ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-secondary-400 dark:text-neutral-100">
                    {t(aKey)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="card p-10 lg:p-16 text-center bg-gradient-to-br from-primary-500 to-primary-600 border-0">
          <Sparkles className="w-10 h-10 text-white mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-medium text-white mb-4">
            {t('hero.cta')}
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
          <button
            onClick={handleCta}
            className="inline-flex items-center gap-2 bg-white text-primary-500 font-medium px-8 py-3 rounded-lg hover:bg-sage-50 transition-colors"
          >
            {t('pricing.cta')}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
