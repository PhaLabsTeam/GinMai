-- Read-only snapshot of everything that decides who can do what in the live
-- database (Phase 8 backend audit). Safe to run any time: SELECT only.
-- Returns one JSON document.
SELECT jsonb_pretty(jsonb_build_object(
  'taken_at', now(),

  'rls', (SELECT jsonb_agg(jsonb_build_object(
      'table', c.relname, 'rls', c.relrowsecurity, 'forced', c.relforcerowsecurity) ORDER BY c.relname)
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')),

  'policies', (SELECT jsonb_agg(jsonb_build_object(
      'table', tablename, 'name', policyname, 'cmd', cmd, 'roles', roles,
      'permissive', permissive, 'using', qual, 'check', with_check) ORDER BY tablename, cmd, policyname)
    FROM pg_policies WHERE schemaname IN ('public', 'storage')),

  'table_grants', (SELECT jsonb_agg(jsonb_build_object(
      'table', table_name, 'grantee', grantee, 'privilege', privilege_type) ORDER BY table_name, grantee, privilege_type)
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated', 'PUBLIC')),

  'column_grants', (SELECT jsonb_agg(jsonb_build_object(
      'table', table_name, 'column', column_name, 'grantee', grantee, 'privilege', privilege_type)
      ORDER BY table_name, grantee, privilege_type, column_name)
    FROM information_schema.column_privileges
    WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')),

  'columns', (SELECT jsonb_agg(jsonb_build_object(
      'table', table_name, 'column', column_name, 'type', data_type,
      'nullable', is_nullable, 'default', column_default) ORDER BY table_name, ordinal_position)
    FROM information_schema.columns WHERE table_schema = 'public'),

  'constraints', (SELECT jsonb_agg(jsonb_build_object(
      'table', conrelid::regclass::text, 'name', conname, 'def', pg_get_constraintdef(oid)) ORDER BY conrelid::regclass::text, conname)
    FROM pg_constraint WHERE connamespace = 'public'::regnamespace),

  'functions', (SELECT jsonb_agg(jsonb_build_object(
      'name', p.proname, 'args', pg_get_function_identity_arguments(p.oid),
      'security_definer', p.prosecdef, 'config', p.proconfig, 'acl', p.proacl::text[],
      'body', p.prosrc) ORDER BY p.proname)
    FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.prokind = 'f'),

  'triggers', (SELECT jsonb_agg(jsonb_build_object(
      'table', tgrelid::regclass::text, 'name', tgname, 'enabled', tgenabled,
      'def', pg_get_triggerdef(oid)) ORDER BY tgrelid::regclass::text, tgname)
    FROM pg_trigger WHERE NOT tgisinternal
      AND tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace)),

  'views', (SELECT jsonb_agg(jsonb_build_object('name', viewname, 'def', definition))
    FROM pg_views WHERE schemaname = 'public'),

  'realtime_tables', (SELECT jsonb_agg(schemaname || '.' || tablename)
    FROM pg_publication_tables WHERE pubname = 'supabase_realtime'),

  'cron_jobs', (SELECT jsonb_agg(jsonb_build_object(
      'name', jobname, 'schedule', schedule, 'command', command, 'active', active))
    FROM cron.job),

  'storage_buckets', (SELECT jsonb_agg(jsonb_build_object('id', id, 'public', public))
    FROM storage.buckets),

  'extensions', (SELECT jsonb_agg(extname || ' ' || extversion ORDER BY extname) FROM pg_extension),

  'row_counts', (SELECT jsonb_object_agg(relname, n_live_tup)
    FROM pg_stat_user_tables WHERE schemaname = 'public')
)) AS snapshot;
