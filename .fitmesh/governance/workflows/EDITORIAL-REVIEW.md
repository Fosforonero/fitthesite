# Editorial review

## Scope

This procedure binds every reviewer, human or agent, who checks FitMesh user
facing copy before it ships. User facing copy means text a reader outside the
team can see: site pages, articles, landing pages, FAQ, store listings, in app
strings (including the Flutter ARB files under `flutter_app/lib/l10n/`),
notifications, and email. It covers copy that is created, translated, or
edited, in either consumer repository (app and site), in any of the site
locales.

The procedure is a reading procedure. It runs with no network access and with
no tool other than reading files in the repository. Guardrail scripts such as
`tools/check-labs-no-em-dash.ts` may exist for some surfaces, but this review
must reach its verdict without running any of them, and a passing script is
never a substitute for a step below.

The reviewer does not rewrite the author's voice. The reviewer reports
violations and proposes the smallest fix that removes each violation. Rhythm,
vocabulary, sentence length, and structure that break no rule are left exactly
as the author wrote them. A finding whose only justification is reviewer
preference is not a finding and must not be reported.

Several sections of this document number from one, so a citation names the
section as well as the number, for example "entry condition 3" or "verdict rule
1". Within a section the numbers are stable: do not renumber, add at the end.

## Entry condition

Run this review when both of the following hold.

1. The change adds, translates, or edits text that will be read outside the
   team, on any of the surfaces named in Scope.
2. The text has not shipped yet, that is, it is still in a branch, a draft, or
   a pending edit.

Two clarifications on the boundary. They continue the same numbered sequence, so
items 1 to 4 are one list and "entry condition 3" resolves to exactly one item.

3. A change that touches only internal documents or code is out of scope for
   this review, with one exception: the competitor naming rule applies to
   internal material as well (code comments, internal documents, README files,
   in both repositories, including the private one). If such a change names a
   competitor, raise it as a finding even though the rest of this procedure
   does not apply.
4. A purely mechanical change with no text content (reordering keys, changing a
   file path, renaming a variable) is out of scope.

Exit condition: the review produces one verdict, PASS or FAIL, in the shape
given at the end of this document. There is no third outcome, and no verdict is
final while any step is still marked unread. Copy that step 8 routes to
`workflows/CLAIM-REVIEW.md` is not a third outcome either: step 8 records each
routed line as a finding, so the verdict is FAIL while the routing is open, and
it stays FAIL until that review returns CLEARED for every routed line and the
copy carries the wording recorded there.

## Documents to read first

Read these completely before looking at the copy, not while looking at it. A
review that starts from memory of the rules is not a review.

1. `standards/EDITORIAL-CORE.md`, in full, including its numbered principles.
2. The addendum for the surface the copy ships on. `standards/EDITORIAL-CORE.md`
   names one per consumer surface:
   - `standards/APP-WRITING.md` for copy that ships inside the Flutter
     application, including the ARB localisation files under
     `flutter_app/lib/l10n/`, and the store metadata and release notes for it;
   - `standards/SITE-WRITING.md` for site copy, its metadata and its structured
     data.
   If the copy ships on a surface neither covers, record that in the verdict as
   an open question rather than guessing.
3. `standards/TRANSLATIONS.md`, whenever the change crosses a language boundary:
   a translation, an edit to one, or text derived from text in another language.
   The core names it a cross-cutting standard rather than an addendum, so it is
   read together with the core and with the addendum for the surface, and it is
   the standard step 10 runs against. A translated app string is governed by
   `standards/APP-WRITING.md` and by this document together.
4. `workflows/CLAIM-REVIEW.md`, at least far enough to recognise what counts as
   a claim, because step 8 may route the copy there.

Gate: all applicable documents read in this session. On failure, stop. Do not
review from memory or from a summary.

## Steps

Each step states what to check, the gate that decides pass or fail, and what to
do when the gate fails. Run the steps in order. Do not skip a step because an
earlier one already failed: the author is entitled to the full list of findings
in one pass, not a sequence of single defect rejections.

### Step 1. Identify surface, language, and change type

Determine, from the files touched: which surface the copy ships on, which
language or locale each string is in, and whether the change is new copy, a
translation, or an edit of shipped copy.

Gate: all three are known and written down.

On failure: ask the author, or read the surrounding files until it is
determinable. Do not assume the surface from the wording of the copy.

### Step 2. Read the copy once, whole, before judging

Read the complete text end to end without annotating. The purpose is to know
what the text is trying to say, so that a proposed fix does not destroy the
author's meaning.

