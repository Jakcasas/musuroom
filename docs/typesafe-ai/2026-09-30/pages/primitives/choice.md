# Choice
Source: https://docs.typesafe.ai/primitives/choice

A Choice is a System One question type for selecting one option from a defined set. The answer includes the selected option, a probability for each option, and confidence.

Use a Choice when the answer is one of a fixed set of options. For example, which team handles a ticket, which category a product belongs to, or which language a code snippet is written in. If the answer is a position on a spectrum, use a [Score](/primitives/score). If it's a yes or no, use a [Noul](/primitives/noul). [Choose a question type](/primitives#choose-a-question-type) compares all three.

A Choice answer is the selected option in `choice`. The model also returns a probability for every option in `probabilities`, and a `confidence` value for the selected option.

Example questions:

```
"What programming language is this code written in"
  → options: python, javascript, typescript, go, rust, other

"What type of meeting is this based on the title and description"
  → options: standup, planning, retrospective, one on one, brainstorm, none of the above

"Which product category does this item belong to"
  → options: electronics, clothing, home garden, food and beverage
```

## Request structure

The POST request body to the [TypeSafe API](/api) has a specific structure. The top level has three fields: `state`, the content to evaluate; `model`; and `questions`, a map from question ids you choose to question objects. Each Choice question has the following fields:

* `type`: Always `"choice"`.
* `instructions`: The question the model answers.
* `criteria`: The answer options, as a map. Each key is an option name and each value is a description of that option.

Below is a request where the state is a support ticket from an online shoe store and the question is which team should handle it:

<TypesafeExample />

You choose the question id, `department` in this case. The answer is returned under the same id. The model never sees the question id. The option names and their descriptions are both sent to the model, so write descriptions that separate the options from each other.

Our [client SDKs](/sdk) provide typed questions. In Python, the same question is a `Choice`:

```python theme={null}
from typesafe_sdk import Choice, TypeSafeClient

with TypeSafeClient() as client:
    response = client.system_one(
        state="My running shoes arrived in the wrong size. Can I swap them for a size 10?",
        questions={
            "department": Choice(
                instructions="Which team should handle this?",
                criteria={
                    "returns": "Exchanges, wrong or damaged items",
                    "shipping": "Delivery status, delays, lost packages",
                    "billing": "Charges, invoices, payment problems",
                },
            ),
        },
    )

    print(response.answers["department"].choice)
```

Use the `system_one` method or the `https://api.typesafe.ai/v1/systemone` endpoint to call a System One model. The `model` field selects which model handles the request. [How to build with TypeSafe](/concepts/how-to-build-with-system-one) covers where in your code to call it.

