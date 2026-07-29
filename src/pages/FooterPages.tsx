import { useState } from 'react';
import { Mail, Phone, MapPin, Send, ChevronDown, ChevronUp, Target, Heart, Award, Flag, Headset, Globe2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { TranslationKey } from '../i18n/translations';

export function AboutPage() {
  const { t } = useLanguage();
  return (
    <div className="pt-16 min-h-screen bg-neutral-light dark:bg-secondary-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <Flag className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-secondary-600 dark:text-white mb-3">{t('about.title')}</h1>
          <p className="text-lg text-secondary-400 dark:text-neutral-100">{t('about.description')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="card p-8">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center text-primary-500 mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-3">{t('about.mission')}</h2>
            <p className="text-secondary-400 dark:text-neutral-100">{t('about.mission_text')}</p>
          </div>
          <div className="card p-8">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center text-primary-500 mb-4">
              <Heart className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-3">{t('about.values')}</h2>
            <p className="text-secondary-400 dark:text-neutral-100">{t('about.values_text')}</p>
          </div>
        </div>

        <div className="card p-8 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-secondary-600 dark:to-secondary-800">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-8 h-8 text-primary-500" />
            <h2 className="text-2xl font-heading font-bold text-secondary-600 dark:text-white">{t('footer.liyah_group')}</h2>
          </div>
          <p className="text-secondary-400 dark:text-neutral-100">{t('about.liyah_text')}</p>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (session?.user) {
      // Logged-in visitors: create a real support ticket the admin team can see and answer.
      await supabase.from('support_tickets').insert({
        subject: `Contact form — ${form.name}`,
        description: `Email: ${form.email}\n\n${form.message}`,
      });
    }

    // Also open the visitor's own email client addressed to our support inbox,
    // since there is no backend email service configured yet.
    const subject = encodeURIComponent(`Contact Digital Skills — ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:cs@liafrik.com?cc=support@liafrik.com&subject=${subject}&body=${body}`;

    setSent(true);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="pt-16 min-h-screen bg-neutral-light dark:bg-secondary-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-secondary-600 dark:text-white mb-3 text-center">{t('contact.title')}</h1>
        <p className="text-center text-secondary-400 dark:text-neutral-100 mb-2">{t('footer.liyah_group')} — {t('footer.tagline')}</p>
        <p className="flex items-center justify-center gap-1.5 text-sm text-secondary-400 dark:text-neutral-100 mb-12">
          <Globe2 className="w-4 h-4" /> Support international — nous répondons partout en Afrique et au-delà
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center text-primary-500 mb-3">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-secondary-600 dark:text-white mb-1">Service client</h3>
            <p className="text-sm text-secondary-400 dark:text-neutral-100">cs@liafrik.com</p>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center text-primary-500 mb-3">
              <Headset className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-secondary-600 dark:text-white mb-1">Support technique</h3>
            <p className="text-sm text-secondary-400 dark:text-neutral-100">support@liafrik.com</p>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center text-primary-500 mb-3">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-secondary-600 dark:text-white mb-1">{t('contact.phone')}</h3>
            <p className="text-sm text-secondary-400 dark:text-neutral-100">+971 4 XXX XXXX</p>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center text-primary-500 mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-secondary-600 dark:text-white mb-1">{t('contact.address')}</h3>
            <p className="text-sm text-secondary-400 dark:text-neutral-100">Dubai, UAE — Head Office</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 max-w-lg mx-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('contact.name')}</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('contact.email')}</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('contact.message')}</label>
            <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-field" />
          </div>
          {sent && (
            <div className="p-3 rounded-lg bg-success-50 dark:bg-success-600/20 text-success-600 dark:text-success-400 text-sm">
              {t('contact.sent')}
            </div>
          )}
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <Send className="w-5 h-5" /> {t('contact.send')}
          </button>
        </form>
      </div>
    </div>
  );
}