Gate: the reviewer can state, in one sentence, what the copy is for and who it
addresses.

On failure: keep reading. A reviewer who cannot state the purpose will propose
fixes that change it.

### Step 3. Check against the numbered principles of `standards/EDITORIAL-CORE.md`

Start with the portability test of `standards/EDITORIAL-CORE.md`. That document
says to run it first in review, and it gives the test no number, so a walk of
the numbered principles alone skips it. Take each sentence and ask whether it
could be moved, unchanged, into another company's page about another product in
another country. If it could, it says nothing about FitMesh and it is filler:
the fix replaces it with a fact, an example, a limit, a consequence or a
concrete piece of behaviour that only applies here, or deletes it. Report such a
sentence under `EDITORIAL-CORE 10` when it is hollow or promotional and under
`EDITORIAL-CORE 11` when it is vague where a concrete detail belongs. On site
copy, `SITE-WRITING 9` covers the same failure for a whole paragraph.

Then walk the numbered principles of `standards/EDITORIAL-CORE.md` in order,
from the first to the last. For each principle, decide one of three outcomes for
the copy under review: applies and is respected, applies and is violated, or
does not apply to this text. Write the outcome next to the principle number. Do
not check the copy against a remembered subset of the principles, and do not
stop early because the copy "reads fine".

Every violation found here becomes a finding whose rule field is
`EDITORIAL-CORE <number>`.

Gate: the portability test has been run over the whole copy, every numbered
principle has an outcome recorded, and no principle is marked violated.

On failure: report each violated principle as a finding in the verdict, with
the quoted line and a proposed fix, and set the verdict to FAIL.

### Step 4. Check against the relevant addendum

Repeat step 3 against the addendum identified in "Documents to read first",
walking its numbered rules in order. Addendum rules are surface specific and
often tighter than the core, so a line that passes step 3 can still fail here.
When the change crosses a language boundary, walk `standards/TRANSLATIONS.md` in
the same way, because it applies on either surface and step 10 depends on it.

One rule needs naming here, because a reviewer who checks only punctuation and
tone will read past it. On site copy, `standards/SITE-WRITING.md` rule 7
requires every sentence that reads as a statement about the world to carry
exactly one of five labels: verified fact, inference, condition, not verifiable,
or planned feature. The label is chosen with the decision ladder in that
document's "Labelling evidence" section, applied in order, stopping at the first
match, and the vocabulary table there fixes the wording of each label. An
assertion carrying no label is a finding under `SITE-WRITING 7`, because an
unlabelled sentence reads as a verified fact and omitting the label is itself a
claim. A label the ladder does not give for that sentence is the same finding,
and so is a label dropped from the summary, the metadata, the social preview or
the structured data while the sentence is kept there.

Findings from this step carry the document name and rule number in the rule
field, for example `SITE-WRITING <number>` for site copy, `APP-WRITING <number>`
for app copy, and `TRANSLATIONS <number>` when the change crosses a language
boundary.

Gate: every numbered rule of the addendum, and of `standards/TRANSLATIONS.md`
when it applies, has an outcome recorded, and none is marked violated.

On failure: report as in step 3 and set the verdict to FAIL.

### Step 5. Em dash pass

Scan every content line of the copy for an em dash. The rule is a ban, not a
budget: one occurrence is a finding. Where an upstream or external style guide
treats the em dash as a matter of taste, the FitMesh ban wins.

The following are not violations, and the reviewer must not "fix" them.

1. The lone em dash used as a "no data available" placeholder in a data table.
2. A verbatim quotation of text FitMesh did not write.
3. An official title or a document name that contains one.
4. Code, including identifiers, dependency names, and third party material that
   cannot be altered.

This list restates `standards/EDITORIAL-CORE.md` rule 9, which declares its
exceptions exhaustive. This procedure may not widen them. A brand, a person's
name, a place, or any other proper name that is not an official title or a
document name is not an exception, and neither is a line the reviewer finds
better with the character in it.

Gate: no em dash on any content line outside the four exceptions above.

On failure: one finding per occurrence, with the proposed fix rewriting the
punctuation as a period, a comma, a colon, or parentheses, whichever preserves
the sentence's meaning. Do not propose a fix that deletes information in order
to remove the punctuation.

```
BAD:  The screen lists the last sync (em dash here) the time and the source.
GOOD: The screen lists the last sync: the time and the source.
Why:  EDITORIAL-CORE 8 bans the character in prose, and the colon carries the
      same break without costing the sentence a word.
```

