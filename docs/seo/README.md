# docs/seo/ — index

Questo indice esiste per rendere inequivocabile quale file è la fonte di
verità per cosa. `docs/seo/` contiene più documenti con scopi diversi —
nessuno duplica l'altro.

| File | Cosa contiene | Cadenza di aggiornamento |
|---|---|---|
| [seo-geo-master-plan.md](./seo-geo-master-plan.md) | **Canonico per la strategia**: missione, principi permanenti, roadmap P0-P3, gate YMYL/GDPR, measurement framework, decision log. | Raro — solo quando cambia la strategia, non ad ogni sprint. |
| [growth-editorial-install-funnel-plan-2026-07-23.md](./growth-editorial-install-funnel-plan-2026-07-23.md) | Piano operativo derivato dal GSC 2026-07-23: scenari di crescita a 3/6/12 mesi, mix editoriale, sequenza sprint, funnel sito → store → prima sincronizzazione e KPI. Subordinato al master plan. | Mensile o quando arriva un nuovo export GSC significativo. |
| [seo-results-log.md](./seo-results-log.md) | **Canonico per i dati misurati**: iniziativa → stato (rilevato/corretto localmente/in preview/deployato/validato/misurato) → risultati 14/28/90gg. | Ad ogni sprint SEO e ad ogni controllo periodico. |
| [piano-editoriale-2026.md](./piano-editoriale-2026.md) | Piano editoriale/contenuti (pillar, cluster, inventario articoli, lingue) — **subordinato** al master plan, non lo sostituisce. | Quando cambia il calendario contenuti. |
| [capability-promotion-checklist.md](./capability-promotion-checklist.md) | Gate per promuovere una capability prodotto da "in development" a "live" nel copy pubblico. Referenziato dal guardrail (`tools/check-llms-consistency.ts`). | Quando una capability cambia stato. |
| [SEO-OPS-README.md](./SEO-OPS-README.md) | Runbook tecnico/infra: agenti automatici, cron, IndexNow, env vars. Non è strategia, è documentazione operativa. | Quando cambia l'infrastruttura degli agenti SEO. |
| [daily/](./daily/) | Report giornalieri generati dagli agenti automatici (`SEOWatchAgent`). Ephemeral, non è una fonte di verità permanente. | Automatico, giornaliero. |

## Se stai cercando...

- **"Qual è la strategia SEO/GEO complessiva?"** → `seo-geo-master-plan.md`
- **"Quale crescita prevediamo e come convertiamo il traffico in installazioni?"** → `growth-editorial-install-funnel-plan-2026-07-23.md`
- **"Cosa abbiamo misurato/deployato finora?"** → `seo-results-log.md`
- **"Quale articolo scrivo dopo?"** → `piano-editoriale-2026.md`
- **"Posso dire che la feature X è live sul sito?"** → `capability-promotion-checklist.md`
- **"Come funziona l'agente SEO automatico?"** → `SEO-OPS-README.md`
