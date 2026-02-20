-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id)
);
CREATE TABLE public.flats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  district text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  rules text,
  services jsonb DEFAULT '[]'::jsonb,
  gender_policy text NOT NULL DEFAULT 'mixed'::text CHECK (gender_policy = ANY (ARRAY['mixed'::text, 'men_only'::text, 'flinta'::text])),
  CONSTRAINT flats_pkey PRIMARY KEY (id),
  CONSTRAINT flats_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL,
  user_b_id uuid NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'room_offer'::text, 'room_assigned'::text, 'room_declined'::text])),
  matched_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT matches_pkey PRIMARY KEY (id),
  CONSTRAINT matches_user_a_id_fkey FOREIGN KEY (user_a_id) REFERENCES public.profiles(id),
  CONSTRAINT matches_user_b_id_fkey FOREIGN KEY (user_b_id) REFERENCES public.profiles(id)
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
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name text,
  avatar_url text,
  bio text,
  gender text NOT NULL CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'non_binary'::text, 'other'::text, 'undisclosed'::text])),
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
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES public.users(id)
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
CREATE TABLE public.room_extras (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  category text,
  room_type text,
  common_area_type text,
  common_area_custom text,
  photos ARRAY NOT NULL DEFAULT '{}'::text[],
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
CREATE TABLE public.swipe_rejections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rejected_profile_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT swipe_rejections_pkey PRIMARY KEY (id),
  CONSTRAINT swipe_rejections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT swipe_rejections_rejected_profile_id_fkey FOREIGN KEY (rejected_profile_id) REFERENCES public.profiles(id)
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
  gender text CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'non_binary'::text, 'other'::text, 'undisclosed'::text])) OR gender IS NULL),
  CONSTRAINT temp_registrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  identity_document text UNIQUE,
  birth_date date,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  gender text NOT NULL CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'non_binary'::text, 'other'::text, 'undisclosed'::text])),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);