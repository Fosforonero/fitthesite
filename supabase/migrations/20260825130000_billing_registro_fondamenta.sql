-- ============================================================================
-- F1 — LE FONDAMENTA DEL REGISTRO DEGLI ACQUISTI
-- ============================================================================
-- Prima forward-only del filone billing. Consolida le tabelle create da
-- cinque migration del ramo `p0/apple-jws-verifier` (20260808211929,
-- 20260810120000, 20260810140000, 20260812093000, 20260813103000) nella loro
-- forma FINALE, non nella successione con cui furono scritte.
--
-- PERCHE' CONSOLIDATE E NON RIPORTATE
-- -----------------------------------
-- Quelle migration sono datate fra l'8 e il 13 agosto, cioe' PRIMA della testa
-- della catena viva. Riportarle com'erano significherebbe riscrivere il
-- passato, e in due casi (`billing_purchase_states`, alterata da
-- 20260812093000) la prima CREATE non e' nemmeno la forma finale.
--
-- Il contenuto qui sotto e' stato prodotto da `pg_dump --schema-only` di un
-- contenitore PG17 usa-e-getta su cui era stata applicata l'INTERA catena del
-- filone (69 migration, 0 fallite). E' quindi lo stato finale osservato, non
-- dedotto leggendo i file.
--
-- COSA QUESTE TABELLE NON SONO
-- ----------------------------
-- Non sono un'autorita' sull'accesso. `private.entitlement_core` resta l'unica
-- funzione che decide se una persona ha diritto, e continua a leggere la
-- proiezione `public.b2c_subscriptions`. Questo registro sta SOTTO la
-- proiezione: dice cosa ha detto lo store, e diventera' l'unico scrittore
-- della riga di proiezione. La domanda «questa persona ha accesso?» continua
-- ad avere una sola risposta, nello stesso posto di prima.
--
-- I TRIGGER NON SONO QUI
-- ----------------------
-- Le cinque tabelle hanno trigger (immutabilita' dei claim, forward-only sugli
-- stati, cancello sandbox, permesso sandbox cambiato). I trigger hanno bisogno
-- delle funzioni, e le funzioni arrivano in F2. Metterli qui renderebbe questa
-- migration inapplicabile da sola.
-- ============================================================================

--
-- Name: billing_pending_revocations; Type: TABLE; Schema: private; Owner: -
--

CREATE TABLE private.billing_pending_revocations (
    billing_source text NOT NULL,
    ownership_key text NOT NULL,
    external_product_id text NOT NULL,
    purchase_kind text NOT NULL,
    store_event_at timestamp with time zone NOT NULL,
    store_event_source text NOT NULL,
    revocation_at timestamp with time zone,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT billing_pending_revocations_billing_source_check CHECK ((billing_source = ANY (ARRAY['apple_iap'::text, 'google_play'::text]))),
    CONSTRAINT billing_pending_revocations_external_product_id_check CHECK ((external_product_id = ANY (ARRAY['fitmesh_pro_lifetime'::text, 'fitmesh_pro_sub'::text]))),
    CONSTRAINT billing_pending_revocations_ownership_key_check CHECK (((length(ownership_key) >= 1) AND (length(ownership_key) <= 64))),
    CONSTRAINT billing_pending_revocations_purchase_kind_check CHECK ((purchase_kind = ANY (ARRAY['lifetime'::text, 'subscription'::text]))),
    CONSTRAINT billing_pending_revocations_store_event_source_check CHECK ((store_event_source = ANY (ARRAY['apple_signed_date'::text, 'apple_request_date'::text, 'google_backend_fetch'::text])))
);


--
-- Name: TABLE billing_pending_revocations; Type: COMMENT; Schema: private; Owner: -
--

COMMENT ON TABLE private.billing_pending_revocations IS 'Rimborsi e revoche di acquisti che al momento in cui li abbiamo saputi non erano (ancora) nel registro. Non sono scarti: sono fatti in attesa del loro acquisto, e il primo claim su quella chiave se li applica addosso.';


