export type UserRole = 'student' | 'trainer' | 'super_admin';

export type SubscriptionPlan = 'starter' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';

export type CourseStatus = 'draft' | 'pending_review' | 'published' | 'rejected';
export type KycStatus = 'unverified' | 'pending' | 'approved' | 'rejected';
export type CourseLevel = 'Débutant' | 'Intermédiaire' | 'Avancé';

export type SuggestionStatus = 'pending' | 'approved' | 'rejected';
export type SuggestionLevel = 'country' | 'region' | 'city' | 'district';

export interface Profile {
  id: string;
  email: string;
  nom: string;
  avatar: string;
  role: UserRole;
  revenue_share: number;
  country_id: string | null;
  region_id: string | null;
  city_id: string | null;
  district_id: string | null;
  language: string;
  theme: string;
  tenant_id: string | null;
  kyc_status: KycStatus;
  document_type: string | null;
  document_url: string | null;
  chosen_category_ids: string[] | null;
  created_at: string;
}

export interface Country {
  id: string;
  name: string;
  code: string;
}

export interface Region {
  id: string;
  country_id: string;
  name: string;
}

export interface City {
  id: string;
  region_id: string;
  name: string;
}

export interface District {
  id: string;
  city_id: string;
  name: string;
}

export interface LocationSuggestion {
  id: string;
  user_id: string;
  level: SuggestionLevel;
  parent_id: string | null;
  proposed_name: string;
  status: SuggestionStatus;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string | null;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  category_id: string | null;
  level: CourseLevel;
  created_by: string;
  tenant_id: string | null;
  status: CourseStatus;
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  video_url: string;
  document_url: string;
  duration: number;
  order_number: number;
  created_at: string;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  question: string;
  answers: string[];
  correct_answer: number;
  explanation: string;
  passing_score: number;
  created_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  certificate_number: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  logo: string;
  owner_id: string;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'member' | 'admin';
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress_pct: number;
  enrolled_at: string;
  completed_at: string | null;
}

export interface Review {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  created_at: string;
}

export interface CourseWithDetails extends Course {
  lessons?: Lesson[];
  instructor_name?: string;
  avg_rating?: number;
  review_count?: number;
  enrollment_count?: number;
}

export interface KycDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  created_by: string;
  created_at: string;
}

export interface WatchSession {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  tenant_id: string | null;
  watched_seconds: number;
  created_at: string;
}

export interface TrainerEarning {
  id: string;
  trainer_id: string;
  period_start: string;
  period_end: string;
  total_watch_hours: number;
  amount_due: number;
  status: 'pending' | 'paid';
  paid_at: string | null;
  created_at: string;
}

export interface CustomRole {
  id: string;
  name: string;
  tenant_id: string | null;
  created_by: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_key: string;
  allowed: boolean;
  created_at: string;
}

export interface StaffMember {
  id: string;
  user_id: string;
  custom_role_id: string;
  assigned_by: string;
  created_at: string;
}
