-- ============================================================
-- ESQUEMA DE BASE DE DATOS - HomiMatchApp
-- Estado: Inicio del Sprint 7 (22 diciembre 2025)
-- Equivalente al final del Sprint 6 / antes del PR #4
--
-- Tablas presentes: 13
-- Periodo: Sprint 0 - Sprint 6 (commits #1-#31)
--
-- Diferencias respecto a bbdd_sprint23.sql:
--
-- Tablas AÚN NO EXISTENTES (añadidas en Sprints 7+):
--   - flat_expenses              (Sprint 7)
--   - flat_expense_participants  (Sprint 7)
--   - flat_settlement_payments   (Sprint 7)
--   - room_invitations           (Sprint 12)
--   - push_tokens                (Sprint 13)
--   - cities                     (Sprint 23)
--   - city_places                (Sprint 23)
--   - city_search_counts         (Sprint 23)
--   - place_search_counts        (Sprint 23)
--   - swipe_limits               (Sprint 26)
--   - message_request_limits     (Sprint 26)
--   - expense_groups y derivadas (Sprint 28)
--   - provinces y derivadas      (Sprint 29)
--   - subscription_history       (Sprint 30)
--   - bug_reports y derivadas    (Sprint 31)
--
-- Columnas AÚN NO EXISTENTES:
--   - profiles.is_searchable         (Sprint 22)
--   - profiles.is_seeking            (Sprint 23)
--   - profiles.desired_roommates_min (Sprint 23)
--   - profiles.desired_roommates_max (Sprint 23)
--   - profiles.is_premium            (Sprint 26)
--   - profiles.onboarding_completed  (Sprint 28)
--   - flats.city_id                  (Sprint 23)
--   - flats.place_id                 (Sprint 23)
--   - flats.capacity_total           (Sprint 23)
--   - users.stripe_*                 (Sprint 30)
--
-- Columna presente que se eliminará después:
--   - profiles.display_name          (eliminada en Sprint 25)
--
-- Vistas y funciones: ninguna (añadidas en Sprint 23+)
-- ============================================================

-- =====================
-- AUTENTICACIÓN
-- =====================

CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  identity_document text UNIQUE,
  birth_date date,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  gender text NOT NULL CHECK (gender = ANY (ARRAY[
    'male'::text, 'female'::text, 'non_binary'::text,
    'other'::text, 'undisclosed'::text
  ])),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.temp_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  temp_token text NOT NULL UNIQUE,
  email text NOT NULL,
  password text,
  is_google_user boolean DEFAULT false,
  first_name text,
  last_name text,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  gender text CHECK (
    (gender = ANY (ARRAY[
      'male'::text, 'female'::text, 'non_binary'::text,
      'other'::text, 'undisclosed'::text
    ])) OR gender IS NULL
  ),
  CONSTRAINT temp_registrations_pkey PRIMARY KEY (id)
);

-- =====================
-- PERFILES
-- =====================

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name text,                     -- Presente en Sprint 7; eliminado en Sprint 25 (migración 20260112)
  avatar_url text,
  bio text,
  gender text NOT NULL CHECK (gender = ANY (ARRAY[
    'male'::text, 'female'::text, 'non_binary'::text,
    'other'::text, 'undisclosed'::text
  ])),
  occupation text,
  smoker boolean DEFAULT false,
  has_pets boolean DEFAULT false,
  social_links jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  university text,
  field_of_study text,
  interests jsonb,
  lifestyle_preferences jsonb,
  housing_situation text,
  preferred_zones jsonb,
  budget_min numeric,
  budget_max numeric,
  -- NOTA: is_searchable NO existía aún; fue añadido en Sprint 22 (commit f065d09)
  -- NOTA: is_seeking NO existía aún; fue añadido en Sprint 23 (commit aa49856)
  -- NOTA: desired_roommates_min/max NO existían aún; añadidos en Sprint 23 (commit 242e32f)
  -- NOTA: is_premium NO existía aún; fue añadido en Sprint 26 (migración 20260116)
  -- NOTA: onboarding_completed NO existía aún; fue añadido en Sprint 28 (commit 6a22187)
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES public.users(id)
);

CREATE TABLE public.profile_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  path text NOT NULL,
  position integer NOT NULL CHECK ("position" >= 1 AND "position" <= 10),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profile_photos_pkey PRIMARY KEY (id),
  CONSTRAINT profile_photos_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);

-- =====================
-- PISOS Y HABITACIONES
-- =====================

CREATE TABLE public.flats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  district text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  rules text,
  services jsonb DEFAULT '[]'::jsonb,
  gender_policy text NOT NULL DEFAULT 'mixed'::text CHECK (gender_policy = ANY (ARRAY[
    'mixed'::text, 'men_only'::text, 'flinta'::text
  ])),
  -- NOTA: city_id NO existía aún; fue añadido en Sprint 23
  -- NOTA: place_id NO existía aún; fue añadido en Sprint 23
  -- NOTA: capacity_total NO existía aún; fue añadido en Sprint 23 (commit 242e32f)
  CONSTRAINT flats_pkey PRIMARY KEY (id),
  CONSTRAINT flats_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);

CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  flat_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  price_per_month numeric NOT NULL,
  size_m2 numeric,
  is_available boolean DEFAULT true,
  available_from date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT rooms_pkey PRIMARY KEY (id),
  CONSTRAINT rooms_flat_id_fkey FOREIGN KEY (flat_id) REFERENCES public.flats(id),
  CONSTRAINT rooms_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);

CREATE TABLE public.room_extras (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  category text,
  room_type text,
  common_area_type text,
  common_area_custom text,
  photos text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  capacity integer,
  CONSTRAINT room_extras_pkey PRIMARY KEY (id),
  CONSTRAINT room_extras_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);

CREATE TABLE public.room_interests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  room_id uuid NOT NULL,
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT room_interests_pkey PRIMARY KEY (id),
  CONSTRAINT room_interests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT room_interests_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);

-- NOTA: room_invitations NO existía aún; fue añadida en Sprint 12 (commit 9bef2fa)

-- =====================
-- MATCHING Y SWIPES
-- =====================

CREATE TABLE public.matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL,
  user_b_id uuid NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY[
    'pending'::text, 'accepted'::text, 'rejected'::text,
    'room_offer'::text, 'room_assigned'::text, 'room_declined'::text
  ])),
  matched_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT matches_pkey PRIMARY KEY (id),
  CONSTRAINT matches_user_a_id_fkey FOREIGN KEY (user_a_id) REFERENCES public.profiles(id),
  CONSTRAINT matches_user_b_id_fkey FOREIGN KEY (user_b_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.room_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid UNIQUE,
  room_id uuid NOT NULL,
  assignee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'offered'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT room_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT room_assignments_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT room_assignments_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.profiles(id),
  CONSTRAINT room_assignments_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id)
);

CREATE TABLE public.swipe_rejections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rejected_profile_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT swipe_rejections_pkey PRIMARY KEY (id),
  CONSTRAINT swipe_rejections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT swipe_rejections_rejected_profile_id_fkey FOREIGN KEY (rejected_profile_id) REFERENCES public.profiles(id)
);

-- NOTA: swipe_limits NO existía aún; fue añadido en Sprint 26 (commit 559f133)

-- =====================
-- CHAT Y MENSAJERÍA
-- =====================

CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id)
);

CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (length(body) <= 1000),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  read_at timestamp with time zone,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);

-- NOTA: message_request_limits NO existía aún; fue añadido en Sprint 26 (migración 20260116)

-- =====================
-- TABLAS AÚN NO EXISTENTES EN SPRINT 7
-- (se muestran como referencia comentada)
-- =====================

-- Sprint 7 (gestion-de-gastos, PR #4):
--   flat_expenses, flat_expense_participants, flat_settlement_payments

-- Sprint 12 (sistema de invitaciones):
--   room_invitations

-- Sprint 13 (push-notifications, PR #8):
--   push_tokens

-- Sprint 23 (Ciudades-y-zonas, PR #20):
--   cities, city_places, city_search_counts, place_search_counts
--   + VIEW cities_with_counts
--   + FUNCTION increment_city_count
--   + FUNCTION increment_place_counts

-- Sprint 26+: swipe_limits, message_request_limits,
--             expense_groups y derivadas, provinces y derivadas,
--             subscription_history, bug_reports y derivadas

-- =====================
-- RESUMEN DE TABLAS (13 tablas)
-- =====================
--
--  1. users                  - Datos básicos de usuario (auth)
--  2. temp_registrations     - Registro temporal multi-fase (Sprints 2-3)
--  3. profiles               - Perfil extendido del usuario
--  4. profile_photos         - Fotos del perfil
--  5. flats                  - Pisos/viviendas
--  6. rooms                  - Habitaciones de un piso
--  7. room_extras            - Detalles adicionales de habitación
--  8. room_interests         - Interés de usuarios en habitaciones
--  9. room_assignments       - Asignación de habitaciones a usuarios
-- 10. matches                - Emparejamientos entre usuarios
-- 11. swipe_rejections       - Rechazos en el sistema de swipe
-- 12. chats                  - Conversaciones entre matches
-- 13. messages               - Mensajes individuales de chat
--
-- Columnas presentes que se añadirán más adelante:
--   profiles.is_searchable        → Sprint 22
--   profiles.is_seeking           → Sprint 23
--   profiles.desired_roommates_*  → Sprint 23
--   flats.city_id/place_id        → Sprint 23
--   flats.capacity_total          → Sprint 23
--
-- Columnas presentes que se eliminarán más adelante:
--   profiles.display_name         → Eliminada en Sprint 25