--
-- Name: billing_projection_guard_mode; Type: TABLE; Schema: private; Owner: -
--

CREATE TABLE private.billing_projection_guard_mode (
    singleton boolean DEFAULT true NOT NULL,
    mode text NOT NULL,
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    note text,
    CONSTRAINT billing_projection_guard_mode_check CHECK ((mode = ANY (ARRAY['compatibility'::text, 'strict'::text]))),
    CONSTRAINT billing_projection_guard_singleton CHECK (singleton)
);


--
-- Name: billing_purchase_claims; Type: TABLE; Schema: private; Owner: -
--

CREATE TABLE private.billing_purchase_claims (
    billing_source text NOT NULL,
    ownership_key text NOT NULL,
    external_transaction_id text,
    external_product_id text NOT NULL,
    owner_user_id uuid,
    environment text NOT NULL,
    app_account_token uuid,
    claimed_at timestamp with time zone DEFAULT now() NOT NULL,
    anonymized_at timestamp with time zone,
    CONSTRAINT billing_purchase_claims_account_token_matches_owner CHECK (((app_account_token IS NULL) OR (owner_user_id IS NULL) OR (app_account_token = owner_user_id))),
    CONSTRAINT billing_purchase_claims_billing_source_check CHECK ((billing_source = ANY (ARRAY['apple_iap'::text, 'google_play'::text]))),
    CONSTRAINT billing_purchase_claims_environment_check CHECK ((environment = ANY (ARRAY['production'::text, 'sandbox'::text]))),
    CONSTRAINT billing_purchase_claims_ownership_key_shape CHECK (
CASE billing_source
    WHEN 'google_play'::text THEN (ownership_key ~ '^[0-9a-f]{64}$'::text)
    WHEN 'apple_iap'::text THEN (((length(ownership_key) >= 1) AND (length(ownership_key) <= 64)) AND (ownership_key !~ '[[:space:]]'::text))
    ELSE false
END),
    CONSTRAINT billing_purchase_claims_tombstone_consistent CHECK (((owner_user_id IS NULL) = (anonymized_at IS NOT NULL)))
);


--
-- Name: TABLE billing_purchase_claims; Type: COMMENT; Schema: private; Owner: -
--

COMMENT ON TABLE private.billing_purchase_claims IS 'Registro append-only della proprieta'' degli acquisti store. PK (billing_source, ownership_key). Nessun token/JWS/ricevuta/raw payload. Righe mai cancellate: alla cancellazione account diventano tombstone anonime (owner_user_id null, anonymized_at valorizzato), MAI reclamabili da un altro utente. Scritto esclusivamente da public.claim_store_purchase().';


--
-- Name: COLUMN billing_purchase_claims.ownership_key; Type: COMMENT; Schema: private; Owner: -
--

COMMENT ON COLUMN private.billing_purchase_claims.ownership_key IS 'apple_iap: originalTransactionId dal JWS verificato. google_play: SHA-256 hex del purchase token, calcolato dal backend DOPO il 200 di Google. Mai il token grezzo.';


--
-- Name: COLUMN billing_purchase_claims.external_transaction_id; Type: COMMENT; Schema: private; Owner: -
--

COMMENT ON COLUMN private.billing_purchase_claims.external_transaction_id IS 'Apple transactionId / Google orderId della transazione che ha stabilito la proprieta'', registrato al primo claim e mai aggiornato. Informativo: non e'' la chiave, cambia a ogni rinnovo e a ogni restore.';


--
-- Name: COLUMN billing_purchase_claims.anonymized_at; Type: COMMENT; Schema: private; Owner: -
--

COMMENT ON COLUMN private.billing_purchase_claims.anonymized_at IS 'Tombstone GDPR: valorizzato quando l''account proprietario viene cancellato. La riga resta, la proprieta'' resta occupata, il legame con la persona sparisce.';


--
-- Name: billing_purchase_states; Type: TABLE; Schema: private; Owner: -
--

