-- ============================================================
-- ESQUEMA DE BASE DE DATOS - HomiMatchApp
-- Estado: Final del Sprint 23 (3 enero 2026)
-- Reconstruido a partir del esquema actual (post-Sprint 31)
-- eliminando los cambios introducidos en Sprints 24-31.
--
-- Cambios revertidos respecto al esquema actual:
--   - Sprint 24: (sin cambios de esquema SQL)
--   - Sprint 25: Se restaura profiles.display_name (eliminado en migración 20260112)
--   - Sprint 26: Se eliminan swipe_limits y message_request_limits;
--                se elimina profiles.is_premium (añadido en migración 20260116)
--   - Sprint 28: Se eliminan expense_groups, expense_group_members,
--                expense_group_invites, group_expenses, group_expense_participants
--                y sus tablas _backup_* (migraciones 20260201/20260125)
--   - Sprint 28: Se elimina profiles.onboarding_completed (commit 6a22187)
--   - Sprint 29: Se eliminan provinces, province_user_counts,
--                user_province_tracking (migración 20260202)
--   - Sprint 30: Se eliminan campos Stripe de users y subscription_history
--                (migraciones 20260126/20260127)
--   - Sprint 31: Se eliminan bug_reports y bug_report_screenshots
--                (migraciones 20260201/20260208)
--
-- NOTA: Este esquema es solo de referencia y no está pensado
--       para ser ejecutado directamente.
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
  display_name text,                     -- Eliminado en Sprint 25 (migración 20260112)
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
  is_searchable boolean NOT NULL DEFAULT true,
  is_seeking boolean DEFAULT false,
  desired_roommates_min integer,
  desired_roommates_max integer,
  -- NOTA: is_premium NO existía aquí; fue añadido en Sprint 26 (migración 20260116)
  -- NOTA: onboarding_completed NO existía aquí; fue añadido en Sprint 28 (commit 6a22187)
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
  city_id text,                          -- Añadido en Sprint 23
  place_id text,                         -- Añadido en Sprint 23
  capacity_total integer,                -- Añadido en Sprint 23
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

CREATE TABLE public.room_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  expires_at timestamp with time zone,
  used_at timestamp with time zone,
  used_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT room_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT room_invitations_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT room_invitations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT room_invitations_used_by_fkey FOREIGN KEY (used_by) REFERENCES public.users(id)
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

CREATE TABLE public.swipe_rejections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rejected_profile_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT swipe_rejections_pkey PRIMARY KEY (id),
  CONSTRAINT swipe_rejections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT swipe_rejections_rejected_profile_id_fkey FOREIGN KEY (rejected_profile_id) REFERENCES public.profiles(id)
);

-- NOTA: swipe_limits NO existía; fue añadido en Sprint 26 (commit 559f133)

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

-- NOTA: message_request_limits NO existía; fue añadido en Sprint 26 (migración 20260116)

-- =====================
-- GASTOS DEL PISO
-- =====================

CREATE TABLE public.flat_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  flat_id uuid NOT NULL,
  created_by uuid NOT NULL,
  concept text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT flat_expenses_pkey PRIMARY KEY (id),
  CONSTRAINT flat_expenses_flat_id_fkey FOREIGN KEY (flat_id) REFERENCES public.flats(id),
  CONSTRAINT flat_expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

CREATE TABLE public.flat_expense_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL,
  member_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT flat_expense_participants_pkey PRIMARY KEY (id),
  CONSTRAINT flat_expense_participants_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.flat_expenses(id),
  CONSTRAINT flat_expense_participants_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.flat_settlement_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  flat_id uuid NOT NULL,
  month text NOT NULL,
  from_id uuid NOT NULL,
  to_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  marked_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT flat_settlement_payments_pkey PRIMARY KEY (id),
  CONSTRAINT flat_settlement_payments_flat_id_fkey FOREIGN KEY (flat_id) REFERENCES public.flats(id),
  CONSTRAINT flat_settlement_payments_from_id_fkey FOREIGN KEY (from_id) REFERENCES public.profiles(id),
  CONSTRAINT flat_settlement_payments_to_id_fkey FOREIGN KEY (to_id) REFERENCES public.profiles(id),
  CONSTRAINT flat_settlement_payments_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.profiles(id)
);

-- NOTA: expense_groups, expense_group_members, expense_group_invites,
--       group_expenses y group_expense_participants NO existían;
--       fueron añadidos en Sprint 28 (migración 20260201_expense_groups.sql)

-- =====================
-- GEOLOCALIZACIÓN (Sprint 23)
-- =====================

CREATE TABLE public.cities (
  id text NOT NULL,
  name text NOT NULL,
  ref_ine text,
  ine_municipio text,
  wikidata text,
  wikipedia text,
  centroid jsonb,
  bbox jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT cities_pkey PRIMARY KEY (id)
);

CREATE TABLE public.city_places (
  id text NOT NULL,
  city_id text NOT NULL,
  name text NOT NULL,
  place text NOT NULL,
  admin_level text,
  ref_ine text,
  wikidata text,
  wikipedia text,
  population text,
  population_date text,
  name_es text,
  name_eu text,
  centroid jsonb,
  bbox jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT city_places_pkey PRIMARY KEY (id),
  CONSTRAINT city_places_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id)
);

CREATE TABLE public.city_search_counts (
  city_id text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT city_search_counts_pkey PRIMARY KEY (city_id),
  CONSTRAINT city_search_counts_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id)
);

