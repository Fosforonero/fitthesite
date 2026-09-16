# Site writing standard

## Scope

This document is an addendum to `standards/EDITORIAL-CORE.md`. It tightens the
core for the marketing site and its articles; it never loosens it. Where a rule
here is stricter, the rule here applies. Where this document is silent, the core
applies unchanged, and nothing here creates an exemption from it.

It binds anyone, human or agent, who writes, translates, edits or reviews public
text on the site `fitthesite` (the Next.js marketing site plus API, domain
`fitmesh.fit`, 11 locales: it, en, es, de, pt, fr, pl, tr, nl, ja, ko): pages,
articles, landing pages, FAQ entries, page metadata, and structured data. App
copy and store listings are governed by `standards/EDITORIAL-CORE.md` and
`standards/APP-WRITING.md`; anything that exists in more than one language is
also governed by `standards/TRANSLATIONS.md`.

Rules are numbered so a review can cite them. Numbering is stable: do not
renumber, add at the end. Core principles are cited by number, in the form
"EDITORIAL-CORE 8", because that numbering is frozen for exactly this purpose.

### Inherited from the core

These bind every page this document covers and are not restated as rules below.
They are listed so that nothing here can be read as an exemption.

- EDITORIAL-CORE 8: no em dash in public text.
- EDITORIAL-CORE 9: the exhaustive exceptions to it, unchanged (the lone
  placeholder character meaning "no data available" in data tables, verbatim
  quotations, official titles, document names, code, dependencies, and third
  party material that cannot be altered).
- EDITORIAL-CORE 4: no future date, no ETA, no unverified availability claim or
  promise.
- EDITORIAL-CORE 6 and 7: no reference to the internal tools used to write,
  while AI may be named when it genuinely is the subject.
- EDITORIAL-CORE 10 and 11: no hollow promotional language, no unproven
  absolute, concrete detail with its limits stated.
- The "Competitors" section of `standards/EDITORIAL-CORE.md`: no competitor
  brand name anywhere, not even as an example.
- The "Tone of voice" section of `standards/EDITORIAL-CORE.md`, including the
  ban on engineering jargon, internal architecture and API names in any user
  facing text.

## Rules

1. **Answer the search intent in the opening.** The first screen must answer the
   question the reader arrived with, in plain sentences, before any context,
   history or narrative. If the page cannot state that answer in two or three
   sentences, the page targets the wrong question.
   Rationale: a reader who has to scroll to reach the answer has been failed,
   and so has any engine quoting the page.

2. **Write for SEO, GEO and AEO (answer engine optimisation) without keyword
   stuffing.** Write once for the reader, then check that the words a person
   would actually type appear where they belong: title, H1, the answer
   sentence, and one subheading. Beyond that, repetition only makes the text
   worse. Optimise for extraction instead: a direct answer sentence, short
   paragraphs, headings that describe their section honestly, and one fact per
   sentence. A competitor brand name is never a keyword (the "Competitors"
   section of `standards/EDITORIAL-CORE.md`).
   Rationale: search engines and answer engines both reward a page that can be
   quoted correctly, and neither rewards density.

3. **Titles and descriptions must be specific, never interchangeable.** The
   title and the meta description of a page must become wrong if pasted onto a
   sibling page. Name the subject and the question, not the category.
   Rationale: an interchangeable title tells the reader and the index nothing
   about which page they are looking at.

4. **H1, body, metadata and JSON-LD must be semantically coherent.** The title
   promises what the H1 names, the H1 names what the body delivers, the meta
   description describes the body that exists rather than the body you wanted,
   and the structured data describes the same page. Change one, check the other
   three in the same change.
   Rationale: four surfaces disagreeing about what a page says is the signature
   of a page written for indexing rather than for reading.

5. **Derive JSON-LD from the same source as the visible content.** Structured
   data is generated from the same data that renders the page, never hand
   written alongside it. Never assert in JSON-LD a property the visible page
   does not support: no question and answer pairs absent from the body, no
   rating, author, review count, date, price or availability the reader cannot
   see. When the visible content loses a property, the structured data loses it
   in the same change.
   Rationale: structured data is a machine readable claim about the page, and a
   claim the page does not support is a false claim, not a formatting detail.

