import { useState, useEffect } from 'react';
import { Mail, Lock, User, AlertCircle, ArrowRight, ArrowLeft, CheckCircle, MapPin, Plus } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Country, Region, City, District } from '../types';
import type { TranslationKey as TKey } from '../i18n/translations';

const PLANS = [
  { id: 'starter', nameKey: 'pricing.starter' as TKey, price: 14 },
  { id: 'premium', nameKey: 'pricing.premium' as TKey, price: 29 },
  { id: 'enterprise', nameKey: 'pricing.enterprise' as TKey, price: 89 },
];

export default function SignupPage() {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const { signUp } = useAuth();

  const [step, setStep] = useState(1);
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Location state
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Custom location inputs
  const [customMode, setCustomMode] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState('');

  const [selectedPlan, setSelectedPlan] = useState('starter');

  // Load countries on mount
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('countries').select('*').order('name');
      if (data) setCountries(data as Country[]);
    })();
  }, []);

  // Load regions when country changes
  useEffect(() => {
    if (!selectedCountry) {
      setRegions([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('regions')
        .select('*')
        .eq('country_id', selectedCountry)
        .order('name');
      if (data) setRegions(data as Region[]);
    })();
    setRegions([]);
    setSelectedRegion('');
    setSelectedCity('');
    setSelectedDistrict('');
    setCities([]);
    setDistricts([]);
  }, [selectedCountry]);

  // Load cities when region changes
  useEffect(() => {
    if (!selectedRegion) {
      setCities([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('cities')
        .select('*')
        .eq('region_id', selectedRegion)
        .order('name');
      if (data) setCities(data as City[]);
    })();
    setCities([]);
    setSelectedCity('');
    setSelectedDistrict('');
    setDistricts([]);
  }, [selectedRegion]);

  // Load districts when city changes
  useEffect(() => {
    if (!selectedCity) {
      setDistricts([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('districts')
        .select('*')
        .eq('city_id', selectedCity)
        .order('name');
      if (data) setDistricts(data as District[]);
    })();
    setDistricts([]);
    setSelectedDistrict('');
  }, [selectedCity]);

  const [pendingSuggestion, setPendingSuggestion] = useState<{ level: string; parentId: string | null; name: string } | null>(null);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('auth.error.weak_password');
      return;
    }
    if (password.length < 6) {
      setError('auth.error.weak_password');
      return;
    }
    setStep(2);
  };

  const handleLocationNext = () => {
    setError(null);

    // Store custom location for submission after signup
    if (customMode && customValue.trim()) {
      let parentId: string | null = null;
      if (customMode === 'region') parentId = selectedCountry || null;
      else if (customMode === 'city') parentId = selectedRegion || null;
      else if (customMode === 'district') parentId = selectedCity || null;

      setPendingSuggestion({ level: customMode, parentId, name: customValue.trim() });
    }

    setStep(3);
  };

  const handleFinish = async () => {
    setError(null);
    setLoading(true);

    const { error: signUpError } = await signUp(email.trim(), password, nom.trim());

    if (signUpError) {
      setError(signUpError);
      setLoading(false);
      return;
    }

    // Wait briefly for session to propagate after signUp
    await new Promise((r) => setTimeout(r, 300));
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (user) {
      await supabase.from('profiles').update({
        nom: nom.trim(),
        country_id: selectedCountry || null,
        region_id: selectedRegion || null,
        city_id: selectedCity || null,
        district_id: selectedDistrict || null,
      }).eq('id', user.id);

      // Submit pending location suggestion
      if (pendingSuggestion) {
        await supabase.from('location_suggestions').insert({
          level: pendingSuggestion.level,
          parent_id: pendingSuggestion.parentId,
          proposed_name: pendingSuggestion.name,
          user_id: user.id,
        });
      }

      // Create trial subscription
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3);

      await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan: selectedPlan,
        status: 'trial',
        end_date: endDate.toISOString(),
      });
    }

    setLoading(false);
    navigate('/dashboard');
  };

  const steps = [1, 2, 3, 4];

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-light to-primary-50 dark:from-secondary-700 dark:to-secondary-800 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="card p-8">
          {/* Progress bar */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    step >= s
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-secondary-500 text-secondary-400'
                  }`}
                >
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${step > s ? 'bg-primary-500' : 'bg-gray-200 dark:bg-secondary-500'}`} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-alert-50 dark:bg-alert-600/20 border border-alert-200 dark:border-alert-600 flex items-center gap-2 text-alert-600 dark:text-alert-400 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{t(error as TKey)}</span>
            </div>
          )}

          {/* Step 1: Info */}
          {step === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-bold text-secondary-600 dark:text-white mb-4">{t('onboarding.step1')}</h2>

              <div>
                <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('auth.name')}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input type="text" required value={nom} onChange={(e) => setNom(e.target.value)} className="input-field pl-10" placeholder="Aminata Koné" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="vous@exemple.com" autoComplete="email" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-10" placeholder="••••••••" autoComplete="new-password" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('auth.confirm_password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field pl-10" placeholder="••••••••" autoComplete="new-password" />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                {t('onboarding.next')}
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-center text-sm text-secondary-400 dark:text-neutral-100">
                {t('auth.has_account')}{' '}
                <button type="button" onClick={() => navigate('/login')} className="text-primary-500 font-semibold hover:underline">
                  {t('auth.login.button')}
                </button>
              </p>
            </form>
          )}

          {/* Step 2: Location cascade */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                <h2 className="text-xl font-bold text-secondary-600 dark:text-white">{t('onboarding.location')}</h2>
              </div>
              <p className="text-sm text-secondary-400 dark:text-neutral-100 mb-4">{t('onboarding.location.subtitle')}</p>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('onboarding.country')}</label>
                <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="input-field">
                  <option value="">{t('onboarding.select_country')}</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Region */}
              {selectedCountry && (
                <div className="animate-fade-in-up">
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('onboarding.region')}</label>
                  {customMode === 'region' ? (
                    <div className="flex gap-2">
                      <input type="text" value={customValue} onChange={(e) => setCustomValue(e.target.value)} className="input-field" placeholder="Nom de la région" />
                      <button type="button" onClick={() => { setCustomMode(null); setCustomValue(''); }} className="px-3 rounded-lg bg-gray-100 dark:bg-secondary-600 text-secondary-400 dark:text-white">✕</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="input-field flex-1">
                        <option value="">{t('onboarding.select_region')}</option>
                        {regions.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => setCustomMode('region')} className="px-3 rounded-lg bg-primary-50 dark:bg-secondary-600 text-primary-500 flex items-center gap-1 text-sm whitespace-nowrap">
                        <Plus className="w-4 h-4" /> {t('onboarding.add_own')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* City */}
              {(selectedRegion || customMode === 'region') && (
                <div className="animate-fade-in-up">
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('onboarding.city')}</label>
                  {customMode === 'city' ? (
                    <div className="flex gap-2">
                      <input type="text" value={customValue} onChange={(e) => setCustomValue(e.target.value)} className="input-field" placeholder="Nom de la ville" />
                      <button type="button" onClick={() => { setCustomMode(null); setCustomValue(''); }} className="px-3 rounded-lg bg-gray-100 dark:bg-secondary-600 text-secondary-400 dark:text-white">✕</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="input-field flex-1" disabled={customMode === 'region'}>
                        <option value="">{t('onboarding.select_city')}</option>
                        {cities.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => setCustomMode('city')} className="px-3 rounded-lg bg-primary-50 dark:bg-secondary-600 text-primary-500 flex items-center gap-1 text-sm whitespace-nowrap">
                        <Plus className="w-4 h-4" /> {t('onboarding.add_own')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* District */}
              {(selectedCity || customMode === 'city') && (
                <div className="animate-fade-in-up">
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('onboarding.district')}</label>
                  {customMode === 'district' ? (
                    <div className="flex gap-2">
                      <input type="text" value={customValue} onChange={(e) => setCustomValue(e.target.value)} className="input-field" placeholder="Nom du quartier" />
                      <button type="button" onClick={() => { setCustomMode(null); setCustomValue(''); }} className="px-3 rounded-lg bg-gray-100 dark:bg-secondary-600 text-secondary-400 dark:text-white">✕</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="input-field flex-1">
                        <option value="">{t('onboarding.select_district')}</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => setCustomMode('district')} className="px-3 rounded-lg bg-primary-50 dark:bg-secondary-600 text-primary-500 flex items-center gap-1 text-sm whitespace-nowrap">
                        <Plus className="w-4 h-4" /> {t('onboarding.add_own')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-outline flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" /> {t('onboarding.back')}
                </button>
                <button type="button" onClick={handleLocationNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {t('onboarding.next')}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Plan */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-bold text-secondary-600 dark:text-white mb-4">{t('onboarding.step3')}</h2>
              <div className="space-y-3">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedPlan === plan.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-600/20'
                        : 'border-gray-200 dark:border-secondary-500 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-secondary-600 dark:text-white">{t(plan.nameKey)}</div>
                        <div className="text-sm text-secondary-400 dark:text-neutral-100">${plan.price}{t('pricing.month')}</div>
                      </div>
                      {selectedPlan === plan.id && <CheckCircle className="w-6 h-6 text-primary-500" />}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(2)} className="btn-outline flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" /> {t('onboarding.back')}
                </button>
                <button type="button" onClick={() => setStep(4)} className="btn-primary flex-1">
                  {t('onboarding.next')}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Trial confirmation */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-success-100 dark:bg-success-600/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success-500" />
              </div>
              <h2 className="text-xl font-bold text-secondary-600 dark:text-white">{t('onboarding.trial')}</h2>
              <p className="text-sm text-secondary-400 dark:text-neutral-100">{t('pricing.subtitle')}</p>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(3)} className="btn-outline flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" /> {t('onboarding.back')}
                </button>
                <button type="button" onClick={handleFinish} disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
                  {loading ? t('auth.loading') : t('onboarding.finish')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
