# Translations

This document tightens `standards/EDITORIAL-CORE.md`. It never loosens it.
Where this document is stricter, this document applies; where it is silent,
`standards/EDITORIAL-CORE.md` applies in full. Nothing here grants an exemption
from any rule recorded there.

## Scope

Binds both consumer repositories, for any text that exists in more than one
language or is derived from text in another language. That includes the Flutter
application under `AppFitmesh/` (its user facing copy and its ARB localisation
files under `flutter_app/lib/l10n/`) and the site `fitthesite` and its API
(domain `fitmesh.fit`, 11 locales: it, en, es, de, pt, fr, pl, tr, nl, ja, ko).
It covers pages, articles, FAQ, landing pages, store listings, in app copy,
notifications and email. What this document adds is aimed at user facing text,
so it adds nothing to internal documentation. That is a limit on this document
only: `standards/EDITORIAL-CORE.md` keeps binding internal documentation
wherever it says so, including the ban on competitor brand names in code
comments, documentation and README files in both repositories.

Rules are numbered for citation. The numbers are stable; do not renumber when
adding a rule. A bare citation of the form (rule N) always means rule N of this
document. Rules in `standards/EDITORIAL-CORE.md` are cited as core rules and
never bare, because the two documents number independently and the numbers
collide.

## Rules

1. **The source language is declared, per module or per content item.**
   Rationale: without a declared source nobody can tell which text is the
   original and which is derived, so a correction can be applied to the wrong
   side and travel outward from there.

2. **English is not automatically the universal source.** The source is
   whichever language the text was actually written in, and English is one of
   the 11 site locales, not the hub. The consumer repositories work in Italian,
   so an original is at least as likely to be Italian as English, and the
   declared source decides which it is, never the assumption.
   Rationale, and the damage the assumption causes: when English is assumed to
   be the original, a translator silently promotes an English draft into the
   reference wording, then "corrects" the true original to match a text that was
   itself a translation. Facts, limits and legal wording settled in the real
   source language get re-derived from a second hand version, differences
   between locales become impossible to arbitrate, and a defect introduced in
   the English pass is copied into every other language as if it were the
   source.

3. **A translation changes the language and nothing else.** The following must
   survive intact:
   - facts: every number, quantity, name and statement of what happens. What
     must survive is the value; how it is written is rule 8's business, so
     separators, date order and unit spacing change with the locale. Where rule
     8 converts a unit system, the converted value is exact and the conversion
     is recorded with the item, so the original value stays recoverable;
   - limits: every condition, exclusion and "only if" clause;
   - degree of certainty: hedges ("may", "in some cases", "up to") keep their
     strength, and a hedge is never dropped or added;
   - links: every link is kept and resolves, pointing at the target locale's
     version when one exists;
   - placeholders: the placeholder name is a key, not a word, and is never
     translated;
   - ICU syntax: the keywords and plural or select categories are syntax and
     stay as they are; only the text inside the braces is translated, and the
     set of categories is the one the target language actually has;
   - product names: see rule 9.
   Rationale: a translation that shifts any of these is not a translation, it is
   a second, unreviewed claim published under the authority of the first.

4. **No syntactic calques.** Translate the sentence, not the construction:
   word order, prepositions, articles, register and idiom follow the target
   language.
   Rationale: the sentence is grammatical, every single word is defensible,
   and no native speaker would ever write it, so the reader stops reading the
   content and starts reading the seams.

5. **No silent cross locale fallback, in either consumer.** A missing string
   must fail loudly (a failing check, a build error, a report) and the item
   stays unpublished in that locale until the string exists. Neither the app nor
   the site may render text from any other locale in place of the missing one
   without the reader being told, and English is not privileged here: an Italian
   string appearing on a French screen is the same violation as an English one.
   Rationale: a silent fallback turns a known gap into an invisible one, it
   looks finished to the reader and to the reviewer, and the only person who
   discovers it is the user.