6. **Show official sources where the claim is.** A claim taken from an official
   document carries its source: an inline link next to the claim, or one compact
   "Sources" section at the end that the claim points to. Prefer the primary
   official document over commentary about it. One source per claim is enough;
   a list of links nobody used is not a source section.
   Rationale: a reader who cannot check the claim has to trust the page, and a
   claim nobody can check will eventually be wrong without anyone noticing.

7. **Label every assertion as one of five kinds.** Each sentence that reads as a
   statement about the world is exactly one of: verified fact, inference,
   condition, not verifiable, or planned feature. Apply the vocabulary and the
   decision ladder in "Labelling evidence" below. A planned feature is named as
   planned and carries no date, no availability claim and no promise.
   Rationale: an unlabelled sentence reads as a verified fact, so omitting the
   label is itself a claim.

8. **Never scale content to grow the number of URLs.** Do not create pages,
   locale variants or article series whose purpose is to increase how many URLs
   exist. A new page is justified when it answers a real question no existing
   page answers; otherwise extend the page that already owns the subject.
   Rationale: pages created for the count compete with each other, dilute the
   page that deserved the traffic, and make the site harder to keep true.

9. **No generic interchangeable paragraphs.** Cut any paragraph that would
   survive unchanged on an unrelated page: the importance of the topic, the
   modern landscape, what technology has changed. If a paragraph carries no fact
   the reader did not have, it is padding.
   Rationale: a paragraph that could sit unchanged on another company's page
   says nothing about this one, so it costs the reader time and returns nothing.

10. **No decorative introduction and no decorative conclusion.** Start at the
    answer and stop at the last useful sentence. No announcement of what the
    article will cover, no closing that repeats what was already said.
    Rationale: the opening is where the reader decides whether the page answers
    the question they arrived with, and a summary of a page they have just read
    carries no information they do not already have.

11. **State the limits explicitly.** Where a claim holds only in some
    situations, say what the page does not cover, in the same section as the
    claim, in the reader's language, not in a footnote or a final disclaimer.
    Rationale: a limit the reader discovers later reads as something the page
    tried to hide.

12. **No false editorial independence.** Never present first party material as
    independent testing, a neutral review, a third party verdict or an external
    editorial judgement. No invented byline, no fictional expert, no unnamed
    "independent" evaluation. When a page compares, recommends or evaluates, it
    is clear who is speaking.
    Rationale: presenting first party material as independent misleads the
    reader about who is speaking, and the page offers no source that could
    correct the impression, because there is none. Whether a given page also
    falls under advertising rules is a claim in its own right, decided in
    `workflows/CLAIM-REVIEW.md` under category E4, not asserted here.

13. **No invented testimonial, first hand experience or hardware test.** Do not
    write "we tested", "in our experience", "users report", a quotation, a
    rating or a measurement that did not happen and is not recorded somewhere it
    can be checked. If a test exists, cite where its result is recorded. If it
    does not exist, write the page without it.
    Rationale: invented experience is fabrication, and it collapses the moment
    one reader asks for the numbers.

14. **Do not delete useful citations in the name of avoiding machine sounding
    prose.** Anti slop editing targets filler, hollow superlatives, symmetrical
    list padding and decorative structure. It never targets links, figures,
    named sources, dates of publication of a cited document, or the qualifier
    that makes a sentence true. Removing evidence to sound more human makes the
    page less trustworthy, not more.
    Rationale: the point of the anti slop rules is to raise information density,
    and citations are information.

