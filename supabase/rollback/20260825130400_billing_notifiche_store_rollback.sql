-- Rollback di 20260825130400_billing_notifiche_store.sql
--
-- Toglie il registro delle consegne degli store e le sue due funzioni.
--
-- COSA SIGNIFICA ESEGUIRLO
-- ------------------------
-- Da quel momento non c'e' piu' niente che riceva un rimborso deciso da Apple
-- o da Google. `billing_pending_revocations` resta, ma nessuno gliene
-- consegnera' piu' uno: si torna esattamente alla situazione in cui un
-- lifetime rimborsato resta per sempre il miglior diritto dell'utente.
--
-- Va fatto SOLO insieme allo spegnimento delle sottoscrizioni nelle console.
-- Lasciare Apple e Pub/Sub che consegnano verso un endpoint che non sa piu'
-- registrare significa perdere le notifiche in silenzio: gli store le
-- riproverebbero per un po' e poi rinuncerebbero, e nessuno saprebbe quali.
--
-- SI RIFIUTA SE CI SONO CONSEGNE NON CHIUSE
-- -----------------------------------------
-- Una riga con `processed_at is null` e' una notifica ricevuta il cui effetto
-- non e' mai stato applicato. Cancellarla e' perdere per sempre l'unica
-- traccia di un rimborso che nessuno ha ancora onorato.
do $$
declare
  v_aperte int;
begin
  if to_regclass('private.billing_store_notifications') is null then
    raise notice 'rollback notifiche: la tabella non esiste, niente da fare.';
    return;
  end if;

  select count(*) into v_aperte
  from private.billing_store_notifications where processed_at is null;

  if v_aperte > 0 and coalesce(current_setting('notifiche_rollback_force', true), '') <> '1' then
    raise exception
      'rollback rifiutato: % consegne ricevute e mai chiuse. Ognuna e'' un effetto che lo store considera consegnato e che noi non abbiamo applicato. Esportarle prima, poi rieseguire con -v notifiche_rollback_force=1.', v_aperte
      using errcode = '55000';
  end if;
end $$;

drop function if exists public.chiudi_notifica_store(text, text, text, text, text, timestamptz);
drop function if exists public.apri_notifica_store(text, text, text, text);
drop table if exists private.billing_store_notifications;

delete from supabase_migrations.schema_migrations
where version = '20260825130400';

do $$
begin
  if to_regclass('private.billing_store_notifications') is not null then
    raise exception 'rollback notifiche: la tabella e'' ancora li''';
  end if;
  raise notice 'rollback 20260825130400 eseguito: nessuno riceve piu'' le notifiche degli store.';
end $$;
