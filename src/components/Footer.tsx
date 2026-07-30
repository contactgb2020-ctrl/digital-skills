import { useLanguage } from '../i18n/LanguageContext';
import { useRouter } from '../router/Router';
import type { TranslationKey } from '../i18n/translations';

export default function Footer() {
  const { t } = useLanguage();
  const { navigate } = useRouter();

  const links: { label: TranslationKey; route: string }[] = [
    { label: 'footer.about', route: '/about' },
    { label: 'footer.contact', route: '/contact' },
    { label: 'footer.terms', route: '/terms' },
    { label: 'footer.privacy', route: '/privacy' },
    { label: 'footer.faq', route: '/faq' },
  ];

  return (
    <footer className="bg-secondary-600 dark:bg-secondary-800 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <span className="text-white font-heading font-medium text-lg">D</span>
              </div>
              <span className="font-heading font-medium text-lg">
                Digital <span className="text-primary-400">Skills</span>
              </span>
            </div>
            <p className="text-secondary-200 text-sm mb-3">{t('footer.tagline')}</p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 text-xs font-medium">
                {t('footer.liyah_group')}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-medium mb-4">{t('nav.courses')}</h4>
            <ul className="space-y-2 text-sm text-secondary-200">
              <li className="hover:text-primary-400 cursor-pointer transition-colors" onClick={() => navigate('/career-paths')}>{t('category.technology')}</li>
              <li className="hover:text-primary-400 cursor-pointer transition-colors" onClick={() => navigate('/career-paths')}>{t('category.business')}</li>
              <li className="hover:text-primary-400 cursor-pointer transition-colors" onClick={() => navigate('/career-paths')}>{t('category.beauty')}</li>
              <li className="hover:text-primary-400 cursor-pointer transition-colors" onClick={() => navigate('/career-paths')}>{t('category.creative')}</li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-medium mb-4">{t('footer.links')}</h4>
            <ul className="space-y-2 text-sm text-secondary-200">
              {links.map((link, i) => (
                <li key={i} className="hover:text-primary-400 cursor-pointer transition-colors" onClick={() => navigate(link.route)}>
                  {t(link.label)}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-medium mb-4">{t('footer.made_in_africa')}</h4>
            <p className="text-sm text-secondary-200 mb-2">
              {t('footer.liyah_group')} — {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-2 text-2xl">
              <span title="Dubai, UAE — Head Office">🇦🇪</span>
              <span title="Africa">🌍</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-secondary-500 text-center text-sm text-secondary-200">
          &copy; {new Date().getFullYear()} Digital Skills — {t('footer.liyah_group')}. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
