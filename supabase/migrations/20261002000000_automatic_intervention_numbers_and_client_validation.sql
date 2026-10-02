-- Numérotation décidée par la base pour éviter les doublons. Le RIT physique
-- reste une saisie libre.
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS rit_number text;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS client_validation_name text;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS client_validated boolean NOT NULL DEFAULT false;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS client_validated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.document_number_counters (
  counter_key text PRIMARY KEY,
  last_value integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_number_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.document_number_counters FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.assign_intervention_reference_numbers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reference_date date := COALESCE(NEW.intervention_date, CURRENT_DATE);
  counter_value integer;
  counter_key_value text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    counter_key_value := 'rit:' || to_char(reference_date, 'YYYYMMDD');
    INSERT INTO public.document_number_counters AS counters (counter_key, last_value, updated_at)
    VALUES (counter_key_value, 1, now())
    ON CONFLICT (counter_key) DO UPDATE
      SET last_value = counters.last_value + 1, updated_at = now()
    RETURNING last_value INTO counter_value;
    NEW.rit_number := 'RIT-' || to_char(reference_date, 'YYYYMMDD') || '-' || lpad(counter_value::text, 4, '0');
  END IF;

  NEW.invoice_status := COALESCE(NULLIF(btrim(NEW.invoice_status), ''), 'Non déposée');
  IF NEW.invoice_status = 'Non requise' THEN
    NEW.invoice_number := NULL;
    NEW.invoice_deposited_at := NULL;
  ELSIF NULLIF(btrim(NEW.invoice_number), '') IS NULL THEN
    counter_key_value := 'fac:' || to_char(reference_date, 'YYYY');
    INSERT INTO public.document_number_counters AS counters (counter_key, last_value, updated_at)
    VALUES (counter_key_value, 1, now())
    ON CONFLICT (counter_key) DO UPDATE
      SET last_value = counters.last_value + 1, updated_at = now()
    RETURNING last_value INTO counter_value;
    NEW.invoice_number := 'FAC-' || to_char(reference_date, 'YYYY') || '-' || lpad(counter_value::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_intervention_reference_numbers ON public.interventions;
CREATE TRIGGER assign_intervention_reference_numbers
BEFORE INSERT OR UPDATE OF invoice_status, invoice_number ON public.interventions
FOR EACH ROW EXECUTE FUNCTION public.assign_intervention_reference_numbers();
