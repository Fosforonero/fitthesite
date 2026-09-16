# Claim review

## Scope

This procedure binds every reviewer, human or agent, who checks FitMesh user
facing copy that asserts something about the product or about the law. It is
the stricter pass that sits on top of `workflows/EDITORIAL-REVIEW.md`. Editorial
review decides whether the text is written correctly. Claim review decides
whether the text is allowed to say what it says.

It applies to the same surfaces as editorial review: site pages, articles,
landing pages, FAQ, store listings, in app strings (including the Flutter ARB
files under `flutter_app/lib/l10n/`), notifications, and email, in either
consumer repository, in any locale.

Like editorial review, this is a reading procedure. It runs with no network
access and with no tool other than reading files in the repository. A claim
whose evidence can only be checked by leaving the repository is, for the
purposes of this review, unverified, with one exception: a claim borrowed from
an official document that carries its source the way `standards/SITE-WRITING.md`
rule 6 requires. That source stays, and E4 below says how it is recorded.
`standards/EDITORIAL-CORE.md` rule 12 forbids dropping such a reference, so this
review never removes a line for carrying one.

Several sections of this document number from one, so a citation names the
section as well as the number, for example "what counts as a claim, 4" or "claim
record rule 1". Within a section the numbers are stable: do not renumber, add at
the end.

## What counts as a claim

A claim is any sentence, fragment, heading, button label, or piece of metadata
that tells the reader something is true about one of these four subjects.

1. **What the product does.** Behaviour, results, accuracy, speed, what happens
   when the reader does something.
2. **What the product supports.** Devices, platforms, data types, languages,
   integrations, conditions under which it works.
3. **What the product protects.** Privacy, storage, retention, deletion,
   sharing, access, security.
4. **What the law requires.** Obligations, rights, compliance status,
   certifications, regulatory categories.

Test to apply when unsure: could a reader be wrong because of this sentence, in
a way they could discover? If yes, it is a claim.

Three consequences of that definition. They continue the same numbered sequence,
so items 1 to 7 are one list and "what counts as a claim, 5" resolves to exactly
one item.

5. A claim does not need a verb of assertion. A heading, a feature list item, a
   store listing bullet, an image caption, alt text, a tooltip, and a page title
   can all be claims.
6. A negative statement is a claim. Saying the product does not do something, or
   does not collect something, needs evidence exactly as a positive statement
   does.
7. An implied claim is a claim. If the literal sentence is defensible but the
   reader will reasonably infer something stronger, the inference is what gets
   reviewed.

What is not a claim: a description of the reader's own situation that says
nothing about the product, an instruction telling the reader what to do, a
question, and a statement of intent by the writer about the text itself. When
the line sits on the boundary, treat it as a claim and let the evidence decide.

## Entry condition

Run this review when either holds.

1. Step 8 of `workflows/EDITORIAL-REVIEW.md` routed one or more lines here.
2. The copy under review contains, by the definition above, at least one claim,
   whether or not editorial review has run yet.

A claim review is also required, not optional, when copy that already shipped is
edited in a way that touches a claim, including a translation of it.

Exit condition: every claim in the copy has a claim record entry in the shape
given at the end of this document, and the review states one overall result,
CLEARED or BLOCKED. When the copy was routed here by step 8 of
`workflows/EDITORIAL-REVIEW.md`, the review is finished only once that result
has been returned there, line by line, as step 7 requires.

## Documents to read first

1. `standards/EDITORIAL-CORE.md`, for the numbered principles a proposed rewrite
   must still satisfy.
2. The addendum for the surface. `standards/SITE-WRITING.md` when the copy ships
   on the site: its rule 6 says how a borrowed claim carries its source, its
   rule 7 and its "Labelling evidence" section say how an assertion is labelled
   for the reader, and its rule 17 says what a privacy, legal or compliance
   sentence needs before it can be published. `standards/APP-WRITING.md` when
   the copy ships inside the Flutter application, including the ARB
   localisation files under `flutter_app/lib/l10n/`, and for that app's store
   metadata and release notes.
3. `standards/TRANSLATIONS.md` whenever the claim exists in more than one
   language or is derived from text in another language. The core names it a
   cross-cutting standard rather than an addendum, and its rule 3 fixes what a
   translation may not change: facts, limits, degree of certainty, links,
   placeholders, ICU syntax, and official names. Scope and certainty rule 5
   below depends on it.
