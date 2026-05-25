# Outreach Giornalisti / Blogger IT 2026

> Lista target + template email pronti all'uso per pitch FitMesh Sync.
> **Workflow**: 1) personalizza il template col nome del giornalista + un riferimento a un suo articolo recente (mostra che hai letto), 2) invii max 3-5 email/giorno (no blast), 3) follow-up dopo 7 giorni se zero reply, 4) tracking in foglio Excel (vedi sezione "Tracking" in fondo).

## Tono raccomandato
- **Sotto le 200 parole** (giornalista ha 2 minuti, no di più)
- **Personal hook iniziale** (un articolo loro che ti è piaciuto, max 1 frase)
- **Mai marketing speak** ("rivoluzionario", "innovativo", "game changer" = cestino)
- **Numeri concreti** (es. "17 founder beta attivi", "9 wearable supportati")
- **Asset linkati**, no allegati pesanti (`fitmesh.fit/it/press` è il media kit)
- **Firma** con nome reale + ruolo + recapito diretto

---

## TEMPLATE 1 — Pitch generico tech consumer (DDay, HDblog, TechPrincess, iSpazio)

```
Subject: Indie italiano: app Android che unifica Galaxy Watch + Mi Band + Fitbit in 1 dashboard

Ciao {NOME},

ho letto il tuo pezzo su {ARTICOLO RECENTE LORO} e ho pensato che il mio progetto potesse interessarti.

Sono Matteo Pizzi (studio Fosforonero, Roma). Ho appena rilasciato in beta privata **FitMesh Sync** — app Android che unifica i dati di salute di Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings e altri 9+ wearable in una dashboard premium. Privacy-first: server europei, GDPR, zero broker dati.

L'idea è nata perché in casa ho un Galaxy Watch, mia moglie una Mi Band e mia madre un Withings. Nessuno offre una vista unificata familiare. App esistenti come Health Sync sono solo bridge passa-dimentica; FitMesh è destinazione + dashboard + (a breve) caregiver per famiglie.

Numeri ad oggi:
- Beta privata da 14 giorni, 17 founder iscritti su 100 posti gratis a vita
- 9 brand wearable già supportati via Health Connect
- Sviluppata da solo (founder = unico dev)
- Lancio pubblico Q3 2026

Press kit completo (descrizioni copy-paste, asset, key facts):
https://fitmesh.fit/it/press

Se ti interessa posso prepararti una demo live in 15 min via call, oppure mandarti un account beta + APK.

Grazie del tempo,
Matteo Pizzi
Fosforonero — mat.pizzi@gmail.com
fitmesh.fit · play.google.com/.../com.fitmeshsync.app
```

---

## TEMPLATE 2 — Pitch health/caregiver angle (Wired, Repubblica salute, Corriere salute)

```
Subject: Caregiver tech italiano: monitorare i passi dei genitori anziani senza GPS

Ciao {NOME},

ho letto il tuo articolo su {ARTICOLO RECENTE su tema famiglia/salute/anziani} e ho pensato di scriverti.

Sto sviluppando un'app Android (FitMesh Sync, da Roma) che permette ai figli adulti di monitorare a distanza la salute dei genitori anziani — passi, sonno, frequenza cardiaca — usando il wearable che già hanno (Galaxy Watch, Mi Band, qualsiasi marca). Senza GPS, senza notifiche invasive, senza dover convincere il genitore a imparare un'app nuova: lui/lei indossa il watch e basta.

Il punto critico differenziatore vs Apple Family / Google Family Link: niente posizione, niente messaggi, solo metriche salute aggregate consensuali. Il caregiver vede se mamma ha smesso di camminare oppure se il battito a riposo cambia di colpo — non altro.

L'app è in beta privata (100 posti founder gratis a vita). Sviluppata da solo, server in UE, GDPR-compliant.

Sarei felice di mandarti screenshot del flow "famiglia" + un account demo. Se ti interessa il taglio "caregiver tech italiano indie", posso anche prepararti scenario reali (intervista con i miei primi 17 tester che usano l'app coi loro familiari).

Press kit: https://fitmesh.fit/it/press
Landing famiglia: https://fitmesh.fit/it/famiglia

Grazie,
Matteo Pizzi
Fosforonero — mat.pizzi@gmail.com
```

---

## TEMPLATE 3 — Indie / open source / tech deep (HackerNews-style, Github Italia, MyOpenSource)

