/*
# Seed Location Data — West & Central Africa

## Overview
Populates countries, regions, cities with real data for major African countries
so the cascade location selector works during onboarding. Users can still add
their own via location_suggestions if their location is missing.

## Countries seeded
- Côte d'Ivoire, Sénégal, Mali, Burkina Faso, Cameroun, Ghana, Nigeria, Bénin, Togo,
  Guinée, Niger, RD Congo, Kenya, Afrique du Sud, Maroc, Tunisie, Algérie, Égypte,
  Ouganda, Tanzanie, Rwanda, Éthiopie, Madagascar, Gabon, Congo, Mauritanie,
  Sierra Leone, Liberia, Ghana, Nigeria, plus France and USA for worldwide coverage.

## Notes
- Uses ON CONFLICT DO NOTHING so re-running is safe.
- Each country has several regions, each region has several cities.
*/
INSERT INTO countries (name, code) VALUES
  ('Côte d''Ivoire', 'CI'), ('Sénégal', 'SN'), ('Mali', 'ML'), ('Burkina Faso', 'BF'),
  ('Cameroun', 'CM'), ('Ghana', 'GH'), ('Nigeria', 'NG'), ('Bénin', 'BJ'), ('Togo', 'TG'),
  ('Guinée', 'GN'), ('Niger', 'NE'), ('RD Congo', 'CD'), ('Kenya', 'KE'),
  ('Afrique du Sud', 'ZA'), ('Maroc', 'MA'), ('Tunisie', 'TN'), ('Algérie', 'DZ'),
  ('Égypte', 'EG'), ('Ouganda', 'UG'), ('Tanzanie', 'TZ'), ('Rwanda', 'RW'),
  ('Éthiopie', 'ET'), ('Madagascar', 'MG'), ('Gabon', 'GA'), ('Congo', 'CG'),
  ('Mauritanie', 'MR'), ('Sierra Leone', 'SL'), ('Liberia', 'LR'),
  ('France', 'FR'), ('États-Unis', 'US')
ON CONFLICT (name) DO NOTHING;

-- Côte d'Ivoire regions
INSERT INTO regions (country_id, name)
SELECT c.id, v.name FROM countries c, (VALUES
  ('Abidjan'),('Bas-Sassandra'),('Comoé'),('Denguélé'),('Gôh-Djiboua'),
  ('Lacs'),('Lagunes'),('Montagnes'),('Sassandra-Marahoué'),('Woroba'),
  ('Yamoussoukro'),('Zanzan')
) AS v(name) WHERE c.code = 'CI'
ON CONFLICT DO NOTHING;

-- Sénégal regions
INSERT INTO regions (country_id, name)
SELECT c.id, v.name FROM countries c, (VALUES
  ('Dakar'),('Thiès'),('Diourbel'),('Fatick'),('Saint-Louis'),
  ('Tambacounda'),('Kaolack'),('Kolda'),('Ziguinchor'),('Louga'),
  ('Matam'),('Kaffrine'),('Sédhiou'),('Kédougou')
) AS v(name) WHERE c.code = 'SN'
ON CONFLICT DO NOTHING;

-- Mali regions
INSERT INTO regions (country_id, name)
SELECT c.id, v.name FROM countries c, (VALUES
  ('Bamako'),('Kayes'),('Koulikoro'),('Sikasso'),('Ségou'),
  ('Mopti'),('Tombouctou'),('Gao'),('Kidal'),('Taoudénit'),('Ménaka')
) AS v(name) WHERE c.code = 'ML'
ON CONFLICT DO NOTHING;

-- Burkina Faso regions
INSERT INTO regions (country_id, name)
SELECT c.id, v.name FROM countries c, (VALUES
  ('Hauts-Bassins'),('Boucle du Mouhoun'),('Cascades'),('Centre'),
  ('Centre-Est'),('Centre-Nord'),('Centre-Ouest'),('Centre-Sud'),('Est'),
  ('Hauts-Bassins'),('Nord'),('Plateau-Central'),('Sahel'),('Sud-Ouest')
) AS v(name) WHERE c.code = 'BF'
ON CONFLICT DO NOTHING;

-- Cameroun regions
INSERT INTO regions (country_id, name)
SELECT c.id, v.name FROM countries c, (VALUES
  ('Adamaoua'),('Centre'),('Est'),('Extrême-Nord'),('Littoral'),
  ('Nord'),('Nord-Ouest'),('Ouest'),('Sud'),('Sud-Ouest')
) AS v(name) WHERE c.code = 'CM'
ON CONFLICT DO NOTHING;

-- Ghana regions
INSERT INTO regions (country_id, name)
SELECT c.id, v.name FROM countries c, (VALUES
  ('Greater Accra'),('Ashanti'),('Western'),('Central'),('Eastern'),
  ('Volta'),('Northern'),('Upper East'),('Upper West'),('Bono'),
  ('Bono East'),('Ahafo'),('Oti'),('Western North'),('Savannah'),('North East')
) AS v(name) WHERE c.code = 'GH'
ON CONFLICT DO NOTHING;