15. **Publish a translation only when it is genuinely localised.** A locale goes
    live when the text was adapted and reviewed: terminology, units, date and
    number formats, examples, and the question readers in that locale actually
    ask. Raw machine output nobody reviewed is not a localisation, and a locale
    variant created to multiply URLs is banned by rule 8. This applies
    `standards/TRANSLATIONS.md` rules 5 and 6 to site pages: an unreviewed
    locale stays unpublished, and what the reader gets instead is fixed by rule
    16.
    Rationale: a page in a language the reader half recognises damages trust in
    every other page in that language.

16. **A page with no reviewed translation resolves to a declared English
    fallback, never to a silent one.** This is the site level application of
    `standards/TRANSLATIONS.md` rule 5, and it does not widen it. That rule
    governs the missing string inside an item: the string fails loudly and the
    item stays unpublished in that locale until the string exists. This rule
    governs the other case, a whole page for which no reviewed translation
    exists: the locale URL resolves to the English text under a visible notice,
    in the reader's language, saying the page is not available in that language
    and is shown in English. The notice sits above the content, not in the
    footer. A declared fallback is a declaration, not permission to ship half a
    translation: never leave the reader on an empty page, on a partially
    translated page passed off as complete, or on a missing URL. Cross locale
    links must resolve to a page that exists.
    Rationale: the notice tells the reader what they are looking at and why,
    while an undeclared fallback hides the gap from everyone except the reader,
    which is the failure `standards/TRANSLATIONS.md` rule 5 names.

17. **No privacy, legal or compliance claim without an approved fact ledger
    entry.** Sentences about what data is collected, where it is stored, who can
    access it, what is deleted and when, and about which regulation, certificate
    or store policy the product satisfies, are publishable only when the exact
    statement has been through `workflows/CLAIM-REVIEW.md` and appears in that
    workflow's ledger, in the entry shape it defines: an evidence category, a
    location a reader can open, an outcome of supported or downgraded, and the
    named approver its step 5 requires for every privacy, legal and compliance
    claim. A wording approved in one form is not approved in another, and one
    approved for one surface or locale is not approved for every surface or
    locale. If no entry exists, the sentence is not published, not even
    softened, hedged, or moved into a heading or an image caption.
    Rationale: the published page is the record of what was claimed, and this
    rule is what keeps every such sentence traceable to an entry someone
    approved.

## Labelling evidence

Rule 7 requires one of five labels. This section fixes the vocabulary so that
two different authors label the same sentence the same way.

### These labels and the evidence categories are two different axes

The five labels here and the four evidence categories E1 to E4 in
`workflows/CLAIM-REVIEW.md` do not compete, and both apply to the same sentence.
A label states what the reader is told about the status of the sentence. A
category states what a reviewer read in order to allow it. The mapping is fixed,
so that neither document has to be read as contradicting the other:

- A **Verified fact** carries one of E1 to E4, and the source the page cites is
  the evidence that category names.
- A **Condition** is a verified fact with its scope made visible, so it carries
  the category of the underlying fact, narrowed to what the evidence covers.
- An **Inference** carries the category of the source it reasons from, and the
  reasoning is visible in the sentence rather than assumed.
- A **Planned feature** asserts only that the thing is not available today,
  which is a claim like any other and needs E1 or E3.
- **Not verifiable** is not an evidence category. A claim that fits none of E1
  to E4 is downgraded or removed in step 4 of `workflows/CLAIM-REVIEW.md`. The
  label belongs to the one sentence that survives that step: the sentence that
  states the absence of a source, instead of asserting the thing.

### Decision ladder

Apply in order and stop at the first match. The order is the tie breaker.

1. The thing described is not available to a reader today, then it is a
   **Planned feature**, whatever else is true of it. Availability is tested
   first on purpose: a thing that does not exist is never labelled Condition,
   because a Condition tells the reader it exists for somebody, which is the
   availability claim EDITORIAL-CORE 4 and rule 7 both forbid.
2. Otherwise, the statement holds only if the reader does something, has
   something, or is in a particular situation, then it is a **Condition**, even
   when the underlying fact is verified.
3. Otherwise, an official or first party document that the page can cite states
   it, then it is a **Verified fact**.
4. Otherwise, it follows by reasoning from a source the page cites, then it is
   an **Inference**.
