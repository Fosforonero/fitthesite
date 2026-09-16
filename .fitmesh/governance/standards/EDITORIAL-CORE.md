# Editorial core

## Scope

This document is the shared nucleus of the FitMesh writing standards. Every
other standard in this repository builds on it and cites it by rule number.

It binds both consumer repositories:

- **app**: the Flutter application under `AppFitmesh/`, including the ARB
  localisation files under `flutter_app/lib/l10n/`;
- **site**: `fitthesite`, the Next.js marketing site plus API on `fitmesh.fit`,
  in 11 locales (it, en, es, de, pt, fr, pl, tr, nl, ja, ko).

It binds every agent runtime that creates, translates, reviews or edits text in
those repositories, and it binds human authors working in them.

The principles are grouped below by how far they reach. The grouping is this
document's own structuring, not a rule carried over from an existing source, and
where a principle states its own reach, that reach wins. Principles 6 to 13
govern user-facing copy: site pages, articles, landing pages, FAQ, store
listings, in app copy, notifications, and email. Rule 8 additionally binds the
governance sources in this repository, as that rule sets out. Principles 1 to 5,
14 and 15 govern every text this repository covers, including internal notes,
log lines and diagnostic output.

Rule numbers are stable. A rule that is withdrawn keeps its number and is
marked withdrawn in place. New rules take new numbers. Never renumber, because
checklists, review workflows and adapter files cite these numbers.

The BAD, GOOD and Why blocks below follow one convention. Where the only correct
fix is removing the text, the GOOD slot says to delete it instead of showing a
replacement line. Where printing the example would itself break a rule, as in
rule 14, the block describes the line instead of printing it.

## Non-negotiable principles

**1. Truth before tone.**
When a sentence cannot be both accurate and elegant, it stays accurate. Rhythm,
symmetry and a satisfying close are never reasons to change what a sentence
asserts. If the accurate version reads badly, rewrite the structure, not the
claim.

**2. Do not invent facts, evidence, sources, tests or availability.**
No invented product behaviour, metric, benchmark, test result, citation,
quotation, date, price, device, or statement of what is available. If a needed
fact is missing, ask for it or leave the gap visible in the draft. An unmarked
guess is worse than an obvious hole, because nobody downstream can see it.

