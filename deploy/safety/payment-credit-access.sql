-- Stage 1: privileged payment credit only. Apply only after production approval.
BEGIN;
REVOKE ALL ON FUNCTION public.credit_zapupi_deposit(text,numeric,text,text,jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_zapupi_deposit(text,numeric,text,text,jsonb)
  TO service_role;
COMMIT;