5. Otherwise it is **Not verifiable**. Before using this label, check whether
   the sentence is merely unchecked: unchecked sentences get checked or cut.
   Label only what no available source can settle.

### Vocabulary

| Category | Canonical label | Allowed forms in prose | Never |
| --- | --- | --- | --- |
| Verified fact | no prefix needed in body; `Verified:` in a sources block | plain present tense, with the source linked: "Feature X does Y." | hedges that weaken a checked fact: "should", "normally", "in theory" |
| Inference | `Inference:` | "Based on <source>, it follows that ...", "Reading <source>, we expect ..." | "clearly", "obviously", "it is known that", stating it as fact |
| Condition | `Condition:` | "Only when ...", "This requires ...", "Applies if ..." | "simply", "just", burying the condition in a footnote or a caption |
| Not verifiable | `Not verifiable:` | "We have no source that confirms ...", "We could not verify ..." | "may", "might", "some say", silence that leaves it reading as fact |
| Planned feature | `Planned, not available:` | "Planned, not available: feature X." | "coming soon", "will ship", "in the next version", any date or quarter |

### Placement

- One label per sentence. Do not stack two labels; if a sentence needs two, it
  is two sentences.
- The label goes at the start of the sentence, or as the prefix of the block it
  governs when a whole block shares one label.
- A label is part of the sentence, so it is translated, not dropped: each locale
  uses one fixed equivalent per category, registered once in that locale's
  strings and reused everywhere, so the same sentence carries the same label in
  all 11 locales.
- A labelled sentence keeps its label in the summary, the metadata, the social
  preview and the structured data, or it is left out of them.

## Examples

The examples are illustrative and product neutral. "Feature X", "setting Y" and
"the document" are placeholders; they assert nothing about any product.

```
BAD:  Wearable technology has changed how people think about daily activity.
      In this article we will look at several aspects of feature X.
GOOD: To turn on feature X, open Settings, select feature X, and confirm.
      The rest of this page covers the cases where that does not work.
Why:  Rule 1 and rule 10: the answer comes first, the throat clearing never.
```

```
BAD:  Feature X guide: everything you need to know about feature X and how to
      use feature X in the feature X screen.
GOOD: Feature X: how to turn it on, and what it does when the device is offline.
Why:  Rule 2 and rule 3: repeating the phrase adds nothing, while a specific
      promise tells reader and index which page this is.
```

```
BAD:  H1 says "How to turn on feature X", the body explains setting Y, and the
      meta description promises a comparison of three approaches.
GOOD: H1, body and meta description all describe turning on feature X, and the
      comparison lives on its own page if it is worth writing.
Why:  Rule 4: four surfaces must describe the same page, or none of them is
      trustworthy.
```

```
BAD:  The page shows no reviews, and the JSON-LD carries an aggregateRating
      with a value and a review count.
GOOD: The page shows no reviews, and the JSON-LD carries no rating property.
Why:  Rule 5: structured data is a claim about the page, and a rating the page
      does not show is a false claim.
```

```
BAD:  The visible FAQ lists three questions; the FAQPage block lists twelve,
      written by hand for the index.
GOOD: The FAQPage block is generated from the same list that renders the three
      visible questions.
Why:  Rule 5: one source for visible content and structured data means they
      cannot drift apart.
```

```
BAD:  Feature X works on every device.
GOOD: Condition: feature X works on devices that let the app read this data.
      Devices that do not are listed below.
Why:  Rule 7 and the ladder: a statement that depends on the reader's situation
      is a Condition, however well verified the underlying fact is, and the
      condition is stated in the reader's terms, not in the developer's.
```

```
BAD:  Many users say setting Y improves their results.
GOOD: Not verifiable: we have no published source for how often setting Y
      changes the result.
Why:  Rule 7 and rule 13: an unlabelled claim reads as verified, and invented
      user reports are fabrication.
```

