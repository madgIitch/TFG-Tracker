-- Cities and city_places tables for location pipeline (OSM data via import_locations.py)

CREATE TABLE public.cities (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  ref_ine       text,
  ine_municipio text,
  wikidata      text,
  wikipedia     text,
  postal_codes  text[] NOT NULL DEFAULT '{}',
  centroid      jsonb,
  bbox          jsonb
);

CREATE TABLE public.city_places (
  id              text PRIMARY KEY,
  city_id         text NOT NULL REFERENCES public.cities(id),
  name            text NOT NULL,
  place           text,
  admin_level     text,
  ref_ine         text,
  wikidata        text,
  wikipedia       text,
  population      text,
  population_date text,
  name_es         text,
  name_eu         text,
  postal_codes    text[] NOT NULL DEFAULT '{}',
  centroid        jsonb,
  bbox            jsonb
);

-- Trigram search on name
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX cities_name_trgm      ON public.cities      USING gin (name gin_trgm_ops);
CREATE INDEX city_places_name_trgm ON public.city_places USING gin (name gin_trgm_ops);

-- FK lookup
CREATE INDEX city_places_city_id_idx ON public.city_places (city_id);

-- Postal code search
CREATE INDEX cities_postal_codes_gin      ON public.cities      USING gin (postal_codes);
CREATE INDEX city_places_postal_codes_gin ON public.city_places USING gin (postal_codes);

-- RLS: public read, service_role full access (pipeline uses service_role)
ALTER TABLE public.cities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public reads cities"
  ON public.cities FOR SELECT USING (true);
CREATE POLICY "service role manages cities"
  ON public.cities USING (auth.role() = 'service_role');

CREATE POLICY "public reads city_places"
  ON public.city_places FOR SELECT USING (true);
CREATE POLICY "service role manages city_places"
  ON public.city_places USING (auth.role() = 'service_role');
