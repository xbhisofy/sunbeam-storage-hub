"""Run only against a disposable local PostgreSQL instance, never a hosted DB."""
import os
from pathlib import Path
import subprocess
import unittest


class PaymentAccessTest(unittest.TestCase):
    def test_only_server_role_can_execute_credit_function(self):
        socket = os.environ.get("TANYORA_TEST_PG_SOCKET", "")
        if not socket.startswith("/tmp/tanyora-acl-"):
            self.skipTest("requires a disposable /tmp/tanyora-acl- socket")
        migration = Path(__file__).with_name("payment-credit-access.sql").read_text()
        sql = """
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;
CREATE FUNCTION public.credit_zapupi_deposit(text,numeric,text,text,jsonb)
RETURNS text LANGUAGE sql SECURITY DEFINER AS $$ SELECT 'fixture_credit'::text $$;
""" + migration + """
DO $$ BEGIN
  IF has_function_privilege('anon','public.credit_zapupi_deposit(text,numeric,text,text,jsonb)','EXECUTE')
     OR has_function_privilege('authenticated','public.credit_zapupi_deposit(text,numeric,text,text,jsonb)','EXECUTE')
     OR NOT has_function_privilege('service_role','public.credit_zapupi_deposit(text,numeric,text,text,jsonb)','EXECUTE') THEN
    RAISE EXCEPTION 'payment ACL test failed';
  END IF;
END $$;
SET ROLE anon;
DO $$ BEGIN
  BEGIN
    PERFORM public.credit_zapupi_deposit('fixture',1,NULL,NULL,'{}');
    RAISE EXCEPTION 'anonymous execution unexpectedly allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET ROLE authenticated;
DO $$ BEGIN
  BEGIN
    PERFORM public.credit_zapupi_deposit('fixture',1,NULL,NULL,'{}');
    RAISE EXCEPTION 'authenticated execution unexpectedly allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET ROLE service_role;
DO $$ BEGIN
  IF public.credit_zapupi_deposit('fixture',1,NULL,NULL,'{}') <> 'fixture_credit' THEN
    RAISE EXCEPTION 'privileged behavior changed';
  END IF;
END $$;
RESET ROLE;
"""
        env = {key: value for key, value in os.environ.items() if not key.startswith("PG")}
        result = subprocess.run(["psql", "-X", "-v", "ON_ERROR_STOP=1", "-h", socket,
                                 "-p", "55439", "-U", "postgres", "-d", "postgres"],
                                input=sql, text=True, capture_output=True, env=env)
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()