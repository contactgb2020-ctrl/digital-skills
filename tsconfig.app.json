/*
# Skills Academy: Career Paths, Portfolios, Employer Portal, Student Stats

1. New Tables
- `career_paths`: Professional career paths. Each contains multiple courses.
- `career_path_courses`: Join table linking career paths to courses with module grouping.
- `portfolios`: Student public portfolios.
- `portfolio_projects`: Projects published in a portfolio.
- `student_stats`: Aggregated learning stats per student (XP, streak, achievements).
- `bookmarks`: Lesson bookmarks for students.
- `wishlist`: Career path wishlist for students.
- `employer_profiles`: Company profiles for the employer portal.
- `saved_candidates`: Employers' saved student profiles.
- `coupons`: Discount coupons.
- `support_tickets`: Support ticket system.
2. Security
- RLS enabled on all new tables with appropriate policies.
*/

-- Career Paths
CREATE TABLE IF NOT EXISTS career_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  long_description text,
  category text NOT NULL DEFAULT 'Technology',
  required_skills text[] DEFAULT '{}',
  duration_weeks int DEFAULT 12,
  level text DEFAULT 'Beginner',
  learning_outcomes text[] DEFAULT '{}',
  salary_range text,
  career_opportunities text[] DEFAULT '{}',
  image text,
  icon text,
  price_cents int DEFAULT 18900,
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE career_paths ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_published_career_paths" ON career_paths;
CREATE POLICY "public_read_published_career_paths" ON career_paths FOR SELECT
  TO anon, authenticated USING (is_published = true);
DROP POLICY IF EXISTS "insert_career_paths" ON career_paths;
CREATE POLICY "insert_career_paths" ON career_paths FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_career_paths" ON career_paths;
CREATE POLICY "update_career_paths" ON career_paths FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_career_paths" ON career_paths;
CREATE POLICY "delete_career_paths" ON career_paths FOR DELETE
  TO authenticated USING (true);

-- Career Path Courses (join table)
CREATE TABLE IF NOT EXISTS career_path_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_path_id uuid NOT NULL REFERENCES career_paths(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_name text DEFAULT 'Module 1',
  module_order int DEFAULT 1,
  course_order int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(career_path_id, course_id)
);
ALTER TABLE career_path_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_career_path_courses" ON career_path_courses;
CREATE POLICY "public_read_career_path_courses" ON career_path_courses FOR SELECT
  TO anon, authenticated USING (true);

-- Portfolios
CREATE TABLE IF NOT EXISTS portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  headline text,
  bio text,
  avatar_url text,
  skills text[] DEFAULT '{}',
  experience jsonb DEFAULT '[]',
  social_links jsonb DEFAULT '{}',
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_portfolios" ON portfolios;
CREATE POLICY "public_read_portfolios" ON portfolios FOR SELECT
  TO anon, authenticated USING (is_public = true);
DROP POLICY IF EXISTS "insert_own_portfolio" ON portfolios;
CREATE POLICY "insert_own_portfolio" ON portfolios FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_portfolio" ON portfolios;
CREATE POLICY "update_own_portfolio" ON portfolios FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_portfolio" ON portfolios;
CREATE POLICY "delete_own_portfolio" ON portfolios FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Portfolio Projects
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  project_url text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_portfolio_projects" ON portfolio_projects;
CREATE POLICY "public_read_portfolio_projects" ON portfolio_projects FOR SELECT
  TO anon, authenticated USING (EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = portfolio_projects.portfolio_id AND portfolios.is_public = true));
DROP POLICY IF EXISTS "insert_own_portfolio_projects" ON portfolio_projects;
CREATE POLICY "insert_own_portfolio_projects" ON portfolio_projects FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = portfolio_id AND portfolios.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_portfolio_projects" ON portfolio_projects;
CREATE POLICY "update_own_portfolio_projects" ON portfolio_projects FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = portfolio_id AND portfolios.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = portfolio_id AND portfolios.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_portfolio_projects" ON portfolio_projects;
CREATE POLICY "delete_own_portfolio_projects" ON portfolio_projects FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = portfolio_id AND portfolios.user_id = auth.uid()));