4. `workflows/EDITORIAL-REVIEW.md`, so that a rewrite proposed here does not
   introduce an editorial violation.

Gate: all applicable documents read in this session. On failure, stop.

## Evidence categories

Every claim is assigned exactly one category. The category determines what
counts as sufficient evidence, and the category is recorded in the claim record.
These four are the only categories this review uses.

They are not the five assertion labels of `standards/SITE-WRITING.md` rule 7
(verified fact, inference, condition, not verifiable, planned feature). Those
label how a sentence is presented to the reader, on the page; E1 to E4 classify
what the reviewer can open and read behind it. The two taxonomies have different
names and different cut points, and a site claim carries both: one category
here, one label in the copy. Rule 5 under "Rules on categories" says how they
are reconciled.

**E1. Implemented behaviour.** The claim describes what the code does, and the
evidence is the code itself: the file and the place in it where the behaviour is
implemented, in the app repository or the site repository. Sufficient only when
a reader of the repository can open that file and see the behaviour without
inferring it.

**E2. Verified check.** The claim is asserted by a check that lives in the
repository and can be read: a test, a fixture, or a guardrail script of the
`tools/check-*.ts` family. The evidence is the check, the surface it covers, and
what it asserts. A check that covers a narrower set of files than the claim
covers is evidence for the narrow set only, and the claim must be narrowed to
match.

**E3. Recorded decision.** The claim restates a decision or standing rule that
is written down in a repository document, for example a standing rule recorded
in `AppFitmesh/CLAUDE.md` or a standard under `standards/`. The evidence is the
document and the rule within it, plus the person or role who owns the decision.
A decision that exists only in conversation is not E3 and is not evidence.

**E4. External source.** The claim rests on a document FitMesh did not write:
platform policy text, licence text, legal text, or third party documentation.
The evidence is the document, its version or identifier, and either a copy or an
exact citation stored in the repository, or the source the copy itself carries
as `standards/SITE-WRITING.md` rule 6 requires: an inline link next to the
claim, or one compact "Sources" section that the claim points to. A correctly
sourced claim is E4 evidence, and it is never removed for the absence of an in
repository copy: `standards/EDITORIAL-CORE.md` rule 12 forbids silently dropping
an official reference, and deleting the line would do exactly that. When the
repository holds no copy or exact citation, record in the claim record that the
evidence is reachable only through the cited source, and narrow the claim to
what the citation itself states. A remembered summary of an external rule,
naming no document a reader can reach, is not E4.

Rules on categories.

1. A claim that fits no category is unverified. Apply the removal rule below.
2. A claim that seems to fit two categories is split into two claims, each with
   its own evidence, or reduced to the one it can actually support.
3. A claim about what the law requires is E4, never E1 or E3. Code cannot be
   evidence of a legal obligation, and an internal decision cannot be evidence of
   one either.
4. A claim about what the product protects needs the category that matches what
   is being asserted: behaviour of the code is E1, a written commitment is E3, a
   legal obligation is E4. Mixing them is how a weak claim gets published.
5. The category is not the label the reader sees. On site copy, the claim also
   carries exactly one of the five labels of `standards/SITE-WRITING.md` rule 7,
   chosen with the decision ladder in that document. Record both: the category
   here and the label as it appears in the copy. Where they disagree, for
   example a sentence presented as a verified fact whose only evidence is an
   inference, or a sentence labelled as planned that is classified E1, the claim
   is BLOCKED until one of the two is corrected. An assertion with no label at
   all is a finding for editorial review under `SITE-WRITING 7`, because
   omitting the label is itself a claim, and it comes back here once labelled.

## Procedure

### Step 1. Enumerate the claims

List every claim in the copy, one per line, quoted exactly as written, with its
file and line reference. Include headings, labels, metadata, alt text, and
anything else covered by the definition above.

Gate: the list is complete and each entry is a verbatim quotation.

On failure: keep reading the copy. An unlisted claim is an unreviewed claim.

### Step 2. Classify each claim

Assign exactly one evidence category, E1 to E4, to each listed claim. Where the
claim is about privacy, about a legal obligation, or about compliance, mark it
as such now: those go through step 5.

