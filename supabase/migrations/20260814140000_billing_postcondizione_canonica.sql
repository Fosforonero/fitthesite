-- ============================================================================
-- LA POSTCONDIZIONE ERA SCRITTA DUE VOLTE, E LE DUE VERSIONI NON DICEVANO LA
-- STESSA COSA
--
-- La correzione precedente (20260814080000) ha smesso di cancellare le revoche
-- che non era riuscita ad applicare, e per farlo si e' chiesta se la revoca in
-- attesa fosse stata SUPERATA da un'evidenza piu' recente. Ma se l'e' chiesta
-- cosi':
--
--     where s.store_event_at > r.store_event_at
--
-- cioe' confrontando due numeri. Il confronto fra evidenze in questo sistema
-- non e' un confronto fra numeri: e' `private._billing_evidenza_supera`, e ha
-- due regole in piu' che qui mancavano tutte e due.
--
--   1  UN SEGNAPOSTO NON SUPERA MAI UN'EVIDENZA STORE. `projection_backfill` e
--      `projection_compatibility` non vengono da nessuno store: sono lo stato
--      dedotto da una riga di proiezione preesistente, e portano il timestamp
--      del momento in cui li abbiamo dedotti — quindi sono quasi sempre PIU'
--      RECENTI di una revoca vera. Con il confronto numerico, una riga
--      scritta dal percorso vecchio bastava a far sparire l'ultima copia di un
--      rimborso.
--
--   2  UNA RICEVUTA LEGACY NON ANNULLA UNA REVOCA JWS. Una risposta
--      verifyReceipt (`apple_request_date`) successiva a una revoca firmata
--      (`apple_signed_date`) dice soltanto "quando abbiamo chiesto", non che il
--      rimborso sia stato annullato. Con il confronto numerico vinceva, e la
--      revoca in attesa veniva consumata da un'evidenza che per contratto non
--      puo' consumarla.
--
-- In entrambi i casi l'esito e' lo stesso, ed e' il peggiore possibile: la
-- riga in attesa e' L'ULTIMA COPIA di quel rimborso, perche' la transazione
-- del client e' gia' stata chiusa. Cancellarla significa che il cliente
-- rimborsato resta Pro e che non esiste piu' niente che possa dircelo.
--
-- Il difetto e' interessante per come e' nato: la regola di precedenza esiste,
-- e' scritta, ed e' usata ovunque si scriva nel registro. Qui pero' non si
-- stava scrivendo — si stava decidendo se BUTTARE VIA — e in quel punto la
-- regola e' stata riscritta a mano nella sua versione ingenua. Una seconda
-- copia di una regola e' una regola che prima o poi divergera'.
--
-- Adesso la domanda e' posta al comparatore canonico, nella forma esatta in
-- cui va posta: la revoca in attesa e' la VECCHIA evidenza (stato `revoked`),
-- lo stato registrato e' la NUOVA. Se la nuova supera la vecchia, la revoca ha
-- perso legittimamente e la riga si consuma; altrimenti resta.
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

      -- (b) Superata: nel registro c'e' un'evidenza che per contratto batte
      -- questa revoca. Si chiede al comparatore canonico, non a `>`: le due
      -- domande sembrano la stessa e non lo sono (vedi il blocco in testa).
      --
      -- Si chiede al registro invece di dedurlo dall'esito, perche' la RPC
      -- risponde `not_persisted` sia quando ha perso il confronto sia quando
      -- non e' riuscita a scrivere, e le due cose meritano destini opposti.
      select private._billing_evidenza_supera(
               r.store_event_source, r.store_event_at, 'revoked',
               s.store_event_source, s.store_event_at, s.state)
        into v_superata
      from private.billing_purchase_states s
      where s.billing_source = r.billing_source
        and s.ownership_key  = r.ownership_key;

      -- Nessuno stato registrato: non c'e' niente che possa aver superato la
      -- revoca, quindi non e' superata. In dubbio la riga resta.
      v_superata := coalesce(v_superata, false);

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
  'oppure superata secondo private._billing_evidenza_supera — non secondo un '
  'confronto fra timestamp, che ignora sia i segnaposto sia le ricevute '
  'legacy. Su qualunque altro esito la riga resta, perche'' e'' l''ultima copia '
  'di quel rimborso.';