CREATE TABLE private.billing_purchase_states (
    billing_source text NOT NULL,
    ownership_key text NOT NULL,
    external_product_id text NOT NULL,
    purchase_kind text NOT NULL,
    state text NOT NULL,
    active_until timestamp with time zone NOT NULL,
    auto_renewing boolean DEFAULT false NOT NULL,
    store_event_at timestamp with time zone NOT NULL,
    store_event_source text NOT NULL,
    verified_at timestamp with time zone DEFAULT now() NOT NULL,
    revocation_at timestamp with time zone,
    CONSTRAINT billing_purchase_states_event_source_check CHECK (
CASE billing_source
    WHEN 'apple_iap'::text THEN (store_event_source = ANY (ARRAY['apple_signed_date'::text, 'apple_request_date'::text, 'projection_backfill'::text, 'projection_compatibility'::text]))
    WHEN 'google_play'::text THEN (store_event_source = ANY (ARRAY['google_backend_fetch'::text, 'projection_backfill'::text, 'projection_compatibility'::text]))
    ELSE false
END),
    CONSTRAINT billing_purchase_states_kind_check CHECK ((purchase_kind = ANY (ARRAY['lifetime'::text, 'subscription'::text]))),
    CONSTRAINT billing_purchase_states_lifetime_sentinel_check CHECK (((purchase_kind <> 'lifetime'::text) OR (active_until > '9000-01-01 00:00:00+00'::timestamp with time zone))),
    CONSTRAINT billing_purchase_states_state_check CHECK ((state = ANY (ARRAY['active'::text, 'grace'::text, 'on_hold'::text, 'paused'::text, 'expired'::text, 'cancelled'::text, 'revoked'::text])))
);


--
-- Name: TABLE billing_purchase_states; Type: COMMENT; Schema: private; Owner: -
--

COMMENT ON TABLE private.billing_purchase_states IS 'Sprint P0 Apple IAP (B''): stato store VERIFICATO di un singolo acquisto, una riga per (billing_source, ownership_key). Mutabile ma solo in avanti nel tempo dell''evidenza store. Non contiene token, JWS, ricevute ne'' payload grezzi. La proprieta'' sta in private.billing_purchase_claims; l''entitlement corrente e'' una PROIEZIONE derivata in public.b2c_subscriptions.';


--
-- Name: COLUMN billing_purchase_states.store_event_at; Type: COMMENT; Schema: private; Owner: -
--

COMMENT ON COLUMN private.billing_purchase_states.store_event_at IS 'Quando lo STORE ha asserito questo stato. Confrontabile solo con altri valori della stessa chiave: vedi store_event_source.';


--
-- Name: COLUMN billing_purchase_states.store_event_source; Type: COMMENT; Schema: private; Owner: -
--

COMMENT ON COLUMN private.billing_purchase_states.store_event_source IS 'Da quale orologio viene store_event_at. apple_signed_date / apple_request_date: orologio di Apple, confrontabili fra loro. google_backend_fetch: il NOSTRO, all''istante del 200 di Play. projection_backfill / projection_compatibility: SEGNAPOSTO, nessuno store ha asserito niente — sono lo stato dedotto da una riga di proiezione preesistente. Un segnaposto perde SEMPRE contro un''evidenza store, in entrambe le direzioni del tempo.';


--
-- Name: COLUMN billing_purchase_states.revocation_at; Type: COMMENT; Schema: private; Owner: -
--

COMMENT ON COLUMN private.billing_purchase_states.revocation_at IS 'Momento in cui il rimborso e'' diventato efficace (revocationDate Apple / cancellation_date_ms). Informativo: NON ordina le evidenze, che si ordinano con store_event_at.';


--
-- Name: billing_sandbox_reviewers; Type: TABLE; Schema: private; Owner: -
--