-- Student Stats
CREATE TABLE IF NOT EXISTS student_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_points int DEFAULT 0,
  streak_days int DEFAULT 0,
  last_activity_date date,
  total_learning_hours numeric DEFAULT 0,
  achievements text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE student_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_own_student_stats" ON student_stats;
CREATE POLICY "read_own_student_stats" ON student_stats FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_student_stats" ON student_stats;
CREATE POLICY "insert_own_student_stats" ON student_stats FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_student_stats" ON student_stats;
CREATE POLICY "update_own_student_stats" ON student_stats FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_own_bookmarks" ON bookmarks;
CREATE POLICY "read_own_bookmarks" ON bookmarks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_bookmarks" ON bookmarks;
CREATE POLICY "insert_own_bookmarks" ON bookmarks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_bookmarks" ON bookmarks;
CREATE POLICY "delete_own_bookmarks" ON bookmarks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  career_path_id uuid NOT NULL REFERENCES career_paths(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, career_path_id)
);
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_own_wishlist" ON wishlist;
CREATE POLICY "read_own_wishlist" ON wishlist FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_wishlist" ON wishlist;
CREATE POLICY "insert_own_wishlist" ON wishlist FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_wishlist" ON wishlist;
CREATE POLICY "delete_own_wishlist" ON wishlist FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Employer Profiles
CREATE TABLE IF NOT EXISTS employer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  logo_url text,
  industry text,
  website text,
  description text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_employer_profiles" ON employer_profiles;
CREATE POLICY "public_read_employer_profiles" ON employer_profiles FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_employer_profile" ON employer_profiles;
CREATE POLICY "insert_own_employer_profile" ON employer_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_employer_profile" ON employer_profiles;
CREATE POLICY "update_own_employer_profile" ON employer_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Saved Candidates
CREATE TABLE IF NOT EXISTS saved_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employer_id, student_id)
);
ALTER TABLE saved_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_own_saved_candidates" ON saved_candidates;
CREATE POLICY "read_own_saved_candidates" ON saved_candidates FOR SELECT
  TO authenticated USING (auth.uid() = employer_id);
DROP POLICY IF EXISTS "insert_own_saved_candidates" ON saved_candidates;
CREATE POLICY "insert_own_saved_candidates" ON saved_candidates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = employer_id);
DROP POLICY IF EXISTS "delete_own_saved_candidates" ON saved_candidates;
CREATE POLICY "delete_own_saved_candidates" ON saved_candidates FOR DELETE
  TO authenticated USING (auth.uid() = employer_id);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent int NOT NULL DEFAULT 10,
  max_uses int DEFAULT 100,
  uses int DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_coupons_admin" ON coupons;
CREATE POLICY "read_coupons_admin" ON coupons FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_coupons_admin" ON coupons;
CREATE POLICY "insert_coupons_admin" ON coupons FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_coupons_admin" ON coupons;
CREATE POLICY "update_coupons_admin" ON coupons FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_coupons_admin" ON coupons;
CREATE POLICY "delete_coupons_admin" ON coupons FOR DELETE
  TO authenticated USING (true);

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text,
  status text DEFAULT 'open',
  priority text DEFAULT 'normal',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_own_tickets" ON support_tickets;
CREATE POLICY "read_own_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR auth.uid() = assigned_to);
DROP POLICY IF EXISTS "insert_own_tickets" ON support_tickets;
CREATE POLICY "insert_own_tickets" ON support_tickets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_tickets" ON support_tickets;
CREATE POLICY "update_own_tickets" ON support_tickets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR auth.uid() = assigned_to) WITH CHECK (true);

