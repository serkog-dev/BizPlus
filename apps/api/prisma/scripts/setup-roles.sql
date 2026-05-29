-- ============================================================
-- One-time role setup for RLS multi-tenant isolation.
-- Run this MANUALLY as the database superuser, ONCE per environment
-- (local Docker, staging, production). NOT a Prisma migration —
-- role passwords must not live in the schema history.
--
-- Local Docker:
--   docker exec -i bizplus-postgres psql -U bizplus -d bizplus < setup-roles.sql
--
-- After running, update .env:
--   DATABASE_URL=postgresql://bizplus_app:<app-pwd>@host:5432/bizplus
--   DATABASE_ADMIN_URL=postgresql://bizplus_admin:<admin-pwd>@host:5432/bizplus
--   DATABASE_MIGRATE_URL=postgresql://bizplus:<owner-pwd>@host:5432/bizplus
--
-- Replace the placeholder passwords below before running.
-- ============================================================

-- App role: NOBYPASSRLS — every query is filtered by RLS policies.
-- This is what the API uses for normal request traffic.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bizplus_app') THEN
    CREATE ROLE bizplus_app LOGIN PASSWORD 'CHANGE_ME_app_password' NOBYPASSRLS;
  END IF;
END $$;

-- Admin role: BYPASSRLS — used by super-admin endpoints, cron jobs,
-- pre-auth lookups, and webhook entry points that haven't resolved a tenant yet.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bizplus_admin') THEN
    CREATE ROLE bizplus_admin LOGIN PASSWORD 'CHANGE_ME_admin_password' BYPASSRLS;
  END IF;
END $$;

-- Grant table/sequence access to both new roles.
-- (Note: schema migrations still run as the owner role `bizplus`.)
GRANT USAGE ON SCHEMA public TO bizplus_app, bizplus_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bizplus_app, bizplus_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bizplus_app, bizplus_admin;

-- Future tables created by `bizplus` (migrations) inherit the same grants.
ALTER DEFAULT PRIVILEGES FOR ROLE bizplus IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bizplus_app, bizplus_admin;
ALTER DEFAULT PRIVILEGES FOR ROLE bizplus IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO bizplus_app, bizplus_admin;

-- Sanity check.
SELECT rolname, rolbypassrls, rolcanlogin
  FROM pg_roles
  WHERE rolname IN ('bizplus', 'bizplus_app', 'bizplus_admin')
  ORDER BY rolname;
