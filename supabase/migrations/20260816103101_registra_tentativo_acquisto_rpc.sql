-- La tabella sta in `private`, che non e' esposto all'API: si passa da qui.
-- L'utente arriva come parametro e non da auth.uid() perche' il chiamante e'
-- il backend con la service role, che non ha una sessione utente.
--
-- Concessa SOLO a service_role: nessun client puo' invocarla, quindi nessuno
-- puo' scrivere tentativi a nome di altri.
create or replace function public.registra_tentativo_acquisto(
  p_user_id uuid,
  p_piattaforma text,
  p_product_id text
) returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  insert into private.billing_tentativi_acquisto
    (user_id, piattaforma, external_product_id)
  values (p_user_id, p_piattaforma, p_product_id);
exception when others then
  -- La traccia non deve MAI essere il motivo per cui un pagamento fallisce.
  -- Se non si riesce a scriverla si prosegue: meglio un pagamento servito
  -- senza traccia che un pagamento rifiutato per un difetto della traccia.
  raise warning 'registra_tentativo_acquisto fallita: %', sqlstate;
end;
$$;

comment on function public.registra_tentativo_acquisto(uuid, text, text) is
  'Scrive la traccia di un tentativo di acquisto in '
  'private.billing_tentativi_acquisto. Chiamata dal backend PRIMA della '
  'validazione dello store. Non solleva mai: un difetto della traccia non deve '
  'far fallire un pagamento. Solo service_role.';

revoke all on function public.registra_tentativo_acquisto(uuid, text, text) from public, authenticated, anon;
grant execute on function public.registra_tentativo_acquisto(uuid, text, text) to service_role;