6. **Anything indexable gets native review, or a recorded equivalent control.**
   Indexable means anything a search engine can reach: pages, articles,
   headings, titles, meta descriptions, structured data, store listings. The
   control that was applied is recorded with the item (see "Declaring the
   source"). An equivalent control is one that a named person with the language
   signs off on, or an automated check in that repository's own guardrail
   scripts that fails the build when the property is not satisfied (on the site,
   the `tools/check-*.ts` family). "It looked fine" is not a control.
   Rationale: indexable text is read by people who never chose to read it, it
   outlives the work that produced it, and it is the version the product is
   judged by.

7. **No mechanical keyword localisation.** A keyword is not translated, it is
   re-researched: verify that the phrase is actually searched in that language
   and that the intent behind it is the same intent the page serves. If the
   verified phrase and the literal rendering differ, the literal rendering is
   not used. If the intent does not exist in that market, the page does not get
   forced to carry it.
   Rationale: the literal rendering of a keyword is often a term nobody types,
   or one that is typed with a different intent, and the page then ranks for a
   question it does not answer.

8. **Dates, numbers, units and punctuation are localised, not carried over.**
   Date order and month names, decimal and grouping separators, unit systems and
   unit spacing, quotation marks, spacing before punctuation, capitalisation of
   titles and of the days and months: all follow the target locale.
   Rationale: the same digits mean two different days and two different
   quantities depending on the locale, so a correctly translated sentence can
   still be read as the wrong fact, and foreign punctuation reads as an error
   even when the words are right.

9. **Official names are not translated when translating would change the
   identity of the thing.** This covers the product name `FitMesh Sync`, the
   titles of legal and licence documents, file and package names such as
   `com.fitmeshsync.app`, and the exact wording of third party material that may
   not be altered. Where the untranslated name is opaque, keep the name and add
   a short gloss in the target language next to it.
   Interface labels are the opposite case, because the interface itself is
   localised. An instruction quotes the label in the form the target locale's
   build actually renders, taken from that locale's own strings: never
   translated on the spot by whoever writes the instruction, and never left in
   the source language. If that locale has no string for the element yet, rule 5
   applies and the instruction is not published in that locale.
   Rationale: an identifier that gets translated sends the reader looking for
   something that does not exist, and a label left in the source language sends
   the reader looking for words that are not on their screen. Both break the
   match between the instruction and what the reader sees.

10. **A correction to a source item travels to its derivatives.** When the
    source changes, every derivative is marked as behind it (see "Declaring the
    source") and the change is carried into each one, or that derivative is
    withdrawn in its locale until it is. A derivative left in place unmarked
    counts as current text that nobody has checked.
    Rationale: a correction that stops at the source leaves the old sentence
    published in every other language under the same authority, and the
    divergence surfaces only when two locales are read side by side.

## Declaring the source

The declaration is a record, not a file format. Use whatever the file at hand
already provides for data that travels with the text and is not rendered to the
reader. If a format provides nothing suitable, extend that format rather than
shadowing it with a parallel side file, and do not invent a second vocabulary
for naming languages: use the same locale identifiers the repository already
uses to address that locale.

Record these four things:

1. **Authored language.** The language the text was actually written in, as a
   locale identifier.
2. **Role.** Whether this item is the source or a derivative of another item.
3. **Origin, for a derivative.** Which item and which language it was translated
   from, and which revision of that item (a commit, a version, a content hash:
   whatever the repository can actually resolve later).
4. **Control, for anything indexable.** Which control under rule 6 was applied
   and in which language, so a reviewer can tell reviewed text from unreviewed
   text without asking anyone.

Three conventions make the record usable:

- **Granularity.** Declare per module only when every item in the module has the
  same origin. Otherwise declare per item. When in doubt, use the smaller unit.
- **Unknown is a value.** If the source of an existing item cannot be
  established, record it as unknown rather than guessing. An item with an
  unknown source counts as unreviewed for rule 6 until someone establishes it.
- **Staleness is visible.** When a source item changes, its derivatives are
  marked as behind the source, and rule 10 governs what happens next. A
  derivative that is silently left in place looks current, which is exactly the
  failure rule 5 forbids at runtime.

## Examples

Examples are illustrative and product neutral.

```
BAD:  "Bonjour {nomUtilisateur}"
GOOD: "Bonjour {userName}"
Why:  the placeholder name is a key the code looks up, not a word for the
      reader, so translating it empties the slot or breaks the build.
```

```
BAD:  "{count, plural, uno {1 elemento} altro {{count} elementi}}"
GOOD: "{count, plural, one {1 elemento} other {{count} elementi}}"
Why:  the plural category keywords are syntax and stay in their fixed form;
      only the text inside the braces is translated, and which categories exist
      is decided by the target language, not by the source.
```

```
BAD:  "It makes sense." into Italian as "Fa senso."
GOOD: "Ha senso."
Why:  the construction exists in the target language but means "it is
      revolting", so the calque is grammatical and says something else.
```

```
BAD:  "Do you have any questions?" into German as "Haben Sie irgendwelche
      Fragen?"
GOOD: "Haben Sie Fragen?"
Why:  the source needs "any" and the target does not, so carrying it over
      produces a sentence that is correct and that nobody writes.
```

```
BAD:  an Italian screen that renders "Settings saved" because the Italian
      string is missing, with nothing logged and nothing failing
GOOD: the missing key fails the check, the screen is not published in that
      locale, and the gap appears in the report
Why:  a silent fallback hides the gap from everyone who could fix it and shows
      it only to the reader.
```

```
BAD:  "Sincronizzazione FitMesh"
GOOD: "FitMesh Sync"
Why:  the product name identifies the app; a translated name is a thing the
      reader cannot find anywhere on the device or in the store.
```

```
BAD:  "Licenza del MIT" as the title of a licence document
GOOD: "MIT License (licenza MIT, testo in inglese)"
Why:  the official title is how the reader locates the document; the gloss
      carries the meaning without replacing the identifier.
```

```
BAD:  translating the English query word for word and using the result as the
      page title in the target locale
GOOD: using the phrase people in that language actually type with that intent,
      even when it shares no words with the source query
Why:  the literal rendering can be a term with volume but a different intent,
      for example a word that means "at no cost" in one language and "vacant"
      in another, and the page then answers a question nobody asked.
```

```
BAD:  "02/03/2024" carried unchanged from a month first source into a day
      first locale
GOOD: "2 marzo 2024", or the unambiguous format the target locale uses
Why:  the same eight characters are two different days, and the reader has no
      way to tell which one was meant.
```

```
BAD:  German copy that keeps the source language's quotation marks: “Gerät”
GOOD: German copy with German quotation marks: „Gerät“
Why:  punctuation belongs to the language, not to the source document.
```

```
BAD:  a source that reads "may reduce" translated as "reduces"
GOOD: the hedge kept at the same strength in the target language
Why:  dropping a qualifier publishes a stronger claim than the one that was
      reviewed, and the strongest published version is the one the product is
      held to.
```

## Checklist before publishing a translation

- [ ] The authored language of the item is declared and matches the text that
      was actually written first (rule 1).
- [ ] The record says whether the item is a source or a derivative, and for a
      derivative which item, which language and which revision it came from
      (rule 1).
- [ ] Nothing was translated through an English intermediate when the item's
      source is another language (rule 2).
- [ ] Every fact, number, limit and hedge in the source is present in the
      translation, at the same strength (rule 3).
- [ ] Placeholders and ICU keywords and categories are unchanged where they are
      syntax, and the target language's own plural categories are used (rule 3).
- [ ] Every link resolves and points at the target locale's version where one
      exists (rule 3).
- [ ] The text was read by someone who writes in the language, and no sentence
      carries the source language's word order or idiom (rule 4).
- [ ] No string renders in another locale at runtime; every missing key fails a
      check instead of being filled silently (rule 5).
- [ ] Indexable text passed native review or the recorded equivalent control,
      and the record says which one (rule 6).
- [ ] Every keyword used in a title, heading or metadata was verified against
      what is actually searched in that language with that intent (rule 7).
- [ ] Dates, numbers, units, separators, quotation marks and spacing follow the
      target locale (rule 8).
- [ ] Product names, official titles and package names are untranslated, with a
      gloss where needed, and every interface label quoted in an instruction is
      the string that locale's build actually renders (rule 9).
- [ ] No source item was corrected without its derivatives being marked as
      behind it and then updated or withdrawn in their locale (rule 10).
- [ ] Every rule in `standards/EDITORIAL-CORE.md` was applied to the translated
      text and not only to the source, including the ban on the em dash (core
      rule 8), whose only exceptions (core rule 9) stay exactly as they are: the
      lone em dash used as a "no data available" placeholder in data tables,
      verbatim quotations, official titles, document names, code, dependencies,
      and third party material that cannot be altered.