CREATE TABLE private.billing_sandbox_reviewers (
    user_id uuid NOT NULL,
    note text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT billing_sandbox_reviewers_note_check CHECK (((length(btrim(note)) >= 3) AND (length(btrim(note)) <= 200))),
    CONSTRAINT billing_sandbox_reviewers_scadenza_breve CHECK ((expires_at <= (created_at + '90 days'::interval))),
    CONSTRAINT billing_sandbox_reviewers_scadenza_futura CHECK ((expires_at > created_at))
);


--
-- Name: TABLE billing_sandbox_reviewers; Type: COMMENT; Schema: private; Owner: -
--

COMMENT ON TABLE private.billing_sandbox_reviewers IS 'Account per cui il backend accetta transazioni Apple SANDBOX in produzione. Sta in private: il client non lo legge e non lo scrive. Ogni riga scade, e l''apertura non e'' mai dell''ambiente ma della singola persona.';


--
-- Name: billing_pending_revocations billing_pending_revocations_pkey; Type: CONSTRAINT; Schema: private; Owner: -
--

ALTER TABLE ONLY private.billing_pending_revocations
    ADD CONSTRAINT billing_pending_revocations_pkey PRIMARY KEY (billing_source, ownership_key);


--
-- Name: billing_projection_guard_mode billing_projection_guard_mode_pkey; Type: CONSTRAINT; Schema: private; Owner: -
--

ALTER TABLE ONLY private.billing_projection_guard_mode
    ADD CONSTRAINT billing_projection_guard_mode_pkey PRIMARY KEY (singleton);


--
-- Name: billing_purchase_claims billing_purchase_claims_pkey; Type: CONSTRAINT; Schema: private; Owner: -
--

ALTER TABLE ONLY private.billing_purchase_claims
    ADD CONSTRAINT billing_purchase_claims_pkey PRIMARY KEY (billing_source, ownership_key);


--
-- Name: billing_purchase_states billing_purchase_states_pkey; Type: CONSTRAINT; Schema: private; Owner: -
--

ALTER TABLE ONLY private.billing_purchase_states
    ADD CONSTRAINT billing_purchase_states_pkey PRIMARY KEY (billing_source, ownership_key);


--
-- Name: billing_sandbox_reviewers billing_sandbox_reviewers_pkey; Type: CONSTRAINT; Schema: private; Owner: -
--

ALTER TABLE ONLY private.billing_sandbox_reviewers
    ADD CONSTRAINT billing_sandbox_reviewers_pkey PRIMARY KEY (user_id);


--
-- Name: billing_purchase_claims_owner_idx; Type: INDEX; Schema: private; Owner: -
--

CREATE INDEX billing_purchase_claims_owner_idx ON private.billing_purchase_claims USING btree (owner_user_id) WHERE (owner_user_id IS NOT NULL);


--
-- Name: billing_purchase_claims_transaction_id_idx; Type: INDEX; Schema: private; Owner: -
--

CREATE UNIQUE INDEX billing_purchase_claims_transaction_id_idx ON private.billing_purchase_claims USING btree (billing_source, external_transaction_id) WHERE (external_transaction_id IS NOT NULL);


--
-- Name: billing_purchase_states billing_purchase_states_forward_only; Type: TRIGGER; Schema: private; Owner: -
--



--
-- Name: billing_purchase_claims trg_billing_cancello_sandbox; Type: TRIGGER; Schema: private; Owner: -
--



--
-- Name: billing_sandbox_reviewers trg_billing_permesso_sandbox_cambiato; Type: TRIGGER; Schema: private; Owner: -
--



--
-- Name: billing_purchase_claims trg_billing_purchase_claims_immutable; Type: TRIGGER; Schema: private; Owner: -
--



--
-- Name: billing_purchase_claims trg_billing_purchase_claims_no_truncate; Type: TRIGGER; Schema: private; Owner: -
--



--
-- Name: billing_purchase_claims billing_purchase_claims_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: private; Owner: -
--

ALTER TABLE ONLY private.billing_purchase_claims
    ADD CONSTRAINT billing_purchase_claims_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: billing_purchase_states billing_purchase_states_claim_fkey; Type: FK CONSTRAINT; Schema: private; Owner: -
