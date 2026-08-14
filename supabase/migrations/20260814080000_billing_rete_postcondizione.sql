-- ============================================================================
-- LA RETE DI RISERVA CANCELLAVA CIO' CHE NON ERA RIUSCITA AD APPLICARE
--
-- private.billing_apply_pending_revocations() faceva:
--
--     perform public.record_store_purchase_revocation(...);
--     delete from private.billing_pending_revocations ...;
--
-- e quel `perform` butta via il valore di ritorno. La RPC pero' NON solleva
-- quando la scrittura fallisce: cattura l'eccezione e risponde
-- `{"outcome":"persistence_failed"}`. Il blocco `exception when others` del
-- ciclo non vedeva quindi niente da intercettare, la riga veniva cancellata lo
-- stesso e il contatore incrementato.
--
-- Conseguenza: l'ULTIMA copia di quel rimborso spariva. Un cliente rimborsato
-- restava Pro, e non c'era piu' niente — ne' la transazione, che era stata
-- chiusa, ne' la riga in attesa — che potesse farcelo sapere. La rete di
-- riserva era diventata il posto in cui le revoche si perdevano.
--
-- Adesso si cancella SOLO dopo una postcondizione dichiarata, e sono due:
--
--   a  la revoca risulta persistita (`outcome = 'revoked'` e `persisted`), cioe'
--      il registro adesso dice `revoked` per quella chiave;
--   b  la revoca e' stata SUPERATA da un'evidenza piu' recente. E' il caso di
--      chi si e' fatto rimborsare e poi ha ricomprato: la revoca ha perso, e
--      ha perso legittimamente. Senza questo ramo la riga resterebbe in attesa
--      per sempre e verrebbe riprovata ogni dieci minuti a vuoto.
--
-- Su `persistence_failed`, `claim_in_flight`, `not_persisted` non superato, o
-- un esito che non sappiamo leggere, la riga RESTA. Costa un tentativo ogni
-- dieci minuti; l'alternativa costa un rimborso.
-- ============================================================================
create or replace function private.billing_apply_pending_revocations(p_max int default 100)
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  r record;
  v_esito jsonb;
  v_outcome text;
  v_superata boolean;
  n integer := 0;
begin
  if not pg_catalog.pg_try_advisory_xact_lock(2, 815150000) then
    return 0;
  end if;

  for r in
    select p.billing_source, p.ownership_key, p.external_product_id,
           p.purchase_kind, p.store_event_at, p.store_event_source,
           p.revocation_at
    from private.billing_pending_revocations p
    join private.billing_purchase_claims c
      on c.billing_source = p.billing_source
     and c.ownership_key  = p.ownership_key
    where c.owner_user_id is not null
    order by p.billing_source, p.ownership_key
    limit p_max
  loop
    begin
      -- L'ESITO SI GUARDA. Era un `perform`, cioe' un valore buttato via.
      v_esito := public.record_store_purchase_revocation(
        r.billing_source, r.ownership_key, r.external_product_id,
        r.purchase_kind, r.store_event_at, r.store_event_source,
        r.revocation_at
      );
      v_outcome := v_esito->>'outcome';

      -- (b) Superata: nel registro c'e' un'evidenza piu' recente di questa.
      -- Si chiede al registro invece di dedurlo dall'esito, perche' la RPC
      -- risponde `not_persisted` sia quando ha perso il confronto sia quando
      -- non e' riuscita a scrivere, e le due cose meritano destini opposti.
      select exists (
        select 1 from private.billing_purchase_states s
        where s.billing_source = r.billing_source
          and s.ownership_key  = r.ownership_key
          and s.store_event_at > r.store_event_at
      ) into v_superata;

      if (v_outcome = 'revoked' and coalesce((v_esito->>'persisted')::boolean, false))
         or v_outcome = 'owner_deleted'
         or v_superata
      then
        delete from private.billing_pending_revocations p
         where p.billing_source = r.billing_source
           and p.ownership_key  = r.ownership_key
           -- Si cancella la riga CHE ABBIAMO LETTO, non "la riga di quella
           -- chiave". Se nel frattempo ne fosse arrivata una piu' recente,
           -- quella deve sopravvivere e aspettare il proprio giro.
           and p.store_event_at = r.store_event_at;
        n := n + 1;
      else
        raise warning 'revoca in attesa NON applicata e conservata (% %): esito %',
          r.billing_source, left(r.ownership_key, 8), coalesce(v_outcome, 'sconosciuto');
      end if;

    exception when others then
      -- Una riga che solleva non deve fermare le altre, e NON si cancella.
      raise warning 'revoca in attesa non applicata (% %): %',
        r.billing_source, left(r.ownership_key, 8), sqlerrm;
    end;
  end loop;

  return n;
end;
$$;

revoke all on function private.billing_apply_pending_revocations(int)
  from public, anon, authenticated, service_role;

comment on function private.billing_apply_pending_revocations(int) is
  'Applica le revoche rimaste in attesa il cui acquisto e'' comparso dopo. '
  'Cancella una riga SOLO dopo che la revoca risulta persistita nel registro '
  'oppure superata da un''evidenza piu'' recente: su qualunque altro esito la '
  'riga resta, perche'' e'' l''ultima copia di quel rimborso.';
