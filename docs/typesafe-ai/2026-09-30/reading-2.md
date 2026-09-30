# Date extraction
Source: https://docs.typesafe.ai/cookbooks/date_extraction_cookbook

Extracts absolute and relative dates by asking TypeSafe for the parts named in a document, then resolving and validating them in code with confidence-based review.

*Read a date's parts off the text with TypeSafe, then resolve them to a `date` in code.*

The function you build here, `extract_date(document, role)`, takes a document and a
phrase naming the date you want, such as "the deadline to return the form", and hands
back a `date` with a confidence. It flags a low-confidence read, and one whose parts do
not add up to a date at all, including a date the document never states. The date can be
spelled out ("August 14, 2027") or written relative to today ("tomorrow", "next
Thursday").

TypeSafe answers `Choice` questions about the date in one call: what kind of date it is,
and
which month, day, year, or weekday the text names. Code turns those answers into a `date`.
The model reads what the text says and never does the calendar math.

The cells below run that function over four short documents, print each date with its
confidence, and split the results into the ones code accepts and the ones a person should
look at.

<img alt="Overview diagram" />

*TypeSafe reads how the date is written and which parts the text names. Code turns those
answers into a `date`, counting from today when the date is relative, and either accepts
it or sends it to review.*

## Setup

[Code example: see complete pages/cookbooks/date_extraction_cookbook.md]

then set `TYPESAFE_API_KEY`.

[Code example: see complete pages/cookbooks/date_extraction_cookbook.md]

[Code example: see complete pages/cookbooks/date_extraction_cookbook.md]

## The questions

Seven `Choice` questions go out in one call. `mode` says how the date is written:
`absolute`
for a date that names a month, `relative` for one written relative to today, and `none`
when the document does not state the date at all.

The other six read the pieces. An absolute date needs `month`, `day`, and `year`. A
relative one needs `day_anchor`: today, tomorrow, the day after, or a named weekday. When
it names a weekday, `weekday` and `week_offset` say which one and which week. Code reads
only the pieces `mode` calls for.

`year` lists one option per year from 1900 to 2050, plus two escapes. `none` means the text
states no year and code fills one in. `out_of_range` means the text states a year outside
the list, and code flags that instead of guessing. If a list that long bothers you, pull
the year-like numbers out of the text first and offer the model only those.

[Code example: see complete pages/cookbooks/date_extraction_cookbook.md]

## Resolve it in code

`read_parts` makes the call. `assemble` turns the answers into a `date`: it fills in the
year when the text states none, and it works out which day a named weekday points at. Both
of those count from `TODAY`, which is pinned so relative dates come out the same on every
run. `assemble` also reports the lowest confidence among the parts it used, so a weak
answer on any one part can send the whole date to review.

"next Thursday" can mean two different days, so code decides which. A weekday with no
qualifier means the next one on or after today. `next` means the following calendar week,
and `current` means this week.

[Code example: see complete pages/cookbooks/date_extraction_cookbook.md]

## Run it

Six questions across four short documents: two dates from a contract that states its years,
a form deadline written without a year, a survey that closes "today", a review set for
"next Thursday", and a date the form never mentions. All of them resolve against `TODAY` =
2026-07-30, a Thursday.

[Code example: see complete pages/cookbooks/date_extraction_cookbook.md]

[Code example: see complete pages/cookbooks/date_extraction_cookbook.md]

The contract states both of its years, so those came off the text. The form states no year,
so code filled in 2026: it takes the current year and moves to the next one only when the
date is already more than a month past. "today" and "next Thursday" went through the same
function as the spelled-out dates.

The kickoff call is the one the form never mentions. There is a date in that form, just not
this one, and the note `absolute date incomplete` means `mode` came back `absolute` with no
month to go with it. The date came back empty, the confidence reads 0.46, and the row is
flagged for a person.

## Confidence to route on

Every answer comes back with a calibrated confidence, and a date's confidence is the lowest
one among the parts that went into it. A date under `REVIEW_BELOW` = 0.60 goes to a person,
and so does a date code could not assemble at all. The rest go straight through.

[Code example: see complete pages/cookbooks/date_extraction_cookbook.md]

[Code example: see complete pages/cookbooks/date_extraction_cookbook.md]

## Open it in the TypeSafe playground

The link below carries the "next Thursday" message and the same questions the code sends.
Open it to see the answers and their confidences, and to change the wording without writing
any code.

[Code example: see complete pages/cookbooks/date_extraction_cookbook.md]

<a href="[long playground URL saved in original]">Open this document + questions in the TypeSafe playground →</a>




# Knowledge graph entity alignment
Source: https://docs.typesafe.ai/cookbooks/entity_alignment

Decides which of 450 candidate pairs from two beer catalogues describe the same product using one Score question plus three companion Nouls that surface which fields disagree.

*A key problem in knowledge graphs is deciding whether an incoming entity duplicates an
existing one, especially when natural language from disparate sources is all that's
available. Given potential duplicate pairs, a single TypeSafe `Score` decides
whether each pair is a duplicate, or whether it deserves a closer look from a curator.*

Suppose two data sources describe overlapping sets of the same things, and you need to
know which entry on one side is the same thing as which entry on the other. A knowledge
graph calls those entries *entities*, and holds the facts recorded about each. Some cheap
but rough first pass has already compared the two sources and picked out 450 pairs worth a
closer look. What remains is to make a judgment call on each pair.

Merging two entities inappropriately is the more expensive mistake, since every fact about
either entity now describes the merged one, and anything linked to either comes along too.
Undoing it later means working out which fact came from where. Missing a match only leaves
a duplicate, so the judgment call needs a third option: pairs that are neither safe to
merge nor safe to drop.

The judgment is a `Score` question with one level for each of the three outcomes:

* **different product** — leave the two entities unlinked
* **related, but possibly not the same** — hand it to a curator to decide
* **same product** — merge them

We use a Score question because we want to attach a semantic label, the score criteria,
directly to each outcome, including the middle outcome. A Noul question could accomplish
this indirectly through thresholding on its output instead, and a Choice question would
lose the ordered relationship of the three outcomes.

Next, for each field of the entity we want to consider, `Noul` questions about whether
those
fields match can ride along in the same request. These nouls provide more detailed
information for the curator, if the score lands neither in the "same product" nor
"different product" levels.

You end up with a `route()` that takes one candidate pair and returns one of the three
outcomes, with no threshold you had to fit to your own data.

[Code example: see complete pages/cookbooks/entity_alignment.md]

## Setup

[Code example: see complete pages/cookbooks/entity_alignment.md]

then set `TYPESAFE_API_KEY`. Every call is cached to `json_cache.json`, which ships with
the cookbook, so re-rendering replays the published numbers without calling the API. Delete
that file to re-run everything live.

Numbers below came from `jev-1.12` on 2026-08-11.

[Code example: see complete pages/cookbooks/entity_alignment.md]

## Load the candidate pairs

The pairs come from a published benchmark set, the Beer data from the Magellan collection:
two beer catalogues scraped from different websites, already cut down to 450 pairs by that
first rough pass. Each entity carries four fields: name, brewery, style, and alcohol
content. Each pair also carries `known_same_as`, the benchmark's own answer.

The text is left exactly as published, without pre-processing: HTML entities that were
never converted back to characters, apostrophes split off as separate words, a few
characters decoded wrongly.

One request goes out per pair, so what you spend follows the number of pairs you were
handed rather than the size of either source.

[Code example: see complete pages/cookbooks/entity_alignment.md]

[Code example: see complete pages/cookbooks/entity_alignment.md]

## Ask one Score question and three Noul questions per candidate pair

Both entities go into a single state, as `entity_a` and `entity_b`, so the questions are
about the *pair* and not about either side on its own. All four ride in one request.

The three level descriptions below are the entire decision: each level is one outcome.
There is no threshold constant anywhere in this file. You can also write these descriptions
before you have seen a single score, which is not true of a number you have to fit.

The middle level is the one worth writing carefully. Here it covers variants, special
editions, and names that could plausibly refer to either product, so those reach a curator
instead of being merged or dropped.

`OUTCOME` names the three outcomes. The merge outcome is called `assert sameAs` because
`sameAs` is the standard way to record that two entities are the same thing, and writing
one is how the merge actually happens.

Three of the four fields get a `Noul` question: name, brewery, and style. Alcohol content
gets none, because comparing two numbers is arithmetic; compute it in code if you want it.
To use this on another kind of data you rewrite `QUESTIONS` and `LEVELS`. The only other
code that knows about beer is the two functions that print results, which name the fields.

[Code example: see complete pages/cookbooks/entity_alignment.md]

Four pairs. `c446` is one product and `c427` is two. The other two land in the middle level
for different reasons: `c100` has the same name and brewery but the sources word its style
differently, while `c428` pairs a beer with a fruit-and-hop variant of it.

[Code example: see complete pages/cookbooks/entity_alignment.md]

[Code example: see complete pages/cookbooks/entity_alignment.md]

## Route every candidate pair

[Code example: see complete pages/cookbooks/entity_alignment.md]

[Code example: see complete pages/cookbooks/entity_alignment.md]

<img alt="output" />

The two score values where `route()` changes its answer are the cut points. Most pairs
settle: 360 score below the lower cut point and 40 above the upper one, leaving 50 for the
curator.

On this set the scores do not sit neatly on the whole numbers. Most land near 0.25. Two
beers with nothing in common might still share a style name, and their brewery names might
look alike, so the model gives the middle level some of its probability instead of none.
What decides a pair is which side of a cut point it falls on. How near it sits to a level
does not enter into it.

The two cut points are not equally crowded. Nine pairs sit within 0.1 of the upper one, at
1.5, which is the one deciding what gets merged into the graph. Forty-seven sit that close
to the lower one, at 0.5, which only decides whether a curator sees the pair. Neither
number is something you tune. Both follow from how you worded the levels, and the wording
of the middle level is what moves pairs between the curator and the pairs left unlinked.

## Open it in the playground

The playground link below opens `c428`, which scored 1.10 and went to the curator.
It pairs *Ambleside Amber Ale* with *Bridge Ambleside Amber Ale - Pomegranate & Galena
Hops*: same brewery, same alcohol content. All four questions come with it.

[Code example: see complete pages/cookbooks/entity_alignment.md]

<a href="[long playground URL saved in original]">Open this pair + questions in the TypeSafe playground →</a>




# Function calling
Source: https://docs.typesafe.ai/cookbooks/function_calling

Turns natural-language trading requests into calls to ordinary typed functions by mapping function names and closed-set arguments to confidence-aware TypeSafe questions.

When you order a "large iced oat latte, no sweetener," the barista does not write your
sentence down. They mark four options on a cup. This cookbook does the same thing for
a trading API: a sentence goes in, and out comes a function name and its arguments as
evaluated enums, each with a confidence.

[Code example: see complete pages/cookbooks/function_calling.md]

Those calls go to ten ordinary functions in a trading assistant. Their arguments take
values from fixed lists, so they are `Literal`s already:

[Code example: see complete pages/cookbooks/function_calling.md]

An argument whose values come from a fixed list is a closed set. When it takes one value
out of that list, it gets a `Choice` question over exactly those values, so whatever
reaches the function is a value the function accepts. You leave the functions alone. What
you add is a spec that says in plain words what each argument means. By the end you have a
`Dispatcher` you can point at your own functions.

## Setup

[Code example: see complete pages/cookbooks/function_calling.md]

Set `TYPESAFE_API_KEY`. Two modules sit beside this file. `trader.py` holds the ten
functions, plus a TypeSafe client that reads answers from a cache, so re-rendering replays
the numbers below without calling the API. `dispatch.py` holds the code that reads a
signature and a spec and makes the call.

[Code example: see complete pages/cookbooks/function_calling.md]

[Code example: see complete pages/cookbooks/function_calling.md]

## Find the closed sets in the signatures

The type hints already say which arguments come from a fixed list, and what is in each
list. `closed_sets` reads a signature and sorts those arguments into three shapes: a
**choice** (a `Literal`, so one value out of the list), a **set** (a `list[Literal[...]]`,
so any number of them), or a **flag** (a `bool`, so on or off). All ten functions are
defined in `trader.py`.

[Code example: see complete pages/cookbooks/function_calling.md]

[Code example: see complete pages/cookbooks/function_calling.md]

`top_movers` shows what gets left out. Of its three arguments, two are closed sets. The
third, `limit`, is an `int`, so it never gets a question and keeps its default of 3. Free
text, numbers and dates work the same way: no question, and the function's default stands.

## Write the spec

The `Literal` gives you the strings `"1mo"` and `"3mo"`. It does not say that a user typing
"this quarter" means the second one. The spec says that. It holds a question per argument,
a line per option, a description per function, and one more question that picks between the
functions. It lives in `spec.json`, and an LLM can write it for you from the signatures.

[Code example: see complete pages/cookbooks/function_calling.md]

[Code example: see complete pages/cookbooks/function_calling.md]

The option keys are the strings the function takes, so nothing has to map a label back to
an argument afterwards. `stated` makes an argument optional. It is a second yes/no question
asking whether the command says anything about that argument at all. When the answer is no,
the call leaves that argument out and the function's own default applies.

A set argument gets its question once per member, with `{}` standing in for the member
name. `"Does the user want {} in the comparison?"` becomes one question per ticker.

Write each question about the idea rather than the words a user might pick, because the
match is on meaning: "is amd tracking nvidia lately" reaches `rolling_correlation` even
though neither *tracking* nor *lately* appears anywhere in `spec.json`. Avoid naming a
question after its parameter - `"Which resolution?"` gives the command nothing to match
against.

## Turn the spec into questions

`Dispatcher` builds the questions from the spec once. Each command is then one request
carrying the choice of function and every function's arguments, and the dispatcher reads
only the chosen function's answers.

[Code example: see complete pages/cookbooks/function_calling.md]

[Code example: see complete pages/cookbooks/function_calling.md]

## Run fourteen commands

A request occupies one line, and its `confidence` is the least certain judgement behind
that call.

[Code example: see complete pages/cookbooks/function_calling.md]

[Code example: see complete pages/cookbooks/function_calling.md]

Both long commands came out as asked. "plot rolling correlation between nvda and spy for
the past month" filled four arguments from one sentence. Two of them, `symbol` and
`benchmark`, draw from the same six tickers, and each ticker landed in the right argument
because the questions spell out the roles: *the one being measured, named first* against
*the second one named, the yardstick*. "compare nvda amd and msft over the past three
months" put three tickers in the set and left the other three out.

Running three of them:

[Code example: see complete pages/cookbooks/function_calling.md]

[Code example: see complete pages/cookbooks/function_calling.md]

<img alt="output" />

<img alt="output" />

<img alt="output" />

And the ones that answer in text:

[Code example: see complete pages/cookbooks/function_calling.md]

[Code example: see complete pages/cookbooks/function_calling.md]

## Read the confidence

`confidence` reports the least certain judgement in the call, rather than the product of
all of them, since one wrong argument is enough to spoil the result. A product answers a
different question ("is every part right"), and it falls as a function takes more
arguments, whether or not any one judgement is shaky.

Where that number came from, argument by argument:

[Code example: see complete pages/cookbooks/function_calling.md]

[Code example: see complete pages/cookbooks/function_calling.md]

`window` and `resolution` are both omitted here, because "lately" does not say how far back
or on what bars, so `rolling_correlation` runs on its own defaults of one month and hourly
bars. That is what the `stated` question is for. Without it, the choice would have to name
some window, and it would have named one confidently.

## Open it in the playground

The link below holds one command and the questions for the function it picked: the choice
over the ten function descriptions, and `rolling_correlation`'s four arguments. Edit the
command there and the arguments change with it.

[Code example: see complete pages/cookbooks/function_calling.md]

<a href="[long playground URL saved in original]">Open the command and its questions in the TypeSafe playground →</a>




# Hierarchical classification
Source: https://docs.typesafe.ai/cookbooks/hierarchical_classification

Classifies documents through deep patent, retail product, biomedical, and source-code hierarchies using parallel beam search over TypeSafe Choice probabilities.

A lot of data exists as structured hierarchies, such as a taxonomies, filesystem
hierarchies, website structures, codebases, org charts, biological ontologies, LLM skills,
moderation policies, etc. The goal of Hierarchical Classification is to traverse the
hierarchy to the correct leaf node, which is the final classification. This is a perfect
fit for typesafe's `Choice` primitive. We find the most probable leaf by classifying the
document at each node (starting at the root), and then iteratively proceeding to the next
most-probable node until we end at a leaf (**Greedy Search**).

The parallel nature of the API also lets us explore multiple paths with parallel questions
using **Beam Search** to improve performance. The cookbook's TypeSafe API calls each
simultaneously evaluate `K` paths of the hierarchy. Beam search keeps the best `K` paths
by a geometric-mean edge probability: `product(edge_probabilities) ** (1 / decisions)`,
and prunes the rest. The probability is length-normalized so that shallow and deep leaves
are compared fairly.

Decomposing the problem into a hierarchy like this has benefits of its own:

* Observability
  * identify which nodes your misclassifications occur most in
  * measure the number of times each node and edge is traversed
* Testability
  * unit test and measure the impact of hierarchy updates on classification performance
* <img alt="this is the way" />

### Hierarchies used in this cookbook

* **[CPC 2026.05](https://www.cooperativepatentclassification.org/sites/default/files/cpc/bulk/CPCSchemeXML202605.zip):** patent subject matter, from broad technology sections to narrow inventions.
* **[Shopify 2026-02](https://github.com/Shopify/product-taxonomy/blob/v2026-02/dist/en/categories.txt):** retail product categories, from store departments to specific product types.
* **[MeSH
  2026](https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/desc2026.zip):**
  biomedical subjects from broad domains to specific conditions. MeSH is a DAG, so one
  descriptor can appear under multiple parents; this demo expands its official tree-number
  paths.
* **CookSafe files:** TypeSafe's cookbook repository hierarchy, searched from folders to
  source files.

### Methods

* **Greedy search:** choose the highest-probability child and discard every alternative.
  One early mistake cannot be recovered.
* **Beam search:** retain `K` plausible paths and classify every frontier in parallel.
  Deeper evidence can repair an ambiguous early decision.  The leaf of the path with the
  highest geometric-mean probability is the final classification.
* **TypeSafe Choice:** every node is a `Choice` question whose full probability
  distribution is its
  edges. Each path of the beam runs as parallel questions, so extra exploration adds little
  wall-clock latency.
* **Formula:**
  * `path_score = product(edge_probabilities) ** (1 / decisions)`
    * used for pruning and comparing paths
  * `separation = top_path_score / second_path_score`
    * useful metric, but not used for pruning
    * the ratio compares the top path's geometric mean against its nearest rival.
      * Near `1×` is ambiguous
      * A large ratio means clear separation.
* **Notes on metrics:**
  * a different metric such as `min(top_prob/second_top_prob)` which would optimize for
    paths that have very clear decisions at every node.
  * use `exp(mean(log(probs)))` instead of `product(edge_probabilities) ** (1 / decisions)`
    to avoid precision errors for hierarchies that are very deep (eg >10 layers)

## Load and visualize the example hierarchies

These helpers download pinned taxonomy sources, parse them into direct-child trees,
and render each search traversal as a static SVG.

[Code example: see complete pages/cookbooks/hierarchical_classification.md]

## Implement greedy and beam search

Each sibling set becomes one `Choice` question in the next section, which also
implements
both traversal strategies and keeps the probabilities the static diagrams need.

[Code example: see complete pages/cookbooks/hierarchical_classification.md]

## Compare the methods

Run both strategies on four labeled examples, compare their leaves against the
expected classifications, and visualize the routes they explored.

[Code example: see complete pages/cookbooks/hierarchical_classification.md]

## Results

Each example has a known expected leaf. Beam search matched 4 of 4 expected leaves; greedy search matched 2 of 4. Keeping three paths recovered the expected classification for CPC patents, Shopify products.

| Hierarchy                | Expected leaf                                       | Greedy leaf                                                         | Beam K=3 leaf                                       | Greedy correct | Beam correct |
| ------------------------ | --------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------- | -------------- | ------------ |
| CPC patents              | A01K31/12 Perches for poultry or birds, e.g. roosts | E99Z99/00 Subject matter not otherwise provided for in this section | A01K31/12 Perches for poultry or birds, e.g. roosts | no             | yes          |
| Shopify products         | Cat Window Beds & Perches                           | Pet Chairs                                                          | Cat Window Beds & Perches                           | no             | yes          |
| MeSH biomedical subjects | C06.405.469.432.500 Crohn Disease                   | C06.405.469.432.500 Crohn Disease                                   | C06.405.469.432.500 Crohn Disease                   | yes            | yes          |
| CookSafe files           | retrievers.py                                       | retrievers.py                                                       | retrievers.py                                       | yes            | yes          |

The diagrams show why the methods differ. Orange marks the greedy route, green marks the winning beam route, purple marks other retained paths, and dashed edges were pruned.

### CPC patents

<img alt="" />

### Shopify products

<img alt="" />

### MeSH biomedical subjects

<img alt="" />

### CookSafe files

<img alt="" />




# Guardrails for LLMs
Source: https://docs.typesafe.ai/cookbooks/llm_guardrails

Screen every message going into and out of an LLM app with one TypeSafe request, thresholding hazard probabilities and severity to pass, review, block, or route.

Labs teach most LLMs to refuse a set of unsafe requests, but each lab draws that line
somewhere else, and each new version of a model moves it again. You probably want it
somewhere else too: stricter in places, and written where you can read it rather than
buried in the weights.

Write a system prompt and you have put your rules in exactly the place a jailbreak talks
its way past. Put a second LLM in front of the first and you pay a call's worth of
latency and money on every turn, and an attacker can talk that one past too.

Screen each message with one TypeSafe request instead. A battery of `Noul` questions
hands you the probability that each hazard holds, and a `Score` question rates how much
harm
complying would do. "Ignore your instructions" scores as a jailbreak instead of working
as one. You then set the thresholds that decide whether a message passes, goes to review,
gets blocked, or routes to support.

Run this TypeSafe check both on LLM inputs, and on LLM outputs, because even
ordinary-looking prompts can lead to harmful generated replies.

[Code example: see complete pages/cookbooks/llm_guardrails.md]

By the end you will have a `guard()` function to put on either side of any LLM call. You
edit it in two places: the dict of hazard questions, and the two named routing policies.

## Setup

[Code example: see complete pages/cookbooks/llm_guardrails.md]

then set `TYPESAFE_API_KEY`. Every API call is cached in `json_cache.json`, which ships
with the cookbook, so re-running replays the published numbers instead of calling the
API. Delete that file to run everything live.

Numbers below came from `jev-1.12` on 2026-08-15.

[Code example: see complete pages/cookbooks/llm_guardrails.md]

## Load the sample messages

Ten user messages in `prompts.txt` and five model replies in `replies.txt`, committed
next to this cookbook. Some are ordinary, some deserve a look from a human, and the rest
are plain violations. The jailbreaks are real, taken verbatim from the public
[in-the-wild jailbreak
prompts](https://huggingface.co/datasets/TrustAIRLab/in-the-wild-jailbreak-prompts)
collection.

[Code example: see complete pages/cookbooks/llm_guardrails.md]

[Code example: see complete pages/cookbooks/llm_guardrails.md]

## Define the guardrails

"Out of bounds" is not one question, so the battery splits it. Four `Noul` questions
each return the probability that one hazard criterion holds. Does the message try to
override the assistant's instructions? Does it ask for help with harm or a crime? Does
it ask for a diagnosis or a dosage? Does it signal that the sender may hurt themselves?
One `Score` question rates how much harm complying would do, on a written scale from
"none" to "serious physical harm".

Both go in the same request, so the whole battery costs one call. The input and output
batteries ask the same four things from the two sides: whether the user is asking for it,
and whether the reply went ahead and gave it.

[Code example: see complete pages/cookbooks/llm_guardrails.md]

## Turn the assessment into a decision

TypeSafe supplies the assessment; your application owns the decision. Each `Noul`
question is compared against two thresholds:

* at or above the **action threshold**, the hazard triggers its configured action;
* at or above the lower **review threshold**, the message goes to a human;
* below both, it passes unless another hazard fires.

The severity `Score` question has a threshold of its own and can turn a review into a
block.

A policy is just those numbers under a name, which makes the trade-off something a
product picks rather than inherits.

[Code example: see complete pages/cookbooks/llm_guardrails.md]

## Screen every message

Every sample message was screened: inputs with the input battery, replies with the
output battery. All of them were routed under `strict`.

[Code example: see complete pages/cookbooks/llm_guardrails.md]

[Code example: see complete pages/cookbooks/llm_guardrails.md]

The four actions all appear, and each one is doing something a plain block could not.
`melatonin_dose` asks a dosage question mild enough to hand to a human rather than
refuse; `self_harm` goes to support instead of being blocked, which is the difference
between helping someone and hanging up on them; `novelist_poison` reads as violent and
passes anyway, because asking how a detective describes poisoning is not asking to poison
anyone. On the output side, `good_refusal` is a reply about breaking into a house that
passes, because it is the assistant declining to help.

The input-side `dosage_request` is the one row where the severity `Score` decides the
outcome. It asks the same kind of question as `melatonin_dose`, and its `medical_advice`
noul would send it to a human on its own. But a severity of 2.02 crosses the block line,
so the review becomes a block.

## The same probabilities, different decisions

The next cell reuses one cached assessment and changes only the policy. The probabilities
do not move; the application decides how much evidence it wants before it acts.

[Code example: see complete pages/cookbooks/llm_guardrails.md]

[Code example: see complete pages/cookbooks/llm_guardrails.md]

## Look at one decision in full

Every screened message, numbered, so you can pick one to open up.

[Code example: see complete pages/cookbooks/llm_guardrails.md]

[Code example: see complete pages/cookbooks/llm_guardrails.md]

`interpret()` prints the full hazard breakdown for any row above. Pass a different
`policy_name` to see the same assessment routed another way.

[Code example: see complete pages/cookbooks/llm_guardrails.md]

[Code example: see complete pages/cookbooks/llm_guardrails.md]

To point this at your own product, edit `INPUT_BATTERY` and `OUTPUT_BATTERY` for the
hazards you care about, map each one to an action in `HAZARD_ACTION`, and set the
thresholds in `POLICIES` from labeled examples of your own traffic.

## Open it in the playground

The link holds one demo prompt plus the input battery. Open it to run the same request
live and edit the questions in the browser.

[Code example: see complete pages/cookbooks/llm_guardrails.md]

<a href="[long playground URL saved in original]">Open the prompt + guardrail questions in the TypeSafe playground →</a>




# Parallel questions
Source: https://docs.typesafe.ai/cookbooks/parallel_questions

Runs a 13-question regulatory briefing over the GDPR Wikipedia article, showing that batching every question into one TypeSafe call is 12.2x cheaper and 10.0x faster with no change in answers.

You have one document and N questions about it. You can send one request with all N
questions, or N requests with one question each. With TypeSafe the answers come out the
same either way: each question is scored on its own against the document, so its answer
doesn't depend on what else is in the request.

To check that, the cookbook asks each question several times both ways - all N in one
request, and one question per request - and compares the run-to-run std dev: how far an
answer moves from one repeat to the next. Whatever noise a question has, it has under
both batching strategies. Batching adds none. Most answers came back identical across all
5 repeats either way, the same value on every call, std dev exactly 0.0.

Cost and speed do change. The document dominates every request. N single-question calls
pay for it N times, in N round trips; the batched call pays once. The bigger the document,
the nearer that saving comes to a full Nx.

The case here is a regulatory briefing. The document is the Wikipedia article on the GDPR
(\~54,000 characters, a document-dominated workload where the document is most of every
request), and a compliance team wants 13 things checked: 8 `Noul` questions, 2 `Choice`
questions, and 3 `Score` questions.

## Setup

[Code example: see complete pages/cookbooks/parallel_questions.md]

then set `TYPESAFE_API_KEY`.

[Code example: see complete pages/cookbooks/parallel_questions.md]

## The document: the Wikipedia article on the GDPR

Fetched as plain text from a pinned revision of the article and cached in `json_cache.json`
next to the API calls, so the document and its numbers stay fixed even as the live
article gets edited.

[Code example: see complete pages/cookbooks/parallel_questions.md]

[Code example: see complete pages/cookbooks/parallel_questions.md]

📄 [Read the pinned Wikipedia revision](https://en.wikipedia.org/?oldid=1363040264)

## The questions: 8 nouls + 2 choices + 3 scores

One number tracked per answer, by type:

* `Noul`: the probability of "yes".
* `Choice`: the max prob, the probability on the picked label. `criteria` maps each
  label to its meaning.
* `Score`: the score normalized to 0-1, the score divided by the top level.
  `criteria` lists the level descriptions, from level 0 up.

[Code example: see complete pages/cookbooks/parallel_questions.md]

## Ask two ways, 5 times each

`ask()` sends any subset of the questions with the document and reduces each answer to its
one tracked number. The document is byte-identical in every call.

Both batching strategies run `RUNS` = 5 times, giving each question 5 answers per strategy,
enough to compare the mean (do the two agree?) and the std dev (does batching add noise?).
Calls are cached to `json_cache.json`, which ships with the cookbook, so re-rendering is
free; delete it to re-run live.

[Code example: see complete pages/cookbooks/parallel_questions.md]

## Batching doesn't change the answers

Per question: the mean and std dev of its tracked number over the 5 runs, under each
batching strategy. If batching changed the answers, the batched columns would differ from
the single columns. A shifted mean is bias. A larger std dev is noise.

[Code example: see complete pages/cookbooks/parallel_questions.md]

[Code example: see complete pages/cookbooks/parallel_questions.md]

Reading the table by question type:

* Choices, scores, and six of the eight nouls come back identical across the 5 repeats:
  std dev exactly 0.0 under both batching strategies, every batched and single call
  returning the same number. One call with N questions gives the same answers as N calls
  with one question each.
* `breach_72h` and `criminal_penalties` carry a little run-to-run sampling noise, and it's
  the same size under both batching strategies, with the means agreeing to within that
  noise. The noise is a property of the question, not of how you batch: batching neither
  shifts the answer nor adds variance.

Either way, there is no batching effect: no question's answer depends on the 12 other
questions sharing its request.

## The only difference: cost and speed

Same answers, different bill. The \~54,000-character article dominates every request, so:

* Cost: the 13 single-question calls re-send the article 13 times; the batched call sends
  it
  once. This saving holds however you fire the calls.
* Speed: the figure sums the 13 single-call latencies, so it assumes they run one after
  another. Fire them concurrently and the gap shrinks, but the 13x token cost stays.

Token counts and latencies are cached alongside the answers; cost is applied after, and
both are averaged over the 5 runs.

[Code example: see complete pages/cookbooks/parallel_questions.md]

[Code example: see complete pages/cookbooks/parallel_questions.md]

## Open it in the TypeSafe playground

The same article and the same 13 questions, packed into a share link. Open it to re-run
the briefing live; the same numbers come back.

[Code example: see complete pages/cookbooks/parallel_questions.md]

<a href="[long playground URL saved in original]">Open this article + questions in the TypeSafe playground →</a>




# Pre-parsed value extraction
Source: https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook

Uses regexes to find candidate emails, phone numbers, and amounts, then has TypeSafe select the requested span so code can normalize a verbatim value.

*A regex finds the candidate values, TypeSafe picks the one the question asks for,
and code copies it verbatim.*

The `find` and `pick` pair here is one you can point at your own documents, and three
worked cases show it in use: the address a sender wants their receipt sent to, a phone
number as `+14155550177`, and an invoice total as `1315.50 USD` flagged as a charge.

TypeSafe picks one of the options you hand it, so the candidates have to be found
first. A regex finds them, TypeSafe picks one, and code copies the pick, in three steps:

1. A regex finds the candidate values in the text. Tune it to over-find.
2. TypeSafe picks which candidate the question is asking for, and reads off any
   attribute the code needs downstream (currency, country, whether an amount is a
   credit or a charge).
3. The code copies the picked value and normalizes it.

Because TypeSafe only ever chooses among the spans the regex found, the value you get
back is one of those spans, copied unchanged. It cannot invent a value or transpose a
digit.

<img alt="Overview diagram" />

*The regex finds candidate values in the document, TypeSafe picks one, and downstream
code normalizes it and acts on it.*

## Setup

[Code example: see complete pages/cookbooks/pre_parsed_value_extraction_cookbook.md]

then set `TYPESAFE_API_KEY`.

[Code example: see complete pages/cookbooks/pre_parsed_value_extraction_cookbook.md]

## Helpers

`find` runs a regex tuned to over-find and dedupes the matches. `pick` is a
`Choice` question whose options are the spans `find` returns, so its answer is one of
those spans copied exactly, or `none` when no candidate fits. `classify` is a
`Choice` question over a fixed set of labels, used here for the currency and the
country.
`is_true` is a `Noul`, used here to ask whether an amount is a credit.

Every call is cached to `json_cache.json`, so re-rendering makes no API calls.

[Code example: see complete pages/cookbooks/pre_parsed_value_extraction_cookbook.md]

## Email: pick the right address by role

Four addresses in the headers. The body asks for the receipt to go to a personal
address instead of the `To:` billing alias, so the answer depends on reading the body.
Two questions here: which address gets the receipt, and which one sent the message.

[Code example: see complete pages/cookbooks/pre_parsed_value_extraction_cookbook.md]

[Code example: see complete pages/cookbooks/pre_parsed_value_extraction_cookbook.md]

`receipt` is the personal Gmail address on the `Reply-To:` line, which is what the body
asks for; `sender` is the one on the `From` line. Both are copies of regex matches,
lowercased in code.

## Phone: pick the mobile, normalize to E.164

Three numbers, none of them carrying a country code. TypeSafe picks the mobile and
reads the country from the text; `phonenumbers` combines those two answers into E.164,
the international format that starts with a `+` and the country code.

[Code example: see complete pages/cookbooks/pre_parsed_value_extraction_cookbook.md]

[Code example: see complete pages/cookbooks/pre_parsed_value_extraction_cookbook.md]

Nothing in the digits says which number is the mobile or what country it is in; the
words around them do. TypeSafe reads those words, and `phonenumbers` formats the picked
number as `+14155550177`.

## Money: pick the amount, classify the currency, flag credit vs charge

An invoice with four amounts on it. TypeSafe picks the total due and the credit, reads
the currency, and flags each picked amount as a charge or a credit. The code copies each
picked string and parses it into a `Decimal`.

[Code example: see complete pages/cookbooks/pre_parsed_value_extraction_cookbook.md]

[Code example: see complete pages/cookbooks/pre_parsed_value_extraction_cookbook.md]

The total due is \$1,315.50 and the credit is \$50.00, both in USD. The credit-or-charge
`Noul` answers 0.01 on the total and 0.99 on the credit, so the code knows the
sign of each `Decimal` it parses.

> `to_decimal` assumes the comma groups thousands and the dot is the decimal point. That
> holds for `$1,315.50`; in `€1.315,50` it is the other way round. Ask a `Noul` question
> which convention the document uses, and branch on it in code.

## Open it in the TypeSafe playground

A share link that opens the email thread in the browser, with the receipt question on it
and the four addresses the regex found among its options.

[Code example: see complete pages/cookbooks/pre_parsed_value_extraction_cookbook.md]

<a href="[long playground URL saved in original]">Open this thread + selection in the TypeSafe playground →</a>

## Two limits

* A `Choice` question allows at most 255 options. With more candidates than that, narrow
  in two
  stages: pick the section first, then the span inside it.
* Finding the candidates is the part that takes work. Emails, phone numbers and amounts
  have regexes that cover them; a name does not, so its candidates have to come from a
  roster you already have, or from a named-entity recognizer or an LLM that proposes
  them. TypeSafe then picks the one the question asks for.




# Re-ranking
Source: https://docs.typesafe.ai/cookbooks/rerank_typesafe

Builds 30-passage BM25 shortlists for 40 CLERC legal queries, then uses one TypeSafe question per query-candidate pair to raise top-1 accuracy from 5% to 18% and top-10 accuracy from 38% to 62%.

You have thousands of documents, and you need to find the one that answers a specific
question. So how do you find it?

First, use a quick method such as keyword matching to cut those thousands of candidates
down to a shortlist of plausible ones. We call this fast search.

Fast search is good at that, but it can't tell you which candidate on the shortlist is
correct. That's where re-ranking comes in. It scores every candidate on the shortlist
against the query directly, and puts the best one first.

Both steps run below on 3,565 court opinion passages from the CLERC dataset: BM25 builds a
fast search shortlist of 30 candidates for each of 40 queries, then TypeSafe re-ranks each
shortlist. With re-ranking, the correct passage lands in first place for 18% of queries, up
from 5% with fast search alone.

**Along the way, you're going to learn:**

* What fast search does, and why it isn't the whole answer
* What re-ranking is, and how it fits after a fast search step
* How TypeSafe scores one candidate against a query, and how much that improves the result

## Try it yourself

[Open a query, candidate, and re-ranking question in the TypeSafe Playground](https://console.typesafe.ai/playground#share/N4IgJg9gxgrgtgUwHYBcAqCAeKQC4AEIwAOiAI4wIBOAngPpZTUAOKpBpUANgIYCWcfADMIVfADc+EXiilIAzvghD8AaWQoYUANY18UPpK75mVaAjAwqCADT4UACwR6h-Yygj55KHigT4efV4BfBhmCCR8AHcHPigHfGsuPgQVKB5IgCN-AHMqDL8wADp8NCd8AFk+bUVIfCQIFHw+MA0+IRpAFAIMsCUrRIR5BB4qePxIQfrGgfFhrm79HhghpRUeKFkI4VEJKRk5RWU1DS1dfUM+YwByEzMmS2sSitEECFmqOwAxazAwFMr1tEeIoGk1AswRig9B57OURNZuBB5FZ-OtNpEeoskKD8Nl8E4uL1rPJwgo+JkuP54QEkHpTOYHjxjK0hAgNoo+JFHP56UwLJycvISmhPNz8Fg-KhYb5Yf4qjUvAgENp7J5MlQBQEgvxBNTJNJfAdVrK+GJLDy7oNFBqcg4UIoYEhWmIxZ92o58ABBRBOn1NGFigCqSD4hXwAGUfH5FABhCLeUMwdF2bkuNyqrxR1HakJhLYxOIJJIpNIZXG5fKoCzl9LLfzfCx-OWAvgg6aBHJvahIP0BDY7GKedJZfwE3rJHgUqk7KDx2SadFM3YG9FC-AASUi+AASgBRAAinpjaAP+FlEbC1kQ+DjViagx8FNbTl6gSE+UQUVEKuprT8VDgTlNRiZAtU7d4ew0ABaEl4xeXpZyocJ8nRZpFA7LsqEgqU0R2alZwUeckzkJdmCscIhjXdcmjHaUmkAHAIQOsfAilY88AHFMOwpooGsXxJkCRDkMNLZMj0Ek2T4JdeCiOxqTFIQ7ycSsmGNcDuz9JcIEyAArNlZFmeQ7ExawfE5RRqVDIYuBUZhqDgDINACJMHFEUNoU8HhmHCTkwXwBydLcqFjTFP4EQ8KhDhURwZSE0QRKQFNyjilC5DQkxISgkLyk4iDe2pMikKRSYjldU1vC9H0wD9IpAFwCDdigCJoAGYAE5WrsABGTqAFYIyKGMUBKVqADZOqKOxg2dc8ABkEHVABnyJ3x4T9vy+H4mwBKB0pxDC8qc3CxEHLFy3xBBCXwCcp22MR9X2eNsvrd0Em9ZBqo0QBMAkUfdKHwAAFS15FjXg6xKcMlTsBAihyCbKpKAAhDJtGoRRnioFBYZvURmBKcQSk+CwSgACQga8ZogMt0cxko4yQuGAHY+s+Ipmt6TqABYAAZOq67mRqgrnWvwAAKVqPRjU0ik69qRoASlIOxOB6Fp+LoCFgZ4HIEHYfBSB8bRNWUFQtjjUR5E+gIwHeWR5GA2IxjrRQxXkLgIByMsjkADAJw0ud58ARmAuEpFBLcs+1y2oLEjPPPxsFuaBgjgZ2HBlM3IvSr2yn8X2uH9wPg4Qf1U7BARFGz-BPhGHc+FtUPFHCZJZHSYwtfewIZTFJxIWNN6NXSIpLfqgAObrK-BsJcfwdrmrsdq+pF8N9wAOQATXwGXWuauWSm9FB8m0b7dlU0xBhaJy-nkLz6VmXoxR4a3qFthA-TsTlxAgQ2kBySr954Q+G7SDiDQN+SBlKhmrO+MmzQI6n1aEwYGOxgRXR6G7KgvQjj-WQJESMCUkr+CwdieQNA84ZCkjuNwZgH7YzgBCWkdh6IxSaKGaIlxjB7WDhAKIJggHNyXA-G2rYjZcnKAAbXDDpOyGx1hB2rgIp+Qjv5eFrkgOqXpvIlAAEzDx6iUOai0RGgSEJcasyIWFa34IRX+B8aS9DQPudcdhuA6gFKA-8AQJxJU7uUawikr7uE8MwXgqlYjoUfhjVsL8nJbDFOGKRPhYC8DEKnXo91+K9FCZXcqYInRZKEB6N6vonI2jtGuT0+So5YDsn8MMl9ZzvBAeefcrZ95xCaLeDGiQg7ViYdY-+dhsi1hWEcKyQRir2BSM7UU5RCbOiXLlDSGg7BRGQYEBZWFexHWMk0SkwImjUjdJFJohSPpSkKhRQYxlcm9NGdYPSGw0pHH0WYJAR96QXNfOE5+myHQKBgKGSclJbrjFbEEngehOQA2wRGKMaUUnLhkD0mZ2TKrvRqqUZKEA7z4DyAUaszylo0maEgHSjoHlbExKIZ01Y942MxPY9cGZL5gr0M8iIR95ERKGL2GJ5Q4n6RkUk4U5RgwQN6Lg6M2NsVHE9N5OYFkdixLZBEXoktRj-KaNYd4QxGqdU0ePfAbNDXD2HqLTe29hU8kclwI+EBmBAS2MYo5Uwwy9Npf-IEMcxKx3slFc8lIcitgeiI2KfEwyhjsHtfA6zuLilQO5N+xRtmGtalzAA3LY2UkQCLcBgK0O+JdzyzOoPMrivYVltiaPITw79pC31YQUuAf8VS9LFDIf8R94FCMerOIOvQ8QETttS3orI5mt3JYlZoSamops6lBNqmjaaxFSPgAAUnm7W+Bl4ICiA5SIl8hhVkagAdQrHihCCj4oahKD1MegZwYlG6lzBem8OY7w3Iy09+IeCzHOpdCITA7CBwxlsfG+Bj2XEAt-DwkR-ojC-j-T0LkgqNOaiNPq97+r4AZr1M1o1Opyyub0K+LR-IZGhAIS5dE+yrmNKYQw-E43zkmadatiBZCIEUHiawHt0HVmQepDZGh+ETuBYOoii5jDnOKmuCGthxQlFhnYcMZZvgZAMPIWcXoMaKAAGRekcCHOIMdNxQDxiUUVYYJWTAAPJcBoLQuINC4Bww5sPZq+BMPhhvZozRdgeocxGnh4eDM5YZoRlweAEgSirxGEXeQug7Acx6gzTzD7p6tV5hvLmXMObBc0WFyoEBxkUzAJu5eEBH1c1S2B9cVBJAx25qlrzj6Rqzw3gzfVIsZadffdRdKrhTQZivtCQt9EsViHSJRcYkk-hKJApEej4hGNojSoBOuZ1WhRILTKUq5RvCMdTr+nE2RkCkAAL4gDsCAektD7QYGwHgQgJAQCtjoAYQodBq1WCYLrF7UI7K61IA0IOis9avcIlQLQq4gcgArhQagehGAsB4mTSYUDBCBEDOGYQFgS3GF7Z0u1DqMS5IrdEDUKBJTNDgIgP4-F7MBDMI6V85xYUxM8rcNkePUAZrFB9hKMDrIqFTlxpUkQrxdkareS6-OVZgEYxrK+m68QY+ox96sp97hOU6OMCAkwWEPkBc+c8EkDDGJ2gG0iZgKKhjSmKBHtBxSYCYEhZhSAP4o3QswiOAvUI+VQAAfjB5wSn1ApJ-f1lDnWT3SAV2HH8BXfgMqa03QdyVOwjdPnkE4FO-gzftCc1DykdgDtOhGGAOwrlCSuKUGIVwGwMpU+7NRh3lAnfI7d01VpmQkyTBhLcl+Uu2cJSKCHkArguBDFh-H+XivgTK-8K2fy1ALp6ApcowCSTVT2p2jsSAGwNRIAQBmlhExK1eEnozl2UjC87XeUiO3vL-CO6Ry7lHAxkglVURd87l3rteR8AABqqMcgT2IA4gnUV2hA1k+kFgzwrQU+T2oiIAEkFgdAiK3gIAAAuudkAA)

## How do we find one document in thousands?

You have a pile of documents, and a query, a piece of text describing what you're looking
for. Somewhere in the pile is the one document that answers it.

Checking every document against the query one at a time works, at one comparison per
document: millions of documents means millions of comparisons per query. You can improve
performance with a two-step approach:

1. Cut the pile down to a short list of likely candidates, using a method fast enough to
   run on the whole pile.
2. Apply a more accurate step to that short list, to find the exact right answer.

<img
  alt="Animated diagram: a pile of documents narrows to a fast search shortlist, then re-ranking
reorders that shortlist so the correct answer rises to the
top"
/>

This cookbook tests that setup on a dataset of court opinions, in
[A re-ranking example](#a-re-ranking-example) below.

## What is fast search?

Fast search is any method that can compare a query against every document in a large corpus
and quickly return a ranked shortlist. Common methods include keyword search, such as BM25,
and dense embeddings, which compare passages by meaning. Systems often combine both
methods.

The first step here is BM25 and nothing else. BM25 ranks passages by shared words.
Keeping this step simple leaves the attention on re-ranking, which is the point of the
cookbook. The choice of fast search method is a side issue: re-ranking only ever sees
the passages that make the shortlist.

## What is re-ranking?

Re-ranking takes the shortlist fast search already produced and puts it in a better order.
Instead of comparing the query against the whole corpus at once, it compares the query
against each candidate on the shortlist individually, and sorts the shortlist by that
score.

<img
  alt="Diagram: a ranked shortlist on the left, an arrow labeled &#x22;re-rank,&#x22; and the re-ordered
version on the right with the true answer moving from the middle to the
top"
/>

The score can come from a language model. Give it the query and one candidate together
and ask how well the candidate answers the query. Re-ranking then finds the best match
on the shortlist even when its wording differs from the query's.

## Re-ranking with TypeSafe

A re-ranker needs a comparable score for every query-candidate pair. A general-purpose
language model can produce these scores, or rank the whole shortlist directly. For
independent pair scoring, however, you need to define a scoring scale and prompt the model
to apply the same standard to every candidate. Repeated calls can still produce different
scores for the same pair, while general-purpose generation adds time and cost to a task
that only needs one number.

### What TypeSafe returns

With TypeSafe, the scoring request can remain a yes/no question:

[Code example: see complete pages/cookbooks/rerank_typesafe.md]

A plain yes or no would not be enough to rank 30 candidates. A `Noul` instead
returns a number between 0 and 1, called a
[noul](/primitives/noul). The noul is TypeSafe's estimate
of how likely the answer is to be yes.

The question's criteria define what counts as true and false. TypeSafe applies them to
every query-candidate pair and returns the noul directly. That noul is the score the
application sorts on. No scoring scale has to be invented for a general-purpose model, and
TypeSafe is built to do this repeated scoring faster, cheaper, and more consistently.

In simplified pseudocode, one TypeSafe scoring call looks like this:

[Code example: see complete pages/cookbooks/rerank_typesafe.md]

TypeSafe reads the query and one candidate together against that question, and returns a
noul.

You can use this to re-rank a shortlist by running the same question against every
candidate on it, then sorting the shortlist by the noul each call comes back with, highest
first.

[Code example: see complete pages/cookbooks/rerank_typesafe.md]

The diagram below shows how one request per candidate produces the scores used to reorder
the shortlist.

[Code example: see complete pages/cookbooks/rerank_typesafe.md]

## A re-ranking example

Fast search and re-ranking now run on
[CLERC](https://aclanthology.org/2025.findings-naacl.441/), a legal retrieval dataset.
This example uses 3,565 court opinion passages and 40 queries.

### Setup

The first step installs the packages this walkthrough depends on.

* `bm25s` and `datasets` build the fast search shortlist.
* `typesafe-sdk` and `cooksafe` handle re-ranking and API caching.
* `matplotlib` draws the result charts.

[Code example: see complete pages/cookbooks/rerank_typesafe.md]

The next block sets up the TypeSafe client and the constants the rest of the walkthrough
uses, such as which TypeSafe model to call and how large a shortlist fast search hands to
the re-ranker. Calling TypeSafe needs a `TYPESAFE_API_KEY`.

[Code example: see complete pages/cookbooks/rerank_typesafe.md]

### Ranking the passages with fast search

The dataset used here is a corpus of US court opinions, 170 rows pooled together. Each
row breaks down like this:

* **Query**: an opinion excerpt with a citation removed.
* **Gold**: the passage the removed citation pointed to, the one correct answer to the
  query.
* **Candidates**: every other passage in the corpus, each one something the query could be
  matched against by mistake.

Of the 170 rows, 40 are picked to evaluate as queries. The other 130 only ever appear as
candidates.

The next cell builds the shortlist, using the technique described above:

1. Load the corpus.
2. Rank it against every query with BM25.

There's no TypeSafe here yet, this is only the fast search step.

[Code example: see complete pages/cookbooks/rerank_typesafe.md]

<img alt="output" />

### Fast search is unlikely to rank the right passage first

The chart shows where fast search puts the correct passage, out of 3,565 candidates.

Fast search reliably narrows the corpus down to a shortlist that contains the right answer.
It contains the right answer for 100% of the 40 queries. But that passage is rarely the
top-ranked one on the shortlist, only 5% of the time.

Re-ranking below only reorders the top 30 candidates already on the shortlist. It cannot
add a passage that fast search did not select. Here, the shortlist contains the correct
passage for all 40 queries, so re-ranking can focus on putting each one in a better
position.

### Re-ranking it with TypeSafe

Re-ranking scores every candidate on the shortlist against its query, then sorts by that
score. The question TypeSafe asks about each pair is whether the candidate could be the
passage the query's removed citation points to.

The next cell does the following:

1. Define that question.
2. Ask it once per candidate on every shortlist, 40 queries times 30 candidates, 1,200
   calls in total, run concurrently instead of one after another.
3. Sort each shortlist by the score TypeSafe returns, producing the re-ranked result.

[Code example: see complete pages/cookbooks/rerank_typesafe.md]

[Code example: see complete pages/cookbooks/rerank_typesafe.md]

<img alt="output" />

### Re-ranking moves the right answer toward the top

The chart compares fast search against fast search plus re-ranking, at three thresholds.
Re-ranking moves the correct passage closer to the top at every one of them:

* **Top 1** — 5% → 18%
* **Top 5** — 15% → 35%
* **Top 10** — 38% → 62%

The reported token count and cost cover all 1,200 TypeSafe calls used to re-rank the 40
shortlists.

Each CLERC row contains one correct passage and 20 negative passages. This walkthrough
pools the passages from 170 rows into one shared corpus. For each of the 40 evaluation
queries, BM25 selects 30 candidates from that full corpus, not only the 20 negatives
supplied with that row. TypeSafe then reads the query against each selected candidate and
re-ranks those 30 passages.

This walkthrough asked one question per pair for clarity. A real application would
ask several questions about the same pair in one call. See the [parallel questions
cookbook](/cookbooks/parallel_questions) and the
[Speculative Fan-Out pattern](/patterns/fan-out) for how.

***

## What's next

The same building blocks show up elsewhere in TypeSafe's docs:

* [Noul](/primitives/noul), for how TypeSafe turns a yes/no
  question into a score.
* [Speculative Fan-Out](/patterns/fan-out), for asking
  several questions about one document in a single call.
* [Line-by-line Search](/cookbooks/semantic_find),
  for another way to search a corpus by meaning rather than keywords.




# SDE cascade
Source: https://docs.typesafe.ai/cookbooks/sde_cascade

Uses a 2-stage structured-data-extraction cascade (mini → verify → reasoning) to get most of the quality of a big reasoning model at a fraction of the cost.

* Overview
  * big reasoning models extract structured data well, but are slow and expensive
  * small models are cheap, but make mistakes
  * a *cascade* gets most of the quality at a fraction of the cost
  * the models we use, and their price (\$ per 1M tokens, input / output; standard rates
    checked September 15, 2026):
    * rung 0 (mini): [`gpt-5.4-mini`](https://developers.openai.com/api/docs/models/gpt-5.4-mini)
      at \$0.75 / \$4.50
    * rung 1 (reasoning): [`gpt-5.5`](https://developers.openai.com/api/docs/models/gpt-5.5)
      at \$5.00 / \$30.00 (roughly 7x the mini)
    * verifier: TypeSafe `jev-1.12` at \$0.042 / \$0.00 (output tokens are free;
      [published Jev pricing](https://typesafe.ai/blog/introducing-system-one-models-and-jev))
* Algorithm
  1. **Extract** with a cheap/small model.
  2. **Verify** with **TypeSafe** primitives: a per-field yes/no ("Noul question")
     question
     * (e.g. "is this value absent from the source?", "was it lifted from unrelated
       text?"), each returning P(something is wrong).
  3. **Escalate** to an expensive reasoning model if a verifier signal fires; otherwise
     keep the cheap answer.
* This Cookbook
  * walks one real example end-to-end, then shows the tradeoff across 100 prompts
  * note: the two extraction rungs use text-mode OpenAI
  * we do *not* use structured outputs, tool calls, or json mode, because:
    * a *schema following* mistake is not the mistake we expect an LLM to make (it's
      easy
      to make synthetic data for this)
    * if an LLM does fail to follow the schema, it's almost always very confused, so
      constrained decoding doesn't fix the underlying issue
    * we encourage you to try them though!

## Setup

* install the dependencies (the TypeSafe verifier client is served from TypeSafe's package
  index):

[Code example: see complete pages/cookbooks/sde_cascade.md]

* then set `OPENAI_API_KEY` and `TYPESAFE_API_KEY` in your environment

[Code example: see complete pages/cookbooks/sde_cascade.md]

## Step 1: the data

We choose a huggingface dataset called scrapegraphai

[Code example: see complete pages/cookbooks/sde_cascade.md]

[Code example: see complete pages/cookbooks/sde_cascade.md]

* This row is an **NYU events-calendar page** ("Fall 2024 Census Date"):
  * the schema asks for just two fields: `registration_open_date` and `description`
  * the prompt scrape captured only calendar nav and boilerplate: **there is no
    registration date, or description**
  * note the schema's `description` field even ships an *example* value ("Registration
    opens for the fall semester") in its own field description
* so a well-behaved extractor should *decline* to invent the fields the page doesn't
  contain
* let's see if the small model does the right thing!

## Step 2: extract with the mini model (text mode)

* note: `gpt-5.4-mini` is very stochastic on this input -- even at `temperature=0` it
  invents a different `description` on nearly every run. For a reproducible walkthrough we
  **hard-code** the one canonical fabrication the rest of this notebook explains (and that
  the verifier flags at P(wrong) > 0.8). A real pipeline would just take `extract(MINI,
  prompt, schema, content, temperature=0)` directly.

[Code example: see complete pages/cookbooks/sde_cascade.md]

[Code example: see complete pages/cookbooks/sde_cascade.md]

* The record is **schema-valid** (the line above prints `True`), yet it's wrong:
  * `registration_open_date` is left blank, which matches the page: it states no date
  * but `description` is fabricated: the page never describes a registration date, so
    mini invents a plausible one. It may parrot the schema's own example, "Registration
    opens for the fall semester", or narrate "...was not found in the document"
  * a JSON-Schema check can't see this. A cheap model produces confident,
    schema-satisfying fabrications of this kind, and catching them is the job of a
    semantic verifier

## Step 3: verify with TypeSafe

* the verifier is **TypeSafe**; for each field we build a `Noul` question:
  * a narrow yes/no, framed so that `true` = something is wrong (escalate)
* TypeSafe returns a calibrated `noul` = `P(true)` per question, in one system\_one call
* the question set:
  * one holistic **`__overall__::judge`** head ("should this record be escalated?"). We
    compute and display it to contrast a whole-record judgment with the per-field heads,
    but the gate in Step 4 does **not** use it -- escalation is driven by the per-field
    battery.
  * a per-field battery
    * non-empty fields get the full set of heads
    * empty fields (null / "" / \[]) get only the `absence_wrong` head
  * (the full pipeline also has a `spurious` head for whole containers and an overall
    `difficulty` score; not shown here, to keep this walkthrough to the two gating heads)
* **The TypeSafe Way: Decomposition**
  * Notice how everything is *programmatically decomposed*, this is TypeSafe way.
  * Decomposition maximizes the intelligence of every prompt, and makes the algorithm
    tunable and interpretable.
  * <img alt="this is the way" />

[Code example: see complete pages/cookbooks/sde_cascade.md]

### Run the whole battery over the mini extraction

[Code example: see complete pages/cookbooks/sde_cascade.md]

[Code example: see complete pages/cookbooks/sde_cascade.md]

<a href="[long playground URL saved in original]">Open this verification in the TypeSafe playground →</a>

* TypeSafe concentrates the signal on the fields that are actually wrong.
* Our results are calibrated: high on the field that is wrong, low on the field that is
  correct, medium on a field that looks off without being clearly wrong
* This is what a typesafe verifier buys you over a blunt "is this whole thing good?"
  judge

## Step 4: the escalation gate

* now we gate on **`any_flag`**: escalate if *any* field flag exceeds `FIRE_T` (0.7, set
  above and shared with the `<== FIRES` marker in Step 3)
* this is a `max`-style gate (escalate if *any* field fires), not a mean, so one confident
  red flag is enough instead of being averaged into silence

[Code example: see complete pages/cookbooks/sde_cascade.md]

[Code example: see complete pages/cookbooks/sde_cascade.md]

## Step 5: escalate to the reasoning model

Since a signal fired, we pay for the strong model (`gpt-5.5`, `reasoning_effort="high"`)

[Code example: see complete pages/cookbooks/sde_cascade.md]

[Code example: see complete pages/cookbooks/sde_cascade.md]

* **The improvement**
  * The reasoning model drops the fabricated `description`, returning `""`
  * It recognized the page never describes a registration date, and declined to invent one
  * The cascade turned a confident, schema-valid fabrication into an honest empty field
  * And it only spent reasoning-model dollars on this one item *because the verifier told
    it to*

## Step 6: what this looks like on 100 prompts

* **These are internal TypeSafe results**, produced with the general method above:
  * the same `extract → verify → escalate` loop, `gpt-5.4-mini → gpt-5.5-reasoning`,
    `any_flag` gate over the per-field heads, run over 100 scrapegraphai prompts
  * each item's cheap-rung extraction is scored by TypeSafe; the gate threshold ("cut") is
    swept 0→1, and every resulting config is plotted in (cost, quality) space
  * the chart is a historical snapshot; its costs have not been recalculated at the
    current Jev rate listed above

<img alt="internal results: cost/quality frontier over 100 prompts" />

* how to read it:
  * **black diamonds** = the four models run on their own (cost climbs with capability; the
    strongest, `gpt-5.5-reasoning`, sits top-right at ≈0.81 quality for ≈\$0.10/extraction)
  * **blue points** = the cascade at many gate thresholds; the dashed line is the **pareto
    frontier**
  * the cascade frontier sits **up-and-left of every single model**: sweeping the gate buys
    you most of the top model's quality at a fraction of its cost
  * the cheap rung handles the easy items for near-free, and only the flagged items pay for
    the reasoning model

## Appendix A: what makes a good verifier signal

* the cascade is only as good as its verifier; what separates a useful signal from a
  useless one:
  * **Narrow and grounded.**
    * one checkable yes/no about one field against the source (e.g. "is this value absent
      from the source?"), not a vague "is this extraction good?"
    * vague questions give mushy, uncalibrated scores
  * **Bad = TRUE, with explicit criteria.**
    * frame each question so the *escalate* case is the `true` case, and state what
      `true`/`false` mean
  * **Per-field, then aggregate with `max`.**
    * a per-field flag localizes the error and stays sparse and strong
    * `max` ("any flag fires") ensures one confident red flag escalates, instead of being
      averaged into silence
  * **Independent and cheap.**
    * a dedicated verifier (here, TypeSafe) judging the output catches the extractor's own
      blind spots
    * it has to be cheap, or there are no savings left to capture
  * **Separating / calibrated.**
    * a good signal is high on real errors and low on correct ones, so a single threshold
      cleanly splits accept vs escalate
    * that separation is what pushes the pareto curve up-and-left




# Line-by-line search
Source: https://docs.typesafe.ai/cookbooks/semantic_find

Build semantic search for GitHub's Terms of Service. In one request, score 218 line ids against a plain-language query with a Choice question, and use a Noul question to check whether the document contains an answer.

You have GitHub's Terms of Service and a plain-language question about it. You need the
lines that answer the question and a way to detect when the document has no answer. The
included queries rank lines with direct answers first. The `exists` thresholds classify
the remaining cases as missing or partial. You end up with `find()`, which returns the
`exists` probability and one relevance score per line.

<img
  alt="A query scans a document and reveals an answer attached to the matching
line"
/>

The search backend comes together in three parts:

1. Tag each line with an ID so TypeSafe can point to it.
2. Use a `Choice` question to rank those line IDs by how well they answer the query. Choice
   question probabilities always add up to 1, so a line ranks first even when none
   answer the query.
3. In the same request, use a `Noul` question to check whether the document contains an
   answer at all.

## Setup

### Get a TypeSafe API key

Create a key in the TypeSafe console and export it:

[Code example: see complete pages/cookbooks/semantic_find.md]

### Install the dependencies

[Code example: see complete pages/cookbooks/semantic_find.md]

`JsonCache` replays the included API responses, so the steps below run without an API key
or any spend. To make the requests live instead, set `TYPESAFE_API_KEY` and delete
`json_cache.json`.

### Create the script

Start `semantic_search.py` with the imports and the client:

[Code example: see complete pages/cookbooks/semantic_find.md]

## Step 1: tag every line with an ID

The test document is GitHub's Terms of Service, split into 218 clauses, so every search
result points to one quotable line.

Add to `semantic_search.py`:

[Code example: see complete pages/cookbooks/semantic_find.md]

The cache prevents repeated downloads, and `splitlines()` leaves a list of 218 strings.

Now prefix each line with a short ID and join the lines back into one document. The model
uses these IDs to point to its answer.

[Code example: see complete pages/cookbooks/semantic_find.md]

`DOCUMENT` now looks like this:

[Code example: see complete pages/cookbooks/semantic_find.md]

## Step 2: ask where the answer is

A `Choice` question returns a probability for every option. Use the line IDs as the
options,
and "pick an option" becomes "point to a line."

[Code example: see complete pages/cookbooks/semantic_find.md]

The option descriptions are `None` because the document already contains the text for each
ID. The query goes in `instructions`; the state stays unchanged between searches.

<Info> A `Choice` question accepts up to 255 options, so this recipe searches documents of
up to 255 lines in one request. Past that, search in two passes: one Choice question picks
a window
of lines, and a second ranks the lines inside it. </Info>

## Step 3: check whether an answer exists

Choice probabilities always add up to 1, so some line ranks first even when the document
doesn't answer the question. The ranking alone can't distinguish a real answer from the
closest irrelevant line.

So ask a second question, in the same request:

[Code example: see complete pages/cookbooks/semantic_find.md]

Unlike the Choice probabilities, the Noul probability doesn't depend on the other options,
so it can fall near zero when the document has no answer.

## Step 4: send both questions in one request

The `system_one` method answers both questions in one pass. The state is sent once, so
adding the existence check requires only a small amount of extra output.

<img
  alt="A tagged document and user question enter one TypeSafe request. A Choice question scores
every line while a Noul question checks whether an answer exists. Local code then ranks the
lines and applies the document verdict."
/>

[Code example: see complete pages/cookbooks/semantic_find.md]

The `relevance` list keeps one score per line, in document order.

## Step 5: read the result

Two pieces of local code finish the job: `verdict()` turns the raw `exists` probability
into three states, with a middle one for partial answers, and `show()` renders `relevance`
as a bar chart so the ranking is readable in a terminal.

[Code example: see complete pages/cookbooks/semantic_find.md]

These thresholds separate the examples below, but tune them against your own documents
before using them in production.

## Step 6: run the search

Ask two questions that have direct answers, one that has no answer, and one that has a
partial answer, four in all.

[Code example: see complete pages/cookbooks/semantic_find.md]

[Code example: see complete pages/cookbooks/semantic_find.md]

## What the scores mean

The first two queries return direct answers and the source lines needed to verify them.

The other two show why the existence check matters:

* **Arbitration:** The ranking gives the closest line a score of 0.86, but `exists` is only
  0.14. The answer is not in the document.
* **Parental permission:** The age rule ranks first, but it doesn't answer whether parental
  permission changes the rule. The result is **partially addressed**.

The ranking tells you where to look; the `exists` score tells you whether the result
answers the question.

## Try it on your own document

[Open the tagged contract in the TypeSafe playground][playground] to edit the questions
against the same text. To search your own, swap the URL in `fetch_document()`; every other
line of the script works off `LINES`.

[playground]: https://console.typesafe.ai/playground#share/N4IgJg9gxgrgtgUwHYBcAqCAeKQC4AEIAMgAxkA++AogGY0JQoCWAbgvmAIYoIECCABwBOTADb4ATAHYANJJISAbPgDt+PgDp8AEQQ0mSJswhIAzgB0kpEgEZKAZQAWEISnxshppiYIB1djCm7CiOCEH4AEacXlD4PEJwpnGOQhAwAObOMG4h7JzpQggIiKhynEhgyQgAnviOnGz4pgIMTPqxiOUG6aZaAJppTVmilQDWSBAA7viT9W6T7J1IM6HLC-iB7AicUI74EDRVcQgJvfhooYUA5EkTbukQ3XEQkXnHpm4m+EZyEdnfKBuTWYonEmxoMHEBhoLjg3G8SA0lmsEkofGW5hAfCgUDSqEx+EKwjCyBQSWqaSE+FECHSnHEhVE8JMpkcTAEMyMewA4kYABIwCJaPj4QA4BAAFE6mEz09Q4vEoQC4BISEMSgqgkuVvhVWEwwDBZQBVIJCQCYBJrss4RAAvZnLFAvUQQdLa574cqVTZHewnFhMKB5CpNX1hd2a-DGk7m75gUlGWpfXkoAVCsUAeSEdMMtuMZmVnEKQwLCEqkxco2aO1DIW4+DhtQieVM0qgTG4Jc5IXdTW6NPwcZQCapky5+yQ7BcdZc7EjnhWJ0WkOYAj7s6SUC1uNBnAiLnb7qgqWbdfKtWEEAAVgwye7PkgA8L8JLPDLxNjcTBUPgN8tG93EHAjZUgc7pILUSDwEB+yHBmWZMDmCK9MiZAAMyUBc7CinwBRFCUSoqvQnhyFuNKMKwCCiNUcgOu6oJHPEiTESYYBGIhch3P6oa4qgnAGB2k6FIRyABpUBjJEwSSQLAeH4AAFLkYoYKc0H4D6Qh+gGyqTgpmJKYkmIAJSgZU9LiBAuTAS0QjwkgLpCJCYRyAIECiP6TChrJBhQKIMAsbZRxJimT4iCwOy1PYKDtnhZShWIO59rW6RcoKGi4nAAD0Xg8OlwisGFRkevg54iTAhRJDW8yLJwZ6Cq5rL4DQqRwHETCIG6zBtV8Cn+BEWUIFoACyEAfCplI9jwRUuW5obFu6sVMhECVuFJvRJSEKVpelG48A8IhhJlRgIAAtM5rlQNUSJWGQAAslCYnwACS+AAGLbCgpUIASSyamBDVvR9KmBYK+zAaV6h0GIbY8OVcwbEESRwrsfHUtsQiGP5k4Fsw7RtlCqAUa56TCcELxE+O1kTWm2QCNkcheT5fkukDET4AAwhAAhiOZcjs5zTpuHw2QHEwmBlEGp77BZf3cADepxvoHbRHDTyI2y44owW6MupjrhtG5soGDwoJMGTAaumNUnwKSdqXdYACslBYRDrntsq32gbUA61BVHBMIUjCUSD2osf7KCB9xKCpKIph0+uJiRy5NKVBEVFBxJGwVCc34QHAcBfBHUednsnBFVjqezAu+CYgXLlfdsZh1A0KvTskWr6DQg5FScAZfrJdskAApEZUzk6y7JBwpIiZDkLwh9eRxwkg+TFKSKkKV7WjPdpoRzY8XD3hOhyQIKKByAN-pHgcbjp1qfDO1Dh-4MzttkIod0gAAQggkXBQgfoIJMCwIA6z1yaFfSYxY5Amg0o5IO9AZZlRjPLdyJlNSiAEPUX439OBOUKP-SYchUaBx2AGZschJx-3pAaXM5DhwuDAEkScGDrLwyLj2OAcUqRLG6EhK6JApDv3ZvjfEwD3a4ljNRLAp8ODcBwRwaAVseI0O+HCImMd8AFE4Bg-06jpQdwgYUJyOxRjL3UYVcylwTzxFxgjTgsY5q8QWn2EIqQMh7AUmpGBL8SAAA5HbMxkMqUU-hAnGTFMaZUgks40QCfgB694NBlCSAsOiSsLZ+2vC4XRgovAsQLO5dRBcdgOiItSTiZgsnkIhgGUpy8NRi0qMUFcEBqhFF4dYAAnI7eJNN8LuwlhHVek5BnYCKqkP0sZKg0Vvk9V6CCEB03vAzJ4544ACDJGUFAkVdh4UKRAexYkKRgzLEICsAgqwNOzkgDwpg7R1AkiUi6yEbAkHflTFAvS67lCSGVZyZgZpBlMBkNRuZ1H018k8cRE5gJSzhNY+kcgyYnHbMnWoMyXr-UKC-Gwdhzg71FJ4zikS9BSnajvLRK5-R2l0eAyBYz9kwEYGYwFvpOJJHPBMjsKcn78kFIs7yEL-IuLSJkI4PU+phIll-H+4o8HuUAdi1E4STShNFAMGAoTCpqspMSwiZL2AGBYhMg04grLSiQExNZp5aEgzgghLqsN6hJD9H1Sok506BCeN1BAvVDpB0JQGAA3K3NwJCwisMnJsH6Z4sZrx3u+BUwbt61jnkyo4XoQIKQTZ+a+9od5WRhAkcoZsQJGCSBCe8oLHyzjrIENwf5aw0miG4GwKF8CtILIww4y8tD2BaK2WUDFbFooECuWohbIievHMeScDwPBIBktmjUckfTsB9GRL4H8+4GX4GAFiuZZR6VMAZbFaEq4gFnEdbkyBkU8EqEIngIiQHfLZvHVePsjlBwsVnTYc4YDNLsVAwUHDpHDMKPuYVbjvSsofM826eLMLisOrq0lMTeURGjAsX1E0nTbUVvcZKqY0qXNMlcx90joFssueefUaaOVy1RTy5MwNazb1caK712H+pxNDdHF4US5xoeYxEI6I8OxAoiJAOEBgu0aMI1oYjTRGXFySCWRlNs5PrSIznMJ5y1FaDWo4FK2c4BaAwuEI9tFpQaIgPOpjKZozcSEgfGYPq+rZN2GGTTRm-iGBudxxThUaOMsqlxjzKn+ykQTkgC8ZwXDpC0GmHE0QESmXLm5w6jDJjjkY8zE8Z5xly19nQBcX5MZ7tYq+Y4ykQKUdg1dGwDs4mHBCMNPIFWD3iCHVcmgZ15ijhCOnbChQV6lAXi3ZorR2jVcSO6UdgcaKTwopQr8enoXBnUpxbFb9z3qqpA+0kXyG6XuveTFFr7hE5Fhp+-9TpANKYiCBm1h43oLO1AKxm7axp5xYu0alboDtfk-fURohbRj8SpN5EwJYtAPWWhAUMdx3sM2CDvT8sYhCUSeIDtwL3zvcu-Z4bFAj8Af2FPKHN5wTj6Qa341SVo3A3IRAQZ85rZRLpvIVWCXR7UNxB+wX7znQ1gA4YYD4FNyJkajqYYNJcjOL1rSNPHE0jlUg58Gz9cA62vHwK2r9HgNeDC1yNej9iS6hVco06T4g7FgDKjLsJmvqr4CR-zqchYazLGhw1EbcoPyoH6IMek3vZq-JZEwRa7AJ2q79wqSVYFBtCsdRS5AyS2R9k-bNLw6QcuuhopGrw-kY8c8DzAd0hYw9mAj32Cd4PVRPGLxTr8QRYBYueV03X5P-duAfdL5CEhXkRhNGcewgoryMH1RZ6n6jP2FEimJJcrV9x2NFw8iXjQa5mQ8F9sGrOqsc7CQpHHRcxJGBfhIXF3PszUrMzvTEYmhAEhAlqK-8E7k+wgeucDd6M4Y6qFP5SJ1DYUQDqZfEXAwNfeEDfeOQuWzaJWGV-XnQ-HeY-EcRPAELQXwLkMSDxGDN7LUB-b8LUReZeIfLOMNY8RbHeRAu0aMLgH+ILVIcfMkYUZYGg3MfLRuRoLXEA9kPsB-dRP4K7SuY3etPINwJtEab3PfJeN8JvZaMIE2JeH-JWAg7LLOZ-NgzMHnDTB6Q4TPD3HeQgzQ-AdghEX-eAkkKnU4OQdYbiXJLOWfMIP5LwSPBqbePIDdBuH2WaAtWEfiL3KkSDDjBA7Q6-XMc-JVCQLQAAJQQAAEcYAMlKh4lC04UER+8z11VFc3BTc3gLc9R+xrd3Q917dzYhA-8aI0oVxv5Ud2Bs8IIORipw1WCEwpZoRYQ7lChEiwg70gNPMlYY9wNxAl5EBY59h1lUtRA5BPwaRjwDDPCAxJik8rDusvhGx6hRBDhn8UY6RxAvY5IxJZh-Q9gNxwh1hxwOw85CwOii0OCdw0hhDdjZQvZh4qQ2gd8Ji3AJ0S5zlCiOdFkVgTiiDwhbdKtZDtQ0i7kRw6I-xxxSFbkhBx1JwIgxBXJ-IaYhBnJ4Zz94MUIu8484jEiMldl+8mt-AuC3h6BpgvA1k+x7I5j3C1d5DGFlhmYgQA1+p+8dtsjRCdc5d4AtQqjv9AxY8c0CSc0flaQHkFxGNMRdwyQn8YVLFOAhY4Urjv5nAGFy92AkcrIQM71MCBcXh9SjATwkZ1YSEFRTBcB+8ScRRVZkYrTKcb5lgD8gg3B-1Ig0VlhDVdR9RZR5ctRZgXgw11kYZ2BLN1iEBNjtiWt415DcFbM5ZwwCirdHESi7dw1Ll05K9XCa93VOcvCzgHSdg1ZFi48PUghGlMABUvA2BA4J0-CEgnhVSHR1SplogKxBpF8ai4ZSV6xfZQ4jhilEIVIS5HTLTEzJ0njjD4z2AD8PVeD1TA48zq8o8PDzTyygRRyWRS9ODpMeIxIJh3dUcCD1ZGoigtynT5DXQwSOCaIY9Lz2AZD2d5Dz86c0x1YzUvhJwaQ9j+xUB4wDzeIjzlgTzrizyvcLzfcD9PJ9DBhdgIA2s3RN9-wyybzu8vMUlpiQ0gR9Bxxfh-gzSfwxxA4-xNhKgJ17IkAtZ0KLSEAT1+8O9eTtcG0iZdc21JwXIMdMD092B1hZoXE0SOwaIgh2AIgRBjZyg3Ajl-IoU5wiY3AsBWwf9uUm00YvUTTUhNE4BbDFwlcc4x02FDRDAf8Ip2wkgmRJgtA8tIBEdzI4gCwlL9gwZOTUL08szlh0cs5W1Ll1hIAXdHLTTQ1fo1wLCqQ9dfy3K8DYdDh1gNKvdu0wqTQIqRyOKQI-LXNOQ6IGIDAINYZZxoxFzc4SwH5KI4rPjZoS4yo5Yytu1s4c0kTXKyQisFJTLDpKgLLoY5AY9u8kToxV8tdmpSDBy-weKThg0xIgUBiQS3sFiVRmhw83CJ1qisd-I0C9g+qFQBqrLOAFVkIUJB89tqRnQxJByTByKAhqzvSxx2AfzlhAAUAm+A0H6jKB7Fsj7CdCSmWEHKRz-FZGLEYx4OXD7BaA5hpEfD+MqDMK+AuqQEDjyIPARLdCVkXlqFfLkO701HJDGgk1MEPHZHuNBCmHaRIBQlxV5OdyRy9DyzEj9BcjuRAiwGclcClxciDluUrTHOstk3arMo7G6tDExl+kJzm0pQ3DcIvFKgkhYi8P3L+sctpvQ2+AQrL1mh1gEvLCeGjNjPHNUn7VxkDl0AaPOwADk7RZRZJ7BtAza3juwHqHtmC3RaTOFIhcNRgdaqRYxDAOxzlXACsIA2RUTQUSjV8PhZTbqS5DQNB7ADM4C0YZI6lzpbKVbBzTIpgu4XwG4xIal59lguavCOx+qCkJ4TgRASlS7pkcRw1vwTh877NgY6tQxMSgUZK3QY646bN50k7LQXA38q0XpJxILITOjlEajoh6iryxoqBMBWae8YCXJ2UpoU7DqlVroJSvx10ZbBxDqsig8K9nDlqCyqQ69OYi8xp3SGAAZjiM9BgM0YrNsHx8AKSDg9UHQl6lMBjyoywjoaBilMZLQ4xtpzCaJQh0FPjDyG7G9u8gQW8d7U4hCjhBl6qd9mSsLCoy1gxW9gLZovTHy0gX4UJ4NsjQ8j6q8VrMY6IUHcjhoVDxYyI-RO4fZoBW8kgfKqQYG49ZI-5kB5xlgaHvhl6I7GNCc08Xg3cOd2HM5OHL75CmKroUImtSHD6lqKGT6TxDZQKvUd54GK6Ew1b0G48gtohTATkwBU7hMiDaLHLCoYSRjHK-wXZKGqQJYnQZ1vbOBVEo8mo0GGpHEAYqijLA5NrxIkg9HgKIBFoTYbZDqeTBh7H6U1kw5wJzI2hag8tuUI5Rz-JAhkh2N3Ed48tR9R0XBaHXADY1bXg0o8gDFH4JZPw2yrR4IOwM0aAbUKDyoIByFH6YF8mRUtq5Hu9+Vll-IGml4+6bRWnwgQIY9zlmxzGg4S9DqSc7ZhQOspjrCadSAUI6d4kwE2ospqE2JxIKjS5dYwgrgZth1xaFsXgY82nG7Uwt4qQsAvGajeqjdncG0QFAINDkrbUdCODEwVbQmsGR5rmg4zpU88gcJRsyRDcy9BzIBss7sTJlgKUzp39YZDZaQKZQxQnmYk1ZGkXndlarHpkgGgK8NUa7hLFm6tBxRJCJLamhLYZb66iADZsNawYIRUk4WZJQmjlyEpZ-bmBLnIW50Tg80EA-YVQmRQU2QBBklRwjkiGO89CqrCwS4pXE7V4a1uKLIRxQSa7mwvblYxnfpim8C7zu7pWZINxzlVLU5BskhuQE6F1V4+ASgRd30Xg8sozDh3LMWq77m0hLlM84W3QsH6MvA9zkJrpB9NXgcGh6ilDWmOQJ08sqB8YsSRBwhWYnRfJqId4c34hcoC2i3Kg+A91kB9QRr5tQ2d8I2g8o2aIY3Cs42zAX5rpcVWYu9VRIo3DIwE2lUnAyn3ApRmcnm6g6HwwRx7FQo9pO4QISIHj197qmDrxy1fHSME6jgTkRhLkfY13dwJdfyEbagTkKx+HXKqRf1NRtW3CaJr3nglLLExIHh9l-GuQ+KxBrqdGp6n75qjdtcYQSbpgFI1j4z04W9lFjjPNwV7FpQ2oypI5-RQ78430gdEKtRsTpFuJaM7wjhm7LkxbXIQMb84kC6GcsF+xayCY-X+wyzJZLge396wZHnOMJVCp3K+SkcGaFXAwR0Jb4p2BeaRnBUXRcQBBqgp5HBPggjrJYw4RTlqR9r1EWaJ20LJxC7Q6JOv0pZebXQY9pb825aIj8AVH2A1yXGTxPb-IgVDDawHmZn5zVIbX05c7gm2wXNQnjPCoJYQ3Jb6TaRIQb8E2SHW3fcP0Em0SgrPSZGPZvw-ZpIPhi1QxBP9whnB2xOyCnwV7S7Jx2Zc5PxgLuQkjYx0Swge2mttAtATsb18X71sOUAE2dtx22amcfArPBgIXBHP1lc3skHM8IO4Y66KmxJ5Obx22KMXgP92BSKWJmgmQfTKhAbDDFvWvPj8P9yPh4u3cdPt9trLtLlbPIZO4J0fhkCbOTYFPcay9NEvw8nZoKPOqyUUKLiigpltLkz7EFIGWX72A3dJ47uZ4VQ85oDLsg4odwgpHVbsrLifue2ScbBYjyHXCLvkSqRGuzsf8ccE26drPFqXD1ymTeuwZj9Avfp6gEhFrF9-JGodMz88UvOllfJQxj9P18OZiAMwAbU4RwcHE4pn2UgBnoNgOjSdSEuSfj6NzXHfoaZonYhluVxndh6JJHmTqcce2O9oiZ2Bpnc4jIf2ACerp+5KAKTBzBIM0qRCgTeyChAr0mvztj8fYsvoZbmqU3DrKv0wZusgtCuaugfkba7cpQoJoiRhojB+7hbL2vNYwCaRBGxRJlh10OCqAtBj9VfVuAiDeon-3OCAax955plR1gQW4h0X47ZcV8TTD1DPAlWwkiBylwhuRrINRkI7YlVsiIXtfWvKrue6GLtyNPiWJKgkchvPn1bVHSe7PU8ZaL6y8Qed5pu3R8OAQwlVrgnqgnhQmgvG2QvxPW+auu+OONEO-PSfo3UpZwqFJoX-kkgxJ0+xz6vrpABkAnq58VvysIf9YUxe9gvB++l2SqsANH70hwMYAWoEhxmhlIe44QJ7swFyYRks6HCM1iyER7fd2IoZDZlVj-4GopSxJQoBYwp45UHGbgf2LK0aDnJqgMkCdLkHCDTczg5mY-vANDB1tb2ThB3mANJAzEEatdMWuFTdxg4OwZ+LvvBg3r4AW+bAp+Jfw7oWBzeyjQYIgJnbmIwYd8fQC7E96g9p4LtEpG9mcAfAygQgJGGwCMSeA3sOfaqJckF5bdOYwtQ4DwK-BKx4S4aAsIAPpSco5AsYBshzBzJrJxkdRDzsB0k6fZuUkcbRv5EegYp5kzKKipuUxLYlH4EQiArZG8G8MnQ59dIP4PoxjNdYOMA2PjGNimxAwlQScuJ1Rh0UfsFEa-scF2ATBvqRXbYuoPviWVq+O2C4OnHwHI4OeKAtfjRECqJ4egZSIXjJ2gHg8LYsiKIKCSDC2DIgxif9A7lZCZ0zSBDdWkGEEHD5g0-tcIGaUNihlgwBYRDpnEwCGdLgxrQMPSGqDWgDUxHPGiGE8DBoNutwthJsKlCy4gwzZZqNd1zqT0Ke+2bbrBxziakngrkIXsbn9BBxOUEAaviTheYjkWAe8DLipGPgRBpEWvMaG71ngZC-BcQayAYByGBDy82MfWHjCNiExiYYScoRrE0r+Rqh0cQ-AwEcANCzqDg1QRsJaGaCH4T-FVugQB4ydkhbIKyifzCT2VbgjlewswHegTQS4tyfgsqSzhocRAjAUSh31MB6oQITglANXzpxrMpBIo9vu3Rohphb+w+LvixUxHbdYuZeDfkrzOiURQhTwCSEClgRpRdklyAuBHmyBjl88poqUFcyj5ZRY+6iMauwHwRco2ilwM4B-FqAekkBLoIYqqGj6V1qwLwP8OGMqB2j-QDoqqm21DJjcxGbofBGEkxBg4CQiY7EjHz2hJB5IQo59N4VhiFjBycw3IHK364cxS6m1HAjvHcpTckxQY6sVUFqCb4FGpARQIPhjH2dWyKoSsY8iKi1R-Q0-C-u3TeFzgS4EwccLWR8j1k3sh7MAAu1YEws3QmwbwRJDV6pwvhYSIkKkFozsBZI3KMHN0CMhaj+mUGXAsBy8whU1KGTdDPhU-BeF6Q8YBWs7hUH3lNmTAqOpAGWIugS4+AwfoMA35c9Bg4-GXkNy-TZYlxZDNRvmXl6AUnOTo6+MKLYGegku3WH2CFX-zXVT+V0RQLikUBZ8YCXo0OqZT-xxFZxLgWoNIJhbIRFASqXwKsF4YktMyI-JjjVX7FVjhx8cSIS6A4gloGq+Apcd0J9jH4OGJHLxsEGnwtt1abba7IMBX63ddBNEJSbDBUmkTDBGk04PBOX6ptuwQQf2svgFZMdjJtYUyX-kFylYcgmkr+hFhLieihCf5EUfkBGzRQQ07oRyV+ESZAozUJYLkjRLPQPRTASAK4FdnTjS0RozgaYGaWvZoJIB1QAAPxWdVQt+Lziqyq5ooa66yRWCgImB09uxE4FoEgCOjShSoZsN0WV0HBTVAQccXOJdVqACZiBbocIbowZz1AgwmIAwLuHRwABeR4pNIqCYgjSVwQsGlLcCC8CJ9HCWmIJonwYpAg0PcOIBiJg8FBY4pQWXjnygVaI4ga4rKAgk0QXx1ojYHzycgLjWQNqCTCBlpYxo2amaHsXgUdErFCQR0lSLiwKC4NxYWyZPt6JMBaA+QUwQSUuIgSS4GBBk+7pKijZI5pkzYeulUBGp0gZMV-P3mrlaE9U3QyAPLnljUFEyuRllN0OBjZyLRPYmAbuBJCCEQTEBogtPteHMJv8iKbgJHITguEvxFAHQ+bjvCkTvo6xQU3CKvHThI5kAhaAMHl25TBc8u1lJcSoLyw6DUZX3USi8C9AvjNqjxW8OhyELmFCoNEOYXTJlBuE7EWiSKJh0cGWjoeLghgG4Oao0RCgZk9gEhhlGfDCs-3X6ZLx4kk5v+T4BcbEDYnJjgxzffanyz9zhoeJdOScUhWj5CoXgfk7IKbytEHCsxsQQMRJMwmFgU5heF0NMiDCpp4x43C2ZwCF4zU9gVPU1jhNJkeAKQ6sB1AalzbjhtREYfgceEmytg-soIWMd-CZJdhLgsrC1JRK2aSQXgSOJURh3U6TA45nTN0AXkFFbdLssmXOTOKjmDihpfsTMVjAKQ2puUeWQskkA0GQw2hPEjvB0gHbHg4irYYqPGGQhSAJxtQKdDBLVLnZ3Y1dBEkxFBDXgbUAslmf2TkhYRG5ioAqIr3DnEJG5ZPY-Ez2ajvi+m9A-NKVCSEoicRWQiePiLooDIc4iAEwUbTRTzQ8uR8goWSIJgmxKR9IuQNSMSpPBTA1QCOnpU5qtQ3aPAeoS5GdC1BZIJcTECVyIUDo3wT0ewCwp4BwBDIS48edykRmNAgu4sOiKdGmjqIh0TEHUKCmewwFikJqTwRJDHK6s6KwWJlFAjwLqIsM7mIOPQUno3hP0ELbilZAKq1gywkIG-ucNAXnhg613eeYwBtRq9WpzEcEuwz+RPMgQ74WumXJqjK84FCJMnjYsWRQlgWkObbqY2gAPxSwqrMaCYpvC6dzF-0l0GgvuoYKUKIEHwRRA7EYwlO0k5LkIuZns4xFEi4oC-CkCU1BgEIVwCqXRmOV22ayFClwuZFUozICooIs5VqJlDtgTnVMYtXQ4T4BI2CLQbC1AojQ658c5sC0qVSdCkgL-L4PVw6TyIHKoaebB4IiV9yXIFEbHkcESGlLu0G4FTpCLKioxPM7qdpmOCOD0F2An6U5SgJxwltdSkEf5lOFQCOA4FzARoA+zjSbsGUaaPJcB1sRm4yFbhblJ+i6GRLRp+AN+SQDrBolzCdUsZK7M+wbgaQFQAsECpCCbwEhJSiNDB22VcyTAcgTEEcgJCA06IAmN0JnnFi-QDiPsCuYHHdQ6hQ44cRetHHGKb4k43pG1B6iS5uisOqAQuEK0GD8LiZYQUcfwjPSZ9goeUCaJHIHEFJX58GTrozinY9cKSkcN6Mg224gRw++4fOSmJxo9Y6qzABFGEnWC9TQ+x4M0krET6E0U+roHZcsEz5tpGwToSYI9QnQRNO41y+GNRFDJmsRoS2dic1UIL78lMpTNmnCniAxrNGYFI4CDP0aQrghMCLNWtSvajgxo-5WUFE0JjUo6Y8VYHjZKtn2g0xFEdyI0AUg0NH2Hc9wN4AVbmEfp4nfajagVVgx7CpIFpU1jR4j9YChwWVFqvYA6qqxeqq6FIA67AixSy6Qcm7mtWR9xJdq2wmyAGJjd2qqVIJnKo5oryaIOvV+STn15CJ9APtJ1a5BXYzqQo+4BdXatfl048s9hOWIJh3gdqVI26mzruujk0Q-wTmR1bjHZWEMZ2iTc8FwqeIAarVr6ndYmtLpIKM4TTfujcM9BBAygjcm1Mt1h6ywZWTQdSSeForwEXFWtNxWApojwb54Y0dsUgHvVxhChSSvtQ1VdpMgqQyhAGJg3AovBeGEU0cHMRhhagxJ0Qa2X2FjBRtV2xYFpR3jr7fLkIPiY6ohWFXuqumFq6HrM2yUobgNaG4Pt+vDwY4UBSGw4EBp3m6rpl4GkwKxqAqDow2GqLzB6VHl7Bn+dKgNRoAkCXI8sD1ccOIESZI4V5Vm21RxLIyrxDZ-wE7uqGUoMd1keeHeOBxDWQpUu8AdLgfBtKqbcU4a6+vmqjVhBA0qmpVD8W-k-4Ca5QOisPXKB6K5UACcnuMAhYsBIQZ2VEk+uPkHgwVVUUQHU2AVSxBGTW7LEWJ7XZcwYgbQtZxGK1XQfEZ6TGV4HjWr8QNSahvmwllH-p56VieINNtIA+J4M1crRnirzWRN3OnJYlqpqaxBM6SparsOWtpCVromdIUOh8XWBu5G1g0ltbwx03kZO1roD3pxqODWUX4PieJqS2HHOB+lQmpeDbNwEQkL1zmqkGFuW0FIKVrzTAO8xpC2kZtJOKmp7Gh19gl23gPJnlmbqMIqQ8Cd6Igh9jdEki2rWHTdKBl3SnZo-MSEjqM3MDQgjAoGYOSXa1BYwDUz7O3I2x9NJwFOj6LzNg3xcI4BgGACTDxHmq5mBm6zRJJEnOC44LGyDfSEqqtZwgpOuBJilDA06MkgM6eE-wxaw6Pu5xXUt93X7+ygh1rEIdlTg127QIG0pkMoQB066UZLBVTXsyqZI1Fdc65XXOMEZKwek-wGiNELmSU7YE6wQcl6B9jh7weeRdIb4IEDUQ8FhIuAhLyLU9DPsUeg3WcBOo7gseq8xLUbNUn+r8AAAKQ0BtoQ20y11mAuQ1B7wtzVGhlL2C2OUQF4QL0IHoj6Gbd5kkzeW6HKWZC04AQ7PSgq2yqaO8NbfdFMRzFx7vmW3NZIx0Yy+8BhEkWHkEIs1+M2du8lHchA6SD48szuv7rqTSZmxCgdICojrTBjw6xkre5bcPvIx8CxN5PCteICI3uNxdqFHfq8LBhf79gj2mtUHAriFge9ElPEIxiN329SQ0jP-GrPJ5tkc452SrbRW6CSrDgfY7CXLtlH5bgKLic1Ya0sT5tRgLtQg4OBfgdJcUz0BibJzX6pERAtkeFmEm0ADRWYIocUCvWqDH6lUybQYMGtbVnlcclqr3McgywTQPeoYbaowbB5ORmWZGYpONzEhWkKiyI0JmNG0AmwjAsoc+IAswPwBX08h3QdiDcA8GzoF0ZrFqzeBjC1+hBQqJ+mENfaT24hmdjIYe528jpihyZRvO2QEy-QJcMaNxDYC+0vwHBrg0yWagolPY1uSFBzDk5g8AAAoZg2g5wf+hYUMc8XECjqeiWW8nuqE+wlx-60cdbI1FYA8K8mkUcHCi0E3MBn6X8QtFPR1BjMnKtRiFjTt6JLi+SP6pA-drBCsJVlSsf+nKy9CFR8BuG6iaQA6RnoKSiTPKsoSCHw8QIRIc1dCBYNEw5wP09OCotXpXQOk8GbkLDiKFRY9FsqDmPXVqBm0r9n0A401kNWTtPA07V+sNoB42tAudEECCEYH7UcQYf+aPIMBogP0Ulp3bKklEaCDd66F026S8Gu4jcvmCYePiCci1fg8VECK9vWoUUQcYcx+nbJOvZJJBDppugHK12P0k4KZHIqkH-0qSTsKgtJupBsmMjpRuKI67bnkTnDnSxIAhJvs-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-aIUAXgpQyKkIiJ8htQ-+rZL2wE792fEOYnwWmJLroiT86ncy+9uEBjzNOEnHybIOWkpW7XWE3q5PhzLCbnMgpWiPYBhvXglZGGAubLgFf+eiZ-gDwLay4AMQWMAnHeUyh-q2cAvpEPFyp9yM4KNOqQULoMK0+NN1juhah+UBob84DZQgcrFWW4WtUI3CoRSIUw9urWD1-z3Q3B3cDkAZT4ZLZtwGfPeIVPlV2mtq5C6QC9IqzrT0Jk45cedxoh9I-RWZvJ6tjgIw2w1KqDrarwzXMjjEutfaQ2AB86EHeNy7zTpwsHl9tnpmXBLPBLk8rxym92kRaybwBpj82U6DBYNGXNMyvV5qSBv92DGgUObK5FEhv4tj6Q0y+I+DThU+OFwcT4ULB6k7dqCajvTbLkN2YhMep8xfg9f1SUARLigWD2QtJ8I8KLpvaPa+AN7wm5ym+wpHgfpPdXsLlp4k85ySQwgPqrt3WJ7eTzCoWbq+yFe6FRuz7odN-kdC-4TxQyv0N3rDCXeSijAmcyt-8EnC2PDi7PT7MfnzcDTWd4cotwUlHFuv16WgHQwTTodELjpbrs9Be92Plvz00QI6BJAJCFRFH4Ny2zFe8i8Qv3fqrzaYUwJcgjZYbp4FXrTAEAL32R-KjiFKjth+UwTWojag3F-1-xnWRLBO84LCPReKj1S9nAkR56Ej9iVSZcYLqUgzYD9qXoFSRzpADQl-d2wgQo-pxnyKkcurSZa2iA2tF3TrfyvJHXhhTqQUU8OM-euuJAUXGfsBuwlk9qKf8eVG3ehjxjLkaZGyDBN+gXvGwzR-svW6ax6iTqcRTT+1rBkpFM4cAMyoPaIBuuRrRjuXuT2scqRbH+5hfpsc35rVOxPjvuz732qijqHMvDY90FRw0e1HTA+tzjrGi2uXPkTUA89s5nn2AAisu7WHgvH46Dj6LUP88Mf5Kyn8vAYsZ6+ML3KK+8C4FZr7h9h++k2zCsxvmL63dOAANLZ3sEv8fBN+4kAd5HjMtggNKhLiyodPACG5v9XqIbaymEOTgrsHKAcVawEsDqNxjDOUDJcEGh9VBtuLpEHUBTA8+EHPC6VxNq07XPbwul7e2NQW-ilcp0rWRvh7KAzYtMnPZ6ny33KIFAAoPVyheY0CbwN-lRJBGwWyE4E+aOqUBJ1o+CICHZeCsxRpRMH8xTUoDA+pvg30a2IVTXz1FYswlfd+GR-4Zkum3ouEbNkncZ9mYE+laTn6+Y-Qf0vVq2DfB4A9yNEaze5MpK+SoIUlcl9gesKZrobWQBRsHw0wbhMWf2dj+SXO7AY-6tBCI07sNDSyUmNw28g1D6iIMSNd+3wCbvR0soQz0fAcML+hUhy-pvgCHoyBJHmP61b51u4qAxxaJTTQoaRFc4kg9ocC1e4t97LpCvqgsokuPjZAZpWj17ftPowNGFajz126E6aoy8DmFTLQpn6M+qFMO93IW8c+KH-BjvWa6B7phTL4hCKc6T1vv0Yj9vLN-FjU-qD9gBCc+XhsrrSsSv2bMmmhon9A+unzKnl8JXYSG8hwgNOZiOZ7NOfkP0d+WCyQSIXMky3IFFDZ+df4gVIhdZMBQK5AN+76x-pAiWOP2QFhc0t8g0KwK3dcwv6XbdVehVlM-+79Rw41fBtr69sPutbXi9FWyQYShD5GM9HBy-8qOSApAlDrWl-YSJHD8VFpRWdayh9mrZYVo0E9XRnI1ZNX3Hk1tWB7hmAWbTJS7AY8ZjQc1H1YfztAJdE8g-1PcFUCk18dTdgYA2yH0W0phNUKg-kJmVrCmYpjU8Q-dhoP-VzlMA6xWdFigfKmBZ1zC7DQCoNef1D9EQUgVWRQFDGVnht9dxjewsxV6WYCsZUXGXw93Qf1n8L-BfybVSfNkBUsy4NZ2PAAqEwGd9WOE4AuF6UbxUU4ZlZUTcBVlH-XoDCwWSAnQ3mOkhA4kWNtz-AxWfWmZhRMMIhaZKgAoDSAOQIjUCAu2d0Gb8HaJXXf8GtWO2fcUIHbFnoazAv04Ch-HgJH8yBGLyvcO5S-zzRawCSAIANnIOEbAamdlFgVSFRxDy46zSIHAxnlYP1NM2DWmyCoutNOCXhz7L4DmZY0WSGGM08MX1b99wIIOmAsg4EXDAy-en3l8DIYNDOd8AIbSUDnDPQBbgAqEQJQpVhZzQGCoAIyFtcBdUkEDgx9S40YxP0QoMkptgEoOS47vRzVz8q1GJgfI9ZKsw28VAw+QDpiWOSDAAjIMwJupQmU0nQFlgRa2EwofFLzLwu9RnFG0JoKDntsdjC+UAcPiBajgNdZKD1EDog+QNiC7kVugNAvwfPCcV2AxeSTJOUSoDywRfIoGWAa-ZYEbVyFMAFCg-OJsz4ZKfVeXh8gFGezD5UgAwK-sgdVHzpw6+V6BLBfvUYFR8O8fwFNBtWXrWqg5zXfjTkVEDlAnAwYHJVqFSdLSXJ0fvYxC8wS4doP7JhwA7gogOQPJkGE5gJ80TZKAJ+yJ9kKca1JhMraNCQRogOQCG0joDKTKBRAXaC5BGIOj38NIZLRSUx0gEFBOZkAUaQDAZICyyZN-YQhTrZ-sEWkjEs4B0zABGQ8nn00M7Ksz10x-UF260cxUUHpC-Q4xF-9M8P7wmBJgJODW9xYIv1VdQWA7hskaqFpHpBBwP+hGw5APlkRpeIZx3-RbCFwBGADxDpzMBCIMTiAwRMP-lrDvgIQDwRoAchU+ETgFoHehZQGp15CbbXgX7J6FfZHSZLUYRRIU3dR4FCowAFk3eIGvXa36sFIKMP9CWvQMKI40LOFWDcFEW2wiIfzXtkoAiARlmqg8IHcLHZKLMb0MdZ+bzwADx0NpDDAWwDJTYRfPbi3QwpeLz3UZcJNqUMAQGOZ3CAHTbTUG4NKYhAYZW8dsBzEJjI5wbxBgIbVcx+Tc3TxCzYD4i90n9UhCJ9VvWKXc9roM9EnVZ1VsFsgdw+DCphEdZUUf9D5WgXfR7baqld9xCbzHSMMoXKBwiEsGwzdt8DB7A7dJiL4Doi3sD-Hi4bvQ5H0037ba31Bz2JKiuVDwsiISBg0JVw8BcENlGl5wPcHhW9WDW8COAOBHYhoEZIBiGVCmsfXkNABATRET45AbQBHg9I2BEKgkfVCO-droHbHmN4uVqEQA8kI2AbB4udYNWAjTXSN7MfcHTAUhhPNXiUCJYGgRWR3dZUJJw1QhSI4oMNCcnjgQVRyMOsXQHyNRp20IhGij0SWKPd05AM-Xi52tcQE-QfiBqEhAso1GCUiFITcVWlIo8ihxV-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-1rtQA2pMBjEA2lcTmMqBchGgVXkzlXreWRcAS0B-UAtBCf4DnSgvYA2BD3RdqLogquWoj8ZCw+lABSbuVXU+AArNvVC90CE-RkQWFFSHbSCYJmiCIzHD3S+BaxcXhQ4kg0GIctDyV0GEgkSSqTLi-vRYRPRWeM3WSDrGObxVBcQDwACIzYeNLRN1wAGNxMdLRQHJI5Y4F0coaMiaH3c0U6ySh4TZTOUNNVxUwADFkdYWiCJGxP0TnBhBcsEMyw0nbB0ic0+x26MqMq6Rrk3gbELcI9AJO1t0L9V3QPxk1Hx3UcDGPxmso+WbAUalYvWyCeAD8ADU4AO4LOGyyT0y61qTlEScDqNjIhWm1wWxOsRdCT8ZYE4yuAbjPk1-0gNMnlisy61KyjI3s0-SScOvjyxDeWoGDSljfNNRsrGIAgjcXaQIAF0y6FsiWN94pm3zEX0vyNjQcrZ0yUiNvMxIStbtGUKITccVUjw1XhbbKyA+ZW40IQcXbrQGiyqECOsMLEkkDVM+hNtxusIQXXRtYolb3CvC8A81DWzfoTb0-SO8SQVHxNsC3B-M35NEGUVO2Mcj+CnnbRKyTHAX4G9hBXXjXmQoEYYHW5SoP0DbVBM6Eni4nOdHIslpAjgmepZnbIT7iJCDhXtlp2Hk3HgT7FkFsJf4mSj50RAmDylBFkFTlc9LkMN09DDgZxix4nzVpUoAzaBiVK5Pw-7GbThMYHJPDpbKNL8AqJIogzJzEKWGWxGAVIE-D6xLV0ihoBJtWUwkM6UNdcpATCK0AqAKLGVzIRIRTK4QGL4CJIHHMAGBz4MeEQlcuw01BdclxWSBsAfElkCY4dvaAiFyqUUOgw08mNQyfSjckwEhE0ibtSUsxZYoltwyiFNkaB3pIwB-xJwGywLsEAD4UqBZICQAKhUwy6TASQIRixLttE9REp91EW4JK8yOAbUIUzc-7AW5zXOXU-RFc6LCGVA4W5GYB1RH0lqByM+xxJIJZWsEQiPwn3LHJXFVm2byJIGgGgF5yTE0gNlgc5CshipcJng8l3XLPoAJ8GPGI95FPLiS9gcrSK0AiAFDJuMGjOXT6ztcL+FdBfACum6BgcnbFNzhc0OjhAA5E72fSg4YpgW9XAIEEQA4Mn6gOimlZqA+CrkfbmlEKhACiJChMIKC9DgZXJWqRmcoomaRWkEyLJhNHGcUeUlEciDN1kuI5mhJx5BLjftgC4GFzJO8gaSyYdFMF2S5feeZR48Ws7fJQygC-1jTo2KLtUmAz8y1nW4QwPeJ4tgDRk15yesrQExjxQN9Kts01Nrh0spAEbJAL4+N+lJQopTbUqtrcRZCOh3KPvPNyzAS5HrzjcjoDcF9MEPi49u9DG2OAaQDBG9wJCspl5yO8NMDfdGcsxOAhDgXwDpygKMIB-M1NCNKNVnjE1ShVOUb6ObovMCSH8oqoIXhPIBAiNE2jePGShvCHiHZ1g5pUplj8M8AueLCLz7DcBt4h5RFiGBEAiKky1SwWGBogWaa8CfMfEXFH807dFAVWzzZFmLftRQBv1MB8wIMFKLNQSiNCRCggxEv4ksiWClNEPHbJri+fIUX0oNpDe1BCYPbPPqL642PVCAFc3U2zJewlBE5p7ZIWCRJl-e7Tv0AZQophtii+CKvdvHVoo5z7iX6H6LUAJLOEVRpIdix4CwowGnQ1Yh2iPlYAHjR2skhaiCMAaQMxRwZPE5Glw8xXIMGI8MsomDOS7CpVCodDlGYGsKrsHvKWLTMq6SKAVfMGAoyEDYNB9hk8+IIop0YeIHsg5M64sQAcxPRjewKEZsJcA8wooEhL0ineGzSp8gDwqDoSm+Bw98WGYucZ5RbOGbDrwHEsTTkLJfPgLRPOcCfituakpVEwAWkqeJ3KFkuF4nEKiKWzdYc4tJUyfP8lbDcwS4KhLAS9+2E8QIP0Hsh-CnQKpBaeOADjlqiaHA1Bsi8-lMYQHejPO5c-QqHIMVIdxhFiGeQpV8YEHaay+tijCoGnDJUhqH-YwUT1JH9lUl50VKrED+Ie186DsCxdAS7IvgxxQbfLJymaQ4Bb5+7F+R0sfEB41PCpckPh-ynGNsDs4uAbxirNjSmaHzYtrc0oudDLbUDDLmGY4KCF3CqFKEA9A-JBl8pEzUC9sPoyIsgFUXedyIJ4iyiE6k2ixhDBgDgmdIwE1hbIpGsOGVIrRkYudliBKZeeMry41hIOFOCD5c5ku5QC40sA1UgfQCZMTxGzH2R7GQjVkQbUd7K8hHVZ1T9JQ4KBENpnVPI1l09goOCwAmkHjT50vGUxEVcHY8gnTK0hUKTKgnLJBTsKScId32yS8wxEkDzxFSBjxceW9A7AccHbRsAfEOnEfCZw3Mo8EIAoX2A4gKnxA7wJYLez+xx6ZUUW5ifIDF8tfA0rO3144GXWREcrM7R-MT9SgGhKsnNLDiT6iWlEgNMbL-Mu97OIIWDZKIoCtoNKARpgxScNYK3zxXGEAlvQIcgKwiEzANAS7YqzGxSYqlUdLkkUEDcRwqBQEiU1OZzgldlI0CKnS1mNKACWDFoTfXFmshiyRP0GADAem3mUAwJGTVTBmZ+3XkrnS4LUA1K2FG4B4geVlf85TK5yfNDjSgAIiykCCvftu4tIs1INCXjUcpXtGyVF9fSJ0v4hfY4aEx59gw4FMDLytRCUKwjBHjEk7I4eWRTk7b13+CZEoCxhB0cN0GEFHEEKoBBVMLGWPLCtPKzog3cbAITKCU0Av0SAYUrIohncfZLdBFUucEbBZ476PCy+wTfCcqmsHL3R4lDQqHiRWc9W1LTlKjrmjKnC6NOJ5c03CUfD3OQHjVDlSg5gQBo4soyDgXKFrxLhsMiaFCYxM5av2z1gOMo7k3nEMycrgoqpjdwNquVK2qy1NuS4QW4VBNzFS7RkEiK8scKN+hPjXI2U90hReG1JF3aKo8gD4m3C1t3c-I0fVh4Q4EElJTQ1D-8kcoYITDwMkiWGDjBar21gz3bYhnDkuDEyuQUHDsG2qtczaumMbADpFJTtJUuzS9DAUfLhh0hegAgzXrZwFZs8mZUo-1XqkyDxkzAeaPervwT6rcqHPcVlwySkx-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-0PT-AhSAYs8CAqQfQVDZixO9o2zVOfzymSKF1SQAOQBAAjaskAwBsAPAEIBgATECwAHkIBAIB6ekADfrPoWnsxAJgSEExAGVEAHxl7IYskxACATEEMiAUdvORh-azcNXgo8gQQV4zGE4BF7zATEHJsR4czX2R2AJ6FuwrSvKWV7MQXXrJ7z0QmnhRhe-AFZ7I4WXVN77oGRubQ7qMpDbl3OS2Ey7kW5gMFVoBOkirpyUMwCWdee89FKMggK3pABMY6rgLUnemXssaJksJkxAAAX2j6+eiAw56WezEHZ7A+pCk4hfe8aTZrBe0FED7+JYEhD6pe6SFXheHBsUDAFeoIggAlelXucAGHUvotC4kR6TRZde5XpAADevnuN6PS03tZ7rAEgFN6IIUED57rAGwD768owfrIAJAEfoH7z0awBQhJ+3CkxBrAa6Dn6x+kgDthl+6ftfh1+hfrIApALfuIAyAHxD37OkI-tsBe+2nv775+-fpxQT+t1xv7Z+8-tH6N+qLpv61+h-qn7t+wJxv7d+t-sv7SAYCpv6OkE-oHwgB4fp-6x+iQAn6wBjfokB7+ggAv7wBpfqgHt+iQFf64Bx-uQHFAIAe-60B9-v36JAQ-qQG8BwAcIGdmM-pwHf+8mlAHyBsfpQhIB6gY36DfE-uIYmB1AZdx0B-frCCmB7AbYHcBnZgIH6B7fpQhiBgQf37E2E-t7ZxBugZ4GKBjCPEHEBkQdIBroVgfgGN+yyPEHuBlQe37rofgekGx+0aJP7+4AwaoHdBjfu74DB2AZMHt+u2HkHLB-frthlB9gdIB7kgwY0HHB1fp0HNBuweEHbBscTIGfBi1uMHPBscSkGghi1osHQhxQBsGIhhwd4GLWzAZIGLW1wdiHFADwbcHFAbwdCG35E-taVshkIbcG9c7IaiH8hmIYoGV1bIaSHSh1IdiGpADIbcG1NE-pyKGhvIdiHZtBoaKGWhkobH6QdBoYqGuhqoYoG4Kk-pP0hhwIbcGOkZoYoHZjIYfaHJhzoY36OkeIYUGSADpF6H5h-obH6OkWod4HnzI-t-NdhhQH2Hwhxwd0t9huYYX6XkRYZ8GXkVYfOHfEfYa2Hf+nFD8GghnFFGHth2-pIGcUI4feGZhwfpxQzh4gBxRLhl4ZsAbhwEf-7Phwmt2HgBz4YvxoRiYb+GYB6Ed+Hp+t1wBH3PJQGhGwRjEfWHUR4b12GjqAkbeHHh2gYJHvhkkZRHzhpRgJHgR44ZQhsR1tFxGqRh4b+GxBz4YkH2RhEdRHZB9kcpHARpQd2G1B9kYZHtBwUZZHURwwc+Ga+XYbMGpR8kb+HrBmUfRHGsWke2G7YBkbtgmRwEbthxR84fHFdh2iQNGuRvUflHURyIYNHlR4WQNGGRlIYNHdRwEayHPhnIadHjRh0dNHzhqQD5H3PKQGVGyhp0YZGhC3YZqHdh+oc+HGhsMddH3PVobDGvR4CuVHuhsMYZGQKkMftH3PYYc+HaDXYfGGsx90cBHDjLMeVGFhrMYZGiarMdTHp6o-oHxiRwfpibKx8mjrGvRgfHRGB8VUd-6B8bEZ9a6x8sZeRKx6-pIGL8SMYvxcx89sbHGsXsdbGax0Ebn7Y+6PsN6QALRCYAAANSjTaekABYAbAOcYOtrwEsCGhxnWnoABtEAEmwSwAAH0hOD4BAAAAXWj6gAA




# Skill suggestion
Source: https://docs.typesafe.ai/cookbooks/skill_suggestion

Picks at most one skill for an agent turn out of the 182 in Nous Research's Hermes catalog, using two TypeSafe requests to rank and re-check the top candidates.

*Agents choose skills by truncating and loading them all into the system message, which
increases costs, degrades skill selection performance, and induces context rot for the rest
of the session. We address this by using two TypeSafe requests per turn, one to rank skills
and one to verify the choice, and reduce incorrect skill loads by more than half.*

An agent with a large skill roster makes its choice on almost no information. The roster
reaches it as an index: one line per skill, with the description truncated so the full text
doesn't crowd out the conversation. Hermes, the agent harness used here, cuts it to 60
characters by default. For example, at that width the skill that *edits* `.pptx` files
reads nearly the same as the one that *authors* them. Ask for a pitch deck and the agent
may load the wrong one. On a turn where no skill fits at all, it may still load
one anyway, because a list of names invites a guess.

This cookbook leaves the descriptions alone and uses progressive disclosure instead,
reading all 182 skills cheaply and then reading three of them in detail. Two TypeSafe
requests go in front of the decision on which skill to load, if any. The first ranks every
skill in the roster against the user's turn and answers whether the turn needs a skill at
all. The second re-reads only the top three, now with each skill's full description and the
opening of its instructions, and is free to reject all of them.

The winner's name goes into one extra line of the agent's system prompt for that turn:

[Code example: see complete pages/cookbooks/skill_suggestion.md]

The agent keeps its full index and its own judgement, and that one line only tells it which
entry to look at first. The roster itself never changes, so any prefix caching over it
still holds. Over 488 requests against `claude-haiku-4-5-20251001`, using skills from the
Hermes roster:

|                                      | loads the wrong skill | loads one when nothing fits |
| ------------------------------------ | --------------------- | --------------------------- |
| agent alone, with just its roster    | 16.8%                 | 9.8%                        |
| **agent with a TypeSafe suggestion** | **7.3%**              | **4.0%**                    |
| agent handed the right answer        | 2.5%                  | 1.2%                        |

The third row shows the floor for making mistakes is not zero, because an agent given the
right skill still does not always load it, and no selection method, however good, gets past
that.

You end up with a `suggest()` function that returns at most one skill name, a
`suggestion_block()` that wraps it for the system prompt, and the harness that produced the
table above, ready to point at your own roster.

[Code example: see complete pages/cookbooks/skill_suggestion.md]

## Setup

* Install the TypeSafe client, the Anthropic client, and the shared cookbook helpers.
* Set a [TypeSafe API key](https://console.typesafe.ai/keys), and an Anthropic key for the
  agent being measured.

[Code example: see complete pages/cookbooks/skill_suggestion.md]

> **Note:** the code blocks below are one script, in order. To follow along, put them in a
> single file in the order shown.

## Caching results

`JsonCache` saves each call's result, keyed on its inputs, so re-running replays the
numbers below instead of calling either API. Delete `json_cache.json` to run live. The
published run used `jev-1.12` and `claude-haiku-4-5-20251001`, rendered 2026-07-31.

[Code example: see complete pages/cookbooks/skill_suggestion.md]

## Step 1: load the roster

`hermes_roster.json` holds the 182 skills of
[NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) (MIT) at one
pinned commit. Each record holds a skill's name and category, the description as the index
shows it, the full description, and the opening of its `SKILL.md`.

The index below, and the instructions above it in the prompt, are copied from Hermes.

[Code example: see complete pages/cookbooks/skill_suggestion.md]

[Code example: see complete pages/cookbooks/skill_suggestion.md]

## Step 2: score the agent on its own

`requests.json` holds 488 single-turn requests, 315 of them covered by exactly one skill
and the other 173 covered by nothing.

The covered requests were written by Claude Sonnet 5 from each skill's own `SKILL.md`, so
the labels are trustworthy and the requests are easier than the ones users send.

The 173 uncovered ones were all written to punish guessing: 85 everyday requests, 42
technical questions no skill serves (*explain what a monad is*), and 46 that ask for
something specific the roster has no skill for, like *post this to Mastodon* on a roster
that covers X and nothing else.

Scoring reads the agent's first response only. Both numbers are error rates, so lower is
better on each:

* **wrong load**: of the covered requests, the share where the first `skill_view` call was
  not the covering skill. A turn that loaded nothing at all counts as a miss.
* **needless load**: of the uncovered requests, the share where the agent called
  `skill_view` at all.

[Code example: see complete pages/cookbooks/skill_suggestion.md]

[Code example: see complete pages/cookbooks/skill_suggestion.md]

The suggestion goes in its own block of the system prompt, after the roster rather than
inside it, so the roster text is identical on every turn to maintain prefix caching.

The agent has a minimal set of tools, including `skill_view` to load a skill using a
free-text name. The name must match the skill exactly for a correct load.

[Code example: see complete pages/cookbooks/skill_suggestion.md]

The agent runs first with nothing but its roster, the way it works today. Its two error
rates are the baseline the rest of the cookbook measures against.

[Code example: see complete pages/cookbooks/skill_suggestion.md]

[Code example: see complete pages/cookbooks/skill_suggestion.md]

Wrong loads land in the right skill's own category far more often than chance would put
them there, so the hard part is telling a few lookalikes apart. The agent is already
looking in roughly the right place.

## Step 3: rank the whole roster

One request carries two kinds of question:

* **`which`** is a [`Choice`](/primitives/choice) question
  over all 182 skill names, with the index description as each option's criteria (the same
  text the agent itself gets). Its probabilities are the ranking.
* **three [`Noul`](/primitives/noul) questions about the
  request**, printed below, each asking a different way whether it wants an action taken
  rather than an explanation given. `prose_suffices`
  counts the other way round. Their mean decides whether to suggest anything at all, and
  under 0.30 nothing is suggested.

Both go out in one request, so the ranking and the check cost one round trip.

Write these three to ask whether an action is wanted. A question about subject matter will
not separate *explain what a monad is* from a request that needs a skill, since both are
software.

One `Choice` question holds a roster this size comfortably. A few times larger and you
would
split it into chunks and rank each one, then run this same shortlist step over the winners.

[Code example: see complete pages/cookbooks/skill_suggestion.md]

[Code example: see complete pages/cookbooks/skill_suggestion.md]

The Notes.app request is unambiguous, and its top option is the right one. Nothing a
ranking can do will save the Mastodon one: the three questions say a skill is wanted,
because posting to an account is an action, and with a skill for posting to X and nothing
for Mastodon the closest skill wins anyway.

That leaves the deck. Both leaders are `.pptx` skills, and on 60 characters the wide Choice
question puts the editing skill ahead of the authoring one, for a request about
authoring a deck.

## Step 4: rerank the top three

Three options leave room for the full description plus the opening of each skill's own
`SKILL.md`, so the second request puts the same question to better evidence:

* **`which`** is a `Choice` question over the shortlist, with that longer text as each
  option's criteria.
* **`fits::{name}`** is one `Noul` question per candidate: does this skill do the
  specific
  thing the request asks for? Each is answered on its own, so they can all come back low,
  and a shortlist whose highest one lands under 0.30 gets dropped entirely.

[Code example: see complete pages/cookbooks/skill_suggestion.md]

[Code example: see complete pages/cookbooks/skill_suggestion.md]

The two `.pptx` skills separate once each one brings its own text: the deck request flips
to the authoring skill.

The `fits` nouls and the Choice disagree there: the nouls score the editing skill higher
while the Choice picks the authoring one. They are deciding different things. The Choice
settles *which* skill, and the nouls settle *whether* to say anything at all.

The Mastodon request survives both checks: its best `fits` noul lands above 0.30, so the
recipe suggests the X skill for a request about Mastodon. Most requests like it are caught.
The second pass can only reject what the wide ranking hands it, and here that was three
near-misses.

The function below is the whole recipe: two requests and two thresholds, with at most one
skill name coming back.

To point it at your own roster, replace `hermes_roster.json`. Every question above reads
`name`, `description`, `description_full`, and `body` out of that file, and nothing else
knows about Hermes.

[Code example: see complete pages/cookbooks/skill_suggestion.md]

[Code example: see complete pages/cookbooks/skill_suggestion.md]

## Step 5: measure the suggestion

Each of the 488 requests goes to the agent three times, one measured turn each. The runs
differ only in what the agent is told:

|                         | what goes in the system prompt                                     |
| ----------------------- | ------------------------------------------------------------------ |
| agent alone             | nothing                                                            |
| agent with a suggestion | whatever `suggest()` returned                                      |
| agent given the answer  | the covering skill's name, or "nothing applies" when there is none |

The third is not achievable; it is the ceiling the other two get measured against.

The wording of that suggestion is doing two jobs. It says the suggestion can be ignored,
because pushing harder wins compliance on wrong suggestions too, and a wrong one is worse
than none. And a turn with nothing to suggest still sends a sentence saying so; sending
nothing at all would leave the roster's own "err on the side of loading" instruction
unopposed.

[Code example: see complete pages/cookbooks/skill_suggestion.md]

[Code example: see complete pages/cookbooks/skill_suggestion.md]

[Code example: see complete pages/cookbooks/skill_suggestion.md]

[Code example: see complete pages/cookbooks/skill_suggestion.md]

The suggestion fixes many more requests than it breaks, but it does break some the agent
had right on its own. A confident wrong suggestion is more persuasive than no suggestion at
all, which is the price of putting one in front of the turn.

[Code example: see complete pages/cookbooks/skill_suggestion.md]

<img alt="output" />

## What the results show

* Wrong loads fell from 16.8% to 7.3% and needless ones from 9.8% to 4.0%, which is most of
  the gap between guessing from a truncated index and being handed the answer.
* Some requests the agent had right on its own come back wrong once a suggestion is
  attached. Counts are above.

Copy this shape when an agent of yours carries a large roster: a cheap ranking over
everything, then a close look at two or three. Either step may come back empty-handed.

## Open it in the playground

Build a playground link for the deck request from step 4, using each candidate's full
description and body excerpt as its criteria.

[Code example: see complete pages/cookbooks/skill_suggestion.md]

<a href="[long playground URL saved in original]">Open the shortlist + questions in the TypeSafe playground →</a>

## What's next

The same shape shows up elsewhere:
[Intent Routing](/patterns/intent-routing) for routing to a
handler rather than a skill, [Confidence](/confidence) for
picking the two thresholds, and
[Speculative Fan-Out](/patterns/fan-out) for putting every
question in one request.




# Demos
Source: https://docs.typesafe.ai/demos

Interactive examples showing what's possible with TypeSafe.

## Available demos

* [Smart Home Assistant Demo](/demos/smart-home) - Evaluate user smart home requests with speculative questions and LLM fallback.

<Tip>
  We're always keen to learn how people are making use of our primitives. If you've found a killer use case you think should be mentioned here, feel free to drop us a note!
</Tip>




# Smart home assistant demo
Source: https://docs.typesafe.ai/demos/smart-home

Demo code: a smart home assistant that uses TypeSafe to evaluate user requests.

## Check it out in action

<Frame>
  <iframe title="Smart home assistant demo video" />
</Frame>

## How it works

### Speculative fan-out

The chief pattern demonstrated here is [speculative fan-out](/patterns/fan-out). Each user request is evaluated against a long list of questions, including many that will end up irrelevant for most requests.

Let's consider the following user request:

> "Turn off all of the lights in the house"

This is a very simple request, and our code will only need to consider the answers to the following questions:

* "What category of request is this?" (smarthome command)
* "What domain is this request targeting?" (whole house)
* "What type of device is this request targeting?" (lights)
* "What action should be taken on the lights?" (turn off)

Notice that the last question is written with the assumption that the user is issuing a command to lights, and we ask it before we know what the user is actually requesting. This is what we call a "speculative question" - we ask it before we even know if it's relevant, allowing us to evaluate all questions in parallel and rely on code to filter out the irrelevant results after the fact. This is a key pattern for building systems that can handle a wide variety of user requests with a single set of questions.

#### The wrong way: sequential API calls

The wrong way to do this would be to separate the questions in to multiple API calls, waiting to ask questions only once you are certain you need the answer:

* "What category of request is this?" (smarthome command)

Then, only once you know it's a smarthome command:

* "What domain is this request targeting?" (whole house)
* "What type of device is this request targeting?" (lights)

Then, only once you know it's targeting lights:

* "What action should be taken on the lights?" (turn off)

This approach optimizes for a minimum number of questions, but it ends up being much slower and more expensive than batching all of the questions in to one upfront API call.

### TypeSafe and LLM pairing

This demo also shows how TypeSafe can be paired with LLMs to handle a system that sometimes requires a string-generation step:

**Splitting a compound user request:** One of the questions in this demo is a Noul question identifying if the user request is asking for more than one distinct action. If this is true, the system uses an LLM to split the request into a list of atomic commands. The split requests are then evaluated by TypeSafe individually.

**Falling back to a conversational LLM:** When TypeSafe determines that the user query is a request for general information or conversation, the system calls an LLM to generate a freeform response. This allows an interactive system to handle requests with known deterministic behavior in a fast and cost efficient way, while still allowing for the flexibility provided by a generative LLM when needed. The initial TypeSafe response is so fast compared to the LLM response that it adds negligible latency to the overall system.

## Run it yourself

This demo is a simple Vite/React single-page app that uses the TypeSafe API to evaluate user requests. The full source code will be available on GitHub at release. Its README includes instructions for running the demo locally and an overview of which bits of the source code are responsible for which parts of the demo.




# Introduction
Source: https://docs.typesafe.ai/introduction

Jev is TypeSafe's flagship model and the first System One model. Send state and typed questions; get structured answers your code can use directly.

Large language models (LLMs) are designed to produce text for humans to read. When you need a model to make a judgment that your code will consume, that creates a mismatch: you are coercing a text-generation system into outputting structured decisions, then parsing the results back into something your code can depend on.

Jev is TypeSafe's flagship model and the first [System One model](/concepts/system-one). System One models are built to make fast, structured decisions that software can use directly. Jev evaluates typed *questions* against a *state* and returns structured results directly. No text generation, no parsing. You get typed values and probability distributions that your code can branch on, sort by, and route with. Choice and Score also return [confidence](/confidence), which your code can use to decide whether and how to act on an answer.

[Code example: see complete pages/introduction.md]

## TypeSafe primitives

TypeSafe exposes three *AI primitives*. Similar to software primitives, our AI primitives are modular, composable, structured, reliable, and fast. Each asks a different type of *question* and returns a different type of answer.

| Question type                | Goal                         | Returns                                 |
| ---------------------------- | ---------------------------- | --------------------------------------- |
| [Choice](/primitives/choice) | Choose an option from a list | `choice`, `probabilities`, `confidence` |
| [Score](/primitives/score)   | Score the state on a rubric  | `score`, `probabilities`, `confidence`  |
| [Noul](/primitives/noul)     | Is this statement true?      | `noul` (0–1)                            |

All three *question* types can be mixed in a single API call. Every *question* is evaluated in parallel and in isolation against the same *state* in one go. Adding questions barely changes the response time. Each question is evaluated independently, so adding more questions does not create context-rot.

## Atomic questions, composed in code

System One models work best when each question asks one specific, well-scoped thing. Think of each question as a gut-check determination: the kind of judgment a highly knowledgeable person could make in a few seconds given the right context.

If the question you want to ask would require extended reasoning or weighs multiple independent factors, decompose it. Ask each factor as a separate question, then combine the results with logic in your code. This keeps each individual evaluation reliable and gives you full control over how dimensions are weighted.

For example, instead of "rate this startup pitch," ask separately about market size, technical feasibility, and differentiation. Combine the scores with your own formula. When priorities shift, change a coefficient in your code rather than rewriting a prompt.

## Next steps

* [Quick Start](/introduction/quickstart) — Everything you need to get started immediately.
* [AI Primer](/introduction/machine-learning-primer) — Why TypeSafe trains models for calibrated decisions instead of generated text.
* [Primitives (Questions)](/primitives) — How to define questions, choose between Choice, Score, and Noul, and ask several at once.
* [Confidence](/confidence) — How TypeSafe reports certainty, and how to use it architecturally.
* [Patterns](/patterns) — Common patterns for building systems with TypeSafe.




# Jev with coding agents
Source: https://docs.typesafe.ai/introduction/coding-agents

What Jev is (and isn't) when you're using a coding agent.

If you found TypeSafe while looking for a model to plug into your coding agent, start here. Jev is **not** a drop-in replacement for the LLM behind Claude Code, Cursor, opencode, Copilot, Muse Spark, Grok Bot, or similar tools. Instead, you can use your coding agent as usual to write code that uses Jev to make decisions.

## Jev is not a chat or code-completion LLM

Jev is a [System One model](/concepts/system-one). It does not generate text, write code, or hold a conversation. It takes a [state](/concepts/state) and a set of typed [questions](/primitives) and returns structured answers your code can use directly:

* A `choice` from a list of options, with per-option probabilities.
* A `score` on a rubric you define.
* A `noul` (0–1) for a true/false statement.

Coding agents rely on an LLM that streams text, calls tools, and edits files based on natural-language instructions. Jev does none of that. There is no `model: "jev-latest"` setting that turns your coding agent into a Jev-powered agent, because the two systems solve different problems.

## What you probably want instead

Pick the row that matches what you were trying to do:

| You wanted to...                                                                                                              | Do this                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Make your coding agent better at *writing code that uses TypeSafe*                                                            | Install the [TypeSafe agent skill](/agent-skill). It gives Claude Code, Codex, and other agents full context on the Jev API, the [primitives](/primitives), and the [patterns](/patterns) so they can generate correct TypeSafe integrations for you.                                                 |
| Use Jev inside an app or agent you're building — for routing, classification, scoring, guardrails, or any structured decision | Start with the [Quick start](/introduction/quickstart), then read [How to build with TypeSafe](/concepts/how-to-build-with-system-one) and the [Patterns](/patterns) for common architectures like [confidence routing](/patterns/confidence-routing) and [intent routing](/patterns/intent-routing). |
| Replace or swap the model that powers a coding agent                                                                          | Jev isn't the tool for this. Keep using an LLM-based coding agent, and use Jev separately wherever your product needs a fast, calibrated, structured decision.                                                                                                                                        |
| Try Jev before writing any code                                                                                               | Open the [Playground](https://console.typesafe.ai/playground), paste some text as the state, and add a few questions. See the [Quick start](/introduction/quickstart) for a walkthrough.                                                                                                              |

## When Jev is worth reaching for

Even though Jev isn't a coding-agent LLM, it's often exactly the right tool *inside* an agent or app you're building with a coding agent. Reach for Jev when your code needs to:

* Route a request to one of a fixed set of destinations, and know how confident that routing is.
* Score something on a rubric (urgency, quality, risk) and branch on the number.
* Check whether a statement is true of a document, message, or record before taking an action.
* Replace a fragile prompt that asks an LLM to "return JSON" with a call that returns typed values by construction.

If any of that matches what you're building, the fastest path in is the [Quick start](/introduction/quickstart), then the [primitives](/primitives) reference for the question types.

## Next steps

* [System One](/concepts/system-one) — What a System One model is and how it differs from an LLM.
* [Quick start](/introduction/quickstart) — Try Jev in the Playground, over HTTP, or with the Python SDK.
* [Agent skill](/agent-skill) — Give your coding agent context on the TypeSafe API.
* [Patterns](/patterns) — Common architectures for building with TypeSafe.


