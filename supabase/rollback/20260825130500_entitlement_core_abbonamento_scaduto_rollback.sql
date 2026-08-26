-- ============================================================================
-- ROLLBACK di F6 — private.entitlement_core torna a NON guardare il tempo.
--
-- F6 non crea niente: MODIFICA una funzione che preesiste. Un rollback che
-- facesse `drop function` cancellerebbe l'autorita' che decide ogni accesso.
-- Qui si toglie soltanto cio' che F6 ha aggiunto, con la sostituzione inversa
-- sul corpo VIVO, letto da pg_get_functiondef.
--
-- Cosi' si conservano per costruzione firma, owner, privilegi, SECURITY
-- DEFINER, volatilita' e search_path: CREATE OR REPLACE non tocca owner e ACL,
-- e tutto il resto e' gia' dentro la definizione che rileggiamo.
--
-- Il conteggio delle occorrenze e' letterale, non con espressioni regolari:
-- l'ancora contiene parentesi e apici, che in un pattern sarebbero
-- metacaratteri.
-- ============================================================================
do $$
declare
  v_def text;
  v_nuovo constant text := '       and b.state in (''active'', ''grace'')' || chr(10) ||
                           '       and b.active_until > v_now';
  v_ancora constant text := '       and b.state in (''active'', ''grace'')';
  v_prima int;
  v_dopo int;
begin
  select pg_catalog.pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private' and p.proname = 'entitlement_core';

  if v_def is null then
    raise exception 'ROLLBACK F6: private.entitlement_core non esiste';
  end if;

  v_prima := (pg_catalog.length(v_def) - pg_catalog.length(pg_catalog.replace(v_def, 'b.active_until > v_now', '')))
             / pg_catalog.length('b.active_until > v_now');
  if v_prima = 0 then
    raise notice 'ROLLBACK F6: gia'' senza il controllo sul tempo, niente da fare';
    return;
  end if;
  if v_prima <> 2 then
    raise exception 'ROLLBACK F6: attese 2 occorrenze del controllo sul tempo, trovate %. Il corpo non e'' quello che F6 ha prodotto: fermarsi.', v_prima;
  end if;

  execute pg_catalog.replace(v_def, v_nuovo, v_ancora);

  select pg_catalog.pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private' and p.proname = 'entitlement_core';
  v_dopo := (pg_catalog.length(v_def) - pg_catalog.length(pg_catalog.replace(v_def, 'b.active_until > v_now', '')))
            / pg_catalog.length('b.active_until > v_now');
  if v_dopo <> 0 then
    raise exception 'ROLLBACK F6: dopo la sostituzione restano % occorrenze', v_dopo;
  end if;

  -- L'impronta strutturale, non solo il corpo.
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = 'entitlement_core'
      and p.prosecdef
      and p.provolatile = 's'
      and 'search_path=""' = any(p.proconfig)
      and pg_catalog.pg_get_function_identity_arguments(p.oid) = 'p_user_id uuid'
  ) then
    raise exception 'ROLLBACK F6: la funzione ha perso SECURITY DEFINER, la volatilita'', il search_path o la firma';
  end if;

  raise notice 'ROLLBACK F6: controllo sul tempo rimosso, impronta strutturale intatta';
end $$;
