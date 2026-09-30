# Score
Source: https://docs.typesafe.ai/primitives/score

A Score is a System One question type for rating content against ordered, descriptive levels. The answer includes a score, a probability for each level, and confidence.

Use a Score when the answer is a position on a spectrum you can describe in steps. For example, how severe a bug is, how happy a customer is, or how much Python experience a candidate has. If the answer is one of a fixed set of options with no order between them, use a [Choice](/primitives/choice). If it's a yes or no, use a [Noul](/primitives/noul). [Choose a question type](/primitives#choose-a-question-type) compares all three.

A Score answer is a position along your levels in `score`, which can fall between two levels. The model also returns a probability for every level in `probabilities`, and a `confidence` value for the answer.

<ScoreExplorer />

The numbers in front of each step are positions, explained under [Levels](#levels).

## Request structure

The POST request body to the [TypeSafe API](/api) has the same three top-level fields as any other question type: `state`, which is the content to evaluate; `model`; and `questions`. Each Score question has the following fields:

* `type`: Always `"score"`.
* `instructions`: The question the model answers. What it's rating.
* `criteria`: An ordered array of level descriptions, from the low end of the scale to the high end. Should have at least two levels; the API accepts up to 10.

Below is a request where the state is a bug report and the question is how severe the bug is:

<TypesafeExample />

You choose the question id, `bug_severity` in this case. This id is not sent to the model. The answer is returned under the same id.

### Levels

Each entry in `criteria` is a level: one point on the spectrum of possible answers, described in words. A level's number is its position in the `criteria` array, starting at 0, so the three entries above are levels 0, 1 and 2. The order of the array is the numbering.

The model gets the descriptions and nothing else, and each level is judged on its own against the state.

The `score` in the response is a position on the levels spectrum. For a three-level scale it runs from 0 to 2, and it can land between two levels.

Our [client SDKs](/sdk) provide typed questions. In Python, the same question is a `Score`:

```python theme={null}
from typesafe_sdk import Score, TypeSafeClient

with TypeSafeClient() as client:
    response = client.system_one(
        state="The export button crashes the settings page in Safari. It works in Chrome, but a few of our customers only use Safari.",
        questions={
            "bug_severity": Score(
                instructions="How severe is the reported issue?",
                criteria=[
                    "Cosmetic; no impact to functionality",
                    "Broken or degraded feature, but workaround exists",
                    "Blocking issue; no workaround exists",
                ],
            ),
        },
    )

    print(response.answers["bug_severity"].score)
```

Use the `system_one` method or the `https://api.typesafe.ai/v1/systemone` endpoint to call a System One model. The `model` field selects which model handles the request. [How to build with TypeSafe](/concepts/how-to-build-with-system-one) covers where in your code to call it.

Use one of our [client SDKs](/sdk) or call the [TypeSafe API](/api) directly. If a coding agent is writing the integration for you, install the [TypeSafe agent skill](/agent-skill#installation) first so it knows the request and response shapes.

<Note>
  `instructions` and each level in `criteria` can be a string, an object, or an array. Start with strings. Use an object when a level needs a description plus a few example situations. See [Structured level descriptions](#structured-level-descriptions) below and the [API reference](/api#param-instructions-2).
</Note>

## Response structure

The response has one entry in `answers` per question, under the ids from the request. This is the response to the example request above:

```json theme={null}
{
  "model": "jev-1.13.0",
  "answers": {
    "bug_severity": {
      "type": "score",
      "score": 1.43,
      "confidence": 0.35,
      "legend": {
        "0": "Cosmetic; no impact to functionality",
        "1": "Broken or degraded feature, but workaround exists",
        "2": "Blocking issue; no workaround exists"
      },
      "probabilities": {
        "0": 0.0,
        "1": 0.57,
        "2": 0.43
      }
    }
  },
  "usage": {
    "input_tokens": 332,
    "output_tokens": 18
  }
}
```

Each Score answer has five values:

* `type`: The type of TypeSafe question.
* `probabilities`: The probability of each level, keyed by level number as a string. The sum of all values is 1.
* `score`: The position on the level number line, from 0 to the top level number, which is 2 here. It's each level number multiplied by its probability, added up: 0 x 0.0 + 1 x 0.57 + 2 x 0.43 = 1.43.
* `legend`: Each level number mapped back to its description.
* [`confidence`](/confidence): A number from 0 to 1 computed from how `probabilities` is spread. A single peak on one level means high confidence. Probability spread over several levels means low confidence.

A score of 1.43 means the model is split between levels 1 and 2, leaning to level 1. That matches the report: the export is broken, and switching to Chrome is a workaround for most customers, but not for the ones who only use Safari. The model puts 0.57 on "workaround exists" and 0.43 on "no workaround", and confidence is 0.35 because it's split.

Using the Python SDK, `ScoreAnswer` has `score`, `confidence`, `probabilities`, and `legend` as typed fields. The SDK keys `probabilities` and `legend` by integer level rather than by string.

## Reading a Score

Let's look at how the score changes with different inputs. For example, using the question and its levels from the request above:

```
"How severe is the reported issue?"
  → 0: Cosmetic; no impact to functionality
  → 1: Broken or degraded feature, but workaround exists
  → 2: Blocking issue; no workaround exists
```

We can see how different bug reports change the score:

<table>
  <thead>
    <tr>
      <th />

      <th><code>probabilities</code></th>
    </tr>

    <tr>
      <th>State</th>
      <th><code>score</code></th>
      <th><code>confidence</code></th>
      <th>Level 0</th>
      <th>Level 1</th>
      <th>Level 2</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>The export button is misaligned by a few pixels on the settings page.</td>
      <td>0.0</td><td>1.0</td><td>1.0</td><td>0.0</td><td>0.0</td>
    </tr>

    <tr>
      <td>The PDF export button does nothing when clicked. I can still export to CSV and convert it myself, but that takes ages.</td>
      <td>1.0</td><td>1.0</td><td>0.0</td><td>1.0</td><td>0.0</td>
    </tr>

    <tr>
      <td>Export to PDF fails with a spinner that never finishes. Some of our team say CSV export still works for them, others say it fails too.</td>
      <td>1.11</td><td>0.84</td><td>0.0</td><td>0.89</td><td>0.11</td>
    </tr>

    <tr>
      <td>The export button crashes the settings page in Safari. It works in Chrome, but a few of our customers only use Safari.</td>
      <td>1.43</td><td>0.35</td><td>0.0</td><td>0.57</td><td>0.43</td>
    </tr>

    <tr>
      <td>Nobody on our team can log in since this morning. We get a 500 error on every attempt.</td>
      <td>2.0</td><td>1.0</td><td>0.0</td><td>0.0</td><td>1.0</td>
    </tr>
  </tbody>
</table>

In these examples, confidence 1.0 means the returned distribution puts all its probability on one level. This describes the model's answer, not a guarantee that the answer is correct.

The score is a probability-weighted mean of the level numbers. In the third and fourth examples, probability is split between levels 1 and 2. More weight on level 2 raises the score. It does not measure the fraction of customers without a workaround.

Different distributions can produce the same score. A score of 1.0 can mean all probability is on level 1, or half is on each of levels 0 and 2. Read `probabilities` and `confidence` alongside the score to distinguish these cases.

A fractional score is a position. You can use it to rank reports by severity, or round it to the nearest level when your code needs one outcome. Our [entity alignment cookbook](/cookbooks/entity_alignment) shows an example of rounding to the nearest level to make a decision.

Low confidence on a Score usually means one of three things. The levels overlap for this state, the question is measuring more than one thing, or the state doesn't say enough to place it. Our [Confidence](/confidence) docs cover how to use it in your code.

## Writing good levels

Describe situations, not degrees. "Broken or degraded feature, but workaround exists" gives the model something to match the state against. "Moderately severe" doesn't. Concrete descriptions can help the model distinguish levels. Check the answers against known examples; higher confidence alone does not show that a description is better.

Every level is evaluated separately. The model doesn't see a level's number or its neighbours, so "worse than the previous level" means nothing to it, and numbers in the descriptions or the instructions don't help. Here is what happens when the levels are only numbers, on the misaligned-button report from the table above:

```
instructions: "Rate severity from 0 to 2, where 2 is worst"
criteria: ["0", "1", "2"]
→ score 0.55, confidence 0.33, probabilities 0: 0.45, 1: 0.55, 2: 0.0
```

The same report with the three descriptive levels scores 0.0 at confidence 1.0. With numbers only, the model has nothing to match against and splits the probability between 0 and 1.

Use as many levels as you can describe distinctly, up to 10. Three is fine. Don't add levels you can't describe distinctly.

Keep each Score question to one dimension. If a description says "punctual and smart and experienced", the question is measuring three things, and an input that is high on one and low on another can't be placed. Confidence drops and the score means less. Split it into one Score question per thing and combine them in code, as the next section shows.

If the top of your scale has a rare extreme case you need to act on differently, give it its own level. A sentiment scale that ends at "very angry" can add "abusive or threatening". Without that level, both messages may receive a score near the top. The score alone may not distinguish them.

If there is no in-between at all, and the answer is one of a few discrete categories, use a [Choice](/primitives/choice) instead, or split the question into several [Noul](/primitives/noul) questions. It's important to test your levels against your own data. Two wordings of the same scale can behave differently on your data.

## Splitting a complex judgment into several Score questions

A complex judgment, one that depends on several things, is best split into one Score question per thing. You can then combine the Scores returned from TypeSafe in your code to make the judgment. Some Score questions may matter more than others, so give each Score question a weight for its relative importance. The weights are yours. When the combined result doesn't match what your team would decide, change them in code and run again. Send the Score questions in one request. They are evaluated in parallel. Adding questions barely changes the response time and costs a few extra question tokens; see [Ask multiple questions together](/primitives#ask-multiple-questions-together).

The request below is the spinner ticket from the table above with some more context. It asks three Score questions: how severe the bug is, how frustrated the customer is, and how much the report gives an engineer to work with.

<TypesafeExample />

TypeSafe's response:

```json theme={null}
{
  "model": "jev-1.13.0",
  "answers": {
    "severity": {
      "type": "score",
      "score": 1.24,
      "confidence": 0.64,
      "legend": {
        "0": "Cosmetic; no impact to functionality",
        "1": "Broken or degraded feature, but workaround exists",
        "2": "Blocking issue; no workaround exists"
      },
      "probabilities": {
        "0": 0.0,
        "1": 0.76,
        "2": 0.24
      }
    },
    "frustration": {
      "type": "score",
      "score": 1.28,
      "confidence": 0.58,
      "legend": {
        "0": "Calm, just stating facts",
        "1": "Frustrated but civil",
        "2": "Very angry, strong language or threatening to leave"
      },
      "probabilities": {
        "0": 0.0,
        "1": 0.72,
        "2": 0.28
      }
    },
    "report_quality": {
      "type": "score",
      "score": 3.0,
      "confidence": 1.0,
      "legend": {
        "0": "No detail; just says something is broken",
        "1": "Names the feature but no steps or environment",
        "2": "Steps to reproduce or environment, but not both",
        "3": "Steps to reproduce and environment"
      },
      "probabilities": {
        "0": 0.0,
        "1": 0.0,
        "2": 0.0,
        "3": 1.0
      }
    }
  },
  "usage": {
    "input_tokens": 468,
    "output_tokens": 43
  }
}
```

Each question is answered on its own against the ticket and given a score:

* `severity` is 1.24 at confidence 0.64. Same reading as the opening example: the export is broken and some have a workaround.
* `frustration` is 1.28 at confidence 0.58. The wording is civil, but "third time" and "I'm done" shift some of the score toward the top level, so the model splits 0.72 and 0.28 between "frustrated but civil" and "very angry". For this ticket the two levels overlap, which is why the confidence is moderate.
* `report_quality` is 3.0 at confidence 1.0. The steps and browser version are both stated.

The three scales have different lengths, so before combining them, normalize each score. A four-level scale returns 0 to 3 and a three-level scale returns 0 to 2, so a top score on one is bigger than a top score on the other. Divide each score by its top level number, `len(criteria) - 1`, to put every score on 0 to 1. Then the weights mean what they say: 0.6 on severity and 0.3 on frustration makes severity count twice as much.

The TypeSafe Python SDK code below asks the three questions, normalizes each score, and combines them using an example priority calculation:

```python theme={null}
from typesafe_sdk import Score, TypeSafeClient

TRIAGE_QUESTIONS = {
    "severity": Score(
        instructions="How severe is the reported issue?",
        criteria=[
            "Cosmetic; no impact to functionality",
            "Broken or degraded feature, but workaround exists",
            "Blocking issue; no workaround exists",
        ],
    ),
    "frustration": Score(
        instructions="How frustrated is the customer?",
        criteria=[
            "Calm, just stating facts",
            "Frustrated but civil",
            "Very angry, strong language or threatening to leave",
        ],
    ),
    "report_quality": Score(
        instructions="How much does the report give an engineer to work with?",
        criteria=[
            "No detail; just says something is broken",
            "Names the feature but no steps or environment",
            "Steps to reproduce or environment, but not both",
            "Steps to reproduce and environment",
        ],
    ),
}


def normalized(answers, question_id: str) -> float:
    """Put a score on 0 to 1 by dividing by its top level number."""
    top_level = len(TRIAGE_QUESTIONS[question_id].criteria) - 1
    return answers[question_id].score / top_level


def priority(ticket: str) -> float:
    with TypeSafeClient() as client:
        response = client.system_one(
            state=ticket,
            questions=TRIAGE_QUESTIONS,
        )
    answers = response.answers

    severity = normalized(answers, "severity")
    frustration = normalized(answers, "frustration")
    report_quality = normalized(answers, "report_quality")

    # A detailed report helps an engineer investigate, so it raises priority a little.
    return 0.6 * severity + 0.3 * frustration + 0.1 * report_quality
```

For the example response above, the normalized scores are 0.62 for severity, 0.64 for frustration, and 1.0 for report quality. The priority is `0.6 × 0.62 + 0.3 × 0.64 + 0.1 × 1.0 = 0.664`, which rounds to `0.66`.

The weights live in your code, so you can see exactly how the number is made and change it when the ranking doesn't match what your team would do. If you later need more Score questions, add them to `TRIAGE_QUESTIONS`. The request count stays at one. This technique of breaking a complex judgment into separate Scores and then combining them with weights in your code is called the [Composite scoring](/patterns/composite-scoring) pattern.

## Structured level descriptions

Start with a basic text description for each level. When the model keeps scoring between two neighbouring levels on inputs you think are clear, give each level an object instead of a string, with a field for what the level covers and a field with a few example situations. Use the same field names on every level so the model can compare like with like.

The request below is the spinner ticket that we used earlier, but with examples on each level:

<TypesafeExample />

The response:

```json theme={null}
{
  "model": "jev-1.13.0",
  "answers": {
    "bug_severity": {
      "type": "score",
      "score": 1.09,
      "confidence": 0.87,
      "legend": {
        "0": {
          "what": "Cosmetic; no impact to functionality",
          "examples": [
            "typo in a label",
            "misaligned icon"
          ]
        },
        "1": {
          "what": "Broken or degraded feature, but workaround exists",
          "examples": [
            "export fails in one browser but works in another"
          ]
        },
        "2": {
          "what": "Blocking issue; no workaround exists",
          "examples": [
            "cannot log in",
            "data loss"
          ]
        }
      },
      "probabilities": {
        "0": 0.0,
        "1": 0.91,
        "2": 0.09
      }
    }
  },
  "usage": {
    "input_tokens": 379,
    "output_tokens": 18
  }
}
```

With plain strings this ticket scored 1.11 with a confidence of 0.84. With examples it scores 1.09 at 0.87 confidence, a small shift because the plain strings already placed it well. The effect is larger when the plain strings leave the model split, as the next table shows.

Examples steer the model, and they only help when they look like your real inputs. The table below is the opening Safari report with three different sets of level objects:

| Level description                                                                                            | `score` | `confidence` |
| ------------------------------------------------------------------------------------------------------------ | ------- | ------------ |
| plain string: no object with examples                                                                        | 1.43    | 0.35         |
| Added examples array with useful example: "export fails in one browser but works in another"                 | 1.03    | 0.96         |
| Added examples array with example unrelated to browsers: "search fails, but browsing categories still works" | 1.43    | 0.35         |

In this comparison, the matching example concentrates almost all the probability on one level. The unrelated example returns the same result as plain strings. Higher confidence does not establish which answer is correct. Choose examples with known expected levels, then test the revised descriptions on separate inputs before keeping them.


