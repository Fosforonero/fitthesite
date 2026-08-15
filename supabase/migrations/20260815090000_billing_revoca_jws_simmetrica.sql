-- ============================================================================
-- LA REGOLA ESISTEVA IN UNA DIREZIONE SOLA, E NELL'ALTRA COSTAVA UN RIMBORSO
--
-- `_billing_evidenza_supera` diceva gia' che una ricevuta legacy non annulla
-- una revoca JWS:
--
--     vecchio = revoked / apple_signed_date
--     nuovo   = active  / apple_request_date   -> non supera
--
-- ma non diceva niente del caso opposto, che finiva quindi nel confronto fra
-- timestamp:
--
--     vecchio = active  / apple_request_date
--     nuovo   = revoked / apple_signed_date    -> vince il piu' recente
--
-- E il piu' recente e' quasi sempre la ricevuta legacy, perche' `request_date`
-- e' l'istante in cui NOI abbiamo chiesto — un ripristino, un riavvio, una
-- rivalidazione — mentre `signedDate` e' l'istante in cui APPLE ha firmato il
-- rimborso. Basta che il cliente riapra l'app dopo essere stato rimborsato e
-- l'ordine si inverte.
--
-- Da li' in poi la revoca non entra piu' nel registro. E dopo 20260814140000
-- non viene nemmeno piu' buttata via: resta in attesa, viene riprovata ogni
-- dieci minuti, e ogni volta perde. Conservata per sempre e applicata mai, che
-- per il cliente rimborsato e' identico a essere stata persa — con la
-- differenza che adesso ce l'abbiamo scritto in un log che nessuno legge.
--
-- Riprodotto sul percorso reale, tre giri della rete di riserva:
--
--     in attesa=1   stato registrato=active   proiezione=active
--
-- cioe' un cliente che ha avuto indietro i soldi e ha ancora il Pro a vita.
--
-- Il difetto non era nella rete di riserva: quella si comportava esattamente
-- come le era stato detto. Era nella regola, che descriveva una asimmetria
-- reale in una direzione sola. Il motivo per cui una ricevuta legacy non
-- annulla una revoca JWS — `request_date_ms` dice solo "quando abbiamo
-- chiesto", non "il rimborso e' stato annullato" — non dipende da quale delle
-- due arriva prima. Adesso la regola dice la stessa cosa in tutti e due i
-- versi, e l'esito non dipende piu' dall'ordine di arrivo.
--
-- COSA NON CAMBIA: `revoked` non diventa assorbente. Una fotografia JWS piu'
-- recente senza revoca continua a riattivare, che e' REFUND_REVERSED. A non
-- poter piu' riattivare — in nessun ordine — e' soltanto la ricevuta legacy,
-- che non porta quell'informazione.
--
-- E IL TEST CHE NON LO VEDEVA. P10 asseriva che la riga in attesa
-- sopravvivesse, e sopravviveva. Nessuno guardava l'entitlement: se una revoca
-- non puo' MAI essere applicata, "conservata" e "buttata via" costano al
-- cliente la stessa identica cosa. Da qui in poi i casi sulle revoche
-- asseriscono anche il diritto proiettato.
-- ============================================================================
create or replace function private._billing_evidenza_supera(
  p_vecchia_fonte text, p_vecchia_at timestamptz, p_vecchio_stato text,
  p_nuova_fonte text,   p_nuova_at timestamptz,   p_nuovo_stato text
)
returns boolean
language sql
immutable
set search_path to ''
as $$
  select case
    -- Un segnaposto non cancella mai un'evidenza store, nemmeno se piu'
    -- recente: e' il caso in cui la 189 riscrive una riga vecchia mentre
    -- l'acquisto e' gia' stato verificato dal percorso nuovo.
    when p_nuova_fonte in ('projection_backfill', 'projection_compatibility')
     and p_vecchia_fonte not in ('projection_backfill', 'projection_compatibility')
      then false
    -- Un'evidenza store supera sempre un segnaposto, anche se anteriore: i due
    -- valori non stanno sullo stesso orologio, e fra i due solo quello dello
    -- store dice qualcosa sull'acquisto.
    when p_vecchia_fonte in ('projection_backfill', 'projection_compatibility')
     and p_nuova_fonte not in ('projection_backfill', 'projection_compatibility')
      then true
    -- UNA REVOCA JWS NON SI ANNULLA CON UNA RICEVUTA LEGACY, E VALE NEI DUE
    -- VERSI.
    --
    -- `revoked` NON e' assorbente: Apple prevede REFUND_REVERSED, cioe'
    -- l'annullamento di un rimborso, e in quel caso l'accesso va RIPRISTINATO
    -- sullo stesso originalTransactionId. Una fotografia JWS piu' recente
    -- senza revoca deve quindi poter riattivare.
    --
    -- Ma verifyReceipt (StoreKit 1) non porta la stessa informazione: il suo
    -- `request_date_ms` e' solo "quando abbiamo chiesto", e una sua risposta
    -- successiva non e' una prova che il rimborso sia stato annullato.
    --
    -- Quindi: una ricevuta legacy non toglie una revoca JWS gia' registrata...
    when p_vecchio_stato = 'revoked'
     and p_nuovo_stato <> 'revoked'
     and p_vecchia_fonte = 'apple_signed_date'
     and p_nuova_fonte = 'apple_request_date'
      then false
    -- ...e non le sbarra nemmeno la strada quando arriva per prima. Era questo
    -- il ramo mancante, e non era simmetria per eleganza: `request_date` e'
    -- l'istante in cui NOI abbiamo chiesto, `signedDate` quello in cui APPLE
    -- ha firmato il rimborso. Il primo e' quasi sempre il piu' recente — basta
    -- che il cliente riapra l'app dopo essere stato rimborsato — e senza
    -- questo ramo la revoca perdeva il confronto per sempre.
    when p_vecchio_stato <> 'revoked'
     and p_nuovo_stato = 'revoked'
     and p_vecchia_fonte = 'apple_request_date'
     and p_nuova_fonte = 'apple_signed_date'
      then true
    -- Stessa classe di orologio: vince la fotografia piu' recente. E' la
    -- regola che Apple documenta per ordinare le evidenze della stessa
    -- transazione.
    else p_nuova_at > p_vecchia_at
  end;
$$;

comment on function private._billing_evidenza_supera(text, timestamptz, text, text, timestamptz, text) is
  'Precedenza fra due evidenze sullo stesso acquisto, ordinate per FRESCHEZZA '
  'DELLA FOTOGRAFIA (store_event_at). Un segnaposto perde sempre contro '
  'un''evidenza store. Fra una revoca JWS e una ricevuta legacy vince SEMPRE la '
  'revoca, in entrambi gli ordini di arrivo: request_date dice solo quando '
  'abbiamo chiesto, mai che il rimborso sia stato annullato. Per il resto vince '
  'la fotografia piu'' recente, e `revoked` NON e'' assorbente — una fotografia '
  'JWS piu'' recente senza revoca ripristina l''accesso (REFUND_REVERSED).';
