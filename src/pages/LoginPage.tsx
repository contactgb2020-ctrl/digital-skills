import { useState } from 'react';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import type { TranslationKey } from '../i18n/translations';

export default function LoginPage() {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email.trim(), password);

    if (signInError) {
      setError(signInError);
      setLoading(false);
      return;
    }

    navigate('/dashboard');
  };

  const getDashboardPath = (role?: string): string => {
    if (role === 'super_admin') return '/super-admin';
    if (role === 'trainer') return '/trainer';
    return '/dashboard';
  };

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-light to-primary-50 dark:from-secondary-700 dark:to-secondary-800 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-600 dark:text-white">{t('auth.login.title')}</h1>
            <p className="text-secondary-400 dark:text-neutral-100 mt-2">{t('auth.login.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-alert-50 dark:bg-alert-600/20 border border-alert-200 dark:border-alert-600 flex items-center gap-2 text-alert-600 dark:text-alert-400 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{t(error as TranslationKey)}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? t('auth.loading') : t('auth.login.button')}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-secondary-400 dark:text-neutral-100">
            {t('auth.no_account')}{' '}
            <button onClick={() => navigate('/signup')} className="text-primary-500 font-semibold hover:underline">
              {t('auth.signup.button')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
