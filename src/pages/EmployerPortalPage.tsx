import { useState, useEffect } from 'react';
import {
  Search,
  Users,
  Award,
  Briefcase,
  Save,
  X,
  CheckCircle,
  XCircle,
  Building2,
  Star,
  Download,
  Mail,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { TranslationKey as TKey } from '../i18n/translations';

interface GraduateResult {
  id: string;
  nom: string;
  email: string;
  avatar: string | null;
  portfolio_id: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  skills: string[];
  certificate_count: number;
}

interface SavedCandidateRow {
  id: string;
  student_id: string;
  notes: string | null;
  created_at: string;
  student: {
    nom: string;
    email: string;
    avatar: string | null;
  } | null;
  portfolio: {
    id: string;
    headline: string | null;
    skills: string[];
  } | null;
}

interface VerifiedCertificate {
  id: string;
  certificate_number: string;
  created_at: string;
  holder_name: string;
  path_title: string | null;
  score: number | null;
}

type Tab = 'search' | 'saved' | 'verify';

export default function EmployerPortalPage() {
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const { session, profile } = useAuth();

  const [tab, setTab] = useState<Tab>('search');
  const [searchQuery, setSearchQuery] = useState('');

  const [graduates, setGraduates] = useState<GraduateResult[]>([]);
  const [graduatesLoading, setGraduatesLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const [savedCandidates, setSavedCandidates] = useState<SavedCandidateRow[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);

  const [certId, setCertId] = useState('');
  const [certVerifying, setCertVerifying] = useState(false);
  const [certResult, setCertResult] = useState<{ valid: boolean; data: VerifiedCertificate | null } | null>(null);

  // Load all graduates (students with public portfolios)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setGraduatesLoading(true);
      try {
        // Fetch student profiles
        const { data: students, error: studentsErr } = await supabase
          .from('profiles')
          .select('id, nom, email, avatar')
          .eq('role', 'student');
        if (studentsErr) throw studentsErr;
        const studentRows = (students || []) as { id: string; nom: string; email: string; avatar: string | null }[];

        // Fetch public portfolios for those students
        const studentIds = studentRows.map((s) => s.id);
        let portfolios: { user_id: string; id: string; headline: string | null; bio: string | null; avatar_url: string | null; skills: string[] }[] = [];
        if (studentIds.length > 0) {
          const { data: portData, error: portErr } = await supabase
            .from('portfolios')
            .select('user_id, id, headline, bio, avatar_url, skills')
            .eq('is_public', true)
            .in('user_id', studentIds);
          if (portErr) throw portErr;
          portfolios = (portData || []) as typeof portfolios;
        }

        // Fetch certificate counts per user
        const certCounts: Record<string, number> = {};
        if (studentIds.length > 0) {
          const { data: certData } = await supabase
            .from('certificates')
            .select('user_id')
            .in('user_id', studentIds);
          if (certData) {
            for (const c of certData as { user_id: string }[]) {
              certCounts[c.user_id] = (certCounts[c.user_id] || 0) + 1;
            }
          }
        }

        const portByUser = new Map(portfolios.map((p) => [p.user_id, p]));
        const merged: GraduateResult[] = studentRows
          .filter((s) => portByUser.has(s.id)) // only students with a public portfolio
          .map((s) => {
            const p = portByUser.get(s.id)!;
            return {
              id: s.id,
              nom: s.nom,
              email: s.email,
              avatar: s.avatar,
              portfolio_id: p.id,
              headline: p.headline,
              bio: p.bio,
              avatar_url: p.avatar_url,
              skills: p.skills || [],
              certificate_count: certCounts[s.id] || 0,
            };
          });

        if (mounted) setGraduates(merged);
      } catch (e) {
        console.error('Error loading graduates:', e);
        if (mounted) setGraduates([]);
      } finally {
        if (mounted) setGraduatesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load saved candidates + saved id set for the current employer
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!session?.user) {
        if (mounted) {
          setSavedCandidates([]);
          setSavedLoading(false);
        }
        return;
      }
      setSavedLoading(true);
      try {
        const { data, error } = await supabase
          .from('saved_candidates')
          .select('id, student_id, notes, created_at')
          .eq('employer_id', session.user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        const rows = (data || []) as SavedCandidateRow[];

        // Hydrate student profiles + portfolios
        const studentIds = rows.map((r) => r.student_id);
        const profileMap = new Map<string, { nom: string; email: string; avatar: string | null }>();
        const portMap = new Map<string, { id: string; headline: string | null; skills: string[] }>();

        if (studentIds.length > 0) {
          const [profRes, portRes] = await Promise.all([
            supabase.from('profiles').select('id, nom, email, avatar').in('id', studentIds),
            supabase.from('portfolios').select('user_id, id, headline, skills').in('user_id', studentIds),
          ]);
          if (profRes.data) {
            for (const p of profRes.data as { id: string; nom: string; email: string; avatar: string | null }[]) {
              profileMap.set(p.id, { nom: p.nom, email: p.email, avatar: p.avatar });
            }
          }
          if (portRes.data) {
            for (const p of portRes.data as { user_id: string; id: string; headline: string | null; skills: string[] }[]) {
              portMap.set(p.user_id, { id: p.id, headline: p.headline, skills: p.skills || [] });
            }
          }
        }

        const hydrated = rows.map((r) => ({
          ...r,
          student: profileMap.get(r.student_id) || null,
          portfolio: portMap.get(r.student_id) || null,
        }));

        if (mounted) {
          setSavedCandidates(hydrated);
          setSavedIds(new Set(rows.map((r) => r.student_id)));
        }
      } catch (e) {
        console.error('Error loading saved candidates:', e);
        if (mounted) setSavedCandidates([]);
      } finally {
        if (mounted) setSavedLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [session]);

  // Filter graduates by search query (skill, name, career path / headline)
  const filteredGraduates = graduates.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.nom.toLowerCase().includes(q) ||
      (g.headline || '').toLowerCase().includes(q) ||
      (g.bio || '').toLowerCase().includes(q) ||
      (g.skills || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  const saveCandidate = async (studentId: string) => {
    if (!session?.user) {
      navigate('/login');
      return;
    }
    if (savedIds.has(studentId)) return;
    const { data, error } = await supabase
      .from('saved_candidates')
      .insert({ employer_id: session.user.id, student_id: studentId })
      .select('id, student_id, notes, created_at')
      .single();
    if (error) {
      console.error('Error saving candidate:', error);
      return;
    }
    const newRow = data as SavedCandidateRow;
    setSavedIds((prev) => new Set(prev).add(studentId));
    // hydrate immediately for the saved tab
    const grad = graduates.find((g) => g.id === studentId);
    setSavedCandidates((prev) => [
      {
        ...newRow,
        student: grad ? { nom: grad.nom, email: grad.email, avatar: grad.avatar } : null,
        portfolio: grad
          ? { id: grad.portfolio_id || '', headline: grad.headline, skills: grad.skills }
          : null,
      },
      ...prev,
    ]);
  };

  const removeCandidate = async (id: string, studentId: string) => {
    const { error } = await supabase.from('saved_candidates').delete().eq('id', id);
    if (error) {
      console.error('Error removing candidate:', error);
      return;
    }
    setSavedCandidates((prev) => prev.filter((c) => c.id !== id));
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
  };

  const verifyCertificate = async () => {
    const id = certId.trim();
    if (!id) return;
    setCertVerifying(true);
    setCertResult(null);
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('id, certificate_number, user_id, course_id, created_at')
        .or(`id.eq.${id},certificate_number.eq.${id}`)
        .maybeSingle();
      if (error || !data) {
        setCertResult({ valid: false, data: null });
        return;
      }
      const cert = data as {
        id: string;
        certificate_number: string;
        user_id: string;
        course_id: string;
        created_at: string;
      };

      // Fetch holder name
      let holder_name = '—';
      const { data: prof } = await supabase
        .from('profiles')
        .select('nom')
        .eq('id', cert.user_id)
        .maybeSingle();
      if (prof) holder_name = (prof as { nom: string }).nom;

      // Fetch path title (try career_paths via course, fallback to course title)
      let path_title: string | null = null;
      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', cert.course_id)
        .maybeSingle();
      if (course) path_title = (course as { title: string }).title;

      // Fetch best quiz score for the user on this course's quizzes
      let score: number | null = null;
      const { data: attempt } = await supabase
        .from('quiz_attempts')
        .select('score')
        .eq('user_id', cert.user_id)
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (attempt) score = (attempt as { score: number }).score;

      setCertResult({
        valid: true,
        data: {
          id: cert.id,
          certificate_number: cert.certificate_number,
          created_at: cert.created_at,
          holder_name,
          path_title,
          score,
        },
      });
    } catch (e) {
      console.error('Error verifying certificate:', e);
      setCertResult({ valid: false, data: null });
    } finally {
      setCertVerifying(false);
    }
  };

  const tabs: { key: Tab; labelKey: TKey; icon: React.ReactNode }[] = [
    { key: 'search', labelKey: 'employer.search_grads', icon: <Search className="w-4 h-4" /> },
    { key: 'saved', labelKey: 'employer.saved_candidates', icon: <Users className="w-4 h-4" /> },
    { key: 'verify', labelKey: 'employer.verify_cert', icon: <Award className="w-4 h-4" /> },
  ];

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-sage-50 dark:bg-secondary-700">
      {/* Header */}
      <div className="bg-white dark:bg-secondary-700 border-b border-slate-100 dark:border-secondary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-primary-500 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-extrabold text-secondary-600 dark:text-white">
                {t('employer.title')}
              </h1>
              <p className="text-sm text-secondary-400 dark:text-neutral-100">
                {profile?.nom ? `${t('employer.company')}: ${profile.nom}` : t('employer.candidates')}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mt-6">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${
                  tab === tb.key
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-secondary-600 text-secondary-600 dark:text-neutral-100 hover:bg-slate-100 dark:hover:bg-secondary-500'
                }`}
              >
                {tb.icon}
                {t(tb.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SEARCH GRADUATES */}
        {tab === 'search' && (
          <div>
            {/* Search bar */}
            <div className="relative max-w-2xl mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('employer.search_placeholder')}
                className="input-field pl-12"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-secondary-400 hover:text-secondary-600 hover:bg-slate-100 dark:hover:bg-secondary-600"
                  aria-label={t('common.close')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {graduatesLoading ? (
              <div className="text-center py-16 text-secondary-400 dark:text-neutral-100">
                {t('common.loading')}
              </div>
            ) : filteredGraduates.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
                  <Search className="w-10 h-10 text-primary-500" />
                </div>
                <p className="text-secondary-600 dark:text-white font-semibold mb-1">
                  {t('employer.no_candidates')}
                </p>
                <p className="text-sm text-secondary-400 dark:text-neutral-100">
                  {t('employer.search_placeholder')}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGraduates.map((g) => (
                  <div key={g.id} className="card p-5 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                        {g.avatar_url || g.avatar ? (
                          <img
                            src={g.avatar_url || g.avatar || ''}
                            alt={g.nom}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-primary-500 font-bold text-lg">
                            {g.nom.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading font-semibold text-secondary-600 dark:text-white truncate">
                          {g.nom}
                        </h3>
                        <p className="text-xs text-secondary-400 dark:text-neutral-100 truncate">
                          {g.headline || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(g.skills || []).slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-secondary-600 text-primary-500 text-xs font-medium"
                        >
                          {s}
                        </span>
                      ))}
                      {(g.skills || []).length > 4 && (
                        <span className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-secondary-600 text-secondary-400 dark:text-neutral-100 text-xs font-medium">
                          +{g.skills.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Cert count */}
                    <div className="flex items-center gap-2 text-sm text-secondary-400 dark:text-neutral-100 mb-4">
                      <Award className="w-4 h-4 text-primary-500" />
                      <span className="font-medium text-secondary-600 dark:text-white">
                        {g.certificate_count}
                      </span>
                      {t('employer.certified').toLowerCase()}
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex gap-2">
                      <button
                        onClick={() => g.portfolio_id && navigate(`/portfolio/${g.portfolio_id}`)}
                        className="btn-outline text-sm px-4 py-2 flex-1 inline-flex items-center justify-center gap-1.5"
                      >
                        <Briefcase className="w-4 h-4" />
                        {t('employer.view_portfolios')}
                      </button>
                      <button
                        onClick={() => saveCandidate(g.id)}
                        disabled={savedIds.has(g.id)}
                        className={`text-sm px-4 py-2 rounded-[10px] font-semibold inline-flex items-center justify-center gap-1.5 transition-all ${
                          savedIds.has(g.id)
                            ? 'bg-success-500 text-white cursor-default'
                            : 'btn-primary'
                        }`}
                      >
                        {savedIds.has(g.id) ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            {t('common.save')}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {t('employer.save_candidate')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SAVED CANDIDATES */}
        {tab === 'saved' && (
          <div>
            {savedLoading ? (
              <div className="text-center py-16 text-secondary-400 dark:text-neutral-100">
                {t('common.loading')}
              </div>
            ) : savedCandidates.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
                  <Users className="w-10 h-10 text-primary-500" />
                </div>
                <p className="text-secondary-600 dark:text-white font-semibold mb-1">
                  {t('employer.no_candidates')}
                </p>
                <button
                  onClick={() => setTab('search')}
                  className="btn-primary mt-4 text-sm px-4 py-2"
                >
                  {t('employer.search_grads')}
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedCandidates.map((c) => (
                  <div key={c.id} className="card p-5 hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                        {c.student?.avatar ? (
                          <img
                            src={c.student.avatar}
                            alt={c.student?.nom || ''}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-primary-500 font-bold text-lg">
                            {(c.student?.nom || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading font-semibold text-secondary-600 dark:text-white truncate">
                          {c.student?.nom || '—'}
                        </h3>
                        <p className="text-xs text-secondary-400 dark:text-neutral-100 truncate">
                          {c.portfolio?.headline || c.student?.email || ''}
                        </p>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(c.portfolio?.skills || []).slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-secondary-600 text-primary-500 text-xs font-medium"
                        >
                          {s}
                        </span>
                      ))}
                      {(c.portfolio?.skills || []).length > 4 && (
                        <span className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-secondary-600 text-secondary-400 dark:text-neutral-100 text-xs font-medium">
                          +{c.portfolio!.skills.length - 4}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex gap-2">
                      <button
                        onClick={() => c.portfolio?.id && navigate(`/portfolio/${c.portfolio.id}`)}
                        className="btn-outline text-sm px-4 py-2 flex-1 inline-flex items-center justify-center gap-1.5"
                      >
                        <Briefcase className="w-4 h-4" />
                        {t('employer.view_portfolios')}
                      </button>
                      <button
                        onClick={() => removeCandidate(c.id, c.student_id)}
                        className="text-sm px-4 py-2 rounded-[10px] font-semibold border-2 border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-secondary-600 active:scale-95 transition-all inline-flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        {t('employer.remove_candidate')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VERIFY CERTIFICATE */}
        {tab === 'verify' && (
          <div className="max-w-2xl">
            <div className="card p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-secondary-600 dark:text-white">
                    {t('employer.verify_cert_id')}
                  </h2>
                  <p className="text-sm text-secondary-400 dark:text-neutral-100">
                    {t('cert.enter_id')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && verifyCertificate()}
                  placeholder={t('cert.id')}
                  className="input-field flex-1"
                />
                <button
                  onClick={verifyCertificate}
                  disabled={!certId.trim() || certVerifying}
                  className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {certVerifying ? (
                    <>
                      <Search className="w-4 h-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      {t('cert.verify_button')}
                    </>
                  )}
                </button>
              </div>

              {/* Result */}
              {certResult && (
                <div className="mt-6">
                  {certResult.valid && certResult.data ? (
                    <div className="rounded-2xl border border-success-200 bg-success-50 dark:bg-success-600/10 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-6 h-6 text-success-500" />
                        <h3 className="font-heading font-bold text-success-600 dark:text-success-400">
                          {t('employer.cert_valid')}
                        </h3>
                      </div>
                      <dl className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-xs font-medium text-secondary-400 dark:text-neutral-100 uppercase tracking-wide">
                            {t('cert.holder')}
                          </dt>
                          <dd className="text-secondary-600 dark:text-white font-semibold mt-0.5">
                            {certResult.data.holder_name}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-secondary-400 dark:text-neutral-100 uppercase tracking-wide">
                            {t('cert.id')}
                          </dt>
                          <dd className="text-secondary-600 dark:text-white font-semibold mt-0.5 font-mono text-sm break-all">
                            {certResult.data.certificate_number || certResult.data.id}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-secondary-400 dark:text-neutral-100 uppercase tracking-wide">
                            {t('employer.path')}
                          </dt>
                          <dd className="text-secondary-600 dark:text-white font-semibold mt-0.5">
                            {certResult.data.path_title || '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-secondary-400 dark:text-neutral-100 uppercase tracking-wide">
                            {t('cert.completion_date')}
                          </dt>
                          <dd className="text-secondary-600 dark:text-white font-semibold mt-0.5">
                            {formatDate(certResult.data.created_at)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-secondary-400 dark:text-neutral-100 uppercase tracking-wide">
                            {t('cert.score')}
                          </dt>
                          <dd className="text-secondary-600 dark:text-white font-semibold mt-0.5 inline-flex items-center gap-1">
                            <Star className="w-4 h-4 text-primary-500" />
                            {certResult.data.score != null ? `${certResult.data.score}%` : '—'}
                          </dd>
                        </div>
                      </dl>
                      <button className="btn-outline text-sm px-4 py-2 mt-5 inline-flex items-center gap-1.5">
                        <Download className="w-4 h-4" />
                        {t('cert.download')}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-600/10 p-6">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-6 h-6 text-red-500" />
                        <h3 className="font-heading font-bold text-red-600 dark:text-red-400">
                          {t('employer.cert_invalid')}
                        </h3>
                      </div>
                      <p className="text-sm text-secondary-400 dark:text-neutral-100 mt-2">
                        {t('cert.invalid')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Helper note */}
              {!certResult && (
                <p className="text-xs text-secondary-400 dark:text-neutral-100 mt-4 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {t('cert.verify_page_title')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
