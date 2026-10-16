-- ============================================================================
-- ROLLBACK COMPENSATIVO di 20260924120000_web_dashboard_access_verdict.sql
-- (verdetto di accesso alla dashboard web)
--
-- NON applicare in produzione senza un GO nominale. Va eseguito a mano, mai dalla
-- catena attiva:    psql -v ON_ERROR_STOP=1 -f <questo file>
--
-- COSA RIMUOVE
--   public.get_web_dashboard_access()   e   private.web_dashboard_verdict(uuid)
--   (la migration non crea altro: provato sul banco con l'impronta completa del catalogo).
--
-- COME E' SCRITTO: UN SOLO BLOCCO DO, senza BEGIN/COMMIT/ROLLBACK nudi.
--   Un blocco DO e' un'unica istruzione: e' atomico sia in autocommit sia dentro una
--   transazione esterna (psql --single-transaction, un runner che apre la transazione):
--   o toglie entrambe le funzioni o non ne tocca nessuna. La versione provata il
--   15/10 (b4a) aveva `begin; ... commit;` nel file: dentro una transazione esterna il
--   suo `commit` confermava la transazione del chiamante e un `rollback` esterno non
--   poteva piu' annullare niente («non annidabile»). Qui non succede (gate 24).
--   Lo stesso criterio delle altre voci del manifesto e del gate 21.
--
-- PRECONDIZIONI (da verificare PRIMA, non dal rollback)
--   P-1  Al momento di applicare la migration le due funzioni NON devono esistere gia'.
--        La migration usa `create or replace`: se esistevano con un altro corpo le
--        SOSTITUISCE, e questo rollback, al ritorno, non puo' ripristinare l'originale
--        (non e' salvato da nessuna parte): droppa quelle della migration. Questo e' il
--        solo caso di perdita non rilevabile qui, e per questo la precondizione si
--        controlla prima con
--          supabase/rollback/20260924120000_web_dashboard_access_verdict_precondizioni.sql
--        (sola lettura; esito PASSA o eccezione). Se le funzioni esistono, salvare
--        l'originale con  select pg_get_functiondef('<schema>.<nome>(<args>)'::regprocedure);
--   P-2  Le dipendenze del corpo (tabelle, colonne, funzioni, ruoli) devono esistere:
--        la funzione e' plpgsql e un oggetto mancante esplode solo a runtime.
--        Controllate dallo stesso script.
--   P-3  Chi esegue deve essere il proprietario delle due funzioni (altrimenti DROP
--        fallisce con «must be owner» e non cambia niente).
--
-- COSA GARANTISCE (provato sul banco: gate 18 in due modalita', gate 24)
--   - 0 funzioni: non fa niente e non da errore (idempotente, avviso).
--   - stato parziale (1 funzione, o piu' di 2 omonime): RIFIUTA.
--   - corpo diverso da quello della migration (omonima preesistente o modificata a
--     mano dopo l'apply): RIFIUTA, non cancella alla cieca. Il confronto e' l'md5 di
--     prosrc misurato sul file applicato a PG17:
--       private.web_dashboard_verdict   cd85f5bf937bc069571b1738e5a55d90
--       public.get_web_dashboard_access 414fa2d0e1949db74672d6e4d688c1ff
--     Se la migration cambia, questi due valori vanno rimisurati (il gate 24 lo pretende).
--   - nessun CASCADE: se un oggetto dipende dalle funzioni il DROP fallisce e non cambia niente.
--   - lock_timeout 5s sul DDL: se una sessione tiene un lock sulle funzioni il rollback
--     fallisce invece di mettersi in coda e bloccare chi chiama.
--
-- COSA NON GARANTISCE (dichiarato)
--   - L'originale in caso di P-1 violata (vedi sopra).
--   - Non tocca il registro delle migration (supabase_migrations.schema_migrations):
--     e' una scrittura separata, con il suo GO. Una riga di versione lasciata dopo il
--     rollback significa «applicata» con le funzioni assenti: scegliere la versione del
--     file evita il drift «stesso nome, versione diversa».
--   - Le funzioni gia' eseguite non lasciano tracce da annullare: il verdetto e' di sola lettura.
-- ============================================================================
do $rollback$
declare
  c_md5_pub  constant text := '414fa2d0e1949db74672d6e4d688c1ff';  -- public.get_web_dashboard_access()
  c_md5_priv constant text := 'cd85f5bf937bc069571b1738e5a55d90';  -- private.web_dashboard_verdict(uuid)
  v_n    int;
  v_pub  text;
  v_priv text;
begin
  -- Vale per questa sola istruzione (is_local = true): in autocommit si azzera da sola.
  perform pg_catalog.set_config('lock_timeout', '5s', true);

  select count(*) into v_n
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where (n.nspname, p.proname) in (('public', 'get_web_dashboard_access'), ('private', 'web_dashboard_verdict'));

  if v_n = 0 then
    raise notice 'ROLLBACK: nessuna delle due funzioni esiste, niente da fare (idempotente)';
    return;
  end if;
  if v_n <> 2 then
    raise exception 'ROLLBACK RIFIUTATO: attese 0 o 2 funzioni, trovate %.', v_n;
  end if;

  select pg_catalog.md5(p.prosrc) into v_pub
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'get_web_dashboard_access' and p.pronargs = 0;
  select pg_catalog.md5(p.prosrc) into v_priv
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private' and p.proname = 'web_dashboard_verdict' and p.pronargs = 1;

  if v_pub is distinct from c_md5_pub or v_priv is distinct from c_md5_priv then
    raise exception 'ROLLBACK RIFIUTATO: il corpo delle funzioni non e'' quello di 20260924120000 (omonima preesistente o modificata): non si cancella alla cieca (pub=%, priv=%).', v_pub, v_priv;
  end if;

  -- Ordine: prima la pubblica (chiama la privata), poi la privata. Niente CASCADE.
  drop function public.get_web_dashboard_access();
  drop function private.web_dashboard_verdict(uuid);

  if exists (
    select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where (n.nspname, p.proname) in (('public', 'get_web_dashboard_access'), ('private', 'web_dashboard_verdict'))
  ) then
    raise exception 'ROLLBACK INCOMPLETO: una delle due funzioni esiste ancora.';
  end if;
end
$rollback$;
