import { useState, useEffect, useCallback } from 'react';
import {
  Users, BookOpen, MapPin, BarChart3, TrendingUp, CheckCircle, XCircle, Search, Trash2, CreditCard, DollarSign, Shield, AlertTriangle,
  FileCheck, FolderPlus, Wallet, UserCog, Settings,
  Award, Building2, Tag, Download, LifeBuoy, PieChart,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getPrivateFileUrl } from '../lib/upload';
import DashboardLayout from '../components/DashboardLayout';
import type { Profile, Course, LocationSuggestion, Subscription, Payment, KycDocument, Category, TrainerEarning, CustomRole, RolePermission, StaffMember, Certificate, EmployerProfile, Coupon, SupportTicket, SuperAdminEmail, PayoutRequest } from '../types';
import type { TranslationKey as TKey } from '../i18n/translations';

// Bootstrap fallback only — used if the DB whitelist hasn't loaded yet, so a
// legitimate super admin is never locked out. The real, editable whitelist
// lives in the `super_admin_emails` table (see 'roles' tab).
const BOOTSTRAP_SUPER_ADMIN_EMAILS = ['vincentnogue2@gmail.com', 'vincentnogue@yahoo.com', 'liyahjoha@gmail.com', 'webdxb1@gmail.com'];
const PERMISSION_KEYS = [
  'view_users', 'edit_users', 'manage_courses', 'validate_kyc',
  'manage_payments', 'view_stats', 'manage_roles', 'manage_categories', 'manage_plans',
];

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
  const [tab, setTab] = useState<'overview' | 'users' | 'courses' | 'locations' | 'subscriptions' | 'kyc' | 'categories' | 'commissions' | 'roles' | 'plans' | 'revenue' | 'certificates' | 'employers' | 'coupons' | 'reports' | 'support' | 'settings'>('overview');
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
  const [superAdminEmails, setSuperAdminEmails] = useState<SuperAdminEmail[]>([]);
  const [newSuperAdminEmail, setNewSuperAdminEmail] = useState('');
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
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

  // Revenue state
  const [revenueByPlan, setRevenueByPlan] = useState<Record<string, number>>({});

  // Certificates state
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certHolderNames, setCertHolderNames] = useState<Record<string, string>>({});
  const [certCourseTitles, setCertCourseTitles] = useState<Record<string, string>>({});

  // Employers state
  const [employers, setEmployers] = useState<EmployerProfile[]>([]);

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_percent: 10, max_uses: 100 });

  // Support tickets state
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [ticketUserNames, setTicketUserNames] = useState<Record<string, string>>({});

  // Settings state
  const [platformSettings, setPlatformSettings] = useState({ platform_name: 'Skillz', default_language: 'fr', support_email: 'support@skillz.com' });

  useEffect(() => {
    (async () => {
      const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (usersData) {
        setUsers(usersData as Profile[]);
        setSuperAdminCount((usersData as Profile[]).filter((u) => u.role === 'super_admin').length);
      }

      const { data: saEmails } = await supabase.from('super_admin_emails').select('*').order('created_at', { ascending: true });
      if (saEmails) setSuperAdminEmails(saEmails as SuperAdminEmail[]);

      const { data: payoutData } = await supabase.from('payout_requests').select('*').order('created_at', { ascending: false });
      if (payoutData) setPayoutRequests(payoutData as PayoutRequest[]);

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

      // Revenue by plan (from completed payments joined with subscriptions)
      const planRevenue: Record<string, number> = { starter: 0, professional: 0, expert: 0, bundle: 0 };
      // Sum completed payments per plan via subscription lookup
      const subById: Record<string, Subscription> = {};
      (subData as Subscription[] || []).forEach((s) => { subById[s.id] = s; });
      (payData as Payment[] || []).filter((p) => p.status === 'completed').forEach((p) => {
        const sub = subById[p.subscription_id ?? ''];
        if (sub && sub.plan) planRevenue[sub.plan] = (planRevenue[sub.plan] || 0) + Number(p.amount);
      });
      setRevenueByPlan(planRevenue);

      // Certificates
      const { data: certData } = await supabase.from('certificates').select('*').order('created_at', { ascending: false }).limit(50);
      if (certData) {
        setCertificates(certData as Certificate[]);
        const cUserIds = [...new Set((certData as Certificate[]).map((c) => c.user_id))];
        const cCourseIds = [...new Set((certData as Certificate[]).map((c) => c.course_id))];
        const [{ data: cProfiles }, { data: cCourses }] = await Promise.all([
          supabase.from('profiles').select('id, nom, email').in('id', cUserIds),
          supabase.from('courses').select('id, title').in('id', cCourseIds),
        ]);
        if (cProfiles) {
          const map: Record<string, string> = {};
          (cProfiles as Pick<Profile, 'id' | 'nom' | 'email'>[]).forEach((p) => { map[p.id] = p.nom || p.email; });
          setCertHolderNames(map);
        }
        if (cCourses) {
          const map: Record<string, string> = {};
          (cCourses as Pick<Course, 'id' | 'title'>[]).forEach((c) => { map[c.id] = c.title; });
          setCertCourseTitles(map);
        }
      }

      // Employers
      const { data: empData } = await supabase.from('employer_profiles').select('*').order('created_at', { ascending: false });
      if (empData) setEmployers(empData as EmployerProfile[]);

      // Coupons
      const { data: couponData } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (couponData) setCoupons(couponData as Coupon[]);

      // Support tickets
      const { data: ticketData } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(50);
      if (ticketData) {
        setSupportTickets(ticketData as SupportTicket[]);
        const tUserIds = [...new Set((ticketData as SupportTicket[]).map((t) => t.user_id))];
        const { data: tProfiles } = await supabase.from('profiles').select('id, nom, email').in('id', tUserIds);
        if (tProfiles) {
          const map: Record<string, string> = {};
          (tProfiles as Pick<Profile, 'id' | 'nom' | 'email'>[]).forEach((p) => { map[p.id] = p.nom || p.email; });
          setTicketUserNames(map);
        }
      }

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
    // If promoting to super_admin, check whitelist (DB-backed, falls back to bootstrap list)
    const whitelist = superAdminEmails.length > 0 ? superAdminEmails.map((e) => e.email) : BOOTSTRAP_SUPER_ADMIN_EMAILS;
    if (newRole === 'super_admin' && !whitelist.includes(user.email)) {
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
  }, [users, superAdminCount, superAdminEmails, t]);

  const addSuperAdminEmail = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const email = newSuperAdminEmail.trim().toLowerCase();
    if (!email) return;
    const { data, error } = await supabase.from('super_admin_emails').insert({ email }).select().single();
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    if (data) setSuperAdminEmails([...superAdminEmails, data as SuperAdminEmail]);
    setNewSuperAdminEmail('');
  }, [newSuperAdminEmail, superAdminEmails]);

  const removeSuperAdminEmail = useCallback(async (email: string, isProtected: boolean) => {
    if (isProtected) return;
    if (!confirm(t('admin.confirm_delete_user'))) return;
    setErrorMsg('');
    const { error } = await supabase.from('super_admin_emails').delete().eq('email', email);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setSuperAdminEmails(superAdminEmails.filter((e) => e.email !== email));
  }, [superAdminEmails, t]);

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

  const confirmManualPayment = useCallback(async (payment: Payment) => {
    await supabase.from('payments').update({ status: 'completed' }).eq('id', payment.id);
    setPayments((prev) => prev.map((p) => (p.id === payment.id ? { ...p, status: 'completed' } : p)));

    if (payment.subscription_id) {
      const newEndDate = new Date();
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      await supabase
        .from('subscriptions')
        .update({ status: 'active', end_date: newEndDate.toISOString() })
        .eq('id', payment.subscription_id);
      setSubscriptions((prev) => prev.map((s) => (s.id === payment.subscription_id ? { ...s, status: 'active', end_date: newEndDate.toISOString() } : s)));
    }
  }, []);

  const processPayoutRequest = useCallback(async (request: PayoutRequest, newStatus: 'paid' | 'rejected') => {
    await supabase
      .from('payout_requests')
      .update({ status: newStatus, processed_at: new Date().toISOString() })
      .eq('id', request.id);
    setPayoutRequests((prev) => prev.map((p) => (p.id === request.id ? { ...p, status: newStatus, processed_at: new Date().toISOString() } : p)));
  }, []);

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
  const planCounts: Record<string, number> = { starter: 0, professional: 0, expert: 0, bundle: 0 };
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
    { icon: <DollarSign className="w-5 h-5" />, labelKey: 'admin.tab_revenue' as TKey, active: tab === 'revenue', onClick: () => setTab('revenue') },
    { icon: <Award className="w-5 h-5" />, labelKey: 'admin.tab_certificates' as TKey, active: tab === 'certificates', onClick: () => setTab('certificates') },
    { icon: <Building2 className="w-5 h-5" />, labelKey: 'admin.tab_employers' as TKey, active: tab === 'employers', onClick: () => setTab('employers') },
    { icon: <Tag className="w-5 h-5" />, labelKey: 'admin.tab_coupons' as TKey, active: tab === 'coupons', onClick: () => setTab('coupons') },
    { icon: <Download className="w-5 h-5" />, labelKey: 'admin.tab_reports' as TKey, active: tab === 'reports', onClick: () => setTab('reports') },
    { icon: <LifeBuoy className="w-5 h-5" />, labelKey: 'admin.tab_support' as TKey, active: tab === 'support', onClick: () => setTab('support') },
    { icon: <Settings className="w-5 h-5" />, labelKey: 'admin.tab_settings' as TKey, active: tab === 'settings', onClick: () => setTab('settings') },
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
                    {(['starter', 'professional', 'expert', 'bundle'] as const).map((plan) => {
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                              {user.role !== 'super_admin' && (superAdminEmails.length > 0 ? superAdminEmails.map((e) => e.email) : BOOTSTRAP_SUPER_ADMIN_EMAILS).includes(user.email) && (
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
              <div className="card p-6">
                <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-1 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary-500" /> Emails autorisés — Super Admin
                </h3>
                <p className="text-sm text-secondary-400 dark:text-neutral-100 mb-4">
                  Seuls ces emails peuvent être promus Super Admin. Les emails protégés ne peuvent jamais être retirés.
                </p>
                <form onSubmit={addSuperAdminEmail} className="flex gap-2 mb-4 max-w-lg">
                  <input
                    type="email"
                    required
                    value={newSuperAdminEmail}
                    onChange={(e) => setNewSuperAdminEmail(e.target.value)}
                    placeholder="nouvel.email@exemple.com"
                    className="input-field flex-1"
                  />
                  <button type="submit" className="btn-primary whitespace-nowrap">Ajouter</button>
                </form>
                <div className="space-y-2">
                  {superAdminEmails.map((e) => (
                    <div key={e.email} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-secondary-600">
                      <span className="text-sm text-secondary-600 dark:text-white">{e.email}</span>
                      {e.protected ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400">Protégé</span>
                      ) : (
                        <button onClick={() => removeSuperAdminEmail(e.email, e.protected)} className="text-xs text-alert-500 hover:underline flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Retirer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {(['starter', 'professional', 'expert', 'bundle'] as const).map((plan) => (
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

          {/* REVENUE */}
          {tab === 'revenue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                <StatCard icon={<DollarSign className="w-6 h-6" />} label={t('admin.revenue_total')} value={totalRevenue} prefix="$" />
                <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Starter" value={revenueByPlan['starter'] || 0} prefix="$" />
                <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Professional" value={revenueByPlan['professional'] || 0} prefix="$" />
                <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Expert" value={revenueByPlan['expert'] || 0} prefix="$" />
                <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Bundle" value={revenueByPlan['bundle'] || 0} prefix="$" />
              </div>

              {payments.some((p) => p.status === 'pending') && (
                <div className="card p-6">
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-1 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary-500" /> Paiements manuels en attente
                  </h3>
                  <p className="text-sm text-secondary-400 dark:text-neutral-100 mb-4">
                    Virements / Mobile Money soumis par les étudiants, en attendant Paystack / CinetPay. Vérifiez la référence puis confirmez.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary-600 dark:bg-secondary-800 text-white">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Montant</th>
                          <th className="text-left p-3 text-sm font-medium">Référence</th>
                          <th className="text-left p-3 text-sm font-medium">Note</th>
                          <th className="text-left p-3 text-sm font-medium">Date</th>
                          <th className="text-left p-3 text-sm font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.filter((p) => p.status === 'pending').map((p) => (
                          <tr key={p.id} className="border-b border-slate-100 dark:border-secondary-500">
                            <td className="p-3 text-sm font-semibold text-secondary-600 dark:text-white">${Number(p.amount).toFixed(2)}</td>
                            <td className="p-3 text-sm text-secondary-600 dark:text-neutral-100">{p.reference || '—'}</td>
                            <td className="p-3 text-sm text-secondary-400 dark:text-neutral-100">{p.note || '—'}</td>
                            <td className="p-3 text-sm text-secondary-400 dark:text-neutral-100">{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="p-3">
                              <button onClick={() => confirmManualPayment(p)} className="btn-primary text-xs py-1.5 px-3">
                                Confirmer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {payoutRequests.some((p) => p.status === 'pending') && (
                <div className="card p-6">
                  <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-1 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary-500" /> Demandes de retrait formateurs
                  </h3>
                  <p className="text-sm text-secondary-400 dark:text-neutral-100 mb-4">
                    Vérifiez les coordonnées puis effectuez le virement/Mobile Money manuellement avant de marquer "Payé".
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary-600 dark:bg-secondary-800 text-white">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Montant</th>
                          <th className="text-left p-3 text-sm font-medium">Méthode</th>
                          <th className="text-left p-3 text-sm font-medium">Coordonnées</th>
                          <th className="text-left p-3 text-sm font-medium">Date</th>
                          <th className="text-left p-3 text-sm font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payoutRequests.filter((p) => p.status === 'pending').map((p) => (
                          <tr key={p.id} className="border-b border-slate-100 dark:border-secondary-500">
                            <td className="p-3 text-sm font-semibold text-secondary-600 dark:text-white">${Number(p.amount).toFixed(2)}</td>
                            <td className="p-3 text-sm text-secondary-600 dark:text-neutral-100">{p.method === 'mobile_money' ? 'Mobile Money' : 'Virement bancaire'}</td>
                            <td className="p-3 text-sm text-secondary-400 dark:text-neutral-100 max-w-xs whitespace-pre-wrap">{p.account_details}</td>
                            <td className="p-3 text-sm text-secondary-400 dark:text-neutral-100">{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <button onClick={() => processPayoutRequest(p, 'paid')} className="btn-primary text-xs py-1.5 px-3">
                                  Payé
                                </button>
                                <button onClick={() => processPayoutRequest(p, 'rejected')} className="text-xs py-1.5 px-3 rounded-lg bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400">
                                  Rejeter
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="card p-6">
                <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary-500" /> Subscription Revenue Breakdown
                </h3>
                <div className="space-y-3">
                  {(['starter', 'professional', 'expert', 'bundle'] as const).map((plan) => {
                    const amt = revenueByPlan[plan] || 0;
                    const pct = totalRevenue > 0 ? (amt / totalRevenue) * 100 : 0;
                    return (
                      <div key={plan}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-secondary-600 dark:text-white capitalize">{plan}</span>
                          <span className="text-secondary-400 dark:text-neutral-100">${amt.toFixed(2)}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-secondary-600">
                          <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CERTIFICATES */}
          {tab === 'certificates' && (
            <div className="space-y-4">
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary-600 dark:bg-secondary-800 text-white">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium">Holder</th>
                        <th className="text-left p-4 text-sm font-medium">Course</th>
                        <th className="text-left p-4 text-sm font-medium">Certificate #</th>
                        <th className="text-left p-4 text-sm font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-secondary-400 dark:text-neutral-100">No certificates</td></tr>
                      ) : certificates.map((cert) => (
                        <tr key={cert.id} className="border-b border-gray-100 dark:border-secondary-500">
                          <td className="p-4 text-sm text-secondary-600 dark:text-white">{certHolderNames[cert.user_id] || '—'}</td>
                          <td className="p-4 text-sm text-secondary-400 dark:text-neutral-100">{certCourseTitles[cert.course_id] || '—'}</td>
                          <td className="p-4 text-sm text-secondary-400 dark:text-neutral-100">{cert.certificate_number || '—'}</td>
                          <td className="p-4 text-sm text-secondary-400 dark:text-neutral-100">{new Date(cert.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* EMPLOYERS */}
          {tab === 'employers' && (
            <div className="space-y-4">
              {employers.length === 0 ? (
                <div className="card p-8 text-center">
                  <Building2 className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                  <p className="text-secondary-400 dark:text-neutral-100">No employer profiles</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employers.map((emp) => (
                    <div key={emp.id} className="card p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-secondary-600 dark:text-white">{emp.company_name || '—'}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.is_verified ? 'bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400' : 'bg-gray-100 dark:bg-secondary-600 text-secondary-400 dark:text-neutral-100'}`}>
                          {emp.is_verified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                      <p className="text-sm text-secondary-400 dark:text-neutral-100">{emp.industry || '—'}</p>
                      {emp.website && <a href={emp.website} target="_blank" rel="noreferrer" className="text-xs text-primary-500 hover:underline">{emp.website}</a>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COUPONS */}
          {tab === 'coupons' && (
            <div className="space-y-6">
              <form onSubmit={async (e) => {
                e.preventDefault();
                const { data } = await supabase.from('coupons').insert({ code: newCoupon.code.toUpperCase(), discount_percent: newCoupon.discount_percent, max_uses: newCoupon.max_uses, is_active: true, created_by: profile.id }).select().single();
                if (data) { setCoupons([data, ...coupons]); setNewCoupon({ code: '', discount_percent: 10, max_uses: 100 }); }
              }} className="card p-6 flex gap-3 items-end flex-wrap max-w-2xl">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">Code</label>
                  <input type="text" required value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })} className="input-field" placeholder="SUMMER20" />
                </div>
                <div className="w-28">
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">Discount %</label>
                  <input type="number" min={1} max={100} required value={newCoupon.discount_percent} onChange={(e) => setNewCoupon({ ...newCoupon, discount_percent: parseInt(e.target.value) || 0 })} className="input-field" />
                </div>
                <div className="w-28">
                  <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">Max uses</label>
                  <input type="number" min={1} required value={newCoupon.max_uses} onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: parseInt(e.target.value) || 0 })} className="input-field" />
                </div>
                <button type="submit" className="btn-primary flex items-center gap-2"><Tag className="w-5 h-5" /> Create Coupon</button>
              </form>

              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary-600 dark:bg-secondary-800 text-white">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium">Code</th>
                        <th className="text-left p-4 text-sm font-medium">Discount</th>
                        <th className="text-left p-4 text-sm font-medium">Uses</th>
                        <th className="text-left p-4 text-sm font-medium">Expires</th>
                        <th className="text-left p-4 text-sm font-medium">Status</th>
                        <th className="text-left p-4 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-secondary-400 dark:text-neutral-100">No coupons</td></tr>
                      ) : coupons.map((c) => (
                        <tr key={c.id} className="border-b border-gray-100 dark:border-secondary-500">
                          <td className="p-4 text-sm font-mono text-secondary-600 dark:text-white">{c.code}</td>
                          <td className="p-4 text-sm text-secondary-400 dark:text-neutral-100">{c.discount_percent}%</td>
                          <td className="p-4 text-sm text-secondary-400 dark:text-neutral-100">{c.uses}/{c.max_uses}</td>
                          <td className="p-4 text-sm text-secondary-400 dark:text-neutral-100">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? 'bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400' : 'bg-gray-100 dark:bg-secondary-600 text-secondary-400 dark:text-neutral-100'}`}>
                              {c.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4">
                            <button onClick={async () => { await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id); setCoupons(coupons.map((x) => x.id === c.id ? { ...x, is_active: !x.is_active } : x)); }} className="text-xs text-primary-500 hover:underline">
                              {c.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS */}
          {tab === 'reports' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary-500" /> Export Data
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => {
                    const rows = users.map((u) => ({ id: u.id, email: u.email, nom: u.nom, role: u.role, kyc_status: u.kyc_status, created_at: u.created_at }));
                    const csv = [Object.keys(rows[0] || {}).join(','), ...rows.map((r) => Object.values(r).join(','))].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'users.csv'; a.click(); URL.revokeObjectURL(url);
                  }} className="btn-outline flex items-center gap-2"><Download className="w-4 h-4" /> Users CSV</button>
                  <button onClick={() => {
                    const rows = allCourses.map((c) => ({ id: c.id, title: c.title, category: c.category, level: c.level, status: c.status, created_at: c.created_at }));
                    const csv = [Object.keys(rows[0] || {}).join(','), ...rows.map((r) => Object.values(r).join(','))].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'courses.csv'; a.click(); URL.revokeObjectURL(url);
                  }} className="btn-outline flex items-center gap-2"><Download className="w-4 h-4" /> Courses CSV</button>
                  <button onClick={() => {
                    const rows = subscriptions.map((s) => ({ id: s.id, plan: s.plan, status: s.status, start_date: s.start_date, end_date: s.end_date }));
                    const csv = [Object.keys(rows[0] || {}).join(','), ...rows.map((r) => Object.values(r).join(','))].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'subscriptions.csv'; a.click(); URL.revokeObjectURL(url);
                  }} className="btn-outline flex items-center gap-2"><Download className="w-4 h-4" /> Subscriptions CSV</button>
                  <button onClick={() => {
                    const rows = payments.map((p) => ({ id: p.id, amount: p.amount, status: p.status, created_at: p.created_at }));
                    const csv = [Object.keys(rows[0] || {}).join(','), ...rows.map((r) => Object.values(r).join(','))].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'payments.csv'; a.click(); URL.revokeObjectURL(url);
                  }} className="btn-outline flex items-center gap-2"><Download className="w-4 h-4" /> Payments CSV</button>
                </div>
              </div>
            </div>
          )}

          {/* SUPPORT */}
          {tab === 'support' && (
            <div className="space-y-4">
              {supportTickets.length === 0 ? (
                <div className="card p-8 text-center">
                  <LifeBuoy className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                  <p className="text-secondary-400 dark:text-neutral-100">No support tickets</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="card p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-secondary-600 dark:text-white">{ticket.subject}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ticket.status === 'open' ? 'bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400' : ticket.status === 'resolved' ? 'bg-success-100 dark:bg-success-600/20 text-success-600 dark:text-success-400' : 'bg-gray-100 dark:bg-secondary-600 text-secondary-400 dark:text-neutral-100'}`}>
                              {ticket.status}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(ticket.priority === 'high' || ticket.priority === 'urgent') ? 'bg-alert-100 dark:bg-alert-600/20 text-alert-600 dark:text-alert-400' : ticket.priority === 'normal' ? 'bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400' : 'bg-gray-100 dark:bg-secondary-600 text-secondary-400 dark:text-neutral-100'}`}>
                              {ticket.priority}
                            </span>
                          </div>
                          <p className="text-xs text-secondary-400 dark:text-neutral-100">{ticketUserNames[ticket.user_id] || '—'} · {new Date(ticket.created_at).toLocaleDateString()}</p>
                          {ticket.description && <p className="text-sm text-secondary-600 dark:text-white mt-2">{ticket.description}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {tab === 'settings' && (
            <div className="space-y-6">
              <div className="card p-6 max-w-lg">
                <h3 className="font-heading font-semibold text-secondary-600 dark:text-white mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary-500" /> Platform Settings
                </h3>
                <form onSubmit={(e) => { e.preventDefault(); alert('Settings saved (demo)'); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">Platform Name</label>
                    <input type="text" value={platformSettings.platform_name} onChange={(e) => setPlatformSettings({ ...platformSettings, platform_name: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">Default Language</label>
                    <select value={platformSettings.default_language} onChange={(e) => setPlatformSettings({ ...platformSettings, default_language: e.target.value })} className="input-field">
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-600 dark:text-neutral-100 mb-1">Support Email</label>
                    <input type="email" value={platformSettings.support_email} onChange={(e) => setPlatformSettings({ ...platformSettings, support_email: e.target.value })} className="input-field" />
                  </div>
                  <button type="submit" className="btn-primary">Save Settings</button>
                </form>
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
