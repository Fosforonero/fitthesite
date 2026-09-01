-- ============================================================================
-- ROLLBACK di F4 — via il trigger di lock, e gdpr_process_deletions torna
-- com'era.
--
-- F4 fa due cose diverse: CREA un trigger su auth.users, e MODIFICA una
-- funzione preesistente. Il trigger si lascia cadere; la funzione no, e va
-- riportata indietro togliendo esattamente le due righe aggiunte.
-- ============================================================================
drop trigger if exists trg_billing_lock_before_user_delete on auth.users;

do $$
declare
  v_def text;
  v_nuovo constant text :=
    '      perform 1 from auth.users u where u.id = uid for update;' || chr(10) ||
    '      perform 1 from public.b2c_subscriptions t where t.user_id = uid for update;' || chr(10) ||
    '      delete from public.profiles where id = uid;';
  v_ancora constant text := '      delete from public.profiles where id = uid;';
  v_prima int;
  v_dopo int;
begin
  select pg_catalog.pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'gdpr_process_deletions';

  if v_def is null then
    raise exception 'ROLLBACK F4: public.gdpr_process_deletions non esiste';
  end if;

  v_prima := (pg_catalog.length(v_def) - pg_catalog.length(pg_catalog.replace(v_def, 'for update', '')))
             / pg_catalog.length('for update');
  if v_prima = 0 then
    raise notice 'ROLLBACK F4: gdpr_process_deletions gia'' senza i lock espliciti';
  else
    if v_prima <> 2 then
      raise exception 'ROLLBACK F4: attesi 2 «for update», trovati %. Il corpo non e'' quello che F4 ha prodotto: fermarsi.', v_prima;
    end if;
    execute pg_catalog.replace(v_def, v_nuovo, v_ancora);

    select pg_catalog.pg_get_functiondef(p.oid) into v_def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'gdpr_process_deletions';
    v_dopo := (pg_catalog.length(v_def) - pg_catalog.length(pg_catalog.replace(v_def, 'for update', '')))
              / pg_catalog.length('for update');
    if v_dopo <> 0 then
      raise exception 'ROLLBACK F4: dopo la sostituzione restano % «for update»', v_dopo;
    end if;
  end if;

  if exists (select 1 from pg_trigger where tgname = 'trg_billing_lock_before_user_delete' and not tgisinternal) then
    raise exception 'ROLLBACK F4: il trigger di lock e'' ancora presente';
  end if;

  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'gdpr_process_deletions' and p.prosecdef
  ) then
    raise exception 'ROLLBACK F4: gdpr_process_deletions ha perso SECURITY DEFINER';
  end if;

  raise notice 'ROLLBACK F4: trigger rimosso e gdpr_process_deletions riportata indietro';
end $$;
