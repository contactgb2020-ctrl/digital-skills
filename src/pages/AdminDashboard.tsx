import { useState, useEffect, useCallback } from 'react';
import { Users, BookOpen, MapPin, BarChart3, TrendingUp, CheckCircle, XCircle, Search, Star, Trash2, CreditCard, DollarSign, Shield, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import type { Profile, Course, LocationSuggestion, Subscription, Payment } from '../types';
import type { TranslationKey as TKey } from '../i18n/translations';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { profile } = useAuth();

  if (!profile || profile.role !== 'super_admin') {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-alert-100 dark:bg-alert-600/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-alert-500" />
          </div>
          <p className="text-secondary-600 dark:text-white font-semibold mb-2">{t('admin.no_access')}</p>
        </div>
      </div>
    );
  }

  return <AdminContent profile={profile} t={t} />;
}

function AdminContent({ profile, t }: { profile: Profile; t: (k: TKey) => string }) {
  const [tab, setTab] = useState<'overview' | 'users' | 'courses' | 'locations' | 'subscriptions'>('overview');
  const [users, setUsers] = useState<Profile[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [pendingCourses, setPendingCourses] = useState<Course[]>([]);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [instructorNames, setInstructorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (usersData) setUsers(usersData as Profile[]);

      const { data: courseData } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (courseData) {
        setAllCourses(courseData as Course[]);
        setPendingCourses((courseData as Course[]).filter((c) => c.status === 'pending_review'));
        // Load instructor names
        const creatorIds = [...new Set((courseData as Course[]).map((c) => c.created_by))];
        const { data: profiles } = await supabase.from('profiles').select('id, nom').in('id', creatorIds);
        if (profiles) {
          const map: Record<string, string> = {};
          (profiles as { id: string; nom: string }[]).forEach((p) => { map[p.id] = p.nom; });
          setInstructorNames(map);
        }
      }

      const { data: sugData } = await supabase.from('location_suggestions').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      if (sugData) setSuggestions(sugData as LocationSuggestion[]);

      const { data: subData } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false });
      if (subData) setSubscriptions(subData as Subscription[]);

      const { data: payData } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(20);
      if (payData) setPayments(payData as Payment[]);

      setLoading(false);
    })();
  }, []);

  const approveCourse = useCallback(async (id: string) => {
    await supabase.from('courses').update({ status: 'published' }).eq('id', id);
    setPendingCourses(pendingCourses.filter((c) => c.id !== id));
    setAllCourses(allCourses.map((c) => (c.id === id ? { ...c, status: 'published' } : c)));
  }, [pendingCourses, allCourses]);

  const rejectCourse = useCallback(async (id: string) => {
    await supabase.from('courses').update({ status: 'rejected' }).eq('id', id);
    setPendingCourses(pendingCourses.filter((c) => c.id !== id));
    setAllCourses(allCourses.map((c) => (c.id === id ? { ...c, status: 'rejected' } : c)));
  }, [pendingCourses, allCourses]);

  const deleteCourse = useCallback(async (id: string) => {
    if (!confirm(t('trainer.confirm_delete'))) return;
    await supabase.from('courses').delete().eq('id', id);
    setAllCourses(allCourses.filter((c) => c.id !== id));
    setPendingCourses(pendingCourses.filter((c) => c.id !== id));
  }, [allCourses, pendingCourses, t]);

  const approveSuggestion = useCallback(async (id: string) => {
    await supabase.from('location_suggestions').update({ status: 'approved' }).eq('id', id);
    setSuggestions(suggestions.filter((s) => s.id !== id));
  }, [suggestions]);

  const rejectSuggestion = useCallback(async (id: string) => {
    await supabase.from('location_suggestions').update({ status: 'rejected' }).eq('id', id);
    setSuggestions(suggestions.filter((s) => s.id !== id));
  }, [suggestions]);

  const changeRole = useCallback(async (user: Profile, newRole: 'student' | 'trainer' | 'super_admin') => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    setUsers(users.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
  }, [users]);

  const deleteUser = useCallback(async (id: string) => {
    if (!confirm(t('admin.confirm_delete_user'))) return;
    await supabase.from('profiles').delete().eq('id', id);
    setUsers(users.filter((u) => u.id !== id));
  }, [users, t]);

  const filteredUsers = users.filter((u) =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.nom.toLowerCase().includes(search.toLowerCase())
  );

  const planCounts = { starter: 0, premium: 0, enterprise: 0 };
  subscriptions.forEach((s) => { (planCounts as any)[s.plan] = ((planCounts as any)[s.plan] || 0) + 1; });
  const roleCounts = { student: 0, trainer: 0, super_admin: 0 };
  users.forEach((u) => { (roleCounts as any)[u.role] = ((roleCounts as any)[u.role] || 0) + 1; });
  const totalRevenue = payments.filter((p) => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);

  const sidebarItems = [
    { icon: <BarChart3 className="w-5 h-5" />, labelKey: 'admin.tab_overview' as TKey, active: tab === 'overview', onClick: () => setTab('overview') },
    { icon: <Users className="w-5 h-5" />, labelKey: 'admin.users' as TKey, active: tab === 'users', onClick: () => setTab('users') },
    { icon: <BookOpen className="w-5 h-5" />, labelKey: 'admin.all_courses' as TKey, active: tab === 'courses', onClick: () => setTab('courses') },
    { icon: <MapPin className="w-5 h-5" />, labelKey: 'admin.locations' as TKey, active: tab === 'locations', onClick: () => setTab('locations') },
    { icon: <CreditCard className="w-5 h-5" />, labelKey: 'admin.subscriptions' as TKey, active: tab === 'subscriptions', onClick: () => setTab('subscriptions') },
  ];

  return (
    <DashboardLayout title={t('admin.title')} items={sidebarItems} currentRoute="/super-admin" userRole={profile.role}>
      {loading ? (
        <div className="text-center py-12 text-secondary-400 dark:text-neutral-100">{t('common.loading')}</div>
      ) : (
        <>
          {/* Overview */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Users className="w-6 h-6" />} label={t('admin.total_users')} value={users.length} />
                <StatCard icon={<TrendingUp className="w-6 h-6" />} label={t('admin.new_users')} value={users.filter((u) => new Date(u.created_at).getMonth() === new Date().getMonth()).length} />
                <StatCard icon={<BookOpen className="w-6 h-6" />} label={t('admin.all_courses')} value={allCourses.length} />
                <StatCard icon={<DollarSign className="w-6 h-6" />} label={t('admin.revenue_total')} value={totalRevenue} prefix="$" />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Pending items */}
                <div className="card p-6">
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-primary-500" /> {t('admin.pending_reviews')}
                  </h3>
                  {pendingCourses.length === 0 ? (
                    <p className="text-sm text-secondary-400 dark:text-neutral-100">{t('admin.no_pending')}</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingCourses.slice(0, 5).map((course) => (
                        <div key={course.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-secondary-600">
                          <span className="text-sm text-secondary-600 dark:text-white truncate">{course.title}</span>
                          <div className="flex gap-1">
                            <button onClick={() => approveCourse(course.id)} className="p-1.5 rounded bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => rejectCourse(course.id)} className="p-1.5 rounded bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Plan distribution */}
                <div className="card p-6">
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4">{t('admin.plan_distribution')}</h3>
                  <div className="space-y-3">
                    {(['starter', 'premium', 'enterprise'] as const).map((plan) => {
                      const count = (planCounts as any)[plan] || 0;
                      const pct = subscriptions.length > 0 ? (count / subscriptions.length) * 100 : 0;
                      return (
                        <div key={plan}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-secondary-600 dark:text-white capitalize">{plan}</span>
                            <span className="text-secondary-400 dark:text-neutral-100">{count}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-secondary-600">
                            <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Role distribution */}
                <div className="card p-6">
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4">{t('admin.role_distribution')}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {(['student', 'trainer', 'super_admin'] as const).map((role) => (
                      <div key={role} className="text-center p-4 rounded-xl bg-gray-50 dark:bg-secondary-600">
                        <div className="text-2xl font-bold text-secondary-600 dark:text-white">{(roleCounts as any)[role] || 0}</div>
                        <div className="text-xs text-secondary-400 dark:text-neutral-100 capitalize">{role.replace('_', ' ')}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending locations */}
                <div className="card p-6">
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-500" /> {t('admin.pending_locations')}
                  </h3>
                  {suggestions.length === 0 ? (
                    <p className="text-sm text-secondary-400 dark:text-neutral-100">{t('admin.no_pending')}</p>
                  ) : (
                    <div className="space-y-2">
                      {suggestions.slice(0, 5).map((sug) => (
                        <div key={sug.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-secondary-600">
                          <div>
                            <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400 text-xs mr-2">{sug.level}</span>
                            <span className="text-sm text-secondary-600 dark:text-white">{sug.proposed_name}</span>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => approveSuggestion(sug.id)} className="p-1.5 rounded bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => rejectSuggestion(sug.id)} className="p-1.5 rounded bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Users management */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.search_user')} className="input-field pl-10" />
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary-600 dark:bg-secondary-800 text-white">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium">Email</th>
                        <th className="text-left p-4 text-sm font-medium">Nom</th>
                        <th className="text-left p-4 text-sm font-medium">{t('admin.role')}</th>
                        <th className="text-left p-4 text-sm font-medium">{t('admin.created')}</th>
                        <th className="text-left p-4 text-sm font-medium">{t('admin.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 dark:border-secondary-500 hover:bg-gray-50 dark:hover:bg-secondary-600">
                          <td className="p-4 text-sm text-secondary-600 dark:text-white">{user.email}</td>
                          <td className="p-4 text-sm text-secondary-600 dark:text-white">{user.nom || '—'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'super_admin' ? 'bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400' : user.role === 'trainer' ? 'bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400' : 'bg-gray-100 dark:bg-secondary-600 text-secondary-400 dark:text-neutral-100'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-secondary-400 dark:text-neutral-100">{new Date(user.created_at).toLocaleDateString()}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              {user.role !== 'trainer' && user.role !== 'super_admin' && (
                                <button onClick={() => changeRole(user, 'trainer')} className="text-xs text-primary-500 hover:underline">{t('admin.make_trainer')}</button>
                              )}
                              {user.role === 'trainer' && (
                                <button onClick={() => changeRole(user, 'student')} className="text-xs text-secondary-400 hover:underline">{t('admin.make_student')}</button>
                              )}
                              {user.role !== 'super_admin' && (
                                <button onClick={() => deleteUser(user.id)} className="text-xs text-alert-500 hover:underline flex items-center gap-1">
                                  <Trash2 className="w-3 h-3" /> {t('admin.delete')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Courses management */}
          {tab === 'courses' && (
            <div className="space-y-6">
              {/* Pending reviews */}
              <div>
                <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary-500" /> {t('admin.pending_reviews')}
                </h3>
                {pendingCourses.length === 0 ? (
                  <p className="text-sm text-secondary-400 dark:text-neutral-100">{t('admin.no_pending')}</p>
                ) : (
                  <div className="space-y-3">
                    {pendingCourses.map((course) => (
                      <div key={course.id} className="card p-5 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-secondary-600 dark:text-white">{course.title}</h4>
                          <p className="text-sm text-secondary-400 dark:text-neutral-100">{course.category} — {course.level} — {instructorNames[course.created_by] || 'Inconnu'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => approveCourse(course.id)} className="p-2 rounded-lg bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400 hover:bg-success-200">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button onClick={() => rejectCourse(course.id)} className="p-2 rounded-lg bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400 hover:bg-alert-200">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* All courses */}
              <div>
                <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-3">{t('admin.all_courses')}</h3>
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary-600 dark:bg-secondary-800 text-white">
                        <tr>
                          <th className="text-left p-4 text-sm font-medium">{t('admin.course_title')}</th>
                          <th className="text-left p-4 text-sm font-medium">{t('admin.instructor')}</th>
                          <th className="text-left p-4 text-sm font-medium">{t('trainer.status')}</th>
                          <th className="text-left p-4 text-sm font-medium">{t('admin.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allCourses.map((course) => (
                          <tr key={course.id} className="border-b border-gray-100 dark:border-secondary-500">
                            <td className="p-4 text-sm text-secondary-600 dark:text-white">{course.title}</td>
                            <td className="p-4 text-sm text-secondary-400 dark:text-neutral-100">{instructorNames[course.created_by] || '—'}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${course.status === 'published' ? 'bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400' : course.status === 'pending_review' ? 'bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400' : 'bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400'}`}>
                                {course.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <button onClick={() => deleteCourse(course.id)} className="text-xs text-alert-500 hover:underline flex items-center gap-1">
                                <Trash2 className="w-3 h-3" /> {t('admin.delete')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Locations */}
          {tab === 'locations' && (
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-secondary-600 dark:text-white">{t('admin.pending_locations')}</h3>
              {suggestions.length === 0 ? (
                <p className="text-sm text-secondary-400 dark:text-neutral-100">{t('admin.no_pending')}</p>
              ) : (
                suggestions.map((sug) => (
                  <div key={sug.id} className="card p-5 flex items-center justify-between">
                    <div>
                      <span className="px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400 text-xs mr-2">{sug.level}</span>
                      <span className="text-secondary-600 dark:text-white font-medium">{sug.proposed_name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approveSuggestion(sug.id)} className="p-2 rounded-lg bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button onClick={() => rejectSuggestion(sug.id)} className="p-2 rounded-lg bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Subscriptions */}
          {tab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                {(['starter', 'premium', 'enterprise'] as const).map((plan) => (
                  <div key={plan} className="card p-6 text-center">
                    <div className="text-3xl font-bold text-primary-500 mb-1">{(planCounts as any)[plan] || 0}</div>
                    <div className="text-sm text-secondary-400 dark:text-neutral-100 capitalize">{plan}</div>
                  </div>
                ))}
              </div>

              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary-600 dark:bg-secondary-800 text-white">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium">Plan</th>
                        <th className="text-left p-4 text-sm font-medium">Statut</th>
                        <th className="text-left p-4 text-sm font-medium">Début</th>
                        <th className="text-left p-4 text-sm font-medium">Fin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.slice(0, 20).map((sub) => (
                        <tr key={sub.id} className="border-b border-gray-100 dark:border-secondary-500">
                          <td className="p-4 text-sm text-secondary-600 dark:text-white capitalize">{sub.plan}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${sub.status === 'active' ? 'bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400' : sub.status === 'trial' ? 'bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400' : 'bg-gray-100 dark:bg-secondary-600 text-secondary-400'}`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-secondary-400 dark:text-neutral-100">{new Date(sub.start_date).toLocaleDateString()}</td>
                          <td className="p-4 text-sm text-secondary-400 dark:text-neutral-100">{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, prefix }: { icon: React.ReactNode; label: string; value: number; prefix?: string }) {
  return (
    <div className="card p-6">
      <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-600/20 flex items-center justify-center text-primary-500 mb-3">{icon}</div>
      <div className="text-2xl font-bold text-secondary-600 dark:text-white">{prefix}{value.toLocaleString()}</div>
      <div className="text-sm text-secondary-400 dark:text-neutral-100">{label}</div>
    </div>
  );
}
