-- Il progetto ha un default privilege che concede EXECUTE ad anon su ogni
-- nuova funzione in public: 'revoke all from public' non lo tocca perche'
-- e' un grant nominale ad anon, non al pseudo-ruolo PUBLIC. Trovato
-- verificando i grant reali dopo la migration precedente, non assunto.
-- anon non ha comunque una sessione autenticata quindi is_admin() sarebbe
-- comunque falso, ma il principio e' non fare affidamento sul controllo
-- interno quando si puo' negare gia' a livello di grant.
revoke execute on function public.get_dashboard_snapshot_admin(date) from anon;