The BAD line names the character in words instead of printing it, so that this
procedure, and any file that quotes it, stays inside the rule it enforces. Write
findings the same way.

### Step 6. Internal tooling pass

Check that the copy does not refer to the internal tooling used to produce it.
Banned in user facing text: names of agents, models, assistants, prompts, and
any phrasing that presents the text as automatically generated, including
decorative disclaimers to that effect.

Naming AI is allowed when AI is genuinely the subject of the page, a documented
product feature, a documented technology, or a legal or transparency
requirement. The test is whether the reader is being told about the product or
about the writing process. The second is banned.

Gate: no reference to the internal writing tooling anywhere in the copy,
including alt text, image captions, metadata, and comments that ship with the
text.

On failure: one finding per occurrence. The proposed fix deletes the reference.
If deleting it leaves a sentence without a subject, propose a rewrite that says
what the product does instead.

```
BAD:  This page was drafted with an automatic writing assistant.
GOOD: (delete the line)
Why:  EDITORIAL-CORE 6: how the page was produced is not part of the page, and
      the line tells the reader nothing.
```

```
BAD:  Our writing assistant fills the field for you.
GOOD: Feature X fills the field for you (illustrative example).
Why:  EDITORIAL-CORE 7 allows naming AI when it is the documented feature being
      described, so the fix names the feature and drops the tooling.
```

### Step 7. Unverified future pass

Check every sentence that points forward in time: future dates, availability,
support for something not yet available, planned work, or any promise about
what will happen. None of these may ship unverified.

Gate: no future date, no ETA, no availability promise, and no roadmap statement
anywhere in the copy. `standards/EDITORIAL-CORE.md` rule 4 bans naming a
quarter, a month or a season for unreleased work, and it grants no exception for
copy that carries a source: a source can show that a plan exists, and it cannot
make a promise to the reader true. Rule 5 of the same document allows what is
historical or present and checkable, in the repository or in an already
published record: a release that happened, a version that exists, availability
that is live. Those are not forward looking and this gate does not touch them.

On failure: one finding per occurrence. The proposed fix removes the forward
looking statement, or restates it in the present tense about what is true now,
including the honest sentence that the thing is not available today. On site
copy, `standards/SITE-WRITING.md` rule 7 supplies the one form a plan may take,
the label `Planned, not available:`, which names the plan with no date, no
availability claim and no promise. Use that label rather than inventing a softer
phrasing. A softened promise is still a promise and is not an acceptable fix.

```
BAD:  Feature X will be available in the next release.
GOOD: Feature X is not available today.
Why:  EDITORIAL-CORE 4: a date nobody has confirmed reads to the user as a
      promise.
```

```
BAD:  Support for setting Y is planned for the spring.
GOOD: Planned, not available: setting Y.
Why:  EDITORIAL-CORE 4 bans naming a season for unreleased work, and
      SITE-WRITING 7 gives the label that names the plan without a date.
```

### Step 8. Claim trigger

Decide whether the copy contains a claim about what the product does, what it
supports, what it protects, or what the law requires. Use the definition in
`workflows/CLAIM-REVIEW.md`; do not use a looser one.

Gate: either the copy contains no claim, or a completed claim review exists for
every claim it contains.

On failure: route the copy to `workflows/CLAIM-REVIEW.md`, record the routing,
and continue to step 9. Do not stop here: the author is entitled to the findings
of steps 9 and 10 in the same pass.

Record each routed line as a finding as well, not only in the ROUTED TO CLAIM
REVIEW field. Its rule field names `workflows/CLAIM-REVIEW.md` and the claim
subject the line falls under (what the product does, what it supports, what it
protects, or what the law requires), and its FIX field is the instruction to
obtain a cleared claim record for that line. The finding stands until claim
review returns CLEARED for the line and the copy carries the wording recorded
there. That is what keeps an open routing out of a PASS: the editorial verdict
cannot be PASS while a claim in the copy is unreviewed, and while the routing is
open the findings count is never zero.

### Step 9. Tone and comparison pass

Check the register against the tone rules: direct, technical, clear, confident,
dry, never offensive. Then check that no other product, app, or companion app
is denigrated, and that no direct competitor is named, in the copy or in
anything shipping with it (metadata, keywords, file names, alt text).
Describing a reader's difficulty is allowed when it is described neutrally,
without judging someone else's product. When the sector has to be described,
generic terms are used.

Check, in the same pass, that the copy is not over technical for its reader.
User facing text explains what the reader sees, where the reader taps, and what
happens. Internal architecture and interface names belong in internal
documents, not here.