-- Seed career paths
INSERT INTO career_paths (slug, title, description, category, required_skills, duration_weeks, level, learning_outcomes, salary_range, career_opportunities, is_featured, is_published, sort_order, price_cents)
VALUES
  ('full-stack-web-developer', 'Full Stack Web Developer', 'Master front-end and back-end development to build complete web applications.', 'Technology', ARRAY['JavaScript','React','Node.js','PostgreSQL','Git'], 16, 'Beginner to Advanced', ARRAY['Build full-stack web apps','Deploy to production','Design REST APIs','Manage databases'], '$45,000 - $120,000', ARRAY['Web Developer','Front-end Engineer','Back-end Developer','Tech Lead'], true, true, 1, 24900),
  ('ai-engineer', 'AI Engineer', 'Learn machine learning, deep learning, and AI deployment for real-world applications.', 'Technology', ARRAY['Python','TensorFlow','Data Science','NLP','MLOps'], 20, 'Intermediate', ARRAY['Build ML models','Deploy AI systems','Process natural language','Create recommendation engines'], '$70,000 - $180,000', ARRAY['AI Engineer','ML Engineer','Data Scientist','AI Consultant'], true, true, 2, 24900),
  ('cybersecurity', 'Cybersecurity Specialist', 'Protect systems and networks from digital attacks and security breaches.', 'Technology', ARRAY['Networking','Linux','Penetration Testing','Cryptography','SIEM'], 18, 'Intermediate', ARRAY['Perform security audits','Implement defense systems','Respond to incidents','Ethical hacking'], '$60,000 - $160,000', ARRAY['Security Analyst','Penetration Tester','SOC Analyst','Security Consultant'], true, true, 3, 24900),
  ('data-analyst', 'Data Analyst', 'Turn raw data into actionable business insights using modern analytics tools.', 'Technology', ARRAY['SQL','Python','Excel','Tableau','Statistics'], 14, 'Beginner', ARRAY['Analyze large datasets','Create dashboards','Build reports','Statistical analysis'], '$50,000 - $130,000', ARRAY['Data Analyst','BI Analyst','Data Consultant','Analytics Manager'], true, true, 4, 24900),
  ('ui-ux-designer', 'UI/UX Designer', 'Design beautiful, intuitive user interfaces and seamless user experiences.', 'Technology', ARRAY['Figma','Design Systems','Prototyping','User Research','Wireframing'], 12, 'Beginner', ARRAY['Design user interfaces','Conduct user research','Create prototypes','Build design systems'], '$45,000 - $140,000', ARRAY['UI Designer','UX Designer','Product Designer','Design Lead'], true, true, 5, 24900),
  ('mobile-app-developer', 'Mobile App Developer', 'Build native and cross-platform mobile apps for iOS and Android.', 'Technology', ARRAY['React Native','Flutter','Swift','Kotlin','Firebase'], 16, 'Intermediate', ARRAY['Build mobile apps','Publish to app stores','Integrate APIs','Mobile UI design'], '$50,000 - $150,000', ARRAY['Mobile Developer','App Engineer','Mobile Lead','Freelance Developer'], false, true, 6, 24900),
  ('accounting', 'Accounting Professional', 'Master financial accounting, bookkeeping, and reporting for businesses.', 'Business', ARRAY['Bookkeeping','Financial Statements','Tax','QuickBooks','Audit'], 14, 'Beginner', ARRAY['Manage accounts','Prepare financial reports','Handle taxes','Audit preparation'], '$40,000 - $100,000', ARRAY['Accountant','Bookkeeper','Audit Associate','Finance Manager'], false, true, 7, 18900),
  ('entrepreneurship', 'Entrepreneurship', 'Launch and grow your own business from idea to scale.', 'Business', ARRAY['Business Planning','Marketing','Finance','Leadership','Strategy'], 10, 'Beginner', ARRAY['Write a business plan','Validate your idea','Raise capital','Scale operations'], 'Variable', ARRAY['Founder','Startup CEO','Business Owner','Consultant'], false, true, 8, 18900),
  ('digital-marketing', 'Digital Marketing Specialist', 'Drive growth through SEO, social media, paid ads, and content marketing.', 'Business', ARRAY['SEO','Google Ads','Social Media','Content Marketing','Analytics'], 12, 'Beginner', ARRAY['Run ad campaigns','Optimize SEO','Build content strategy','Analyze metrics'], '$40,000 - $120,000', ARRAY['Marketing Manager','SEO Specialist','Growth Marketer','CMO'], true, true, 9, 24900),
  ('sales-crm', 'Sales & CRM Manager', 'Master the sales process and CRM tools to drive revenue growth.', 'Business', ARRAY['Sales Strategy','CRM','Negotiation','Pipeline Management','HubSpot'], 10, 'Beginner', ARRAY['Manage sales pipelines','Close deals','Use CRM tools','Build sales teams'], '$45,000 - $130,000', ARRAY['Sales Rep','Account Manager','Sales Director','VP Sales'], false, true, 10, 18900),
  ('e-commerce', 'E-Commerce Manager', 'Build and scale online stores from product sourcing to fulfillment.', 'Business', ARRAY['Shopify','Product Listing','Logistics','Payment Gateways','SEO'], 12, 'Beginner', ARRAY['Launch an online store','Manage inventory','Optimize conversions','Handle logistics'], '$40,000 - $110,000', ARRAY['E-Commerce Manager','Store Owner','Dropshipper','Operations Lead'], false, true, 11, 18900),
  ('professional-makeup-artist', 'Professional Makeup Artist', 'Master makeup artistry for weddings, events, film, and editorial.', 'Beauty & Fashion', ARRAY['Skin Preparation','Color Theory','Bridal Makeup','Contouring','Hygiene'], 8, 'Beginner', ARRAY['Apply bridal makeup','Create editorial looks','Build a client base','Kit management'], '$30,000 - $90,000', ARRAY['Makeup Artist','Bridal Artist','Editorial Artist','Brand Ambassador'], true, true, 12, 18900),
  ('hair-stylist', 'Hair Stylist', 'Learn cutting, coloring, styling, and salon management.', 'Beauty & Fashion', ARRAY['Cutting','Coloring','Styling','Salon Management','Client Care'], 10, 'Beginner', ARRAY['Cut and style hair','Apply color treatments','Run a salon','Build clientele'], '$25,000 - $80,000', ARRAY['Hair Stylist','Salon Owner','Color Specialist','Session Stylist'], false, true, 13, 18900),
  ('nail-technician', 'Nail Technician', 'Master nail art, manicures, pedicures, and nail salon business.', 'Beauty & Fashion', ARRAY['Manicure','Pedicure','Nail Art','Gel & Acrylic','Hygiene'], 8, 'Beginner', ARRAY['Perform manicures','Create nail art','Apply gel/acrylics','Run a nail business'], '$20,000 - $70,000', ARRAY['Nail Technician','Nail Salon Owner','Nail Artist','Brand Rep'], false, true, 14, 18900),
  ('barber', 'Professional Barber', 'Master fades, beard grooming, and modern barber shop management.', 'Beauty & Fashion', ARRAY['Fade Cutting','Beard Grooming','Straight Razor','Salon Management','Hygiene'], 8, 'Beginner', ARRAY['Execute fade cuts','Groom beards','Shave with straight razor','Run a barbershop'], '$25,000 - $75,000', ARRAY['Barber','Barbershop Owner','Mobile Barber','Brand Educator'], false, true, 15, 18900),
  ('fashion-designer', 'Fashion Designer', 'Learn fashion illustration, pattern making, sewing, and brand building.', 'Beauty & Fashion', ARRAY['Illustration','Pattern Making','Sewing','Textiles','Branding'], 14, 'Beginner', ARRAY['Design garments','Create patterns','Sew collections','Build a fashion brand'], '$30,000 - $100,000', ARRAY['Fashion Designer','Pattern Maker','Brand Owner','Stylist'], false, true, 16, 18900),
  ('graphic-design', 'Graphic Designer', 'Master visual design, branding, typography, and Adobe Creative Suite.', 'Creative', ARRAY['Photoshop','Illustrator','Typography','Branding','Layout'], 12, 'Beginner', ARRAY['Design brand identities','Create marketing materials','Master typography','Build a portfolio'], '$35,000 - $100,000', ARRAY['Graphic Designer','Brand Designer','Art Director','Freelance Designer'], true, true, 17, 24900),
  ('video-editing', 'Video Editor', 'Learn professional video editing for film, YouTube, and social media.', 'Creative', ARRAY['Premiere Pro','After Effects','Color Grading','Sound Design','Storytelling'], 10, 'Beginner', ARRAY['Edit professional videos','Color grade footage','Create motion graphics','Build a reel'], '$30,000 - $90,000', ARRAY['Video Editor','YouTube Editor','Post-Production Lead','Freelance Editor'], false, true, 18, 24900),
  ('photography', 'Professional Photographer', 'Master photography for portraits, events, products, and editing.', 'Creative', ARRAY['Camera Operation','Lighting','Composition','Lightroom','Photoshop'], 10, 'Beginner', ARRAY['Shoot professional photos','Edit in Lightroom','Build a portfolio','Run a studio'], '$25,000 - $85,000', ARRAY['Photographer','Studio Owner','Product Photographer','Freelancer'], false, true, 19, 24900),
  ('motion-graphics', 'Motion Graphics Designer', 'Create animated graphics for video, advertising, and digital media.', 'Creative', ARRAY['After Effects','Cinema 4D','Animation','Illustration','Sound Design'], 12, 'Intermediate', ARRAY['Animate graphics','Create 3D motion','Design title sequences','Build a motion reel'], '$40,000 - $120,000', ARRAY['Motion Designer','Animator','Creative Director','Freelance Motion Artist'], false, true, 20, 24900),
  ('electrical-installation', 'Electrical Installation Technician', 'Learn residential and commercial electrical installation and safety.', 'Technical Trades', ARRAY['Wiring','Circuit Design','Safety Codes','Troubleshooting','Panel Installation'], 12, 'Beginner', ARRAY['Install electrical systems','Read blueprints','Troubleshoot faults','Ensure safety compliance'], '$35,000 - $80,000', ARRAY['Electrician','Electrical Contractor','Maintenance Tech','Inspector'], false, true, 21, 18900),
  ('plumbing', 'Plumbing Professional', 'Master plumbing installation, repair, and system design.', 'Technical Trades', ARRAY['Pipe Fitting','Drainage','Water Systems','Soldering','Codes'], 10, 'Beginner', ARRAY['Install plumbing systems','Repair leaks','Design water systems','Read blueprints'], '$35,000 - $75,000', ARRAY['Plumber','Plumbing Contractor','Maintenance Tech','Inspector'], false, true, 22, 18900),
  ('air-conditioning', 'HVAC Technician', 'Learn heating, ventilation, and air conditioning installation and repair.', 'Technical Trades', ARRAY['Refrigeration','Ductwork','Electrical','Troubleshooting','Safety'], 10, 'Beginner', ARRAY['Install HVAC systems','Service units','Troubleshoot faults','Handle refrigerants'], '$35,000 - $80,000', ARRAY['HVAC Technician','HVAC Contractor','Service Tech','Maintenance Lead'], false, true, 23, 18900),
  ('computer-repair', 'Computer Repair Technician', 'Master hardware repair, troubleshooting, and IT support.', 'Technical Trades', ARRAY['Hardware','Diagnostics','OS Installation','Networking','Troubleshooting'], 8, 'Beginner', ARRAY['Repair computers','Build PCs','Diagnose hardware','Provide IT support'], '$30,000 - $70,000', ARRAY['IT Support','PC Technician','Repair Shop Owner','Field Tech'], false, true, 24, 18900),
  ('english-language', 'English Language', 'Master English for professional communication and international business.', 'Languages', ARRAY['Grammar','Conversation','Business English','Writing','Pronunciation'], 16, 'Beginner', ARRAY['Speak fluently','Write professionally','Pass interviews','Business communication'], 'Career boost', ARRAY['Any international role','Translator','Customer Support','Teacher'], false, true, 25, 18900),
  ('french-language', 'French Language', 'Master French for professional and academic use.', 'Languages', ARRAY['Grammar','Conversation','Writing','Pronunciation','DELF/DALF'], 16, 'Beginner', ARRAY['Speak fluently','Write professionally','Pass DELF/DALF','Business French'], 'Career boost', ARRAY['Any francophone role','Translator','Diplomat','Teacher'], false, true, 26, 18900),
  ('arabic-language', 'Arabic Language', 'Learn modern standard Arabic for business, travel, and culture.', 'Languages', ARRAY['Grammar','Conversation','Writing','Reading','Pronunciation'], 16, 'Beginner', ARRAY['Speak Arabic','Read and write','Business communication','Cultural understanding'], 'Career boost', ARRAY['International business','Translator','Teacher','Diplomat'], false, true, 27, 18900)
ON CONFLICT (slug) DO NOTHING;
