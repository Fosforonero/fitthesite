-- ── MIGRATION STORICA SANITIZZATA — NON REPLICA IL CORPO REMOTO ────────────
--
-- Questo file NON esegue niente. Esiste per occupare la versione
-- `20260525080147`, che in produzione risulta applicata, senza portare in git
-- il suo contenuto.
--
-- PERCHE': gli statement remoti contengono **tre occorrenze di un indirizzo
-- email personale in chiaro**, cablato dentro la definizione di
-- `public.is_admin()` e ripetuto nel commento della funzione. Portarli qui
-- significherebbe spostare un dato personale da un database ad accesso
-- controllato a una cronologia che vive su molte copie e non si ripulisce.
--
-- IMPRONTA DEL CORPO REMOTO, per poterlo riconoscere senza averlo:
--
--     statements[1]            802 byte
--     md5(statements[1])       b30bb99d37c5070973a4c2d6608d8075
--     md5 normalizzato         9fe99290ec4a1a0db350d745fb6b77b2  (508 caratteri)
--
-- La normalizzazione e' quella usata da tutta la riconciliazione: via le righe
-- di solo commento, via gli a capo iniziali e finali.
--
-- COSA FACEVA: un solo oggetto, `create or replace function public.is_admin()`.
-- Restituiva vero solo se l'utente della sessione era **quell'indirizzo** e
-- aveva anche `role = 'admin'`. La lista bianca per indirizzo era pensata come
-- difesa in profondita' contro un inserimento abusivo in `user_roles`.
--
-- COSA LA SOSTITUISCE: la migration forward-only che ridefinisce
-- `public.is_admin()` sulla sola autorita' di `public.user_roles`
-- (`role = 'admin'` e scadenza nulla o futura), senza nessun indirizzo nel
-- sorgente. Da quel punto in poi lo schema torna equivalente al live.
--
-- CONSEGUENZA DICHIARATA: fra questa versione e la forward-only, una
-- ricostruzione da zero **non e' equivalente al live**, ed e' voluto. E' il
-- solo caso ammesso. Il cancello e' l'equivalenza strutturale **finale**.
--
-- Classificazione nel manifesto: `sanitized_historical`. Non `exact`.

do $$ begin
  raise notice 'migration storica sanitizzata: nessuna operazione, vedi intestazione';
end $$;