--

ALTER TABLE ONLY private.billing_purchase_states
    ADD CONSTRAINT billing_purchase_states_claim_fkey FOREIGN KEY (billing_source, ownership_key) REFERENCES private.billing_purchase_claims(billing_source, ownership_key) ON DELETE RESTRICT;


--
-- Name: billing_sandbox_reviewers billing_sandbox_reviewers_user_id_fkey; Type: FK CONSTRAINT; Schema: private; Owner: -
--

ALTER TABLE ONLY private.billing_sandbox_reviewers
    ADD CONSTRAINT billing_sandbox_reviewers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: billing_purchase_claims; Type: ROW SECURITY; Schema: private; Owner: -
--

ALTER TABLE private.billing_purchase_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: billing_purchase_states; Type: ROW SECURITY; Schema: private; Owner: -
--

ALTER TABLE private.billing_purchase_states ENABLE ROW LEVEL SECURITY;

--

-- ── Il seme della modalita' guardia ─────────────────────────────────────────
-- `compatibility` e' lo stato iniziale, e copre la finestra fra questa
-- migration e il deploy della route che passa dal registro. Il passaggio a
-- `strict` e' un'operazione separata, dopo il deploy, con GO esplicito: non si
-- dichiara, si verifica (vedi `set_billing_projection_guard_mode` in F3, che
-- si RIFIUTA di passare a strict se esistono righe che la guardia boccerebbe).
insert into private.billing_projection_guard_mode (singleton, mode, note)
values (true, 'compatibility',
        'Stato iniziale. Copre la finestra fra questa migration e il deploy della route che passa dal registro.')
on conflict (singleton) do nothing;

-- ── Nessuno tranne il proprietario del database ─────────────────────────────
-- Lo schema `private` non concede USAGE ad anon/authenticated (verificato in
-- produzione: `postgres=UC/postgres` e nient'altro), quindi questi revoke sono
-- ridondanti per costruzione. Restano perche' una difesa che dipende da un
-- solo strato non e' una difesa: se un domani qualcuno concedesse USAGE sullo
-- schema, questi revoke sarebbero l'unica cosa in piedi.
revoke all on table private.billing_purchase_claims       from public, anon, authenticated, service_role;
revoke all on table private.billing_purchase_states       from public, anon, authenticated, service_role;
revoke all on table private.billing_pending_revocations   from public, anon, authenticated, service_role;
revoke all on table private.billing_projection_guard_mode from public, anon, authenticated, service_role;
revoke all on table private.billing_sandbox_reviewers     from public, anon, authenticated;

-- ── Postcondizione ──────────────────────────────────────────────────────────
-- Una migration che crea cinque tabelle e non verifica di averle create e' una
-- dichiarazione, non una migration.
do $$
declare
  v_tabelle int;
  v_rls int;
  v_modo text;
begin
  select count(*) into v_tabelle
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'private' and c.relkind = 'r'
    and c.relname in ('billing_purchase_claims','billing_purchase_states',
                      'billing_pending_revocations','billing_projection_guard_mode',
                      'billing_sandbox_reviewers');
  if v_tabelle <> 5 then
    raise exception 'F1: attese 5 tabelle, trovate %', v_tabelle;
  end if;

  select count(*) into v_rls
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'private' and c.relrowsecurity
    and c.relname in ('billing_purchase_claims','billing_purchase_states');
  if v_rls <> 2 then
    raise exception 'F1: RLS attesa su claims e states, attiva su % tabelle', v_rls;
  end if;

  select mode into v_modo from private.billing_projection_guard_mode where singleton;
  if v_modo is distinct from 'compatibility' then
    raise exception 'F1: la guardia deve nascere in compatibility, non in %', coalesce(v_modo, '<nessuna riga>');
  end if;

  raise notice 'F1: 5 tabelle, RLS su 2, guardia in compatibility.';
end $$;
