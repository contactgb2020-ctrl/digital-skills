import { useState, useEffect, useCallback } from 'react';
import {
  Users, BookOpen, MapPin, BarChart3, TrendingUp, CheckCircle, XCircle, Search, Star, Trash2, CreditCard, DollarSign, Shield, AlertTriangle,
  FileCheck, FolderPlus, Wallet, UserCog, Settings, Clock,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getPrivateFileUrl } from '../lib/upload';
import DashboardLayout from '../components/DashboardLayout';
import type { Profile, Course, LocationSuggestion, Subscription, Payment, KycDocument, Category, TrainerEarning, CustomRole, RolePermission, StaffMember } from '../types';
import type { TranslationKey as TKey } from '../i18n/translations';

const SUPER_ADMIN_EMAILS = ['vincentnogue2@gmail.com', 'vincentnogue@yahoo.com', 'webdxb1@gmail.com'];
const PERMISSION_KEYS = [
  'view_users', 'edit_users', 'manage_courses', 'validate_kyc',
  'manage_payments', 'view_stats', 'manage_roles', 'manage_categories', 'manage_plans',
];

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { profile } = useAuth();

  if (!profile || profile.role !== 'super_admin' || !SUPER_ADMIN_EMAILS.includes(profile.email)) {
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
  const [tab, setTab] = useState<'overview' | 'users' | 'courses' | 'locations' | 'subscriptions' | 'kyc' | 'categories' | 'commissions' | 'roles' | 'plans'>('overview');
  const [users, setUsers] = useState<Profile[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [pendingCourses, setPendingCourses] = useState<Course[]>([]);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [instructorNames, setInstructorNames] = useState<Record<string, string>>({});
  const [superAdminCount, setSuperAdminCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // KYC state
  const [kycDocs, setKycDocs] = useState<KycDocument[]>([]);
  const [kycFilter, setKycFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [kycUserNames, setKycUserNames] = useState<Record<string, string>>({});
  const [rejectingKyc, setRejectingKyc] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', icon: 'BookOpen' });

  // Commissions state
  const [earnings, setEarnings] = useState<TrainerEarning[]>([]);
  const [trainerNames, setTrainerNames] = useState<Record<string, string>>({});
  const [commissionRate, setCommissionRate] = useState(1);

  // Custom roles state
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<string, RolePermission[]>>({});
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [assignRole, setAssignRole] = useState({ userId: '', roleId: '' });

  useEffect(() => {
    (async () => {
      const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (usersData) {
        setUsers(usersData as Profile[]);
        setSuperAdminCount((usersData as Profile[]).filter((u) => u.role === 'super_admin').length);
      }

      const { data: courseData } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (courseData) {
        setAllCourses(courseData as Course[]);
        setPendingCourses((courseData as Course[]).filter((c) => c.status === 'pending_review'));
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

      // KYC
      const { data: kycData } = await supabase.from('kyc_documents').select('*').order('created_at', { ascending: false });
      if (kycData) {
        setKycDocs(kycData as KycDocument[]);
        const userIds = [...new Set((kycData as KycDocument[]).map((d) => d.user_id))];
        const { data: kycProfiles } = await supabase.from('profiles').select('id, nom, email').in('id', userIds);
        if (kycProfiles) {
          const map: Record<string, string> = {};
          (kycProfiles as { id: string; nom: string; email: string }[]).forEach((p) => { map[p.id] = p.nom || p.email; });
          setKycUserNames(map);
        }
      }

      // Categories
      const { data: catData } = await supabase.from('categories').select('*').order('name', { ascending: true });
      if (catData) setCategories(catData as Category[]);

      // Earnings
      const { data: earnData } = await supabase.from('trainer_earnings').select('*').order('created_at', { ascending: false });
      if (earnData) {
        setEarnings(earnData as TrainerEarning[]);
        const tIds = [...new Set((earnData as TrainerEarning[]).map((e) => e.trainer_id))];
        const { data: tProfiles } = await supabase.from('profiles').select('id, nom, email').in('id', tIds);
        if (tProfiles) {
          const map: Record<string, string> = {};
          (tProfiles as { id: string; nom: string; email: string }[]).forEach((p) => { map[p.id] = p.nom || p.email; });
          setTrainerNames(map);
        }
      }

      // Custom roles
      const { data: roleData } = await supabase.from('custom_roles').select('*').order('created_at', { ascending: false });
      if (roleData) {
        setCustomRoles(roleData as CustomRole[]);
        for (const role of roleData as CustomRole[]) {
          const { data: perms } = await supabase.from('role_permissions').select('*').eq('role_id', role.id);
          if (perms) setRolePerms((prev) => ({ ...prev, [role.id]: perms as RolePermission[] }));
        }
      }

      const { data: staffData } = await supabase.from('staff_members').select('*').order('created_at', { ascending: false });
      if (staffData) setStaffMembers(staffData as StaffMember[]);

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
    setErrorMsg('');
    // If demoting a super_admin, check min-2 rule
    if (user.role === 'super_admin' && newRole !== 'super_admin' && superAdminCount <= 2) {
      setErrorMsg(t('admin.min_admins_error'));
      return;
    }
    // If promoting to super_admin, check whitelist
    if (newRole === 'super_admin' && !SUPER_ADMIN_EMAILS.includes(user.email)) {
      setErrorMsg(t('admin.email_whitelist'));
      return;
    }
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setUsers(users.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
    setSuperAdminCount(users.filter((u) => u.role === 'super_admin' && u.id !== user.id).length + (newRole === 'super_admin' ? 1 : 0));
  }, [users, superAdminCount, t]);

  const deleteUser = useCallback(async (id: string, role: string) => {
    setErrorMsg('');
    if (role === 'super_admin' && superAdminCount <= 2) {
      setErrorMsg(t('admin.min_admins_error'));
      return;
    }
    if (!confirm(t('admin.confirm_delete_user'))) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setUsers(users.filter((u) => u.id !== id));
  }, [users, superAdminCount, t]);

  const approveKyc = useCallback(async (id: string, userId: string) => {
    await supabase.from('kyc_documents').update({ status: 'approved', reviewed_by: profile.id, reviewed_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('profiles').update({ kyc_status: 'approved' }).eq('id', userId);
    setKycDocs(kycDocs.map((d) => (d.id === id ? { ...d, status: 'approved', reviewed_by: profile.id, reviewed_at: new Date().toISOString() } : d)));
  }, [kycDocs, profile]);

  const rejectKyc = useCallback(async (id: string, userId: string) => {
    await supabase.from('kyc_documents').update({ status: 'rejected', reviewed_by: profile.id, reviewed_at: new Date().toISOString(), rejection_reason: rejectReason }).eq('id', id);
    await supabase.from('profiles').update({ kyc_status: 'rejected' }).eq('id', userId);
    setKycDocs(kycDocs.map((d) => (d.id === id ? { ...d, status: 'rejected', rejection_reason: rejectReason, reviewed_by: profile.id, reviewed_at: new Date().toISOString() } : d)));
    setRejectingKyc(null);
    setRejectReason('');
  }, [kycDocs, profile, rejectReason]);

  const addCategory = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = newCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { data } = await supabase.from('categories').insert({ name: newCategory.name, slug, icon: newCategory.icon }).select().single();
    if (data) {
      setCategories([...categories, data as Category]);
      setNewCategory({ name: '', icon: 'BookOpen' });
    }
  }, [newCategory, categories]);

  const deleteCategory = useCallback(async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    setCategories(categories.filter((c) => c.id !== id));
  }, [categories]);

  const markEarningPaid = useCallback(async (id: string) => {
    await supabase.from('trainer_earnings').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id);
    setEarnings(earnings.map((e) => (e.id === id ? { ...e, status: 'paid', paid_at: new Date().toISOString() } : e)));
  }, [earnings]);

  const createRole = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    const { data } = await supabase.from('custom_roles').insert({ name: newRoleName, created_by: profile.id }).select().single();
    if (data) {
      setCustomRoles([data as CustomRole, ...customRoles]);
      setRolePerms({ ...rolePerms, [(data as CustomRole).id]: [] });
      setNewRoleName('');
    }
  }, [newRoleName, customRoles, rolePerms, profile]);

  const togglePermission = useCallback(async (roleId: string, permKey: string) => {
    const existing = (rolePerms[roleId] || []).find((p) => p.permission_key === permKey);
    if (existing) {
      const newVal = !existing.allowed;
      await supabase.from('role_permissions').update({ allowed: newVal }).eq('id', existing.id);
      setRolePerms({ ...rolePerms, [roleId]: (rolePerms[roleId] || []).map((p) => (p.permission_key === permKey ? { ...p, allowed: newVal } : p)) });
    } else {
      const { data } = await supabase.from('role_permissions').insert({ role_id: roleId, permission_key: permKey, allowed: true }).select().single();
      if (data) setRolePerms({ ...rolePerms, [roleId]: [...(rolePerms[roleId] || []), data as RolePermission] });
    }
  }, [rolePerms]);

  const assignStaffRole = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignRole.userId || !assignRole.roleId) return;
    const { data } = await supabase.from('staff_members').insert({ user_id: assignRole.userId, custom_role_id: assignRole.roleId, assigned_by: profile.id }).select().single();
    if (data) {
      setStaffMembers([data as StaffMember, ...staffMembers]);
      setAssignRole({ userId: '', roleId: '' });
    }
  }, [assignRole, staffMembers, profile]);

  const filteredUsers = users.filter((u) =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) || (u.nom || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredKyc = kycFilter === 'all' ? kycDocs : kycDocs.filter((d) => d.status === kycFilter);
  const planCounts: Record<string, number> = { starter: 0, premium: 0, enterprise: 0 };
  subscriptions.forEach((s) => { planCounts[s.plan] = (planCounts[s.plan] || 0) + 1; });
  const roleCounts: Record<string, number> = { student: 0, trainer: 0, super_admin: 0 };
  users.forEach((u) => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });
  const totalRevenue = payments.filter((p) => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
  const pendingEarnings = earnings.filter((e) => e.status === 'pending');
  const paidEarnings = earnings.filter((e) => e.status === 'paid');

  const sidebarItems = [
    { icon: <BarChart3 className="w-5 h-5" />, labelKey: 'admin.tab_overview' as TKey, active: tab === 'overview', onClick: () => setTab('overview') },
    { icon: <Users className="w-5 h-5" />, labelKey: 'admin.users' as TKey, active: tab === 'users', onClick: () => setTab('users') },
    { icon: <BookOpen className="w-5 h-5" />, labelKey: 'admin.all_courses' as TKey, active: tab === 'courses', onClick: () => setTab('courses') },
    { icon: <FileCheck className="w-5 h-5" />, labelKey: 'admin.tab_kyc' as TKey, active: tab === 'kyc', onClick: () => setTab('kyc') },
    { icon: <FolderPlus className="w-5 h-5" />, labelKey: 'admin.tab_categories' as TKey, active: tab === 'categories', onClick: () => setTab('categories') },
    { icon: <Wallet className="w-5 h-5" />, labelKey: 'admin.tab_commissions' as TKey, active: tab === 'commissions', onClick: () => setTab('commissions') },
    { icon: <UserCog className="w-5 h-5" />, labelKey: 'admin.tab_roles' as TKey, active: tab === 'roles', onClick: () => setTab('roles') },
    { icon: <MapPin className="w-5 h-5" />, labelKey: 'admin.locations' as TKey, active: tab === 'locations', onClick: () => setTab('locations') },
    { icon: <CreditCard className="w-5 h-5" />, labelKey: 'admin.tab_subscriptions' as TKey, active: tab === 'subscriptions', onClick: () => setTab('subscriptions') },
  ];

  return (
    <DashboardLayout title={t('admin.title')} items={sidebarItems} currentRoute="/super-admin" userRole={profile.role}>
      {errorMsg && (
        <div className="mb-4 p-4 rounded-xl bg-alert-50 dark:bg-alert-600/20 border border-alert-200 dark:border-alert-600 text-alert-600 dark:text-alert-400 text-sm">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-secondary-400 dark:text-neutral-100">{t('common.loading')}</div>
      ) : (
        <>
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Users className="w-6 h-6" />} label={t('admin.total_users')} value={users.length} />
                <StatCard icon={<TrendingUp className="w-6 h-6" />} label={t('admin.new_users')} value={users.filter((u) => new Date(u.created_at).getMonth() === new Date().getMonth()).length} />
                <StatCard icon={<BookOpen className="w-6 h-6" />} label={t('admin.all_courses')} value={allCourses.length} />
                <StatCard icon={<DollarSign className="w-6 h-6" />} label={t('admin.revenue_total')} value={totalRevenue} prefix="$" />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
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
                            <button onClick={() => approveCourse(course.id)} className="p-1.5 rounded bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => rejectCourse(course.id)} className="p-1.5 rounded bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card p-6">
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-primary-500" /> {t('admin.kyc_pending')}
                  </h3>
                  {kycDocs.filter((d) => d.status === 'pending').length === 0 ? (
                    <p className="text-sm text-secondary-400 dark:text-neutral-100">{t('admin.kyc_no_pending')}</p>
                  ) : (
                    <p className="text-sm text-secondary-600 dark:text-white">{kycDocs.filter((d) => d.status === 'pending').length} {t('admin.kyc_pending')}</p>
                  )}
                </div>

                <div className="card p-6">
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4">{t('admin.plan_distribution')}</h3>
                  <div className="space-y-3">
                    {(['starter', 'premium', 'enterprise'] as const).map((plan) => {
                      const count = planCounts[plan] || 0;
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

                <div className="card p-6">
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4">{t('admin.role_distribution')}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {(['student', 'trainer', 'super_admin'] as const).map((role) => (
                      <div key={role} className="text-center p-4 rounded-xl bg-gray-50 dark:bg-secondary-600">
                        <div className="text-2xl font-bold text-secondary-600 dark:text-white">{roleCounts[role] || 0}</div>
                        <div className="text-xs text-secondary-400 dark:text-neutral-100 capitalize">{role.replace('_', ' ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS */}
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
                        <th className="text-left p-4 text-sm font-medium">KYC</th>
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
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${user.kyc_status === 'approved' ? 'bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400' : user.kyc_status === 'pending' ? 'bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400' : user.kyc_status === 'rejected' ? 'bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400' : 'bg-gray-100 dark:bg-secondary-600 text-secondary-400'}`}>
                              {user.kyc_status || 'unverified'}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-secondary-400 dark:text-neutral-100">{new Date(user.created_at).toLocaleDateString()}</td>
                          <td className="p-4">
                            <div className="flex gap-2 flex-wrap">
                              {user.role !== 'trainer' && user.role !== 'super_admin' && (
                                <button onClick={() => changeRole(user, 'trainer')} className="text-xs text-primary-500 hover:underline">{t('admin.make_trainer')}</button>
                              )}
                              {user.role === 'trainer' && (
                                <button onClick={() => changeRole(user, 'student')} className="text-xs text-secondary-400 hover:underline">{t('admin.make_student')}</button>
                              )}
                              {user.role !== 'super_admin' && SUPER_ADMIN_EMAILS.includes(user.email) && (
                                <button onClick={() => changeRole(user, 'super_admin')} className="text-xs text-alert-500 hover:underline">{t('admin.make_admin')}</button>
                              )}
                              {user.role !== 'super_admin' && (
                                <button onClick={() => deleteUser(user.id, user.role)} className="text-xs text-alert-500 hover:underline flex items-center gap-1">
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

          {/* COURSES */}
          {tab === 'courses' && (
            <div className="space-y-6">
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
                          <p className="text-sm text-secondary-400 dark:text-neutral-100">{course.category} — {course.level} — {instructorNames[course.created_by] || t('admin.unknown')}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => approveCourse(course.id)} className="p-2 rounded-lg bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400"><CheckCircle className="w-5 h-5" /></button>
                          <button onClick={() => rejectCourse(course.id)} className="p-2 rounded-lg bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400"><XCircle className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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

          {/* KYC */}
          {tab === 'kyc' && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
                  <button key={status} onClick={() => setKycFilter(status)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${kycFilter === status ? 'bg-primary-500 text-white' : 'bg-white dark:bg-secondary-600 text-secondary-600 dark:text-neutral-100'}`}>
                    {status === 'all' ? t('admin.kyc_all') : status === 'pending' ? t('admin.kyc_pending') : status === 'approved' ? t('admin.kyc_approved') : t('admin.kyc_rejected')}
                  </button>
                ))}
              </div>

              {filteredKyc.length === 0 ? (
                <div className="card p-8 text-center">
                  <FileCheck className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                  <p className="text-secondary-400 dark:text-neutral-100">{t('admin.kyc_no_pending')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredKyc.map((doc) => (
                    <div key={doc.id} className="card p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-secondary-600 dark:text-white">{kycUserNames[doc.user_id] || t('admin.user_default')}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${doc.status === 'approved' ? 'bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400' : doc.status === 'pending' ? 'bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400' : 'bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400'}`}>
                              {doc.status}
                            </span>
                          </div>
                          <p className="text-sm text-secondary-400 dark:text-neutral-100 mb-2">
                            {t('admin.kyc_type')}: {doc.document_type} — {t('admin.kyc_submitted')}: {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                          {doc.file_url && (
                            <button onClick={async () => { const url = await getPrivateFileUrl(doc.document_type === 'diploma' ? 'diplomas' : 'kyc-documents', doc.file_url); if (url) window.open(url, '_blank'); }} className="inline-flex items-center gap-2 text-sm text-primary-500 hover:underline">
                              <FileCheck className="w-4 h-4" /> {t('admin.kyc_document')}
                            </button>
                          )}
                          {doc.rejection_reason && (
                            <p className="text-sm text-alert-500 mt-2">Motif: {doc.rejection_reason}</p>
                          )}
                        </div>
                        {doc.status === 'pending' && (
                          <div className="flex flex-col gap-2">
                            <button onClick={() => approveKyc(doc.id, doc.user_id)} className="btn-primary text-sm px-4 py-2 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" /> {t('admin.kyc_approve')}
                            </button>
                            {rejectingKyc === doc.id ? (
                              <div className="space-y-2">
                                <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={t('admin.kyc_rejection_reason')} className="input-field text-sm" />
                                <button onClick={() => rejectKyc(doc.id, doc.user_id)} className="btn-outline text-sm px-4 py-2 text-alert-500 border-alert-300">{t('admin.kyc_reject')}</button>
                              </div>
                            ) : (
                              <button onClick={() => setRejectingKyc(doc.id)} className="btn-outline text-sm px-4 py-2 text-alert-500 border-alert-300 flex items-center gap-1">
                                <XCircle className="w-4 h-4" /> {t('admin.kyc_reject')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CATEGORIES */}
          {tab === 'categories' && (
            <div className="space-y-6">
              <form onSubmit={addCategory} className="card p-6 flex gap-3 items-end max-w-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('admin.category_name')}</label>
                  <input type="text" required value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('admin.category_icon')}</label>
                  <input type="text" value={newCategory.icon} onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })} className="input-field" />
                </div>
                <button type="submit" className="btn-primary flex items-center gap-2"><FolderPlus className="w-5 h-5" /> {t('admin.add_category')}</button>
              </form>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="card p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-secondary-600 dark:text-white">{cat.name}</h4>
                      <p className="text-xs text-secondary-400 dark:text-neutral-100">{cat.slug}</p>
                    </div>
                    <button onClick={() => deleteCategory(cat.id)} className="p-2 rounded-lg hover:bg-alert-50 dark:hover:bg-alert-600/20 text-alert-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMMISSIONS */}
          {tab === 'commissions' && (
            <div className="space-y-6">
              <div className="card p-6">
                <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-2">{t('admin.commission_rate')}</label>
                <div className="flex items-center gap-3 max-w-xs">
                  <input type="number" step="0.1" value={commissionRate} onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 1)} className="input-field" />
                  <span className="text-sm text-secondary-400 dark:text-neutral-100">$/heure</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-3">{t('admin.earnings_pending')}</h3>
                  <div className="text-2xl font-bold text-primary-500 mb-3">
                    ${pendingEarnings.reduce((s, e) => s + Number(e.amount_due), 0).toFixed(2)}
                  </div>
                  <div className="space-y-2">
                    {pendingEarnings.map((e) => (
                      <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-secondary-600">
                        <div>
                          <span className="text-sm text-secondary-600 dark:text-white">{trainerNames[e.trainer_id] || '—'}</span>
                          <span className="text-xs text-secondary-400 dark:text-neutral-100 ml-2">{e.total_watch_hours}h</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary-500">${Number(e.amount_due).toFixed(2)}</span>
                          <button onClick={() => markEarningPaid(e.id)} className="text-xs text-success-500 hover:underline">{t('admin.mark_paid')}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-3">{t('admin.earnings_paid')}</h3>
                  <div className="text-2xl font-bold text-success-500 mb-3">
                    ${paidEarnings.reduce((s, e) => s + Number(e.amount_due), 0).toFixed(2)}
                  </div>
                  <div className="space-y-2">
                    {paidEarnings.map((e) => (
                      <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-secondary-600">
                        <span className="text-sm text-secondary-600 dark:text-white">{trainerNames[e.trainer_id] || '—'}</span>
                        <span className="text-sm font-semibold text-success-500">${Number(e.amount_due).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ROLES */}
          {tab === 'roles' && (
            <div className="space-y-6">
              <form onSubmit={createRole} className="card p-6 flex gap-3 items-end max-w-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('admin.role_name')}</label>
                  <input type="text" required value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="input-field" placeholder={t('admin.role_placeholder')} />
                </div>
                <button type="submit" className="btn-primary flex items-center gap-2"><UserCog className="w-5 h-5" /> {t('admin.create_role')}</button>
              </form>

              <div className="space-y-4">
                {customRoles.length === 0 ? (
                  <div className="card p-8 text-center">
                    <UserCog className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                    <p className="text-secondary-400 dark:text-neutral-100">{t('admin.no_custom_roles')}</p>
                  </div>
                ) : (
                  customRoles.map((role) => (
                    <div key={role.id} className="card p-6">
                      <h4 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4">{role.name}</h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {PERMISSION_KEYS.map((perm) => {
                          const existing = (rolePerms[role.id] || []).find((p) => p.permission_key === perm);
                          const allowed = existing ? existing.allowed : false;
                          return (
                            <button key={perm} onClick={() => togglePermission(role.id, perm)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${allowed ? 'bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400' : 'bg-gray-100 dark:bg-secondary-600 text-secondary-400 dark:text-neutral-100'}`}>
                              {perm.replace('_', ' ')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={assignStaffRole} className="card p-6 max-w-lg space-y-4">
                <h4 className="font-heading font-semibold text-secondary-600 dark:text-white">{t('admin.assign_role')}</h4>
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('admin.select_user')}</label>
                  <select value={assignRole.userId} onChange={(e) => setAssignRole({ ...assignRole, userId: e.target.value })} className="input-field">
                    <option value="">—</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">{t('admin.select_role')}</label>
                  <select value={assignRole.roleId} onChange={(e) => setAssignRole({ ...assignRole, roleId: e.target.value })} className="input-field">
                    <option value="">—</option>
                    {customRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn-primary">{t('admin.assign_role')}</button>
              </form>
            </div>
          )}

          {/* LOCATIONS */}
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
                      <button onClick={() => approveSuggestion(sug.id)} className="p-2 rounded-lg bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400"><CheckCircle className="w-5 h-5" /></button>
                      <button onClick={() => rejectSuggestion(sug.id)} className="p-2 rounded-lg bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400"><XCircle className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SUBSCRIPTIONS */}
          {tab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                {(['starter', 'premium', 'enterprise'] as const).map((plan) => (
                  <div key={plan} className="card p-6 text-center">
                    <div className="text-3xl font-bold text-primary-500 mb-1">{planCounts[plan] || 0}</div>
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