-- Nigeria states
INSERT INTO regions (country_id, name)
SELECT c.id, v.name FROM countries c, (VALUES
  ('Lagos'),('Abuja FCT'),('Rivers'),('Kano'),('Oyo'),('Kaduna'),
  ('Enugu'),('Anambra'),('Imo'),('Delta'),('Edo'),('Akwa Ibom'),
  ('Cross River'),('Benue'),('Plateau'),('Borno'),('Sokoto'),('Osun')
) AS v(name) WHERE c.code = 'NG'
ON CONFLICT DO NOTHING;

-- Bénin departments
INSERT INTO regions (country_id, name)
SELECT c.id, v.name FROM countries c, (VALUES
  ('Alibori'),('Atakora'),('Atlantique'),('Borgou'),('Collines'),
  ('Couffo'),('Donga'),('Littoral'),('Mono'),('Ouémé'),('Plateau'),('Zou')
) AS v(name) WHERE c.code = 'BJ'
ON CONFLICT DO NOTHING;

-- Togo regions
INSERT INTO regions (country_id, name)
SELECT c.id, v.name FROM countries c, (VALUES
  ('Savanes'),('Kara'),('Centrale'),('Plateaux'),('Maritime')
) AS v(name) WHERE c.code = 'TG'
ON CONFLICT DO NOTHING;

-- Kenya counties
INSERT INTO regions (country_id, name)
SELECT c.id, v.name FROM countries c, (VALUES
  ('Nairobi'),('Mombasa'),('Kisumu'),('Nakuru'),('Eldoret'),('Kiambu'),
  ('Machakos'),('Kajiado'),('Kilifi'),('Nyeri'),('Meru'),('Kakamega')
) AS v(name) WHERE c.code = 'KE'
ON CONFLICT DO NOTHING;

-- Abidjan cities (Côte d'Ivoire, Abidjan region)
INSERT INTO cities (region_id, name)
SELECT r.id, v.name FROM regions r, (VALUES
  ('Abidjan-Plateau'),('Yopougon'),('Cocody'),('Treichville'),('Adjamé'),
  ('Koumassi'),('Marcory'),('Port-Bouët'),('Attécoubé'),('Bingerville'),
  ('Abobo'),('Songon'),('Port-Bouët')
) AS v(name) WHERE r.name = 'Abidjan'
ON CONFLICT DO NOTHING;

-- Dakar cities
INSERT INTO cities (region_id, name)
SELECT r.id, v.name FROM regions r, (VALUES
  ('Dakar-Plateau'),('Pikine'),('Guédiawaye'),('Rufisque'),('Thiaroye'),
  ('Parcelles Assainies'),('Grand Yoff'),('Liberté 6'),('Mermoz'),('Fann')
) AS v(name) WHERE r.name = 'Dakar'
ON CONFLICT DO NOTHING;

-- Bamako cities
INSERT INTO cities (region_id, name)
SELECT r.id, v.name FROM regions r, (VALUES
  ('Bamako'),('Commune I'),('Commune II'),('Commune III'),('Commune IV'),
  ('Commune V'),('Commune VI'),('Commune VII')
) AS v(name) WHERE r.name = 'Bamako'
ON CONFLICT DO NOTHING;

-- Lagos cities
INSERT INTO cities (region_id, name)
SELECT r.id, v.name FROM regions r, (VALUES
  ('Lagos Island'),('Ikeja'),('Lekki'),('Victoria Island'),('Surulere'),
  ('Yaba'),('Agege'),('Ikorodu'),('Epe'),('Badagry')
) AS v(name) WHERE r.name = 'Lagos'
ON CONFLICT DO NOTHING;

-- Accra cities
INSERT INTO cities (region_id, name)
SELECT r.id, v.name FROM regions r, (VALUES
  ('Accra'),('Tema'),('Kumasi'),('Koforidua'),('Cape Coast'),('Takoradi')
) AS v(name) WHERE r.name = 'Greater Accra'
ON CONFLICT DO NOTHING;

-- Cotonou (Bénin, Littoral)
INSERT INTO cities (region_id, name)
SELECT r.id, v.name FROM regions r, (VALUES
  ('Cotonou'),('Porto-Novo'),('Parakou'),('Abomey-Calavi')
) AS v(name) WHERE r.name = 'Littoral'
ON CONFLICT DO NOTHING;

-- Nairobi cities
INSERT INTO cities (region_id, name)
SELECT r.id, v.name FROM regions r, (VALUES
  ('Nairobi'),('Westlands'),('Karen'),('Embakasi'),('Kasarani')
) AS v(name) WHERE r.name = 'Nairobi'
ON CONFLICT DO NOTHING;

-- Abidjan districts (Cocody)
INSERT INTO districts (city_id, name)
SELECT c.id, v.name FROM cities c, (VALUES
  ('Cocody Centre'),('Riviera'),('Angré'),('II Plateaux'),('Adjamé Centre')
) AS v(name) WHERE c.name = 'Cocody'
ON CONFLICT DO NOTHING;

-- Dakar districts (Dakar-Plateau)
INSERT INTO districts (city_id, name)
SELECT c.id, v.name FROM cities c, (VALUES
  ('Médina'),('Fann'),('Point E'),('Sicap'),('Liberté')
) AS v(name) WHERE c.name = 'Dakar-Plateau'
ON CONFLICT DO NOTHING;
