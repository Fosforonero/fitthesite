ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS activity_level TEXT CHECK (activity_level IN ('sedentary','light','moderate','active','very_active'));

-- Verifica policy UPDATE esistente (probabile profiles_update WITH CHECK id = auth.uid())
-- Se mancante:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_update_own'
  ) THEN
    CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE
      USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END $$;
