-- ============================================================================
-- ROLLBACK di 20260810140000_b2c_projection_guard.sql
--
-- LEGGERE PRIMA supabase/rollback/README-rollback-applicativo.md.
--
-- Questo file mancava, ed e' stato il collaudo a dirlo: 87-rollback-verificato.sh
-- esegue i rollback in una transazione che poi annulla e controlla che non
-- sopravviva nessun oggetto. Sopravvivevano la guardia, il suo trigger, la
-- funzione di passaggio di modo e la tabella del modo — cioe' tutto cio' che
-- questa migration crea. Un controllo che si limitasse a leggere i file non lo
-- avrebbe visto: non c'era niente di sbagliato scritto, semplicemente non
-- c'era scritto niente.
--
-- ── COSA SI RIACCENDE TOGLIENDO QUESTA GUARDIA ─────────────────────────────
--
-- La guardia e' l'unica cosa che impedisce a una scrittura diretta su
-- public.b2c_subscriptions di concedere il Pro senza che nessuno store abbia
-- verificato niente. Senza:
--
--   - il backend vecchio (e chiunque altro col service_role) torna a poter
--     scrivere l'entitlement senza iscrivere la proprieta' nel registro;
--   - un acquisto che il registro sa REVOCATO torna Pro se qualcuno lo
--     ripresenta;
--   - una riga Founder torna sovrascrivibile da una scrittura commerciale;
--   - una riga commerciale torna cancellabile fuori dal registro, e la
--     cancellazione fa anche passare il controllo di copertura, che conta le
--     righe esistenti;
--   - `billing_source = 'stripe'` torna accettato, cioe' una fonte che in
--     questo prodotto non ha nessun percorso legittimo.
--
-- Non e' una difesa in piu': e' la sola che sta fra il registro e la finestra
-- di compatibilita' con la 189.
--
-- Uso:
--   psql -v ON_ERROR_STOP=1 -f 20260810140000_b2c_projection_guard_rollback.sql
-- ============================================================================

\set ON_ERROR_STOP on

begin;

-- Se il modo e' 'strict', toglierlo significa passare da "l'entitlement si
-- scrive solo col registro" a "chiunque puo' scriverlo". Vale la pena
-- accorgersene mentre succede.
do $$
declare v_modo text;
begin
  select mode into v_modo
  from private.billing_projection_guard_mode
  where singleton;

  if v_modo = 'strict' then
    raise warning
      'rollback: la guardia era in modo strict. Da adesso una scrittura diretta su public.b2c_subscriptions concede il Pro senza che nessuno store abbia verificato niente.';
  end if;
exception
  when undefined_table then
    null; -- gia' tolta da un rollback precedente
end $$;

drop trigger if exists b2c_projection_guard on public.b2c_subscriptions;
drop function if exists private._b2c_projection_guard();

drop function if exists private.set_billing_projection_guard_mode(text, text);

-- La tabella del modo se ne va per ultima: la leggono sia la guardia sia la
-- funzione di passaggio, ed entrambe sono gia' sparite qui sopra.
drop table if exists private.billing_projection_guard_mode;

commit;

\echo 'rollback 20260810140000 eseguito: la guardia della proiezione non c e piu.'
\echo 'public.b2c_subscriptions torna scrivibile direttamente da chiunque abbia il service_role.'
