-- The initial seed data used US salary ranges, which don't reflect the
-- African job market this platform serves. This corrects the existing rows
-- (an UPDATE, since the original INSERT used ON CONFLICT DO NOTHING and
-- won't touch rows already created).
UPDATE career_paths SET salary_range = '$6,000 - $30,000' WHERE slug = 'full-stack-web-developer';
UPDATE career_paths SET salary_range = '$8,000 - $40,000' WHERE slug = 'ai-engineer';
UPDATE career_paths SET salary_range = '$7,000 - $35,000' WHERE slug = 'cybersecurity';
UPDATE career_paths SET salary_range = '$5,000 - $25,000' WHERE slug = 'data-analyst';
UPDATE career_paths SET salary_range = '$5,000 - $28,000' WHERE slug = 'ui-ux-designer';
UPDATE career_paths SET salary_range = '$6,000 - $32,000' WHERE slug = 'mobile-app-developer';
UPDATE career_paths SET salary_range = '$4,000 - $18,000' WHERE slug = 'accounting';
UPDATE career_paths SET salary_range = '$4,000 - $20,000' WHERE slug = 'digital-marketing';
UPDATE career_paths SET salary_range = '$4,000 - $22,000' WHERE slug = 'sales-crm';
UPDATE career_paths SET salary_range = '$4,000 - $20,000' WHERE slug = 'e-commerce';
UPDATE career_paths SET salary_range = '$2,500 - $15,000' WHERE slug = 'professional-makeup-artist';
UPDATE career_paths SET salary_range = '$2,000 - $12,000' WHERE slug = 'hair-stylist';
UPDATE career_paths SET salary_range = '$1,800 - $10,000' WHERE slug = 'nail-technician';
UPDATE career_paths SET salary_range = '$2,000 - $12,000' WHERE slug = 'barber';
UPDATE career_paths SET salary_range = '$3,000 - $18,000' WHERE slug = 'fashion-designer';
UPDATE career_paths SET salary_range = '$3,500 - $18,000' WHERE slug = 'graphic-design';
UPDATE career_paths SET salary_range = '$3,000 - $16,000' WHERE slug = 'video-editing';
UPDATE career_paths SET salary_range = '$2,500 - $15,000' WHERE slug = 'photography';
UPDATE career_paths SET salary_range = '$4,000 - $20,000' WHERE slug = 'motion-graphics';
UPDATE career_paths SET salary_range = '$3,000 - $14,000' WHERE slug = 'electrical-installation';
UPDATE career_paths SET salary_range = '$3,000 - $13,000' WHERE slug = 'plumbing';
UPDATE career_paths SET salary_range = '$3,000 - $14,000' WHERE slug = 'air-conditioning';
UPDATE career_paths SET salary_range = '$2,500 - $12,000' WHERE slug = 'computer-repair';