On site copy, record in the same pass the label the copy carries under
`standards/SITE-WRITING.md` rule 7, and check it against the decision ladder in
that document. Rule 5 under "Rules on categories" says what to do when the label
and the category disagree, and an unlabelled assertion goes back to editorial
review before it can be classified here.

Gate: every claim has one category, every privacy, legal, or compliance claim is
flagged, and every site claim has its rule 7 label recorded.

On failure: split or narrow the claim until one category fits, and re record it.

### Step 3. Locate the evidence

For each claim, find the evidence and record where it lives, precisely enough
that another reviewer can open it and reach the same conclusion by reading. A
reference that names a whole repository, a whole directory, or "the codebase" is
not precise enough.

Gate: every claim has evidence with a readable location.

On failure: the claim is unverified. Go to step 4.

### Step 4. Decide the outcome of each claim

Each claim ends in one of three states.

1. **Supported.** The evidence holds, and it covers the full scope and the full
   certainty of the claim as written. The claim ships unchanged.
2. **Downgraded.** The evidence holds for less than the claim asserts. The claim
   is rewritten so that it asserts exactly what the evidence supports, no more.
   A narrower claim is a different claim: re record its category and evidence,
   and re run this step on the rewritten line.
3. **Removed.** There is no evidence, or the evidence cannot be located at all.
   The line is deleted. A claim that carries its official source as
   `standards/SITE-WRITING.md` rule 6 requires is not removed on the ground that
   the repository holds no copy of that source: it is E4 (see the category), and
   `standards/EDITORIAL-CORE.md` rule 12 forbids dropping the reference. Narrow
   it to what the cited document states, or record the missing in repository
   copy as an open point, but do not delete a sourced line for want of a local
   copy.

An unverifiable claim is removed or downgraded. It is never softened with a
hedge that keeps the implication. Adding "helps", "designed to", "can", "may",
"aims to", "typically", or "up to" in front of an unsupported assertion leaves
the reader believing the same thing and is prohibited. The test for a hedge: if
the reader would still act on the sentence in the same way, the hedge changed
nothing and the claim is still unverified.

Gate: no claim is left in the copy in a hedged but unsupported form.

On failure: delete the line. Deleting a sentence is always available and always
acceptable. Publishing an unsupported one is not.

### Step 5. Approved entry for privacy, legal, and compliance claims

Every claim flagged in step 2 clears this step on one kind of evidence only, the
one `standards/SITE-WRITING.md` rule 17 requires: the exact statement already
exists as an approved entry in the fact ledger that governance names for that
area, and the copy can be traced back to that entry. The fact ledger is a
standing record that exists before the review starts. The claim record this
procedure produces is the output of the review, and it is not that ledger and
cannot stand in for it. Wording approved at review time, for a sentence written
at review time, is not an entry, and a reviewer may not create one here.

Record, for each flagged claim: the entry the statement matches, where that
entry lives, and the person or role who owns it, by name. A claim approved in
one wording is not approved in another wording, and a claim approved for one
surface or locale is not approved for every surface or locale.

Gate: every flagged claim names an existing fact ledger entry whose wording
matches the wording in the copy, character for character, and names the owner of
that entry.

On failure: the claim is BLOCKED. It does not ship while the entry is missing,
it is not rewritten into something weaker in order to avoid asking, and it is
not moved into a heading, an image caption or metadata, which rule 17 bans in
the same sentence. If governance names no fact ledger for that area, the claim
stays BLOCKED and the missing ledger is recorded as an open point: an unnamed
ledger is not a licence to approve the wording here.

### Step 6. Check the rewrites

For every claim that was downgraded, check the rewritten line against
`workflows/EDITORIAL-REVIEW.md`, because a rewrite is new copy. That means the
em dash pass, the internal tooling pass, the unverified future pass, the tone
and comparison pass, and the portability test of `standards/EDITORIAL-CORE.md`,
which that document says to run first in review. On site copy the rewritten
line also carries its rule 7 label, chosen again with the decision ladder,
because the label belongs to the sentence and a new sentence may need a
different one. Then apply the scope and certainty rule below.

Gate: every rewritten line passes editorial review and changes neither the
certainty nor the scope in the wrong direction.

On failure: rewrite again, or remove.

### Step 7. Produce the claim record and return it

Write one claim record entry per claim, in the shape given below, in the order
the claims appear in the copy. State the overall result.

