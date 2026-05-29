-- ============================================================
-- Phase 1: Enable RLS in PERMISSIVE mode.
--
-- Adds the helper function app_current_tenant() and enables Row Level
-- Security on every tenant-scoped table with a `USING (true)` policy.
-- This phase changes NO observable behavior — every query still sees
-- every row. The point is to flip the RLS switch on so we can verify
-- the application layer sets the tenant GUC correctly before tightening
-- policies in Phase 4.
--
-- Prerequisite: run apps/api/prisma/scripts/setup-roles.sql first to
-- create the bizplus_app (NOBYPASSRLS) and bizplus_admin (BYPASSRLS)
-- database roles. This migration itself runs as the owner role.
-- ============================================================

-- Helper: reads the per-transaction GUC, returns NULL if unset.
-- Used by the policies in Phase 4. Defined here so Phase 4 only flips
-- predicates without redefining infrastructure.
CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- ------------------------------------------------------------
-- Tables with a direct tenant_id column.
-- ------------------------------------------------------------
ALTER TABLE "locations"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "locations"        FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "locations"        USING (true) WITH CHECK (true);

ALTER TABLE "users"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users"            FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "users"            USING (true) WITH CHECK (true);

ALTER TABLE "providers"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "providers"        FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "providers"        USING (true) WITH CHECK (true);

ALTER TABLE "services"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "services"         FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "services"         USING (true) WITH CHECK (true);

ALTER TABLE "customers"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers"        FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "customers"        USING (true) WITH CHECK (true);

ALTER TABLE "appointments"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointments"     FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "appointments"     USING (true) WITH CHECK (true);

ALTER TABLE "conversations"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversations"    FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "conversations"    USING (true) WITH CHECK (true);

ALTER TABLE "channel_configs"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "channel_configs"  FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "channel_configs"  USING (true) WITH CHECK (true);

ALTER TABLE "audit_logs"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs"       FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "audit_logs"       USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- Tables without a tenant_id column — scoped indirectly via a parent.
-- Phase 4 will replace USING (true) with EXISTS subqueries against the parent.
-- ------------------------------------------------------------
ALTER TABLE "messages"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages"             FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "messages"             USING (true) WITH CHECK (true);

ALTER TABLE "schedules"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schedules"            FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "schedules"            USING (true) WITH CHECK (true);

ALTER TABLE "schedule_breaks"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schedule_breaks"      FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "schedule_breaks"      USING (true) WITH CHECK (true);

ALTER TABLE "provider_services"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "provider_services"    FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "provider_services"    USING (true) WITH CHECK (true);

ALTER TABLE "provider_locations"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "provider_locations"   FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "provider_locations"   USING (true) WITH CHECK (true);

ALTER TABLE "service_locations"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "service_locations"    FORCE  ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "service_locations"    USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- Platform-level tables (tenants, admin_users, subscriptions, etc.)
-- are intentionally left WITHOUT RLS. They are managed by admin
-- endpoints / auth flows that connect as bizplus_admin (BYPASSRLS).
-- ------------------------------------------------------------