```
BAD:  Feature X is coming soon and will be available in the next version.
GOOD: Planned, not available: feature X.
Why:  Rule 7 and EDITORIAL-CORE 4: a plan may be named, a date or an
      availability promise may not.
```

```
BAD:  A reader in a locale with no reviewed translation sees the English body
      under a translated title, with no explanation.
GOOD: The same reader sees the English body under a notice, in their own
      language, saying the page is not available in that language and is
      shown in English.
Why:  Rule 16: a declared fallback is usable, an undeclared one looks broken.
```

```
BAD:  The language switcher points at a locale URL that does not exist, and the
      reader lands on a 404.
GOOD: The switcher points at the English page, which carries the fallback
      notice.
Why:  Rule 16: a missing translation is a fallback, never a dead end.
```

```
BAD:  Your data is fully encrypted, stored safely, and we comply with every
      applicable regulation.
GOOD: See the privacy policy for what is collected and how it is handled.
Why:  Rule 17: privacy and compliance sentences are publishable only as an
      approved ledger entry, and a vague version of an unapproved claim is
      still the claim.
```

```
BAD:  An editor removes the link to the official document and the exact figure,
      because the sentence "sounded like it was written by a machine".
GOOD: The editor removes the hollow adjectives and keeps the link, the figure
      and the condition that makes the sentence true.
Why:  Rule 14: anti slop editing removes filler, never evidence.
```

## Checklist before publishing a page

- [ ] The opening answers the question the page targets, before any context
      (rule 1).
- [ ] The words a reader would actually type appear in the title, the H1, the
      answer sentence and one subheading, and nowhere as padding, and no
      competitor brand name is used as a keyword (rule 2, and the "Competitors"
      section of `standards/EDITORIAL-CORE.md`).
- [ ] Title and meta description would be wrong on any sibling page (rule 3).
- [ ] H1, body, metadata and structured data describe the same page (rule 4).
- [ ] JSON-LD comes from the same source as the visible content and asserts no
      property the page does not show (rule 5).
- [ ] Every borrowed claim links to its official source inline or from one
      Sources section (rule 6).
- [ ] Every assertion is either a Verified fact traceable to the source it
      links, or carries exactly one of the four explicit prefixes, chosen with
      the decision ladder: `Inference:`, `Condition:`, `Not verifiable:`,
      `Planned, not available:` (rule 7).
- [ ] Anything not available to a reader today is labelled as planned, never as
      a Condition, and carries no date, availability claim or promise (rule 7
      and EDITORIAL-CORE 4).
- [ ] This page answers a question no existing page answers, and no page,
      locale variant or series here exists to increase how many URLs the site
      has (rule 8).
- [ ] The page states what it does not cover, beside the claims it limits
      (rule 11).
- [ ] No paragraph would survive unchanged on an unrelated page, and there is no
      decorative opening or closing (rules 9 and 10).
- [ ] No invented test, testimonial, byline, measurement, or framing that
      suggests independent review (rules 12 and 13).
- [ ] Links, figures and qualifiers were not stripped while editing for tone
      (rule 14).
- [ ] The locale is genuinely localised, or it is English with a fallback notice
      in the reader's language, and every cross locale link resolves (rules 15
      and 16, and `standards/TRANSLATIONS.md` rule 5).
- [ ] Every privacy, legal and compliance sentence traces to a ledger entry in
      `workflows/CLAIM-REVIEW.md`, with its evidence category and its named
      approver (rule 17).
- [ ] No competitor brand name anywhere, and no internal tooling, model or agent
      named (the "Competitors" section of `standards/EDITORIAL-CORE.md`, and
      EDITORIAL-CORE 6).
- [ ] No em dash outside the exceptions of EDITORIAL-CORE 9, checked by reading
      the page (EDITORIAL-CORE 8). The guardrail scripts under
      `tools/check-*.ts` are run too, but `tools/check-labs-no-em-dash.ts`
      covers 16 files of the Labs cluster and scans content lines only, so a
      green run is evidence for those files and for nothing else. Every file
      outside that set is checked by hand.