export function TermsPage() {
  const { t } = useLanguage();
  const sections: { titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
    { titleKey: 'terms.s1_title', bodyKey: 'terms.s1_body' },
    { titleKey: 'terms.s2_title', bodyKey: 'terms.s2_body' },
    { titleKey: 'terms.s3_title', bodyKey: 'terms.s3_body' },
    { titleKey: 'terms.s4_title', bodyKey: 'terms.s4_body' },
    { titleKey: 'terms.s5_title', bodyKey: 'terms.s5_body' },
    { titleKey: 'terms.s6_title', bodyKey: 'terms.s6_body' },
    { titleKey: 'terms.s8_title', bodyKey: 'terms.s8_body' },
    { titleKey: 'terms.s9_title', bodyKey: 'terms.s9_body' },
    { titleKey: 'terms.s10_title', bodyKey: 'terms.s10_body' },
    { titleKey: 'terms.s11_title', bodyKey: 'terms.s11_body' },
    { titleKey: 'terms.s12_title', bodyKey: 'terms.s12_body' },
    { titleKey: 'terms.s7_title', bodyKey: 'terms.s7_body' },
  ];

  return (
    <div className="pt-16 min-h-screen bg-neutral-light dark:bg-secondary-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-secondary-600 dark:text-white mb-3">{t('terms.title')}</h1>
        <p className="text-secondary-400 dark:text-neutral-100 mb-8">{t('terms.updated')} {new Date().toLocaleDateString()}</p>

        <div className="card p-8 space-y-6 text-secondary-400 dark:text-neutral-100 leading-relaxed">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-2">{t(s.titleKey)}</h2>
              <p>{t(s.bodyKey)}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  const { t } = useLanguage();
  const sections: { titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
    { titleKey: 'privacy.s1_title', bodyKey: 'privacy.s1_body' },
    { titleKey: 'privacy.s2_title', bodyKey: 'privacy.s2_body' },
    { titleKey: 'privacy.s3_title', bodyKey: 'privacy.s3_body' },
    { titleKey: 'privacy.s4_title', bodyKey: 'privacy.s4_body' },
    { titleKey: 'privacy.s5_title', bodyKey: 'privacy.s5_body' },
    { titleKey: 'privacy.s6_title', bodyKey: 'privacy.s6_body' },
    { titleKey: 'privacy.s7_title', bodyKey: 'privacy.s7_body' },
    { titleKey: 'privacy.s8_title', bodyKey: 'privacy.s8_body' },
    { titleKey: 'privacy.s9_title', bodyKey: 'privacy.s9_body' },
    { titleKey: 'privacy.s10_title', bodyKey: 'privacy.s10_body' },
  ];

  return (
    <div className="pt-16 min-h-screen bg-neutral-light dark:bg-secondary-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-secondary-600 dark:text-white mb-3">{t('privacy.title')}</h1>
        <p className="text-secondary-400 dark:text-neutral-100 mb-8">{t('privacy.updated')} {new Date().toLocaleDateString()}</p>

        <div className="card p-8 space-y-6 text-secondary-400 dark:text-neutral-100 leading-relaxed">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-2">{t(s.titleKey)}</h2>
              <p>{t(s.bodyKey)}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FaqPage() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: { qKey: TranslationKey; aKey: TranslationKey }[] = [
    { qKey: 'faq.q1', aKey: 'faq.a1' },
    { qKey: 'faq.q2', aKey: 'faq.a2' },
    { qKey: 'faq.q3', aKey: 'faq.a3' },
    { qKey: 'faq.q4', aKey: 'faq.a4' },
    { qKey: 'faq.q5', aKey: 'faq.a5' },
    { qKey: 'faq.q6', aKey: 'faq.a6' },
    { qKey: 'faq.q7', aKey: 'faq.a7' },
    { qKey: 'faq.q8', aKey: 'faq.a8' },
  ];

  return (
    <div className="pt-16 min-h-screen bg-neutral-light dark:bg-secondary-700">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-secondary-600 dark:text-white mb-3 text-center">{t('faq.title')}</h1>
        <p className="text-center text-secondary-400 dark:text-neutral-100 mb-12">{t('footer.liyah_group')} — {t('footer.tagline')}</p>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-medium text-secondary-600 dark:text-white">{t(faq.qKey)}</span>
                {openIndex === i ? <ChevronUp className="w-5 h-5 text-primary-500 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-secondary-400 flex-shrink-0" />}
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 text-secondary-400 dark:text-neutral-100 animate-fade-in">
                  {t(faq.aKey)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