When the copy arrived here from step 8 of `workflows/EDITORIAL-REVIEW.md`, this
step ends by handing the result back to that review, line by line, so that the
routing opened there can be closed. CLEARED for a line, with the copy carrying
the wording recorded here, clears the routing finding for that line. BLOCKED
keeps the editorial verdict at FAIL. A line downgraded or removed here is new
copy, so it re enters editorial review at step 1 instead of shipping on this
record alone. When the copy did not arrive from editorial review, the record
goes to whoever asked for the review, and editorial review still runs before the
copy ships.

Gate: the claim record covers every claim from step 1, with no entry missing a
field, and, for copy routed from editorial review, the per line outcomes have
been returned there.

On failure: the review is not finished.

## The scope and certainty rule

A rewrite may not change the certainty of a claim, and may not change its scope.
This cuts in both directions.

1. It may not raise certainty. "Sometimes" does not become "always", "in this
   case" does not become "in every case", and a conditional does not lose its
   condition.
2. It may not lower certainty in order to escape the evidence requirement. A
   claim the evidence does not support is removed, not blurred.
3. It may not widen scope. Evidence for one surface, one platform, one locale,
   or one set of files supports a claim about that set only.
4. It may not narrow scope silently in a way that misleads. If the narrowing
   matters to the reader, the narrowing has to be visible in the text.
5. A translation is a rewrite. It is subject to this rule in the target
   language, and its certainty and scope are measured against the source.
   `standards/TRANSLATIONS.md` rule 3 states the same duty for translation work
   and lists what must survive intact, and its rule 2 says which text counts as
   the source: the language the item was actually written in, which is often not
   English. Measure against that item, not against an English intermediate.

Illustrative, product neutral examples.

```
BAD:  Feature X works on every device.
GOOD: Feature X works on the devices listed on this page.
Why:  The evidence covered a listed set, so the claim may not be widened to all
      devices.
```

```
BAD:  Feature X is designed to keep your data private.
GOOD: (removed, pending evidence and an approved fact ledger entry)
Why:  The hedge leaves the reader with the same belief while the evidence for
      the privacy claim is missing, and a privacy claim also needs the ledger
      entry that SITE-WRITING 17 requires.
```

```
BAD:  Feature X may help reduce errors in some cases.
GOOD: Feature X reports the error count for the selected period.
Why:  An unverifiable benefit is replaced by the behaviour the evidence
      actually supports, not softened.
```

## Shape of the claim record entry

The review produces exactly this, one block per claim, and nothing else. The
record is this review's output. It is not the fact ledger of
`standards/SITE-WRITING.md` rule 17, which is a standing artefact and is named
in the LEDGER ENTRY field below.

```
CLAIM REVIEW RESULT: CLEARED | BLOCKED
SURFACE: <surface and locale>
CLAIMS: <count>

1.
CLAIM:     "<the claim exactly as written in the copy>"
LOCATION:  <file and line of the claim>
SUBJECT:   does | supports | protects | law
CATEGORY:  E1 | E2 | E3 | E4
LABEL:     <the assertion label the copy carries under SITE-WRITING rule 7, for
            site copy; "not applicable" otherwise>
EVIDENCE:  <what the evidence is, in one sentence>
EVIDENCE LIVES: <file and place within it, readable offline, or the source the
            copy cites under SITE-WRITING rule 6>
OUTCOME:   supported | downgraded | removed
NEW TEXT:  <the shipped wording after this review, or "removed", or
            "unchanged">
LEDGER ENTRY: <the approved fact ledger entry the statement matches, where that
            entry lives, and the person or role who owns it, for privacy, legal
            and compliance claims; "not applicable" otherwise>

2.
CLAIM:     ...
```

Rules on the claim record.

1. CLEARED is allowed only when every entry is supported or downgraded, every
   flagged claim names an approved fact ledger entry that matches its wording,
   and nothing is left BLOCKED.
2. A removed claim still gets an entry. The record of what was removed, and why,
   is the reason the same sentence does not come back in the next draft.
3. The CLAIM field is verbatim. A paraphrase hides the wording that was
   actually reviewed.
4. EVIDENCE LIVES names a place a reader can open, by reading the repository or
   by following the source the copy carries under `standards/SITE-WRITING.md`
   rule 6. If it names nothing a reader can open, the claim is unverified
   regardless of what the reviewer believes to be true.
5. The claim record itself obeys the editorial rules, including the em dash ban.