**3. Do not change the certainty, the limits or the meaning of a claim while
rewriting it.**
Rewriting, shortening, translating and SEO work all carry the same duty: the
output asserts exactly what the input asserted, no more and no less. Hedges,
conditions, scope limits ("in this case", "for these devices", "when the
connection allows it") are part of the claim, not padding to be trimmed.

```
BAD:  Feature X always works offline.
GOOD: Feature X can work offline in the cases described above.
Why:  "Always" adds a guarantee the source never made (illustrative example).
```

**4. No future dates, ETAs or unverified promises.**
Do not write that something will ship, is planned, is coming, or will be
available at a named time. Do not name a quarter, a month or a season for
unreleased work. Describe what is true now. If something does not exist yet for
the reader, the honest sentence is that it is not available.

```
BAD:  Feature X will be available in the next release.
GOOD: Feature X is not available today.
Why:  A date nobody has confirmed reads to the user as a promise.
```

**5. Historical dates, version numbers and confirmed availability are
allowed.**
Facts about the past and the present are welcome and usually improve the copy:
a release that happened, a version that exists, a change that is live. The test
is verifiability: the date, number or availability must be checkable in the
repository or in an already published record before it is written.

**6. No reference to the internal tools used to write.**
Public text never mentions the agents, models, prompts, assistants or
automatic generation involved in producing it, and never carries a "written
with AI" disclaimer or a decorative credit for the tooling. How a page was
produced is not part of the page.

```
BAD:  This article was drafted with an automatic writing assistant.
GOOD: (delete the line)
Why:  The credit tells the reader nothing and is not the subject of the page.
```

**7. AI may be named when it genuinely is the subject.**
Naming AI is correct and expected when AI is the subject of the page, a
documented product feature, a documented technology being described, or a legal
or transparency requirement. Rule 6 bans the tooling credit, not the topic.
When AI is the topic, apply rules 2 and 3 to it like any other subject.

**8. No em dashes in FitMesh-authored copy.**
The em dash used as punctuation or as a separator in prose is banned in public
text: site, articles, landing pages, FAQ, store listings, in app copy,
notifications, and email. Use a period, a comma, a colon, or parentheses. The
rule applies when writing new text and equally during SEO and GEO work on
existing text. This restates the standing rule dated 13/06/2026 recorded in
`AppFitmesh/CLAUDE.md`.

```
BAD:  The screen shows the last sync (em dash here) the time and the source.
GOOD: The screen shows the last sync: the time and the source.
Why:  A colon carries the same break and keeps the copy inside rule 8.
```

Rule 8 also binds the governance sources in this repository, not only published
copy. No file under `standards/`, `workflows/` or `adapters/` may contain the
character at all, not even under the exceptions in rule 9, and the check script
in `scripts/` scans those directories and fails on any occurrence. That is why
the BAD line above names the character in words rather than printing it. Quote a
source that contains one by naming the character in words.

**9. Exceptions to rule 8.**
The character may appear only in these cases, and the list is exhaustive:

1. verbatim quotations, where altering the source would misquote it;
2. official titles;
3. document names;
4. code;
5. dependency names;
6. third party material that cannot be altered;
7. the pre-existing placeholder recorded in the codebase: the lone em dash used
   as a "no data available" placeholder in data tables.

Exception 7 is mandatory and predates this standard. A rule or a check that
removed the table placeholder would contradict shipped code, so no addendum,
review workflow or automated fix may touch it.

Existing enforcement: the site already runs a family of factual guardrail
scripts under `tools/check-*.ts` as npm scripts. One of them,
`tools/check-labs-no-em-dash.ts` (npm script `labs:no-em-dash-check`), enforces
the ban across 16 files of the Labs cluster, scanning content lines only and
skipping comment lines. That script covers those files, not the whole of either
repository, so rule 8 still needs human and review attention everywhere else.

**10. No hollow promotional language.**
Four things to remove on sight.

*Promotional register.* revolutionary, game changing, cutting edge, best in
class, transformative, supercharge, seamless, effortless, robust, unlock,
empower, leverage, foster, streamline, delve, elevate, harness. Treat this as a
register to recognise, not a blocklist to route around with synonyms.

*Unproven absolutes.* always, never, everyone, everything, instantly,
guaranteed, zero effort, perfectly accurate. Each is a claim under rules 2 and
3, and each needs evidence or deletion.

*Generic openings.* "In today's world", "When it comes to", "It is worth
noting that", "In this article we will look at". Delete the opener and start
with the first real sentence.

*Conclusions that restate the text.* "In conclusion", "Ultimately", "Overall",
or a closing paragraph that summarises what the reader has just read. End on
the last concrete point or on what the reader can do next.

**11. Use concrete detail, explicit limits, natural sentences.**
Prefer what the reader can check: what is on the screen, what happens after a
tap, what the app does and does not do. State limits openly. Write sentences a
person would say out loud, with ordinary verbs, and vary their length.

```
BAD:  The screen is designed to be intuitive.
GOOD: The screen lists one row per day, most recent first.
Why:  The reader can verify the second sentence and cannot verify the first
      (illustrative example).
```

**12. Official sources and useful citations must not be removed.**
When copy already carries a link or a reference to an official source, a
standard, a regulation, an institutional document or a manufacturer's own
documentation, keep it. Editing passes, length cuts, SEO rewrites and
translations all preserve it. If a citation looks wrong, raise it; do not
silently drop it.

**13. Ban only these four citation abuses.**
Decorative credits; disclaimers about AI usage; dumps of sources that support
no claim in the text; invented attributions. Everything else stays under rule
12.

```
BAD:  Studies show that this approach is better.
GOOD: (delete the sentence, unless a named source and its figure can be cited)
Why:  "Studies show" is an attribution to nobody, which rule 2 already forbids.
```

**14. No personal data, health data, tokens, identifiers or sensitive
information in diagnostic text or logs.**
This covers log lines, error messages, crash reports, test fixtures, sample
payloads in documentation, screenshots used in docs, and anything pasted into
an issue. Applies to real and to realistic looking values alike. Diagnostics
need a code, a category and a count, not a person.

```
BAD:  A log line that prints the account address and the day's health values.
GOOD: A log line that prints the error code and the number of records involved.
Why:  The second is enough to diagnose the failure and carries nothing personal.
```

**15. No text may present itself as written or verified by a named person when
that is not true.**
No byline, signature, "reviewed by", credential or expert endorsement naming
someone who did not write or review the text and did not agree to appear. This
holds for real people and for invented ones. The remedy is no byline, not a
safer sounding one.

## Tone of voice

This section carries forward the standing rule dated 12/06/2026 recorded in
`AppFitmesh/CLAUDE.md`. It is a constraint on published copy, not a suggestion.

- Direct and effective, never offensive.
- Technical, clear, confident, dry. Sell with facts about what the app does.
- **Never denigrate other products or apps.** This includes the companion apps
  that ship with the devices FitMesh supports, and ones with poor reviews. The
  register "rubbish", "useless", "poor" is banned. Scornful comparison is
  banned as a sales technique.
- Instead of denigrating, state FitMesh's value factually. If something is
  better, show what it does; do not rate what someone else does.
- When describing a user's pain, describe it neutrally, without judging another
  product. The problem the user has is the subject; the other product is not.
- **No overly technical explanation in any user-facing text.** This applies to
  the site, articles, landing pages, store listings, in app copy, notifications
  and email. Explain the features and how to use them: what you see, where you
  tap, what happens next. Engineering jargon, internal architecture and API
  names do not belong in public text. Technical detail lives in internal docs.
  The target reader is a curious user, not a developer.

## Competitors

This section carries forward the standing rule dated 26/05/2026 recorded in
`AppFitmesh/CLAUDE.md`.

Study competitors internally. Never publish that study.

- Direct competitor brand names are banned from code comments, documentation,
  site copy, manuals, blog posts and README files, in both repositories,
  including the private one.
- Do not use a competitor name as an SEO keyword.
- Do not write comparison pages against a named competitor.
- When the sector has to be described, use generic terms.

This document follows its own rule: no competitor is named anywhere in it, not
even as an example.

## Adapted anti-slop guidance

This section is adapted from an MIT-licensed upstream skill by Peter Yang
(`no-ai-slop`). The licence text and the pinned commit are recorded in
`THIRD_PARTY_NOTICES.md`. Only the patterns that serve FitMesh editorial
quality are carried over, rewritten for this context.

The goal is quality. Nothing here is about making text look as if a particular
tool did or did not touch it. Every pattern below is banned because it costs the
reader something: precision, time, or trust.

Known divergence: upstream treats the em dash as a style question and tolerates
one or two in a longer draft. FitMesh bans it outright, with the exceptions in
rule 9. **Where the two disagree, FitMesh wins.** That holds here and in every
future adaptation.

Patterns to cut, and what to do instead:

- **Throat-clearing openers.** "Here's the thing", "Let me be clear", "I'll be
  honest". Delete the opener and start with the claim.
- **Binary contrasts.** "It's not X, it's Y", "The question isn't X, it's Y".
  State Y as a plain sentence and drop X.
- **Faux-insight setups.** "What most people get wrong", "the part everyone
  misses". Cut the setup and let the claim stand alone.
- **Colon reveals.** A noun phrase, a colon, then a dramatic short reveal.
  Rewrite as one ordinary sentence; keep colons for lists, labels and quotes.
- **Importance puffery.** "plays a vital role", "marks a turning point",
  "underscores its significance". State the fact and let the reader judge it.
- **Weasel attribution.** "experts agree", "studies show", "many argue". Name
  the source or delete the claim, per rules 2 and 13.
- **Synonym cycling.** Rotating words for the same thing to avoid repetition.
  Repeat the correct word; in 11 locales, a rotating term becomes 11 different
  terms.
- **Summary-recap endings.** A final paragraph that restates the page. End on
  the last concrete point or on the next action.
- **Fake-profound closing lines.** The clever aphorism or metaphor that lands
  after the real content. Delete it, do not improve it.
- **Formatting slop.** Emoji in headings, bold scattered mid-sentence, bullet
  lists where two sentences of prose read better, headings over two-sentence
  sections. Format follows content; it does not decorate it.

**Portability test.** Take any sentence and ask whether it could be moved,
unchanged, into another company's page about another product in another
country. If it could, it says nothing about FitMesh and it is filler: delete it
or replace it with a fact, an example, a limit, a consequence or a concrete
piece of behaviour that only applies here. Run this test first in review.

## How this document is used

This is the nucleus. Two addenda specialise it, one per consumer surface, and a
consumer receives only its own:

- app surface: `standards/APP-WRITING.md`;
- site surface: `standards/SITE-WRITING.md`.

`standards/TRANSLATIONS.md` is not an addendum. It is a cross-cutting standard
that applies on either surface whenever a language boundary is crossed, and it
is read together with this document and with the addendum for the surface.

The review workflows under `workflows/` and the adapter files under `adapters/`
cite the principles above by number, for example "EDITORIAL-CORE 8" or
"EDITORIAL-CORE 3". That is why the numbering is frozen.

An addendum may tighten a rule, add a rule, or add examples and checks for its
own surface. **An addendum may never loosen a rule.** It may not widen an
exception, grant a local exemption, or reinterpret a principle into something
weaker. Where an addendum appears to conflict with this document, this document
wins and the addendum is the defect to fix.

The three short rules carried inline by every adapter are the compressed form
of principles 8, 6 with 7, and 4. They are a reminder, not a replacement: the
adapters also carry the standing order, which is the entry point to everything
above.

```
Before creating, translating or editing user-facing copy, read the applicable
documents under `.fitmesh/governance/standards/` completely.
```
