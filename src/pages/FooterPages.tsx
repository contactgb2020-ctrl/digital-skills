import { useState } from 'react';
import { Mail, Phone, MapPin, Send, ChevronDown, ChevronUp, Target, Heart, Award, Flag } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
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
          <p className="text-secondary-400 dark:text-neutral-100">
            Digital Skills Africa est un produit de <strong className="text-primary-500">LIYAH GROUP</strong>,
            une entreprise camerounaise qui croit au potentiel de la jeunesse africaine.
            Notre plateforme est conçue, développée et opérée depuis le Cameroun, par des Africains, pour l'Afrique.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="pt-16 min-h-screen bg-neutral-light dark:bg-secondary-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-secondary-600 dark:text-white mb-3 text-center">{t('contact.title')}</h1>
        <p className="text-center text-secondary-400 dark:text-neutral-100 mb-12">{t('footer.liyah_group')} — {t('footer.tagline')}</p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center text-primary-500 mb-3">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-secondary-600 dark:text-white mb-1">{t('contact.email')}</h3>
            <p className="text-sm text-secondary-400 dark:text-neutral-100">contact@liyahgroup.com</p>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center text-primary-500 mb-3">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-secondary-600 dark:text-white mb-1">{t('contact.phone')}</h3>
            <p className="text-sm text-secondary-400 dark:text-neutral-100">+237 6XX XXX XXX</p>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center text-primary-500 mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-secondary-600 dark:text-white mb-1">{t('contact.address')}</h3>
            <p className="text-sm text-secondary-400 dark:text-neutral-100">Douala, Cameroun 🇨🇲</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 max-w-lg mx-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">Nom</label>
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
  return (
    <div className="pt-16 min-h-screen bg-neutral-light dark:bg-secondary-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-secondary-600 dark:text-white mb-3">{t('terms.title')}</h1>
        <p className="text-secondary-400 dark:text-neutral-100 mb-8">Dernière mise à jour : {new Date().toLocaleDateString()}</p>

        <div className="card p-8 space-y-6 text-secondary-400 dark:text-neutral-100 leading-relaxed">
          <section>
            <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-2">1. Acceptation des conditions</h2>
            <p>En accédant et en utilisant Digital Skills Africa, vous acceptez les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.</p>
          </section>
          <section>
            <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-2">2. Description du service</h2>
            <p>Digital Skills Africa est une plateforme d'apprentissage en ligne développée par LIYAH GROUP, connectant formateurs et apprenants. Les formateurs publient des cours, les apprenants s'abonnent pour y accéder.</p>
          </section>
          <section>
            <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-2">3. Comptes utilisateurs</h2>
            <p>Vous devez fournir des informations exactes lors de l'inscription. Une vérification d'identité (KYC) est requise pour accéder à certaines fonctionnalités. Vous êtes responsable de la sécurité de votre compte.</p>
          </section>
          <section>
            <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-2">4. Commissions formateurs</h2>
            <p>Les formateurs reçoivent une commission de 1$ par heure de visionnage effectif par les apprenants abonnés. Les paiements sont traités par LIYAH GROUP selon un cycle défini.</p>
          </section>
          <section>
            <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-2">5. Propriété intellectuelle</h2>
            <p>Les cours publiés restent la propriété de leurs formateurs. LIYAH GROUP dispose d'une licence pour diffuser ces contenus sur la plateforme.</p>
          </section>
          <section>
            <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-2">6. Limitation de responsabilité</h2>
            <p>LIYAH GROUP ne peut être tenu responsable des dommages indirects résultant de l'utilisation de la plateforme.</p>
          </section>
          <section>
            <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-2">7. Contact</h2>
            <p>Pour toute question relative aux conditions, contactez-nous à contact@liyahgroup.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  const { t } = useLanguage();
  return (
    <div className="pt-16 min-h-screen bg-neutral-light dark:bg-secondary-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-secondary-600 dark:text-white mb-3">{t('privacy.title')}</h1>
        <p className="text-secondary-400 dark:text-neutral-100 mb-8">Dernière mise à jour : {new Date().toLocaleDateString()}</p>

        <div className="card p-8 space-y-6 text-secondary-400 dark:text-neutral-100 leading-relaxed">
          <section>
            <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-2">1. Données collectées</h2>
            <p>Nous collectons : nom, email, localisation (pays, région, ville, quartier), documents d'identité (KYC), et données d'utilisation de la plateforme.</p>
          </section>
          <section>
            <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-2">2. Utilisation des données</h2>
            <p>Vos données servent à : créer et gérer votre compte, vérifier votre identité, personnaliser votre expérience, calculer les commissions formateurs, et améliorer nos services.</p>
          </section>
          <section>
            <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-2">3. Protection des données</h2>
            <p>Nous utilisons Supabase avec Row Level Security (RLS) pour garantir l'isolation des données. Vos documents KYC sont stockés de manière sécurisée et accessibles uniquement par les Super Admins autorisés.</p>
          </section>
          <section>
            <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-2">4. Partage des données</h2>
            <p>Nous ne partageons jamais vos données avec des tiers, sauf obligation légale. Les données sont hébergées sur des serveurs sécurisés.</p>
          </section>
          <section>
            <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-2">5. Vos droits</h2>
            <p>Vous pouvez accéder, modifier ou supprimer vos données à tout moment. Contactez-nous à contact@liyahgroup.com pour exercer ces droits.</p>
          </section>
          <section>
            <h2 className="text-xl font-heading font-semibold text-secondary-600 dark:text-white mb-2">6. Multi-tenant</h2>
            <p>Si vous appartenez à une organisation, vos données d'apprentissage sont isolées et accessibles uniquement aux membres de votre organisation et aux Super Admins.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function FaqPage() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: { q: string; a: string }[] = [
    { q: 'Qu\'est-ce que Digital Skills Africa ?', a: 'Une plateforme d\'apprentissage en ligne développée par LIYAH GROUP, 100% camerounaise, connectant formateurs et apprenants à travers l\'Afrique.' },
    { q: 'Comment m\'inscrire ?', a: 'Cliquez sur "S\'inscrire", choisissez votre rôle (Apprenant ou Formateur), renseignez votre localisation et téléchargez votre pièce d\'identité pour la vérification KYC.' },
    { q: 'Qu\'est-ce que la vérification KYC ?', a: 'C\'est la vérification de votre identité par téléversement d\'une pièce d\'identité. Elle est obligatoire pour accéder aux cours payants (apprenants) ou publier des cours (formateurs).' },
    { q: 'Combien coûte la plateforme ?', a: 'Pour les apprenants : 3 forfaits (Starter, Premium, Entreprise) avec période d\'essai. Pour les formateurs : le dashboard est 100% gratuit.' },
    { q: 'Comment sont rémunérés les formateurs ?', a: 'Les formateurs perçoivent 1$ par heure de visionnage effectif de leurs cours par les apprenants abonnés. Les gains sont visibles en temps réel sur leur dashboard.' },
    { q: 'Puis-je obtenir un certificat ?', a: 'Oui ! En complétant une formation à 100%, vous générez automatiquement un certificat avec identifiant unique, téléchargeable depuis votre dashboard.' },
    { q: 'La plateforme est-elle disponible en plusieurs langues ?', a: 'Oui, Digital Skills Africa est disponible en français et en anglais, avec un sélecteur de langue intégré.' },
    { q: 'Qui est LIYAH GROUP ?', a: 'LIYAH GROUP est l\'entreprise camerounaise qui développe et opère Digital Skills Africa. Fiers de notre identité africaine, nous bâtissons des solutions pour l\'Afrique.' },
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
                <span className="font-medium text-secondary-600 dark:text-white">{faq.q}</span>
                {openIndex === i ? <ChevronUp className="w-5 h-5 text-primary-500 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-secondary-400 flex-shrink-0" />}
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 text-secondary-400 dark:text-neutral-100 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