CREATE TABLE public.place_search_counts (
  city_id text NOT NULL,
  place_id text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT place_search_counts_pkey PRIMARY KEY (city_id, place_id),
  CONSTRAINT place_search_counts_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id),
  CONSTRAINT place_search_counts_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.city_places(id)
);

-- NOTA: provinces, province_user_counts y user_province_tracking
--       NO existían; fueron añadidos en Sprint 29 (migración 20260202)

-- =====================
-- NOTIFICACIONES PUSH
-- =====================

CREATE TABLE public.push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform = ANY (ARRAY['ios'::text, 'android'::text])),
  device_id text,
  device_name text,
  app_version text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  last_used_at timestamp with time zone,
  provider text NOT NULL CHECK (provider = ANY (ARRAY['fcm'::text, 'apns'::text])),
  CONSTRAINT push_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- =====================
-- VISTAS Y FUNCIONES
-- =====================

-- Vista: ciudades con contadores de búsqueda
CREATE OR REPLACE VIEW public.cities_with_counts AS
SELECT
  c.id,
  c.name,
  c.ref_ine,
  c.ine_municipio,
  c.wikidata,
  c.wikipedia,
  c.centroid,
  c.bbox,
  c.created_at,
  COALESCE(csc.count, 0) AS search_count
FROM public.cities c
LEFT JOIN public.city_search_counts csc ON c.id = csc.city_id;

-- Función RPC: incrementar contador de búsquedas de ciudad
CREATE OR REPLACE FUNCTION public.increment_city_count(p_city_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.city_search_counts (city_id, count, updated_at)
  VALUES (p_city_id, 1, NOW())
  ON CONFLICT (city_id)
  DO UPDATE SET
    count = city_search_counts.count + 1,
    updated_at = NOW();
END;
$$;

-- Función RPC: incrementar contadores de lugar (place)
CREATE OR REPLACE FUNCTION public.increment_place_counts(
  p_city_id text,
  p_place_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.place_search_counts (city_id, place_id, count, updated_at)
  VALUES (p_city_id, p_place_id, 1, NOW())
  ON CONFLICT (city_id, place_id)
  DO UPDATE SET
    count = place_search_counts.count + 1,
    updated_at = NOW();
END;
$$;

-- =====================
-- RESUMEN DE TABLAS (23 tablas)
-- =====================
--
--  1. users                        - Datos básicos de usuario (auth)
--  2. temp_registrations           - Registro temporal multi-fase
--  3. profiles                     - Perfil extendido del usuario
--  4. profile_photos               - Fotos del perfil
--  5. flats                        - Pisos/viviendas
--  6. rooms                        - Habitaciones de un piso
--  7. room_extras                  - Detalles adicionales de habitación
--  8. room_interests               - Interés de usuarios en habitaciones
--  9. room_invitations             - Códigos de invitación a pisos
-- 10. room_assignments             - Asignación de habitaciones a usuarios
-- 11. matches                      - Emparejamientos entre usuarios
-- 12. swipe_rejections             - Rechazos en el sistema de swipe
-- 13. chats                        - Conversaciones entre matches
-- 14. messages                     - Mensajes individuales de chat
-- 15. flat_expenses                - Gastos del piso
-- 16. flat_expense_participants    - Participantes en un gasto
-- 17. flat_settlement_payments     - Liquidaciones entre compañeros
-- 18. cities                       - Ciudades españolas (datos geográficos)
-- 19. city_places                  - Barrios/zonas dentro de ciudades
-- 20. city_search_counts           - Contadores de búsqueda por ciudad
-- 21. place_search_counts          - Contadores de búsqueda por zona
-- 22. push_tokens                  - Tokens de notificaciones push (FCM)
--
-- Tablas que NO existían aún (añadidas en Sprints 24-31):
--   - swipe_limits                 (Sprint 26)
--   - message_request_limits       (Sprint 26)
--   - expense_groups               (Sprint 28)
--   - expense_group_members        (Sprint 28)
--   - expense_group_invites        (Sprint 28)
--   - group_expenses               (Sprint 28)
--   - group_expense_participants   (Sprint 28)
--   - provinces                    (Sprint 29)
--   - province_user_counts         (Sprint 29)
--   - user_province_tracking       (Sprint 29)
--   - subscription_history         (Sprint 30)
--   - bug_reports                  (Sprint 31)
--   - bug_report_screenshots       (Sprint 31)
--   - _backup_expense_groups       (artefacto de migración Sprint 28)
--   - _backup_expense_group_members (artefacto de migración Sprint 28)
--   - _backup_expense_group_invites (artefacto de migración Sprint 28)
--
-- Columnas que NO existían aún:
--   - profiles.is_premium              (Sprint 26)
--   - profiles.onboarding_completed    (Sprint 28)
--   - users.stripe_customer_id         (Sprint 30)
--   - users.stripe_subscription_id     (Sprint 30)
--   - users.subscription_status        (Sprint 30)
--   - users.subscription_current_period_end   (Sprint 30)
--   - users.is_premium                 (Sprint 30)
--   - users.subscription_cancel_at_period_end (Sprint 30)
--   - users.subscription_current_period_start (Sprint 30)
--   - users.subscription_interval      (Sprint 30)
--   - users.subscription_interval_count (Sprint 30)
--   - bug_reports.reporter_email       (Sprint 31)
--   - bug_reports.reporter_uuid        (Sprint 31)
--
-- Columna que SÍ existía y fue eliminada después:
--   - profiles.display_name            (Eliminada en Sprint 25)
