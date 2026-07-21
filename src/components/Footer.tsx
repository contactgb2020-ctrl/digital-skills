import { useLanguage } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';

export default function Footer() {
  const { t } = useLanguage();

  const links: { label: TranslationKey }[] = [
    { label: 'footer.about' },
    { label: 'footer.contact' },
    { label: 'footer.terms' },
    { label: 'footer.privacy' },
  ];

  return (
    <footer className="bg-secondary-600 dark:bg-secondary-800 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <span className="text-white font-heading font-bold text-lg">D</span>
              </div>
              <span className="font-heading font-bold text-lg">
                Digital Skills <span className="text-primary-400">Africa</span>
              </span>
            </div>
            <p className="text-secondary-200 text-sm">{t('footer.tagline')}</p>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">{t('nav.courses')}</h4>
            <ul className="space-y-2 text-sm text-secondary-200">
              <li>{t('category.web')}</li>
              <li>{t('category.marketing')}</li>
              <li>{t('category.beauty')}</li>
              <li>{t('category.data')}</li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Liens</h4>
            <ul className="space-y-2 text-sm text-secondary-200">
              {links.map((link, i) => (
                <li key={i} className="hover:text-primary-400 cursor-pointer transition-colors">
                  {t(link.label)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-secondary-500 text-center text-sm text-secondary-200">
          &copy; {new Date().getFullYear()} Digital Skills Africa. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