```
Subject: How I built a 9-brand wearable aggregator in 6 months as a solo dev (Italy)

Hi {NOME},

solo dev from Italy here. I just released the private beta of **FitMesh Sync** — Android app that aggregates health data from Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei and Oura into one premium dashboard. All built solo over the past 6 months.

Tech stack:
- **App**: Flutter 3.11 + Riverpod + native Health Connect via package:health
- **Backend**: Supabase (Postgres + RLS + pg_cron, Frankfurt EU)
- **Marketing site**: Next.js 15 + Tailwind v4 on Vercel
- **CI/release**: GitHub + AAB upload manuale Play Console
- **Auth**: Supabase Auth + Google OAuth

Key technical design decisions:
1. **Read-only via Health Connect** (no per-brand OAuth nightmare) — covers 9+ brands out of the box because they all write to HC since 2024
2. **Multi-source HR priority picker**: when user has both Polar chest strap + Mi Band, we run a winner-takes-all priority algorithm per day, not naive aggregation (chest strap >> watch >> band >> phone)
3. **Privacy-first**: zero analytics on health data, server in EU, GDPR baked in from day 1
4. **No bridge mode**: unlike Health Sync (5M downloads), we are not a "pass and forget" router — we store + visualize + (soon) share within family

Currently 17 lifetime-free founders on board (100-seat beta).

If interested in a tech deep-dive blog post / interview about indie health app development in 2026, happy to write or be interviewed. Code is closed source but I'm transparent about architecture.

https://fitmesh.fit
https://fitmesh.fit/en/press

Matteo Pizzi
Fosforonero (Italy) — mat.pizzi@gmail.com
```

---

## LISTA GIORNALISTI / OUTLET TARGET (10)

### Tier 1 — Audience tech ampia (priorità ALTA)

| # | Outlet | Contatto | Ultimo articolo da menzionare (es) | Note |
|---|---|---|---|---|
| 1 | **DDay.it** | redazione@dday.it | Cerca pezzo su wearable o Galaxy Watch ultimi 30 giorni | Tech consumer mainstream, copre app spesso |
| 2 | **HDblog.it** | tramite form sezione "Contattaci" | Pezzo su Health Connect Android | Recensisce app Play Store, schema chiaro |
| 3 | **Andrea Galeazzi** (YouTube/web) | tramite IG DM o sito | Video recente su wearable | Recensisce app/tech con audience tech-affine |
| 4 | **iSpazio.net** | redazione@ispazio.net | Originally Apple, copre cross-platform | Comunità attiva, link tracciato |
| 5 | **TechPrincess.it** | redazione@techprincess.it | Pezzi tech consumer | Audience più ampia |

### Tier 2 — Salute / caregiver / lifestyle (per angle Mesh Famiglia)

| # | Outlet | Contatto | Note |
|---|---|---|---|
| 6 | **WiredItalia** | redazione@wired.it | Lungo shot ma pezzo possibile su angle "indie italiano + privacy" |
| 7 | **La Stampa Salute** | redazione.salute@lastampa.it | Sezione caregiver e tech famiglia |
| 8 | **Donna Moderna** | redazione@donnamoderna.it | Sezione "App utili per la famiglia", target 35-55 |
| 9 | **Buona Domenica / Salute&Benessere** (Rai/Mediaset) | tramite ufficio stampa Mediaset | TV: long shot ma potenziale virale |

### Tier 3 — Indie / open / community

| # | Outlet | Contatto | Note |
|---|---|---|---|
| 10 | **MyOpenSource.it** | hello@myopensource.it | Indie/OSS Italia, audience dev |

---

## TRACKING SUGGERITO (Google Sheets)

Crea sheet con colonne:
| Outlet | Contatto | Data invio | Template usato | Reply (S/N) | Pubblicato (URL) | Note |
|---|---|---|---|---|---|---|

**Soglia di engagement**: se dopo 30 giorni meno di 2 reply su 10 contatti → ripensa hook iniziale (forse il prodotto non risuona ancora).

---

## REGOLE DI BASE

1. **Mai blast** = max 3-5 email/giorno, ciascuna personalizzata
2. **Follow-up unico** dopo 7 giorni (mai più di 1)
3. **No allegati** = press kit pubblico è la regola 2026
4. **Risposta < 1h** se il giornalista risponde (tempo è tutto in newsroom)
5. **Onestà sui numeri** = se hai 17 founder, di' 17. NON 100, NON "centinaia"
6. **Demo offer** = quasi sempre converti review se offri demo live 15min con tua faccia
7. **Tracking tassativo** = dopo 30 giorni vedi cosa ha funzionato e cosa no

---

## TEMPLATE FOLLOW-UP (Day +7 se zero reply)

```
Subject: Re: {SUBJECT ORIGINALE}

Ciao {NOME},

so che hai casella piena. Ti riscrivo solo per chiederti se l'email di {DATA} è arrivata e se l'angle ti interessa.

Se preferisci, posso mandarti direttamente:
- 30s video demo dell'app
- Account beta gratis (anche per uso personale tuo)
- Press kit PDF (allego anche qui se vuoi)

Altrimenti, nessun problema: continuo a costruire e ti riscrivo in 3 mesi quando avremo numeri più grossi.

Grazie comunque del tempo,
Matteo
```

---

**TLDR**: 3 template diversi per 3 angle diversi, 10 giornalisti target, tracking in sheet, follow-up unico a +7gg, demo live offerta = la conversion arma migliore.