Use one of our [client SDKs](/sdk) or call the [HTTP API](/api) directly. If a coding agent is writing the integration for you, install the [TypeSafe agent skill](/agent-skill#installation) first so it knows the request and response shapes.

<Note>
  `instructions` and each entry in `criteria` can be a string, an object, or an array. Start with a string. Use an object when a description needs several kinds of guidance, such as what an option covers, what it doesn't cover, and some examples. See [Structured instructions and criteria](#structured-instructions-and-criteria) below and the [API reference](/api#param-instructions-1).
</Note>

## Response structure

The response has one entry in `answers` per question, under the ids from the request. This is the response to the example request above:

```json theme={null}
{
  "model": "jev-1.13.0",
  "answers": {
    "department": {
      "type": "choice",
      "choice": "returns",
      "confidence": 1.0,
      "probabilities": {
        "shipping": 0.0,
        "returns": 1.0,
        "billing": 0.0
      }
    }
  },
  "usage": {
    "input_tokens": 328,
    "output_tokens": 34
  }
}
```

Besides `type`, each Choice answer has three values:

* `choice`: The option with the highest probability.
* `probabilities`: The full probability distribution across every option. The sum of all values is 1.
* [`confidence`](/confidence): A number from 0 to 1 computed from how `probabilities` is spread. A flat shape, with probability spread across several options, means low confidence. A single peak on one option means high confidence.

This ticket is an easy one, so all of the probability is on `returns` and confidence is 1.0. A ticket that mentions a wrong size and a missing refund would split probability between `returns` and `billing`, and confidence would drop.

## Good practice: ask more than one question per call

Ask every Choice question your code might need in a single request rather than one request per question. Questions are evaluated in parallel. Adding questions barely changes the response time, and the code can ignore answers it doesn't need. Extra questions still cost tokens. [Ask multiple questions together](/primitives#ask-multiple-questions-together) explains this in full; the next section shows five Choice questions in one call.

The same logic applies to the options inside a single Choice question. A Choice question accepts up to 255 options, and adding options costs a few tokens each, so give the model the full list of teams, categories, or products rather than a shortlist. Add an `other` or `none of the above` option when the list might not cover every input, so the model can say none of the others fit.

To classify documents through a deep hierarchy or large taxonomy, chain Choice questions level by level. The [Hierarchical Classification cookbook](/cookbooks/hierarchical_classification) shows how to run a beam search over Choice probabilities, keeping the best `K` candidate paths at each level instead of committing to a single greedy path.

## A more complex example

The basic example above routes a ticket to a team. A bigger support system might also need the return reason, the delivery problem, what the customer wants, and the customer's tone.

The request below asks five Choice questions about a ticket that is more ambiguous than the first: it involves three teams and doesn't say what the customer wants.

<TypesafeExample />

Two of these Choice questions are speculative: `return_reason` only matters if the `department` is `returns`, and `shipping_issue` only matters if it's `shipping`. The `tone` question uses `null` descriptions because the option names are clear on their own.

The TypeSafe response:

```json theme={null}
{
  "model": "jev-1.13.0",
  "answers": {
    "department": {
      "type": "choice",
      "choice": "returns",
      "confidence": 0.42,
      "probabilities": {
        "shipping": 0.04,
        "billing": 0.35,
        "returns": 0.61
      }
    },
    "return_reason": {
      "type": "choice",
      "choice": "wrong_size",
      "confidence": 1.0,
      "probabilities": {
        "other": 0.0,
        "wrong_size": 1.0,
        "changed_mind": 0.0,
        "damaged": 0.0,
        "wrong_item": 0.0
      }
    },
    "shipping_issue": {
      "type": "choice",
      "choice": "delayed",
      "confidence": 0.67,
      "probabilities": {
        "wrong_address": 0.0,
        "other": 0.26,
        "not_delivered": 0.0,
        "damaged_in_transit": 0.0,
        "delayed": 0.74
      }
    },
    "requested_resolution": {
      "type": "choice",
      "choice": "refund",
      "confidence": 0.2,
      "probabilities": {
        "replacement": 0.34,
        "refund": 0.4,
        "information": 0.02,
        "exchange": 0.24
      }
    },
    "tone": {
      "type": "choice",
      "choice": "frustrated",
      "confidence": 0.76,
      "probabilities": {
        "frustrated": 0.84,
        "angry": 0.16,
        "calm": 0.0
      }
    }
  },
  "usage": {
    "input_tokens": 589,
    "output_tokens": 212
  }
}
```

Each question is answered on its own against the ticket:

* The `department` answer is `returns` with a 0.61 probability, but `billing` has 0.35 because of the double charge. The ticket belongs to two teams, and the split confidence of 0.42 reflects that.
* The `return_reason` is `wrong_size` with a confidence of 1.0, which is expected because it says this clearly in the ticket.
* The `shipping_issue` answer is split between `delayed` and `other`. It's a speculative question and `department` didn't come back as shipping, so it can be ignored by the code, as shown in the example code snippet below.
* The `requested_resolution` answer leans to `refund` at 0.40, with `replacement` and `exchange` sharing most of the rest, and the confidence is 0.20. The double charge suggests money back, the wrong size suggests a swap, and the customer never says which they want.
* The `tone` answer is `frustrated` with a probability of 0.84 and a confidence of 0.76.

The example code below reads the answers it needs, ignores the rest, and treats a low-confidence answer as a reason to ask rather than act:

```python theme={null}
from typesafe_sdk import Choice, TypeSafeClient

TRIAGE_QUESTIONS = {
    "department": Choice(
        instructions="Which team should handle this?",
        criteria={
            "returns": "Exchanges, wrong or damaged items",
            "shipping": "Delivery status, delays, lost packages",
            "billing": "Charges, invoices, payment problems",
        },
    ),
    "return_reason": Choice(
        instructions="If the customer wants to return something, why?",
        criteria={
            "wrong_size": "The item doesn't fit",
            "wrong_item": "A different product was delivered",
            "damaged": "The item arrived broken or faulty",
            "changed_mind": "The item is fine, the customer no longer wants it",
            "other": "A return reason that fits none of the above",
        },
    ),
    "shipping_issue": Choice(
        instructions="If this is a shipping problem, which kind is it?",
        criteria={
            "not_delivered": "The package never arrived",
            "delayed": "The package is late but still on its way",
            "wrong_address": "The package went to the wrong place",
            "damaged_in_transit": "The package arrived damaged",
            "other": "A shipping problem that fits none of the above",
        },
    ),
    "requested_resolution": Choice(
        instructions="What does the customer want to happen?",
        criteria={
            "exchange": "Swap the item for a different one",
            "refund": "Money back",
            "replacement": "The same item sent again",
            "information": "Just an answer, no action needed",
        },
    ),
    "tone": Choice(
        instructions="What is the customer's tone?",
        criteria={"calm": None, "frustrated": None, "angry": None},
    ),
}


def triage(ticket: str) -> None:
    with TypeSafeClient() as client:
        response = client.system_one(
            state=ticket,
            questions=TRIAGE_QUESTIONS,
        )
    answers = response.answers

    department = answers["department"]
    if department.confidence < 0.3:
        # Not clear which team to send to. Let a person decide.
        send_to_manual_triage(ticket)
        return

    if department.choice == "returns":
        # return_reason answer is only used here
        assign(ticket, team="returns", issue=answers["return_reason"].choice)
    elif department.choice == "shipping":
        # shipping_issue answer is only used here
        assign(ticket, team="shipping", issue=answers["shipping_issue"].choice)
    else:
        assign(ticket, team="billing")

    # A second team with a real share of the probability gets a copy
    for team, probability in department.probabilities.items():
        if team != department.choice and probability > 0.25:
            notify(ticket, team=team)

    resolution = answers["requested_resolution"]
    if resolution.confidence < 0.5:
        # The customer hasn't said what they want. Ask, don't guess.
        ask_customer_what_they_want(ticket)
    elif resolution.choice == "refund":
        flag_for_refund_approval(ticket)

    if answers["tone"].choice == "angry":
        flag_for_senior_agent(ticket)
```

For the ticket above, this assigns the ticket to the returns team with issue `wrong_size`, sends the billing team a copy because its 0.35 share is over the 0.25 threshold, and asks the customer what they want because the resolution confidence of 0.20 is under 0.5. The code does not use the `shipping_issue` answer.

One request, five answers, and the routing logic is ordinary `if` statements. If you later need to know the customer's language, or which product the ticket is about, add another Choice question to `TRIAGE_QUESTIONS`; the request count stays at one.

The [smart home assistant demo](/demos/smart-home) evaluates every user request against a long list of Choice questions in one call: the request category, the room, the device, and the action. Most of those questions are irrelevant to any one request and the code ignores them.

## Structured instructions and criteria

Start with a one-line description per option. When two options are similar and the model keeps confusing them, describe each one with an object instead of a string. Give it fields for what the option covers, what belongs to a neighboring option instead, and a few example inputs.

The two answer options below, return\_policy and return\_status, are easy to confuse. A ticket about either one can mention returns and refunds, so each option says what it is not for.

<TypesafeExample />

The response is `return_status` at confidence 1.0:

```json theme={null}
{
  "model": "jev-1.13.0",
  "answers": {
    "return_topic": {
      "type": "choice",
      "choice": "return_status",
      "confidence": 1.0,
      "probabilities": {
        "return_policy": 0.0,
        "return_status": 1.0
      }
    }
  },
  "usage": {
    "input_tokens": 407,
    "output_tokens": 32
  }
}
```

The field names `question`, `focus`, `what`, `not_for`, and `examples` are not part of the API, and none are reserved. You choose them, the same way you choose option names. The model sees the names along with the values, so use short names that label what follows.