Gate: no denigration, no competitor name, no engineering jargon aimed at a
reader who is not a developer.

On failure: one finding per occurrence. For denigration, the proposed fix
states what FitMesh does, factually, in place of the scornful comparison. For a
competitor name, the proposed fix removes the name and, if the sentence still
needs a subject, uses a generic term for the category.

```
BAD:  The app that ships with the device is useless for this.
GOOD: Feature X reads the same values and shows them in one list (illustrative
      example).
Why:  The tone of voice section bans the register "useless" about a companion
      app, and the fix states what the product does instead of rating what
      someone else does.
```

```
BAD:  The client retries the endpoint with exponential backoff until the
      payload is accepted.
GOOD: If the transfer does not go through, the app tries again on its own.
Why:  The tone of voice section keeps engineering jargon and interface names
      out of user facing text: the reader needs what happens, not how.
```

### Step 10. Translation pass

Run this step only when the change is a translation, or an edit to a
translation.

`standards/TRANSLATIONS.md` governs this step. Read it in full and walk its
numbered rules as step 4 requires. It fixes what must survive a translation
intact (facts, limits, degree of certainty, links, placeholders, ICU syntax and
its plural or select categories, product and official names), what counts as a
calque, what is localised rather than carried over (dates, numbers, units,
separators, quotation marks, spacing), what must be declared about the source of
the text, and which control an indexable string needs.

Check that the rules were applied to the target language and not only to the
source: an em dash introduced by the translator is a violation even when the
source had none, and a hedge or a promise introduced by the translator is a
violation even when the source was clean. Check that placeholders,
interpolation markers, and formatting tokens are identical to the source
(`TRANSLATIONS 3`), that the source language of the item is declared and that
the translation was not made through an English intermediate when the source is
another language (`TRANSLATIONS 1` and `TRANSLATIONS 2`), that dates, numbers,
units and punctuation follow the target locale (`TRANSLATIONS 8`), that names
the reader has to find on the screen are untranslated (`TRANSLATIONS 9`), and
that no claim was strengthened, weakened, or broadened in translation.

Gate: the target text respects every rule on its own, and carries the same
claims, at the same strength and the same scope, as the source.

On failure: one finding per string, quoting the target line, naming the rule as
`EDITORIAL-CORE <number>`, `TRANSLATIONS <number>`, or the addendum for the
surface, and proposing the corrected target line. Where the divergence is a
claim, route to `workflows/CLAIM-REVIEW.md` as in step 8.

### Step 11. Produce the verdict

Assemble the findings from steps 3 to 10 into the shape below. Order findings
by the order in which the offending lines appear in the copy, so the author can
work top to bottom. Merge nothing: one finding per occurrence, even when the
same rule is broken five times.

Gate: the verdict is complete, every finding has all four fields (RULE, LINE,
FIX, WHY), and the overall result is stated.

On failure: the review is not finished. Do not hand over a partial verdict.

## Shape of the verdict

The reviewer produces exactly this, and nothing else. No preamble, no praise,
no summary of the copy, no restatement of the rules that were respected.

```
VERDICT: PASS | FAIL
SURFACE: <surface and locale>
DOCUMENTS READ: <list>

FINDINGS: <count>

1.
RULE:  <document and rule number, for example EDITORIAL-CORE 4>
LINE:  "<the offending line, quoted exactly as written, including its file
        and line reference>"
FIX:   <the proposed replacement line, or the instruction to delete>
WHY:   <one sentence, naming the rule, not the reviewer's taste>

2.
RULE:  ...
LINE:  ...
FIX:   ...
WHY:   ...

OPEN QUESTIONS: <anything the reviewer could not determine by reading, or
"none">
ROUTED TO CLAIM REVIEW: <the lines sent to workflows/CLAIM-REVIEW.md, or
"none">
```

Rules on the verdict itself.

1. PASS is allowed only when FINDINGS is zero and nothing was routed to claim
   review without returning CLEARED for every routed line. Step 8 records each
   routed line as a finding, so an open routing already makes FINDINGS non zero
   and the verdict FAIL. There is no state in which the copy is neither PASS nor
   FAIL.
2. Every finding quotes the offending line verbatim. A paraphrase is not a
   finding, because the author cannot locate it.
3. Every finding names a rule by document and number. A finding with no rule
   number is reviewer preference and must be dropped before the verdict is
   handed over.
4. The FIX field changes only what the rule requires. It preserves the author's
   wording everywhere else in the line, including word choice and sentence
   shape.
5. The verdict itself obeys the rules it enforces, including the em dash ban.
