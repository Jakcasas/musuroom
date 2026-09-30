# Agent skill
Source: https://docs.typesafe.ai/agent-skill

Drop-in skill for Claude Code, Codex, and other agent environments.

The TypeSafe agent skill gives your AI coding agent full context on the TypeSafe API: the three question [types](/primitives), the architectural [patterns](/patterns), and best practices for structuring evaluations.

## Installation

<Tabs>
  <Tab title="Claude Code">
    Run these two commands in your terminal:

[Code example: see complete pages/agent-skill.md]
  </Tab>

  <Tab title="Other agents">
[Code example: see complete pages/agent-skill.md]

    Choose your agent when prompted. Installation is project-local by default; add `-g` to install globally.
  </Tab>

  <Tab title="Copy to your agent">
    Paste this prompt into your coding agent:

[Code example: see complete pages/agent-skill.md]
  </Tab>
</Tabs>

Read [SKILL.md on GitHub](https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md) or fetch the [raw Markdown](https://raw.githubusercontent.com/typesafe-ai/skills/main/skills/typesafe-ai/SKILL.md) directly. For manual installation, copy the entire [skills/typesafe-ai directory](https://github.com/typesafe-ai/skills/tree/main/skills/typesafe-ai), including its reference files, into your agent's skills directory.

Choose one installation method to avoid duplicate copies.

### Updates

For the Claude Code plugin, run:

[Code example: see complete pages/agent-skill.md]

Restart Claude Code or run `/reload-plugins` to load the update. To enable automatic updates, open `/plugin`, select **Marketplaces → typesafe-ai → Enable auto-update**.

For skills.sh installations, run `npx skills update`. For manual copies, replace the entire skill directory with the latest GitHub version.

## Example prompts

Naming the skill in your prompt — "use the TypeSafe skill" — works in any agent, so each of the prompts below does that. With the Claude Code plugin, you can also invoke `/typesafe:typesafe-ai` directly.

* A good prompt to start with is a brainstorming prompt to help you figure out where TypeSafe can best be used in a project.

[Code example: see complete pages/agent-skill.md]

* You can also create an [API key](https://console.typesafe.ai/keys) and give your agent permission to figure out the best way to use TypeSafe by running cheap test queries.

[Code example: see complete pages/agent-skill.md]

* Point your agent at a [specific cookbook](/cookbooks/consistency_noul_cookbook) that solves a problem you have in your codebase, or point it at the [cookbooks index](/cookbooks) and ask if there are any patterns that are similar to the ones in your project.

[Code example: see complete pages/agent-skill.md]

## Good vibe coding principles

1. Talk it out with your agent, using the example prompts above as a starting point.
2. Review the plan and ensure it makes sense before implementing it.
3. Put the constants (questions and thresholds) in a single place so they're easy to review. Agents aren't great at writing questions, so expect to edit collaboratively with them.
4. Don't take assertions at face value; encourage the agent to validate its assumptions.

## Common issues

### The agent isn't using the skill

With the Claude Code plugin, invoke `/typesafe:typesafe-ai`. In other agents, ask to "use the TypeSafe skill". If it still does not load, confirm the installer targeted the agent you are using, then restart the agent.

### Routing isn't working like you expect

Check the questions and thresholds. It's possible that your thresholds are either set too high (causing false negatives) or too low (causing false positives). You may also need to tweak your questions to be more specific.

### You're using confidence thresholds everywhere

If all you care about is choosing the best option, you just need to choose the option with the highest confidence (rather than setting a confidence threshold). If you have a specific statistical algorithm in mind, you should probably be using probabilities instead of confidence.

### It's difficult to review TypeSafe code

The most important thing for humans to review is the questions and any threshold constants used in your TypeSafe code. These should be defined in a single code file so that they're easy to find without too much spelunking.

### The agent invents request or response fields

A stale skill can cause this. Update it using your installation method above and retry.




# API reference
Source: https://docs.typesafe.ai/api

Full HTTP API reference for the TypeSafe evaluation endpoint.

Evaluate a `state` against a map of typed `questions` and get back structured `answers`, one per question. For a guided introduction, start with the [primitives](/primitives).

## Evaluation endpoint

[Code example: see complete pages/api.md]

## Request body

The top-level shape of every request. Each entry in the `questions` map is a typed question you name.

<ParamField type="string | object | array">
  The content to evaluate. A plain string for text, or structured data (object/array) for things like chat logs, records, or the current state of your application. See [State](/concepts/state) for formats and best practices.
</ParamField>

<ParamField type="string">
  The model that handles the request. Use `"jev-latest"`, TypeSafe's flagship model. See [Models](/models) for the available models and aliases.
</ParamField>

<ParamField type="map<string, Question>">
  A map of typed [Question](#question-types) objects. You choose each key; answers come back under the same keys.

  <Expandable title="map entries">
    <ParamField type="Question">
      A key you choose. The matching [Answer](#answer-types) is returned under this same id. The key is not sent to the underlying model and is not used in inference.
    </ParamField>
  </Expandable>
</ParamField>

[Code example: see complete pages/api.md]

## Question types

A `Question` is one of three types, set by its `type` field. All three share `type` and `instructions`; each adds its own `criteria`.

The `instructions` property can be a string, an object, or an array. You can break up a long question that has extra context, or data it needs to reference, into a structured object. Put the question in one field and the data in the others, and refer to the data fields by name in backticks, the same way you point a question at a nested `state` value:

[Code example: see complete pages/api.md]

See [Use structure in the questions](/concepts/how-to-build-with-system-one#use-structure-in-the-questions) to learn more.

### Noul

A yes/no question. Returns the probability the answer is yes.

<ParamField type="&#x22;noul&#x22;" />

<ParamField type="string | object | array">
  The yes/no question to evaluate. An object can hold the question in one field and data it refers to in others; see [Use structure in the questions](/concepts/how-to-build-with-system-one#use-structure-in-the-questions).
</ParamField>

<ParamField type="object">
  Optional descriptions of what a yes and a no mean.

  <Expandable title="properties">
    <ParamField type="string | object | array">
      What a yes (value near 1) means.
    </ParamField>

    <ParamField type="string | object | array">
      What a no (value near 0) means.
    </ParamField>
  </Expandable>
</ParamField>

[Code example: see complete pages/api.md]

### Choice

Picks one option from a set you define. Returns the chosen option and the full probability distribution.

<ParamField type="&#x22;choice&#x22;" />

<ParamField type="string | object | array">
  What the model should decide. An object can hold the question in one field and data it refers to in others; see [Structured instructions and criteria](/primitives/choice#structured-instructions-and-criteria).
</ParamField>

<ParamField type="map<string, string | object | array | null>">
  A map of option to rubric description; use null when an option needs no extra detail. You can have a maximum of 255 options per Choice.

  <Expandable title="map entries">
    <ParamField type="string | object | array | null">
      A key you choose. A description of this option.
    </ParamField>
  </Expandable>
</ParamField>

[Code example: see complete pages/api.md]

### Score

Rates the state along a rubric you define. Returns a probability-weighted value across your levels.

<ParamField type="&#x22;score&#x22;" />

<ParamField type="string | object | array">
  What the model should rate. An object can hold the question in one field and data it refers to in others; see [Use structure in the questions](/concepts/how-to-build-with-system-one#use-structure-in-the-questions).
</ParamField>

<ParamField type="array<string | object | array>">
  An ordered array of level descriptions. A Score should have at least two levels; the API accepts up to 10.
</ParamField>

[Code example: see complete pages/api.md]

## Response body

One answer per question, returned under the same ids you provided.

<ResponseField name="model" type="string">
  The model that performed the evaluation.
</ResponseField>

<ResponseField name="answers" type="map<string, Answer>">
  One [Answer](#answer-types) per question, keyed by the same ids you used in questions.

  <Expandable title="map entries">
    <ResponseField name="‹question id›" type="Answer">
      The same id you chose in questions.
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="usage" type="object">
  Token usage for the request.

  <Expandable title="properties">
    <ResponseField name="input_tokens" type="integer" />

    <ResponseField name="output_tokens" type="integer" />
  </Expandable>
</ResponseField>

[Code example: see complete pages/api.md]

## Answer types

Every answer carries a `type` matching its question. Choice and Score answers also carry a `confidence` between 0 to 1, derived from the answer's probability distribution. See [Confidence](/confidence).

### Noul answer

<ResponseField name="type" type="&#x22;noul&#x22;" />

<ResponseField name="noul" type="number">
  The yes/no answer on a scale from 0 (no) to 1 (yes).
</ResponseField>

[Code example: see complete pages/api.md]

### Choice answer

<ResponseField name="type" type="&#x22;choice&#x22;" />

<ResponseField name="choice" type="string">
  The highest-probability option.
</ResponseField>

<ResponseField name="probabilities" type="map<string, number>">
  Every option mapped to its probability (floats that sum to 1).

  <Expandable title="map entries">
    <ResponseField name="‹option›" type="number">
      An option you defined in criteria.
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="confidence" type="number">
  How certain the model is, derived from probabilities.
</ResponseField>

[Code example: see complete pages/api.md]

### Score answer

<ResponseField name="type" type="&#x22;score&#x22;" />

<ResponseField name="score" type="number">
  The probability-weighted answer across the levels; can land between levels.
</ResponseField>

<ResponseField name="legend" type="map<string, string>">
  Each level number mapped back to its description.
</ResponseField>

<ResponseField name="probabilities" type="map<string, number>">
  Each level (string key) mapped to its probability (floats that sum to 1).

  <Expandable title="map entries">
    <ResponseField name="‹level›" type="number">
      A level index, as a string key matching legend.
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="confidence" type="number">
  How certain the model is, derived from probabilities.
</ResponseField>

[Code example: see complete pages/api.md]

## Errors

Errors use standard HTTP status codes with a JSON body describing what went wrong.

| Status                     | Meaning                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `401 Unauthorized`         | Missing or invalid API key. Check the `Authorization` header.                                                                            |
| `422 Unprocessable Entity` | The request body failed validation — for example a missing required field or a malformed question. The body details the offending field. |
| `429 Too Many Requests`    | You have exceeded your rate limit. Back off and retry after a short delay.                                                               |
| `529 Overloaded`           | TypeSafe is temporarily overloaded. Retry after a short delay.                                                                           |

### Handling rate limits

When you receive a `429 Too Many Requests` or `529 Overloaded` response, retry the request with exponential backoff instead of retrying immediately. Our client SDKs handle this automatically, so no extra handling is needed if you use one of our SDKs with its default retry policy.




# How to build with TypeSafe
Source: https://docs.typesafe.ai/concepts/how-to-build-with-system-one

Design AI-powered software by keeping code in control and giving System One narrow, structured decisions.

System One is TypeSafe's model for building AI-powered software, not agents. It does not generate code or choose its own next action. It provides AI primitives that embed into software, so code remains in control while the model handles common-sense judgments over unstructured data.

<Info>
  **Summary:** build a normal software workflow and insert System One only where AI is needed.

  * Keep control flow, deterministic rules, and side effects in code.
  * Break broad judgments into narrow, typed questions with explicit instructions and criteria.
  * Give each question only the context it needs.
  * Use probabilities and confidence to act, ask for review, or escalate.
  * Ask independent questions together, then compose their answers in code.
</Info>

## Three software architectures

TypeSafe is designed for building **AI-powered software**, where code owns the workflow and AI handles narrow, structured decisions.

<Tabs>
  <Tab title="Traditional software">
    Traditional code is a complex decision tree made from simple software primitives. Because each primitive is reliable, developers can compose them into higher-level abstractions.
  </Tab>

  <Tab title="LLM agents">
    An agent processes instructions and chooses its next step. This works well when a person is monitoring the process, but every loop introduces another opportunity to go off the rails.
  </Tab>

  <Tab title="AI-powered software">
    Code handles deterministic work and owns the control flow. The model appears only where the system needs programmable common sense or needs to interpret unstructured data. Each AI task is kept atomic and constrained.
  </Tab>
</Tabs>

<Frame>
  <img alt="Traditional software, agents, and AI-powered software shown as three different system architectures." />

  <img alt="Traditional software, agents, and AI-powered software shown as three different system architectures." />
</Frame>

## What makes System One composable

<Columns>
  <Card title="Structured" icon="braces">
    System One is type-safe by construction. Decisions and probabilities conform to the structured software types and JSON schema your code expects, so it never has to recover a value from generated prose.
  </Card>

  <Card title="Parallel" icon="split">
    Questions are evaluated independently and in parallel. One primitive's result does not become hidden context that changes another primitive's result.
  </Card>

  <Card title="Comparable" icon="arrow-up-down">
    Outputs are sortable and can drive smart `if` statements, thresholds, and comparisons.
  </Card>

  <Card title="Fast" icon="gauge">
    Most queries complete in about 100 ms. System One is fast enough for real-time request paths and user interfaces.
  </Card>

  <Card title="Calibrated confidence" icon="chart-no-axes-combined">
    [RLCD](/introduction/machine-learning-primer) communicates uncertainty through calibrated probabilities instead of tending toward overconfidence.
  </Card>

  <Card title="Self-consistent" icon="repeat-2">
    System One is designed to return stable answers across repeated evaluations. See the [self-consistency cookbook](/cookbooks/consistency_noul_cookbook).
  </Card>
</Columns>

Because every output is constrained to the supplied options, the model returns a full probability distribution over those options rather than inventing a value outside the schema. TypeSafe's target is a greater than 100× intelligence-to-speed-and-cost ratio; the underlying bet is that cheaper intelligence will create much more demand.

## Design a System One workflow

<Steps>
  <Step title="Use code when you can">
    Keep deterministic work in code. It is reliable and cheap. Avoid agent `while` loops when a software workflow can express the same behavior.

    <Accordion title="Example: keep deterministic rules in code">
[Code example: see complete pages/concepts/how-to-build-with-system-one.md]
    </Accordion>

    Browse the [System One patterns](/patterns) for bounded ways to compose model decisions with code.
  </Step>

  <Step title="Decompose the input state">
    Include only the context relevant to the current questions. This helps the model avoid distractions and context rot. Do not rely on knowledge stored in model weights when current information can come from your own knowledge base.

    <Accordion title="Example: send only relevant context">
      <TypesafeExample title="request" />
    </Accordion>
  </Step>

  <Step title="Use structure in the input state">
    Use nested JSON for the `state` and `questions` fields. Point questions at specific values when that removes ambiguity, and include the backtick characters around each path inside the question.

    <Accordion title="Example: reference a nested value">
      Use a backticked dot-and-index path to point a question at a specific nested value, such as `support.tickets[0].message`.

      <TypesafeExample title="request" />
    </Accordion>
  </Step>

  <Step title="Decompose the questions">
    Ask the most explicit, narrow, specific, atomic questions you can. Break down complex or ill-defined questions into separate questions that each evaluate one property.

    <Info>
      This is probably the most important concept in this guide. Broad questions hide several judgments behind one answer. Atomic questions expose those judgments so you can inspect, tune, and combine them in code.
    </Info>

    <Accordion title="Example: decompose spam detection">
      <TypesafeExample title="One broad question (bad)" />

      <TypesafeExample title="Decomposed questions (good)" />
    </Accordion>

    <Accordion title="Example: verify a tool-call trace">
      <TypesafeExample title="One broad question (bad)" />

      <TypesafeExample title="Decomposed questions (good)" />
    </Accordion>
  </Step>

  <Step title="Use structure in the questions">
    Keep questions short. `instructions` and `criteria` are usually strings, and for a short, unambiguous question a string is all you need. They can also be objects or arrays. Put the question in one field and the data that guides the question in the others.

    Structure helps in these situations:

    * The question needs context or examples. A long sentence of background information or a list of example inputs belongs in named fields next to the question, where your code can add to them or swap them without rewriting the question.
    * Part of the question comes from your code. When a value comes from a database, put it in its own field instead of splicing it into a string template.
    * Several questions have similar instructions. A request takes one state and can include multiple questions. Adding supplementary data can help make questions distinct.

    <Accordion title="Example: reference a record from your code">
      This Noul compares a resume in the state against a record from a candidate database. The record goes into `potential_duplicate` as it is, and the question refers to it by name.

      <TypesafeExample title="questions" />
    </Accordion>

    The "potential\_duplicate" data sourced from code can change over time. The "question" references it using backticks.

    The descriptions inside `criteria` can be objects too. For a Choice, each option's description can be an object that says what the option covers, what belongs to a different option, and a few examples. Use the same field names across options so the model can compare them directly.

    <Accordion title="Example: define contrastive Choice criteria">
      <TypesafeExample title="questions" />
    </Accordion>

    Each question type's page has a worked example:

    * [Noul](/primitives/noul#structured-instructions) compares one resume against several candidate records, one question per record, with the questions built in code.
    * [Choice](/primitives/choice#structured-instructions-and-criteria) describes two easily confused options with what each covers, what it's not for, and examples.
    * [Score](/primitives/score#structured-level-descriptions) gives each level a description and example situations.

    The [structured-data-extraction cascade cookbook](/cookbooks/sde_cascade) shows the shared-wording case, asking the same battery of questions about every field of an extracted record.

    A short, unambiguous question or criterion can remain a string. Add structure when it separates guidance that would otherwise blur together. For the full set of places structure is accepted, see [Advanced: structure](/primitives/advanced).
  </Step>

  <Step title="Ask a lot of questions">
    Ask many narrow, independent questions about the same state in one request. This is how you maximize effectiveness and intelligence per dollar with the API: questions run in parallel, and code can combine their signals without adding serial model round trips.

    See the [Speculative Fan-Out pattern](/patterns/fan-out) and [Parallel questions cookbook](/cookbooks/parallel_questions).
  </Step>

  <Step title="Combine question outputs in code (or feed into a classical ML model)">
    Combine independent answers with deterministic rules or weighted sums. For learned composition, use the probabilities as features in a downstream classical machine-learning model.

    <Accordion title="Example: combine signals with a weighted score">
[Code example: see complete pages/concepts/how-to-build-with-system-one.md]
    </Accordion>

    [Composite Scoring](/patterns/composite-scoring) shows how to preserve individual judgments while combining them. If you do not have labels for a downstream model, use an ensemble of expensive reasoning models to generate them; the [AutoResearch cookbook](/cookbooks/autoresearch_feature_discovery) shows how to train a classical model on System One outputs.
  </Step>

  <Step title="Route on uncertainty">
    Make code take different actions for confident and unconfident answers. Escalate uncertain cases to a person or a more expensive reasoning model. Test thresholds by plotting confidence against accuracy on your data.

    <Accordion title="Example: route by confidence">
[Code example: see complete pages/concepts/how-to-build-with-system-one.md]
    </Accordion>

    See [Confidence](/confidence) and [Confidence-Gated Routing](/patterns/confidence-routing) for choosing thresholds and matching them to the risk of each action.
  </Step>
</Steps>

<Tip>
  Decomposition does not require more round trips. Questions over the same state run in parallel.
</Tip>

## Putting it all together

This support-ticket workflow keeps deterministic work in code, sends only relevant structured context, evaluates many atomic questions in one request, and composes the answers with explicit confidence gates.

[Code example: see complete pages/concepts/how-to-build-with-system-one.md]




# State
Source: https://docs.typesafe.ai/concepts/state

What state is, how to structure it, and how to give a System One model the context it needs.

**State** is the content you ask a System One model to evaluate. It could be a support message, a passage of text, or the current state of your application. You pass it in the `state` field of an API request, alongside the questions you want answered.

Each request evaluates one state against one or more questions. All questions see the same state and are evaluated independently. You can mix [Choice](/primitives/choice), [Score](/primitives/score), and [Noul](/primitives/noul) questions in one request.

## State can be a simple string or a structured JSON value

The simplest state is a plain string:

[Code example: see complete pages/concepts/state.md]

State can also be a JSON object or array containing related context, examples, and other information that helps the model answer the associated questions. Think of state as the material you would present to a panel of experts before asking them to make a judgment. In Python, pass the corresponding string, dictionary, or list directly to `client.system_one(state=...)`.

| Format | Useful for                                          | Example                                                                 |
| ------ | --------------------------------------------------- | ----------------------------------------------------------------------- |
| String | A message, article, or passage                      | `"My card was charged twice."`                                          |
| Object | Named fields, related records, or application state | `{"message": "My card was charged twice.", "order_id": "A-104"}`        |
| Array  | A sequence of messages or records                   | `["Hi", "My customer number is TS1337.", "My card was charged twice."]` |

Use an object for most requests so each part of the state has a descriptive name and its relationships remain clear. A string is suitable when the use case is simple and requires only one piece of text.

<Note>
  Jev accepts text only. State must be a string, JSON object, or array of text values. Images, audio, and video are not supported (yet). Jev's primary training language is English; other languages, including CJK scripts, are accepted but currently have lower accuracy — see [Models](/models#language-support).
</Note>

[Code example: see complete pages/concepts/state.md]

This object is one state, even though it contains a conversation, an order, and a policy. Put related information together when the decision requires comparing those parts.

## Separate content from questions

The state contains the content and supporting facts. [Questions](/primitives) define the judgments the model should make about that material. For example, keep the refund request and policy in the state, then ask whether the customer requested a refund and whether the policy supports it.

See [Primitives (Questions)](/primitives) for guidance on instructions, criteria, question types, and asking several questions about one state.

See the [API reference](/api) for the request schema and [client SDKs](/sdk) for installation, typed inputs, and response handling.




# System One
Source: https://docs.typesafe.ai/concepts/system-one

System One models make fast, structured decisions for software. Jev is TypeSafe's flagship model and the first System One model.

System One models are a class of AI models built to make fast, structured decisions that software can use directly. A System One model evaluates a [state](/concepts/state) and returns typed answers and probabilities.

Jev is TypeSafe's flagship model and the first System One model.

Like an LLM, a System One model understands natural-language input. It returns typed decisions and probabilities rather than generated text.

<Note>
  Jev currently accepts text input only. It evaluates strings, JSON objects, and arrays of text. Images, audio, and video are not supported (yet).
</Note>

## How it differs from an LLM

System One models are trained for calibrated decisions: their probabilities are optimized against outcomes to reflect uncertainty. Calibration is measured across groups of predictions; it does not guarantee that an individual answer is correct.

System One models do not write replies, produce code, or generate explanations of their reasoning. You define the possible answers through [primitives](/primitives):

| Primitive                    | Question                              | Example answer space                          | Example output      |
| ---------------------------- | ------------------------------------- | --------------------------------------------- | ------------------- |
| [Choice](/primitives/choice) | Which team should handle this ticket? | `billing`, `technical`, or `account`          | `choice: "billing"` |
| [Score](/primitives/score)   | How frustrated is this customer?      | 0 = calm, 1 = frustrated, 2 = very frustrated | `score: 1.4`        |
| [Noul](/primitives/noul)     | Does this message request a refund?   | True or false                                 | `noul: 0.95`        |

These are illustrative configurations and values. The primitive pages describe the available configuration options and full response fields.

Read the [AI primer](/introduction/machine-learning-primer) to learn how System One models work and how they are trained.

<Note>
  The System One name comes from the concept Daniel Kahneman popularized in his book *Thinking, Fast and Slow*. System 1 thinking is fast and intuitive. System 2 is slower and more deliberate. Here, the emphasis is on fast, focused judgments.
</Note>

## Fast judgments inside a larger workflow

For a refund request, your application can:

1. Build a state containing the customer's message, the relevant transactions, and the refund policy.
2. Ask independent questions together: whether a refund was requested, whether the evidence indicates a duplicate charge, and whether the policy supports a refund.
3. Combine the answers with deterministic checks in code, then route the case for action or review.

Once you have seen the primitives in action, you can combine them into a larger system. Because System One models return typed, constrained outputs rather than free-form text, your code can inspect and combine its answers into predictable workflows. See [How to build with TypeSafe](/concepts/how-to-build-with-system-one) for the full workflow.

Answers from System One models also include [confidence](/confidence), so you can decide when to act and when to escalate to a person or a reasoning model.

## Call a System One model

Call a System One model through one of our [client SDKs](/sdk) or `POST /v1/systemone` in the [HTTP API](/api). The `model` field selects which model handles the request. The examples in these docs use `jev-latest`, which is also the SDK default. See [Models](/models) for the available models, their prices, and their aliases.

Start with [State](/concepts/state) to prepare the input and [Primitives (Questions)](/primitives) to explore the types of questions you can ask.




# Example use cases
Source: https://docs.typesafe.ai/concepts/use-case-map

Explore TypeSafe use cases by industry and turn promising ideas into software workflows.

Use this map to brainstorm where TypeSafe could fit in your industry. Open the closest industry, scan the example decisions, and adapt them to the documents and actions in your own workflow.

## Example use case categories

<Columns>
  <Card title="AI Automation Software" icon="blocks">
    Interleave AI with reliable software in a way where you can run it a million times in the background without a human co-pilot. Code owns control flow (not markdown files) while TypeSafe handles the semantic decisions and language understanding.
  </Card>

  <Card title="Real-time applications" icon="zap">
    Frontier intelligence at real-time speeds (150ms) means AI can make decisions faster than human perception. Fast and smart enough to be programmed to play games or embedded into a UI.
  </Card>

  <Card title="AI Map Reduce over Big Data" icon="database-zap">
    100x cheaper means you can process giant datasets. Search for relevant information over giant corpuses, classify giant agent traces, and extract features to make predictions.
  </Card>

  <Card title="Universal Verification" icon="badge-check">
    Verify the input prompt, extractions, reasoning traces, tool calls, or inputs of any other AI. Detect jailbreaks, citation errors, hallucinations, mistakes, or other error-modes that other AIs or LLMs make at a fraction of the cost for the actual LLM call.
  </Card>

  <Card title="Harness Engineering" icon="wrench">
    Use Jev queries to make your harness smarter - model routing, semantic context retrieval, LLM error detection and guardrails, reasoning trace classification at lightspeed and a fraction of the cost.
  </Card>
</Columns>

## Example automation use cases

<AccordionGroup>
  <Accordion title="Search and retrieval" icon="search">
    * Replace or supplement embeddings in RAG pipelines with semantic search, scoring, and ranking.
    * Score query-to-candidate relevance.
    * Rerank results with pairwise comparisons.
    * Cross-encode queries and candidates for higher precision.
    * Select useful context for downstream AI workflows.
  </Accordion>

  <Accordion title="Scientific discovery" icon="flask-conical">
    * Screen papers against inclusion and exclusion criteria for systematic reviews.
    * Label passages in interview transcripts, open-ended survey responses, and field notes using predefined themes or categories.
    * Check whether cited passages support claims in manuscripts and generated summaries.
    * Flag missing methodological details, such as controls, dataset descriptions, and experimental settings.
    * Identify entities and relationships across papers to build research knowledge graphs, linking findings to supporting passages.
  </Accordion>

  <Accordion title="Model routing" icon="route">
    * Use Jev to build a custom router that chooses which LLM receives each prompt.
    * Set routing rules and thresholds for your specific workflow.
    * Classify intent and domain.
    * Estimate difficulty and risk.
    * Escalate requests that need a more expensive model.
  </Accordion>

  <Accordion title="LLM guardrails" icon="shield">
    * Place semantic checks on every LLM input, output, and tool call at a fraction of the cost of the LLM call.
    * Detect jailbreaks and prompt injection.
    * Identify policy violations and sensitive-data exposure.
    * Detect tool-call errors and response-quality failures in real time.
    * Log structured check results and probabilities to make AI system and harness failures easier to trace.
  </Accordion>

  <Accordion title="Semantic code linting" icon="code">
    * Use Jev queries to add automated semantic lints to code and writing.
    * Define checks for your team's coding conventions and writing guidelines.
    * Run these checks in CI and flag violations for review.
  </Accordion>

  <Accordion title="Feature extraction for predictive modeling" icon="chart-spline">
    * Use Jev to extract probabilistic features from natural-language data.
    * Combine these features with structured data to train models for tasks with ground-truth outcomes.
    * Use autoresearch workflows to propose feature definitions and evaluate their predictive value against held-out ground truth.
  </Accordion>

  <Accordion title="Recruiting" icon="users">
    * Evaluate resumes, applications, and interview feedback against explicit, job-related criteria.
    * Identify relevant experience.
    * Score evidence for required competencies.
    * Match candidates to roles.
    * Route candidates to hiring managers or recruiters.
    * Escalate uncertain cases for human review.
  </Accordion>

  <Accordion title="Lead generation" icon="user-round-search">
    * Match company profiles, executive biographies, and inbound messages to an ideal customer profile.
    * Score industry fit and company maturity.
    * Detect buyer relevance, pain points, and purchase intent.
    * Prioritize and route leads.
  </Accordion>

  <Accordion title="Customer support" icon="headset">
    * Classify incoming tickets by issue, product area, and customer intent.
    * Process call transcripts to extract customer issues, commitments, and follow-up actions.
    * Detect urgency, frustration, churn risk, and refund requests.
    * Route cases to the right team, queue, or automated workflow.
    * Verify support responses against policies and the customer's request.
  </Accordion>

  <Accordion title="Insurance claims" icon="clipboard-check">
    * Classify first-notice-of-loss reports, adjuster notes, and supporting documents.
    * Detect claim complexity, missing information, and potential fraud indicators.
    * Prioritize claims for straight-through processing or specialist review.
    * Escalate uncertain or high-risk cases to a human adjuster.
  </Accordion>

  <Accordion title="Financial crime" icon="landmark">
    * Evaluate transaction narratives, KYC documents, and alert histories for suspicious characteristics.
    * Match entities across inconsistent names, profiles, and records.
    * Prioritize alerts by risk, relevance, and evidence quality.
    * Route ambiguous cases to investigators for review.
  </Accordion>

  <Accordion title="Legal and compliance" icon="scale">
    * Classify contracts, policies, regulatory filings, and marketing claims.
    * Detect missing clauses, prohibited claims, and policy violations.
    * Verify documents against explicit legal or compliance requirements.
    * Escalate high-risk or uncertain findings to counsel or compliance teams.
  </Accordion>

  <Accordion title="E-commerce marketplaces" icon="store">
    * Classify and normalize product listings across inconsistent seller catalogs.
    * Extract product attributes from titles and descriptions.
    * Detect prohibited listings, counterfeit signals, review abuse, and policy violations.
    * Rank products and route uncertain listings for human review.
  </Accordion>

  <Accordion title="Moderation and trust and safety" icon="shield-check">
    * Apply company-specific, nuanced criteria to decide which posts meet your moderation standards.
    * Moderate user content and automated conversations across communities, customer support, and SDR workflows.
    * Detect toxicity, harassment, spam, fraud, unsafe advice, personal-data exposure, opt-out requests, and policy-violating claims.
    * Combine severity and confidence to allow, warn, review, or block content.
  </Accordion>

  <Accordion title="Advertising" icon="megaphone">
    * Evaluate creative assets, campaign copy, landing pages, and placement context.
    * Classify brand safety and audience suitability.
    * Check regulatory compliance and prohibited claims.
    * Evaluate creative quality and ad-to-landing-page alignment.
  </Accordion>

  <Accordion title="Gaming" icon="gamepad-2">
    * Evaluate player reports, in-game chat, reviews, and support conversations.
    * Moderate chat and detect abuse, toxicity, or suspicious behavior.
    * Annotate content and score frustration or engagement.
    * Detect churn signals and route player-support requests.
  </Accordion>

  <Accordion title="Risk assessment" icon="triangle-alert">
    * Convert incident reports, claims notes, transaction descriptions, and vendor assessments into probabilistic risk indicators.
    * Use these indicators in insurance and underwriting workflows.
    * Classify risk types and detect suspicious characteristics.
    * Score severity and prioritize review.
    * Extract features for broader risk models.
  </Accordion>

  <Accordion title="Demand forecasting" icon="chart-spline">
    * Enrich forecasting models with semantic signals from customer inquiries, sales notes, product reviews, support tickets, and market reports.
    * Extract purchase intent, urgency, and product interest.
    * Detect supply concerns, competitive pressure, and emerging demand themes.
    * Feed those features into a forecasting model alongside historical time-series data.
  </Accordion>

  <Accordion title="Graphs and knowledge graphs" icon="network">
    * Annotate and verify knowledge graphs with typed semantic decisions.
    * Classify relationships and entity types.
    * Detect contradictions between records or claims.
    * Support probabilistic traversal and hierarchical classification.
  </Accordion>
</AccordionGroup>

## Example task categories

| Decision shape                 | Reach for it when                                          | Examples                                                                |
| ------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Classification**             | One known category should win                              | Intent, topic, department, risk type, entity type                       |
| **Detection**                  | You need a probability that one property is present        | Spam, fraud, urgency, jailbreaks, sensitive data                        |
| **Scoring**                    | The answer belongs on an ordered rubric                    | Severity, relevance, quality, frustration, suitability                  |
| **Routing**                    | A category selects the next code path                      | Tool use, escalation, model routing, support queues                     |
| **Search**                     | You need to find items that match a natural-language query | Semantic search, document discovery, candidate generation               |
| **Retrieval**                  | A workflow needs the most relevant context or records      | RAG context, evidence retrieval, knowledge lookup                       |
| **Ranking**                    | Items need to be ordered by semantic relevance or quality  | Search results, recommendations, candidate prioritization               |
| **Verification**               | An artifact must be checked for specific failure modes     | Citation support, policy violations, tool-call errors, response quality |
| **ML Feature Extraction**      | A downstream classical ML model needs semantic signals     | Purchase intent, product interest, competitive pressure, churn signals  |
| **Structured Data Extraction** | Known fields must be recovered from unstructured input     | Candidate attributes, order fields, document labels                     |




# Confidence
Source: https://docs.typesafe.ai/confidence

How TypeSafe reports certainty, how it differs from probability, and how to use it to control system behavior.

All Score and Choice answers from TypeSafe include a `probabilities` property representing the probability distribution across the options (for Choice) or levels (for Score). The *shape* of that distribution is what tells you how certain the model is: concentrated on one outcome means a confident answer, spread out means an uncertain one.

The answer's `confidence` property collapses that shape into a single number from 0 to 1, so you can threshold on it without doing the math yourself. (Noul answers don't carry one.)

## Confidence is derived from the probabilities

`confidence` is a statistic computed from the probability distribution the answer already gives you. TypeSafe computes it for you and returns it on every Choice and Score answer, so the common case needs no extra work on your side.

<ConfidenceExplorer />

<Note>
  **A solid default:** We provide `confidence` as a convenient measure that fits most use-cases, but you are never locked into our definition. Depending on what you are evaluating, a different measure may serve you better, which is exactly why we give you the full `probabilities` in the response. The pros and cons of different computations is a specialized topic that we'll keep to a separate cookbook rather than this page, and will add the link here when we do!
</Note>

For a [Choice](/primitives/choice), the distribution is `probabilities` across your options. For a [Score](/primitives/score), it is the distribution across your levels. In both cases a flatter distribution means lower confidence: low confidence on a Choice often means none of the options are a clear winner over the others, and low confidence on a Score often means the levels are ambiguous, multi-dimensional, or the state doesn't contain enough to go on.

## "I don't know" is a useful signal

If an intelligent system, whether human or machine, cannot express honest uncertainty, the system cannot be trusted.

Confidence gives you a built-in mechanism for the model to say "I'm not sure about this one." This lets your code implement different behavior for different levels of certainty, which is the foundation for building systems you can actually rely on.

## Three paths for using confidence in your code

A useful starting pattern is to divide confidence into three ranges, each producing a different system behavior:

**High confidence:** Act automatically. The model has a clear read and you can proceed without human involvement.

**Medium confidence:** Proceed with caution. The model has a reasonable answer but is not certain. Depending on context, you might ask the user to confirm, flag for review, or gather more information before acting.

**Low confidence:** Do not act. Route to a human, request clarification, or fall back to a different system. The model is telling you it does not have enough information or the question is not a good fit.

Where you draw those boundaries depends on the stakes.

## Thresholds scale with risk

A confidence threshold is not one number. Different actions within the same system should be gated at different levels depending on the consequences of getting it wrong.

[Code example: see complete pages/confidence.md]

The 0.5 confidence floor catches anything the model reports as genuinely uncertain. Above that, the threshold for acting without confirmation is higher for a destructive operation than for a read-only one. Your code encodes the risk tolerance.

<Note>
  The correct threshold values depend on your domain and the performance of the model for your use case. Start with conservative thresholds, test with your own data, and adjust as you observe results.
</Note>




# Cookbooks
Source: https://docs.typesafe.ai/cookbooks

End-to-end recipes that show TypeSafe in real problems, from a few questions to full pipelines.

Each cookbook is a worked example: a real dataset, the TypeSafe questions that decide something about it, and the code that turns those decisions into a working system. Read one when you want to see how the [primitives](/primitives) and [patterns](/patterns) come together on a concrete problem, or copy one as the starting point for your own.

This section assumes you know the [TypeSafe primitives](/primitives) and understand [how confidence works](/confidence). If not, read those first.

## Self-consistency

Repeat a decision and use the agreement across runs as a signal.

| Cookbook                                                            | What it does                                                                                                      | Level    |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| [Self-consistency: nouls](/cookbooks/consistency_noul_cookbook)     | Route uncertain probabilities to human review while keeping the underlying noul values visible.                   | Beginner |
| [Self-consistency: choices](/cookbooks/consistency_choice_cookbook) | Add an uncertain outcome to moderation decisions and compare label agreement with the share of automatic actions. | Beginner |

## Batching

Pack many questions into a single request.

| Cookbook                                            | What it does                                                                                                                                                                                     | Level    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| [Parallel questions](/cookbooks/parallel_questions) | Runs a 13-question regulatory briefing over the GDPR Wikipedia article, showing that batching every question into one TypeSafe call is 12.2x cheaper and 10.0x faster with no change in answers. | Beginner |

## How-to

Recipes for common tasks: search, formatting, tool selection, guardrails.

| Cookbook                                                        | What it does                                                                                                                                                                                                             | Level        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| [Re-ranking](/cookbooks/rerank_typesafe)                        | Builds 30-passage BM25 shortlists for 40 CLERC legal queries, then uses one TypeSafe question per query-candidate pair to raise top-1 accuracy from 5% to 18% and top-10 accuracy from 38% to 62%.                       | Beginner     |
| [Line-by-line search](/cookbooks/semantic_find)                 | Build semantic search for GitHub's Terms of Service. In one request, score 218 line ids against a plain-language query with a Choice question, and use a Noul question to check whether the document contains an answer. | Beginner     |
| [Structure recovery](/cookbooks/autoformat)                     | Reconstructs Markdown from plain text that lost its formatting in two requests: one stitches hard-wrapped lines back together, one classifies every block (heading, list, code, callout).                                | Beginner     |
| [Function calling](/cookbooks/function_calling)                 | Turns natural-language trading requests into calls to ordinary typed functions by mapping function names and closed-set arguments to confidence-aware TypeSafe questions.                                                | Intermediate |
| [Skill suggestion](/cookbooks/skill_suggestion)                 | Picks at most one skill for an agent turn out of the 182 in Nous Research's Hermes catalog, using two TypeSafe requests to rank and re-check the top candidates.                                                         | Intermediate |
| [Knowledge graph entity alignment](/cookbooks/entity_alignment) | Decides which of 450 candidate pairs from two beer catalogues describe the same product using one Score question plus three companion Nouls that surface which fields disagree.                                          | Beginner     |
| [Classifying RAG passages](/cookbooks/classifying_rag_passages) | Score each retrieved passage with one TypeSafe request, then decide in code which ones reach the answering model.                                                                                                        | Intermediate |
| [Double-checking citations](/cookbooks/citation_check)          | Catch wrong or hallucinated citations by checking against the source document. One Choice question decides whether the quote's context supports the claim.                                                               | Beginner     |
| [Guardrails for LLMs](/cookbooks/llm_guardrails)                | Screen every message going into and out of an LLM app with one TypeSafe request, thresholding hazard probabilities and severity to pass, review, block, or route.                                                        | Intermediate |

## Extraction

Pull typed values out of messy text.

| Cookbook                                                                       | What it does                                                                                                                                                        | Level        |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| [SDE cascade](/cookbooks/sde_cascade)                                          | Uses a 2-stage structured-data-extraction cascade (mini → verify → reasoning) to get most of the quality of a big reasoning model at a fraction of the cost.        | Intermediate |
| [Date extraction](/cookbooks/date_extraction_cookbook)                         | Extracts absolute and relative dates by asking TypeSafe for the parts named in a document, then resolving and validating them in code with confidence-based review. | Beginner     |
| [Pre-parsed value extraction](/cookbooks/pre_parsed_value_extraction_cookbook) | Uses regexes to find candidate emails, phone numbers, and amounts, then has TypeSafe select the requested span so code can normalize a verbatim value.              | Beginner     |

## Classification

Assign inputs to categories at any depth.

| Cookbook                                                                      | What it does                                                                                                                                                                             | Level        |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| [Hierarchical classification](/cookbooks/hierarchical_classification)         | Classifies documents through deep patent, retail product, biomedical, and source-code hierarchies using parallel beam search over TypeSafe Choice probabilities.                         | Intermediate |
| [Autoresearch feature discovery](/cookbooks/autoresearch_feature_discovery)   | Runs an autoresearch loop that proposes TypeSafe questions, converts free text into numeric features, and uses model errors to improve a supervised CatBoost regressor.                  | Advanced     |
| [Classification using confidence](/cookbooks/classification_using_confidence) | Classify SEC annual reports into 75 industry groups with one Choice each, then read the answer's own confidence to decide whether to report that group or the broader division above it. | Beginner     |

<Tip>
  We're always keen to learn how people are making use of our primitives. If you've built something worth a cookbook, drop us a note!
</Tip>




# Structure recovery
Source: https://docs.typesafe.ai/cookbooks/autoformat

Reconstructs Markdown from plain text that lost its formatting in two requests: one stitches hard-wrapped lines back together, one classifies every block (heading, list, code, callout).

This cookbook takes plain text whose markup has been stripped (lines hard-wrapped
mid-sentence, no heading markers, no list bullets) and reconstructs the structure as
Markdown: headings, paragraphs, lists, quotes, code, callouts. The input is a team memo
in exactly that state.

A text-generation model could rewrite the text into Markdown, but a rewrite can also
change the words. Here the model never generates text: it answers narrow questions about
the document (*does this line pick up mid-sentence? what kind of content is this
block?*), and code does the rendering, so every character of the output comes from the
input, and every judgment carries a probability.

The whole pipeline is two API requests per document, run in sequence:

* **Pass 1, stitch:** one `Noul` question (a yes/no question whose answer is the
  probability that yes is correct) per adjacent pair of lines, asking whether the line
  break split a sentence across the two. All the pairs go in a single request, and lines
  that continue a split sentence get merged back into blocks.
* **Pass 2, classify:** one `Choice` question (pick one option from a list, with a
  probability for every option) per merged block, choosing among heading, paragraph, list
  item, quote, code, or callout (a note, tip, or warning set apart from the main text).
  The blocks only exist once pass 1 has answered, so this is a second request; it also
  carries companion questions for every block (heading level, step order, callout kind)
  whose answers are read only when the block's type makes them relevant.
* **Direct evidence stays in code.** Blank lines and explicit markers (`- `, `1.`, `#`)
  are read in code, never sent to the model to reconsider; this memo kept its blank lines
  but lost every marker. The model gets only the questions code cannot answer from the
  text.

All of the behavior is specified in the pass-2 question criteria: three dicts of
one-line descriptions, plus the step question's true/false criteria inside
`classify_questions`. The rest of the code is plumbing around them. The cost and latency
numbers are in the appendix: two round trips, 10,211 tokens, 0.8s, \$0.0015 for this
memo.

## Setup

[Code example: see complete pages/cookbooks/autoformat.md]

then set `TYPESAFE_API_KEY`. Every API call is cached in `json_cache.json`, which ships
with the cookbook, so re-rendering replays the published numbers without calling the API.
Delete that file to re-run everything live.

[Code example: see complete pages/cookbooks/autoformat.md]

## The document: a team memo that lost its formatting

The test document is a memo about a build-system migration, in the state it arrives in a
plain-text inbox: paragraphs hard-wrapped mid-sentence, a shell command sitting on a bare
line, two lists with no bullets or numbers, a warning with nothing marking it as one. The
text is fetched from a pinned gist so the cookbook's numbers stay reproducible.

[Code example: see complete pages/cookbooks/autoformat.md]

[Code example: see complete pages/cookbooks/autoformat.md]

Line splitting, blank-line tracking, and id tagging all happen in code; no model is
involved.
Each line gets a short id (`L014| `); the ids are ordinary text the model reads as part of
the state, and questions and answers refer to lines by these ids (the same scheme as the
[semantic search cookbook](/cookbooks/semantic_find)).

[Code example: see complete pages/cookbooks/autoformat.md]

[Code example: see complete pages/cookbooks/autoformat.md]

## Pass 1: stitching split sentences

One Noul question per adjacent pair of lines, all in one request; pairs separated by a
blank line are skipped. The question is deliberately narrow ("does this line pick up
mid-sentence?"), which is close to an objective fact about the text. The appendix covers
both the wording choice and how the merge thresholds were derived.

[Code example: see complete pages/cookbooks/autoformat.md]

[Code example: see complete pages/cookbooks/autoformat.md]

The cutoff for merging depends on how the previous line ends. After a dangling line (one
with no sentence-ending punctuation), a join probability of 0.2 or above merges the
pair; after terminal punctuation (`.` `!` `?` `:` `;`), the cutoff rises to 0.5. The
appendix walks through the probabilities behind the two numbers.

[Code example: see complete pages/cookbooks/autoformat.md]

[Code example: see complete pages/cookbooks/autoformat.md]

## Pass 2: classifying blocks

Each stitched block gets a `Choice` question: *what kind of content is this?* These
three
dicts, plus the step question's true/false criteria inside `classify_questions` below,
are the entire specification of the classifier. There is no other logic. To adapt the
pipeline to your own documents, edit these descriptions.

[Code example: see complete pages/cookbooks/autoformat.md]

Everything below is plumbing: build the questions, send one request, read the answers back.
If the type comes back `heading`, the renderer needs a heading level; if `list_item`,
whether order matters; if `callout`, which kind. The types are not known yet, and waiting
for them would mean a third round trip, so the companion questions are asked up front in
the same request. Most of these answers are never read: the step probability of a paragraph
means nothing and is simply ignored. An extra question adds little, since the state is
most of the tokens and is sent once either way, while an extra round trip adds a full
request of latency.

[Code example: see complete pages/cookbooks/autoformat.md]

[Code example: see complete pages/cookbooks/autoformat.md]

Every block's judgment is in that table, and the companion column shows the up-front
answers being put to use: the three "Things to do before Monday" lines carry step
probabilities near 0.9 (they will render as a numbered list), the three team lines sit
near 0.1 (bulleted), and the unmarked warning about the doctor script was classified as
a callout of kind `warning`. The appendix looks at the one block the model was unsure
about.

## Rendering

Code assembles the page from the judgments. Consecutive list items become one list,
numbered when the mean of the items' step probabilities is at least 0.5. That threshold
is a
group-level decision no single question asked directly.

[Code example: see complete pages/cookbooks/autoformat.md]

[Code example: see complete pages/cookbooks/autoformat.md]

Every word above is from the input. The pipeline only chose boundaries, types, and
markup.

## Open it in the playground

This share link holds the stitched blocks and the full pass-2 question set. Open it to
re-run the classification live.

[Code example: see complete pages/cookbooks/autoformat.md]

<a href="[long playground URL saved in original]">Open the stitched memo + questions in the TypeSafe playground →</a>

***

# Appendix

## Cost and latency

[Code example: see complete pages/cookbooks/autoformat.md]

[Code example: see complete pages/cookbooks/autoformat.md]

Two round trips, 10,211 tokens, 0.8s, \$0.0015.

## Where the join thresholds come from

The per-line join probabilities from pass 1:

[Code example: see complete pages/cookbooks/autoformat.md]

[Code example: see complete pages/cookbooks/autoformat.md]

The probabilities land in two separate bands: line breaks that split a sentence score
0.39 and up, breaks the author meant score close to zero. But where to put the cutoff
between the bands depends on **how the previous line ends**, a fact code can read
directly:

* After a *dangling* line (one with no sentence-ending punctuation), anything at 0.2 or
  above counts as a continuation. True continuations score as low as 0.39 here (`L004|
  make the switch for real.`), so a single cautious cutoff at 0.5 would break up healthy
  paragraphs.
* After *terminal* punctuation (a character that ends a sentence or clause: `.` `!` `?`
  `:` `;`), the cutoff rises to 0.5. The memo's team list shows why: `L015| The platform
  team` follows a colon and scores 0.22. That is a low but nonzero "this continues the
  sentence" signal, and it would clear the 0.2 cutoff and merge the list into the
  sentence
  introducing it. No single threshold works for both cases; once code checks the
  punctuation first, the two bands separate.

## Why the question is "mid-sentence" and not "same paragraph"

The first version of this pipeline asked the obvious question: "are these two lines part
of the same paragraph?" It failed in a specific way. A run of short lines under a
heading (a list typed without bullets) *is* a paragraph in the loose sense: the lines sit
together and share a topic. Asked about paragraphs, the model says yes to every pair, and
the stitch pass merges the whole list into one long block.

Same document, same request shape, only the wording changed:

[Code example: see complete pages/cookbooks/autoformat.md]

[Code example: see complete pages/cookbooks/autoformat.md]

With the paragraph wording, every unmarked list item scores above 0.75 and both lists
collapse. The memo merges into a few run-on blocks. "Same paragraph" asks the model to
judge whether the topic carries over, and between list items it does. "Picks up
mid-sentence" asks about the text itself. When a judgment call feeds a threshold, the
question should name the narrowest fact that decides it. Here the wording is the
difference between 17 blocks and 12.

## The lowest-confidence block

[Code example: see complete pages/cookbooks/autoformat.md]

[Code example: see complete pages/cookbooks/autoformat.md]

The sentence introducing the team list is genuinely ambiguous - it names what follows
(heading-like), is a complete sentence (paragraph-like), and sits where a callout would
go. The probabilities spread accordingly (paragraph 0.53, list\_item 0.24, callout 0.19),
and a UI can surface that - for example, underline for review any block whose type
confidence (the probability behind the winning choice) is under 0.55.




# Autoresearch feature discovery
Source: https://docs.typesafe.ai/cookbooks/autoresearch_feature_discovery

Runs an autoresearch loop that proposes TypeSafe questions, converts free text into numeric features, and uses model errors to improve a supervised CatBoost regressor.

*TypeSafe questions turn free text into numeric features for a supervised CatBoost model;
use an autoresearch loop to discover them.*

CatBoost needs a table of numbers, and a tasting note is not one. This cookbook builds the
table out of questions about the note, and none of them are written by hand. An LLM
proposes the questions, TypeSafe answers them for every row, and CatBoost trains on the
answers. The autoresearch part is what comes next: CatBoost reports which questions it used
and which rows it still gets wrong, the following proposal call reads that report, and the
loop runs again.

By the end you have a loop you can point at your own labelled text, a curve of held-out
error per round, and a table of which questions the final model used most.

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

A score answer becomes two columns: the average level the answer points at, and how spread
out it is around that average. A noul answer is one probability, so it is one column.

The data is 2,000 wine reviews: a tasting note in, the critic's score on an 80-100 scale
out. RMSE measures prediction error in critic-score points, with larger misses counting for
more, and lower is better. Every number in the table below comes from the 800 reviews that
neither the model nor the loop ever saw.

| how the note becomes a score                            | RMSE     |
| ------------------------------------------------------- | -------- |
| predict the average score of the training rows          | 3.09     |
| the same CatBoost, reading the note as word counts      | 2.47     |
| ask TypeSafe for the score itself, rescaled and shifted | 2.15     |
| 18 questions from one proposal call, no loop            | 1.87     |
| **38 questions after five rounds of the loop**          | **1.77** |

The last two rows are the loop. One proposal call, with nothing to go on yet, gets to 1.87.
Four more rounds of reading its own worst predictions get to 1.77. Most of the gain is in
that first call, and how much the four rounds after it add is measured further down.

<Tip>
  Want to take this notebook further or apply it to another problem? See
  [Next steps](#next-steps).
</Tip>

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

## Setup

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

then set `TYPESAFE_API_KEY` and `ANTHROPIC_API_KEY`. Every API call is cached to
`json_cache.json`, which ships with the cookbook, so a re-render replays these numbers
without calling anything. Delete it to re-run live. The numbers came from TypeSafe
`jev-1.12` and `claude-sonnet-5` on 2026-08-03. `propose()` has a second branch for
`gpt-5.6-luna`, which was not run.

The first code cell is the whole implementation: API calls, encodings, metrics, chart
style. It is there so this file runs on its own, and the docs site folds it away. Skip it
on a first read - the recipe starts under it.

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

The loop reads the same 1,200 of the 2,000 rows (the dev rows) over and over, and keeps a
question when it helps predict those 1,200 scores. Scoring on the same rows would mostly
measure how well the loop fitted itself to them, so the other 800 are held out and scored
once, at the end.

## Two question types

A proposed question is one of two kinds, and the kind decides what number comes back.

* **`intensity`** becomes a `Score`, for anything that comes in degrees. Its five
  levels are printed below, and the column is the average level, so a note that sits
  between "moderate" and "strongly" comes out between the two.
* **`presence`** becomes a `Noul`, for a yes/no fact like whether a fault is named.
  The column is that one probability.

## The method

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

No question is filtered out before it is answered. All of a round's questions go out in the
same request, so one more question costs no extra request. A question that applies to one
row in ten will look useless in the 60 notes the proposer reads, and still be the most
useful column in the set.

k-fold means splitting the dev rows into k parts and predicting each part with a model
trained on the other parts. Those predictions do three jobs: they judge every revision and
drop, they pick the notes the next round reads, and they tell the proposer which of its
questions helped, by how far they have moved since the round before.

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

## The autoresearch loop

`run_loop` runs all five rounds and prints a block per round. An added question goes
straight in: its answers have already been fetched, and its importance will show later
whether it was worth asking. A revision or a drop takes away a column the model is already
using, so each one is tried first: refit with the change, and keep it only if the dev
error goes down. A refit costs no API calls, so trying a change and rejecting it is free.

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

## Pointing it at your own data

`PROPOSER_TASK` is the only string that mentions wine, and `featurize()` takes any list of
strings. Editing that brief changes the proposal prompt, and the prompt is part of the
cache key, so the next run calls the API again for every round.

The request count grows with rows, not with questions: one request per row per round, so
100,000 rows is 100,000 requests a round. A revision counts as a new question, so it costs
another pass over every row. Raise the worker pool slowly. Eight is already enough to hit
a rate limit on a shared key.

## What the questions see

Five held-out reviews, one at each quarter of the score range, against fifteen of the 38
questions: the top eight score questions by importance, plus the top seven nouls.

Those fifteen rows are then sorted by which way the answer moves with the critic score.
Questions whose answer rises with the score come first, questions whose answer falls with
it come after the divider. So going left to right, from the worst review to the best, the
answers above the divider should climb and the answers below it should drop off.

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

<img alt="output" />

The table from the top of the page, computed. All five arms are scored once on the same 800
held-out rows, and the first three skip feature discovery. One predicts the mean of the dev
scores and reads nothing from the note at all. One hands the note to the same CatBoost
through its `text_features` handling, which turns it into word counts. One asks TypeSafe
for the score itself.

That third one is a single `Score` per row over ten quality bands, from "faulty or
unpleasant" up to "profound". Ten because ten levels is the most a `Score` question
takes -
eleven comes back as a server error. Level 0 maps to 80 points and level 9 to 100.
Spreading the bands over the scale that way is not enough on its own, because nothing in
the question says where this publication's scores actually sit on it. So every answer is
then moved by a single offset, measured on the dev scores. That offset is printed in the
row label, and it is the only thing this shortcut learns from the scores.

Spearman is rank correlation, where 1.0 would put the held-out wines in exactly the
critic's order. The word-count row is CatBoost's own text handling, not a tuned
text-regression pipeline. All of this is one dataset and one run of the loop.

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

## Did the autoresearch rounds help?

Both lines plot the error of the question set at the end of each round, starting from
the first proposal. The dashed line is the cross-validated dev error, the number every
accept and reject decision is made on. The solid line scores the same question set on
the held-out rows, which the loop never reads. Each point is the set as it stood when
the round closed, so a round that only revised or dropped a question still moves both
lines. The feature map says what the questions measure; the error is what tells you
whether the rounds after the first proposal made the predictions any better.

The axis is tight: everything on it happens inside a fifth of a point, and every shortcut
from the table above sits far off the top of it. The dev line runs above the held-out line
the whole way, and that is a training-size effect. Each dev fold trains on four fifths of
the dev rows, while the held-out number comes from a model that got all 1,200. The two
lines move together, so the dev number the loop steers by tracks the held-out number it
never sees. The interval under the title comes from resampling the held-out rows, so it
says whether the move from round 1 to round 5 is bigger than the noise in 800 rows.

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

<img alt="output" />

The held-out line falls further than the dev line does. Round 1 wrote its questions with no
feedback to work from, and the four rounds after it are worth 0.10 points on the held-out
rows, 95% CI \[-0.147, -0.050].

Round 5 proposed four adds, two rewordings and eight drops, and gave the first dev number
that did not improve. There is only so much to ask about a 245-character note, and by round
5 the proposals had tipped from adding questions to dropping them.

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

`importance share` is CatBoost feature importance, normalized so all 38 questions sum to
100%. It is not a share of rows, of questions, or of prediction accuracy. A score question
owns two columns, a mean and a spread, so its two column importances are added back
together before the percentage is printed. `note_overall_tone_positivity` accounts for
17.4% of the total. The fourth row is a noul: whether the note names a single vineyard or
some other prestige signal is a yes/no fact, so it was asked as one.

## Next steps

This run keeps the loop small. Direct extensions:

* Screen a candidate before paying to answer it. Treat the proposed question itself as the
  state and ask nouls about it: can it be answered from the source text, does it mean
  one thing under its criteria, does it apply to most rows, will it vary across rows. Send
  only the questions that clear all four with enough confidence.
* Prune correlated features. Measure correlation between encoded columns on the dev rows,
  cluster the near-duplicates, and keep the clearest or most important question from each
  cluster.
* Add simple baselines. Compare TF-IDF, character counts, and other structural features on
  their own, then append them to the discovered columns to measure what each contributes.
* Mix proposer families. Generate candidate batches with Anthropic, OpenAI, Google Gemini,
  and open-source models, then merge and deduplicate them before any of them reach
  TypeSafe. Different families should widen the search more than repeated calls to one
  proposer.
* Compare predictive models and methods. Try linear or elastic-net regression, a support
  vector regressor, random forests, and recalibration where the downstream output is
  probabilistic. Check whether the discovered features help outside CatBoost.
* Add an embedding baseline. An embedding turns a note into a few hundred numbers with no
  question attached: `sentence-transformers/all-MiniLM-L6-v2` runs locally, OpenAI's
  `text-embedding-3-small` is a hosted call. Append one to the discovered columns and
  measure whether it carries anything they do not.
* Match validation to deployment. Use chronological splits when predicting the future,
  grouped splits when related rows must stay together, and keep a final test set untouched
  by both feature discovery and model selection.
* Stop on a plateau. End the loop when cross-validated RMSE stops improving for a fixed
  number of rounds, or when it reaches a question or request budget.
* Run a longer search in an agent's Goal mode. Give it an explicit metric, budget, and
  stopping rule, then let it propose, evaluate, and refine more rounds.
* Check stability. Repeat discovery across seeds or data slices and keep the questions that
  stay useful, rather than the ones whose importance rests on one split.

## Open it in the playground

This share link holds one tasting note plus every question the loop ended up with.

[Code example: see complete pages/cookbooks/autoresearch_feature_discovery.md]

<a href="[long playground URL saved in original]">Open the note + questions in the TypeSafe playground →</a>




# Double-checking citations
Source: https://docs.typesafe.ai/cookbooks/citation_check

Catch wrong or hallucinated citations by checking against the source document. One Choice question decides whether the quote's context supports the claim.

An LLM answers a question and attaches citations: for each claim, a section of a source
document and the quote it rests on. Some of those citations are wrong or hallucinated:
the quote can be missing from the document altogether, or sit in it word for word while
its context says the opposite of the claim.

Checking one by hand is slow: find the document, find the quote inside it, then read
enough of its context to tell whether it backs the claim up.

To automate that check, we first look for missing quotes with an ordinary string match,
and then we use a `Choice` question to read each surviving quote's context and decide
whether it supports the claim.

[Code example: see complete pages/cookbooks/citation_check.md]

Below, eight citations from an LLM's answer about RFC 7519 (JSON Web Token) go through the
check. The four accurate ones came back `verified` at confidence 0.93 or higher. All four
planted failures were caught: a fabricated quote, a contradicted claim, and two unsupported
citations sent to a human.

`check_citation()`, the function you build here, takes a source document and one citation
and returns one of four verdicts: `verified`, `unsupported`, `contradicted`, or
`fabricated`. It also returns a confidence that flags the ones a human should look at.

## Setup

[Code example: see complete pages/cookbooks/citation_check.md]

then set `TYPESAFE_API_KEY`. Every API call is cached in `json_cache.json`, which ships
with the cookbook, so re-running replays the published numbers instead of calling the
API. Delete that file to run everything live.

Numbers below came from `jev-1.12` on 2026-08-16.

[Code example: see complete pages/cookbooks/citation_check.md]

## Load the source and the citations

The source is [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519.html) (JSON Web Token),
fetched from rfc-editor.org and committed next to this cookbook as `rfc7519.txt`. The code
below strips the page headers and footers, then splits the text into numbered sections.

The eight citations in `citations.json` were written by an LLM against the RFC. Four are
accurate; we edited the other four to fail the check.

[Code example: see complete pages/cookbooks/citation_check.md]

[Code example: see complete pages/cookbooks/citation_check.md]

## Find each quote in the source

A quote that is not in the source is fabricated, and no model is needed to find that out.
Normalize whitespace and curly quotes so a quote still matches across the RFC's line
wraps, then look for it as a substring. A match also says which section the quote came
from, and that section is the text the model reads in the next step.

A citation can name a section without quoting anything from it. There is nothing to match
in that case, so take the section the citation names and go straight to the model.

[Code example: see complete pages/cookbooks/citation_check.md]

[Code example: see complete pages/cookbooks/citation_check.md]

## Verify whether the source supports the claim

A citation that still has a quote at this point matches the source word for word. That is
not enough: the quote can be accurate and the claim built on top of it still wrong.
Deciding that takes the quote's context, the section step 1 found.

One `Choice` question per surviving citation covers the three ways a section can relate
to a claim.
The option with the highest probability is the verdict, and `AUTO_ACCEPT` (0.8 in the
code above) decides what happens to it:

* confidence at or above 0.8: the verdict stands on its own;
* below 0.8: a human confirms the verdict before anything acts on it.

Start high, and lower the threshold as you see how the model does on your own documents.

[Code example: see complete pages/cookbooks/citation_check.md]

## Check every citation

All eight citations through the same check:

[Code example: see complete pages/cookbooks/citation_check.md]

[Code example: see complete pages/cookbooks/citation_check.md]

Four citations came back `verified`, one `fabricated`, one `contradicted`, and two
`unsupported`.

* `epoch_seconds`, `aud_reject`, `clock_skew`, and `duplicate_names` are the accurate four.
  All of them came back `verified` at confidence 0.93 or higher, well above `AUTO_ACCEPT`.
* `sig_reporting` never reached the model. Its quote is not in the RFC, so the string
  match alone marks it `fabricated`.
* `exp_required` quotes section 4.1.4 word for word, and the same section says "Use of
  this claim is OPTIONAL", so it is `contradicted`, at confidence 0.99.
* `pii_encryption` and `iat_future` came back `unsupported` at 0.27 and 0.56, both under
  the threshold, so both went to a human. `pii_encryption` shows why the string match is
  not enough on its own: its quote is in the source word for word, and the section it
  came from says nothing about the claim.

To point this at your own data, replace `rfc7519.txt` and `citations.json`.
`load_source()` and `split_sections()` are written for an RFC's layout, so a document of
another shape needs its own parsing.

The string match is exact after normalization: a quote that is truncated or lightly
reworded comes back as `fabricated`. A production system that tolerates sloppy quoting
would need fuzzy matching instead.

## Open it in the playground

The link holds one citation's claim and section, plus the question. Open it to run the same
call live in the browser.

[Code example: see complete pages/cookbooks/citation_check.md]

<a href="[long playground URL saved in original]">Open one citation's claim + section in the TypeSafe playground →</a>




# Classification using confidence
Source: https://docs.typesafe.ai/cookbooks/classification_using_confidence

Classify SEC annual reports into 75 industry groups with one Choice each, then read the answer's own confidence to decide whether to report that group or the broader division above it.

Every company that files an annual report with the SEC describes its own business in it. We
classify those descriptions under the Standard Industrial Classification: 75 industry
groups, one `Choice` question per document.

Most filings are easy. A regional bank is a regional bank. Some are not: a company that
just sold one of its two segments, or a startup describing a business it plans to enter
rather than one it runs. The model has to pick a group regardless, and the answer for a
hard case looks no different from the answer for an easy one. Telling hard cases from easy
ones is normally where the cost goes: a second model, extra calls, human review.

A Choice already tells you. Alongside the winning option it returns `confidence`, high when
nearly all the probability landed on one option and low when it spread across several. That
one number separates the answers you can trust from the ones you can't.

What to do with an untrusted answer depends on your labels. SIC labels form a hierarchy:
industry groups roll up into broader divisions. That makes one response nearly free. When
the model is unsure of the group, report the division it belongs to. The broad label
follows from the narrow one, so there is no second call.

Across 60 filings, a confidence cutoff of 0.9 splits them in half. The confident half is
right 90% of the time; the other half, 40%. Reported one level up, that 40% becomes 70%. We
end with a `classify()` function that returns a label plus how specific it is, at one
request per document.

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

## Setup

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

then set `TYPESAFE_API_KEY`. Every API call is cached to `json_cache.json`, which ships
with the cookbook, so re-rendering replays the published numbers without calling the API.
Delete that file to re-run everything live.

Numbers below came from `jev-1.12` on 2026-08-12.

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

## Build the two levels of the taxonomy

`sic_codes.tsv` is the industry list the SEC publishes for filers to pick their own code
from, fetched 2026-08-10: 444 four-digit codes, each with an industry title. The digits are
a hierarchy. The first two are the **major group** (75 of them here, from `01` agricultural
production to `99` non-classifiable), and fixed ranges of major groups make up the ten
**divisions**, the broadest split SIC has.

Both levels come out of that one file with no model involved: group the codes by their
first two digits, then map those digits to a division.

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

A Choice question needs something to describe each option, and a group's own name is not
always
there: 42 of the 75 carry an umbrella title in the SEC's list, and the rest carry none. So
each group is described by the industries inside it, which is what someone reading the
filing would match against anyway.

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

## The filings

`filings.jsonl` holds 60 annual reports (10-K), each trimmed to Item 1 "Business", the
section where a company describes what it does, which is the only part an industry code is
about. They span 1993–2024 and run from 700 to 2,200 words. Each one carries the SIC code
its filer chose, plus the accession number to look it up on EDGAR.

Where that label comes from matters before any accuracy number. It is self-reported:
whoever prepared the filing picked it once, and it goes stale when a company sells the
business the code names and keeps the code. These 60 were filtered down to filings whose
own text supports the code they carry, so the numbers here measure the recipe rather than
the state of EDGAR's metadata.

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

## Ask one Choice question, and read the confidence

One `Choice` question whose options are the 75 groups. The whole taxonomy fits in one
request: a Choice works reliably up to roughly 240 options, and 75 is well inside that.

The answer comes back with `choice`, the winning group; `probabilities`, the weight on each
of the 75; and `confidence`, which says how concentrated that spread was. The recipe reads
`confidence` rather than the winner's own probability. A winner at 0.45 with a runner-up at
0.44, and a winner at 0.45 with the rest of the weight scattered thinly, are different
situations, and `confidence` is what separates them.

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

## Return the group when sure, its division when not

The four lines below are the whole recipe. At 0.9 confidence or above, the answer is
reported as an industry group; below that, the same answer is reported as the division that
group sits in.

Every filing still comes back with a usable label. One the model could not classify
confidently comes back one level up instead of being dropped or sent on. If a division is
too coarse for your application to act on, this branch is where you hand it to a person.

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

The confidences line up with how hard each filing is to classify. The three at 1.00 are a
pharmaceutical maker, a life insurer and a utility; all three are holding companies on
paper, but each has one dominant business the filing names outright. The three at the
bottom are harder for reasons you can read in the text. Two are development-stage companies
describing a business they intend to start (Nevaeh "intends to operate as a software
developer", Barricode was "organized to enter into the computer security software
industry"), and the third had two segments and sold one of them weeks before filing. Those
three come back as a division rather than a group.

`classify()` is the whole recipe. Point `ask()` at your own documents and rewrite
`describe()` for your own taxonomy, and the rest carries over.

## What the broader answer buys

All 60 filings, scored against the code each filer chose, under both policies: name a group
every time, or report the division whenever confidence lands under 0.9.

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

Where the model was sure, the group it named is right nine times in ten. Where it was not,
naming a group was wrong more often than right, at 40%. Reporting those same answers as a
division takes them to 70%.

The chart puts the two policies side by side, split by whether the model was sure.

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

<img alt="output" />

## Open it in the playground

This share link holds one filing and the 75-option question, so you can see the
distribution and the confidence it produces without writing any code.

[Code example: see complete pages/cookbooks/classification_using_confidence.md]

<a href="[long playground URL saved in original]">Open the filing + question in the TypeSafe playground →</a>




# Classifying RAG passages
Source: https://docs.typesafe.ai/cookbooks/classifying_rag_passages

Score each retrieved passage with one TypeSafe request, then decide in code which ones reach the answering model.

The retrieval step of a RAG pipeline ranks passages by how much their wording resembles
the query, and hands the top few to a language model. These may include noisy or
irrelevant passages, or worse yet, may lump together contradicting facts, prompt
injections, or model instructions together with what is nominally evidence to assist with
generating an answer.

Between retrieval and generation, add a second stage that classifies each retrieved
passage. For each one, send TypeSafe one request carrying multiple questions about the
query–passage pair: is it relevant, does it state something usable in an answer, does it
contradict something the query takes for granted, and is it trying to instruct the model.
The answers to those questions decide what happens to each passage, with simple branching
logic: add it to the prompt as evidence, add it to the prompt as conflicting information,
or drop it. Evidence and conflicts arrive in separate blocks, so the generator can react
appropriately.

To exercise the pipeline, we run it over some tricky questions against real auth
documentation full of pages that read alike, and a planted passage carrying a prompt
injection. Two questions contain false assumptions, which are flagged before being handed
to the model generating answers.

The pipeline, in the order the sections build it: the 81-passage corpus, a
cosine-similarity search that keeps the top 12 passages per query, the four
`Noul` questions sent to TypeSafe for each of those passages, the thresholds in `route()`
that label each one, the prompt assembled from separate evidence and conflict blocks, and
the answers `claude-sonnet-5` writes from it.

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

## Setup

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

Set `TYPESAFE_API_KEY`, `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`. We use TypeSafe to score
each retrieved passage, OpenAI to embed the corpus for the search step, and Claude to write
the final answer out of whatever survives the scoring.

None of the three needs a key to reproduce this page. `json_cache.json` ships with the
cookbook and replays every recorded call, so a re-render costs nothing. Delete the file to
run the pipeline live instead. The numbers here came out of `jev-1.12` and
`claude-sonnet-5` on 2026-08-27.

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

## Load the docs corpus

The corpus file `corpus.json` holds 81 passages. We copied 80 of them straight from the
Supabase auth docs at commit `2440b06`, one passage per heading, verbatim and used under
Apache 2.0:
[https://github.com/supabase/supabase/tree/2440b06/apps/docs/content/guides/auth](https://github.com/supabase/supabase/tree/2440b06/apps/docs/content/guides/auth)

Each passage carries `id`, `title`, `text` and `source_type`, and every request sends all
four. Near-misses fill the set. Rotation, expiry, sessions and signing keys each get their
own page, and those pages read alike. Refresh-token rotation and JWT signing-key rotation
are different things described in nearly the same words.

We wrote the last one ourselves, `forum-injection`, marked `community_forum`: it reads as
an ordinary forum answer until its final paragraph, which is an instruction aimed at the
model.

We also wrote two of the six queries to state a premise the docs contradict, so the
injection and conflict routes both have something to catch.

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

## Retrieve the top passages

Rank the passages by cosine similarity over embeddings, using `text-embedding-3-small` at
256 dimensions, and keep the best `TOP_K = 12` for each query. Short vectors keep the
shipped cache small, and the embedding calls are cached with everything else, so the
vectors travel inside `json_cache.json`.

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

The 12 passages retrieved for the first query:

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

The forum post carrying the injected instruction, `forum-injection`, ranks 1st at 0.584.
The passage that refutes the premise, `sessions-01`, ranks 7th at 0.509. All 12 scores
fall between 0.584 and 0.455, a spread too narrow to separate the passage that corrects
the query from the one trying to hijack the answer.

## Ask four questions about each passage

Put the query and one passage in the state together, so every question is about the pair
rather than the passage alone. Shape:

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

Use the same four questions for every query. Only the state changes between calls.

Four `Noul` questions, and what each answer drives:

* `is_relevant`: the relevance floor.
* `contains_answer_evidence`: include, or drop.
* `contradicts_query_premise`: promotes to the conflict block.
* `contains_prompt_injection`: excludes outright.

None of the four asks whether to include the passage. That call sits in the code below,
where changing it means editing a number instead of rewording a question.

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

## Route each passage in code

Every answer comes back as a probability, and there are plenty of ways to turn four of
them into one decision. A plain run of comparisons worked here. Test the four
probabilities against their thresholds in a fixed order and stop at the first match. That
match labels the passage, and the label decides what happens to it: evidence in the
prompt, a conflict in the prompt, or dropped.

The tests, in order:

1. `contains_prompt_injection > 0.70` -> exclude
2. `contradicts_query_premise > 0.70` -> conflicting\_evidence
3. `is_relevant < 0.45` -> exclude
4. `contains_answer_evidence > 0.55` -> include
5. otherwise exclude

Injection comes first because it is a security decision, not an evidence one. The
contradiction test comes before the evidence test because a passage that denies the
query's premise usually states something usable too; tested the other way round, it would
land in the accepted block instead of the conflict one.

<Info>
  We picked these four numbers for this corpus. Treat them as a starting point, not
  defaults. Moving one is cheap: `THRESHOLDS` holds all four and `route()` reads only the
  stored answers, so re-routing every passage costs no API calls.
</Info>

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

The premise-contradiction question scores `sessions-01` at 0.92 and sends it to the
conflict block. Relevance reads 0.49 and answer evidence 0.51, so those two alone would
have dropped it.

Similarity ranked `forum-injection` first and its relevance clears the floor at 0.71. The
injection score of 0.99 is what drops it.

Nothing reaches the prompt as evidence, which is right for a question built on a false
premise. Below, the same table for a query the docs do answer.

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

Four passages reach the evidence block here, and the answer below cites all four. The
rows print in retrieval order, which shows the reshuffle: ranks 2, 3 and 4 all read
*Lifetime of a signing key*, the wrong kind of lifetime in almost the query's own words,
and all three score 0.08 or less on relevance. Three of the four that made it sat 8th,
9th and 11th. `forum-injection` is excluded again at 0.99.

The injection question is a filter, and only one. A passage that scores under the
threshold still reaches the prompt, so the generator prompt has to treat every passage as
untrusted text regardless of its score. Nothing here is a security boundary.

One request per passage, so cost scales with `k`. Nothing batches passages into one
request, because each question is about one pair.

## Build the prompt from the accepted evidence

TypeSafe scores the passages and the routing labels them. An LLM still writes the answer,
here `claude-sonnet-5`. Keep accepted and conflicting evidence in separate blocks.

Two blocks let the answer push back. Merge them into one and the generator has no way to
tell a passage that answers the query from one that denies its premise.

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

The first answer is to the false-premise query, *Refresh tokens expire after 30 days -
how do I
extend that window?*; the second is to an ordinary question the docs do answer, whose 12
retrieved passages included `forum-injection` and its injected instruction.

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

The first answer arrived with an empty accepted block and one conflicting passage. It
opens with "I don't have sufficient accepted evidence", names the conflict, and quotes
`sessions-01` on refresh tokens never expiring rather than inventing a 30-day setting.

The second had 4 accepted passages and no conflict, and cites all four. Nothing of the
injected instruction reaches the text.

## Compare the six queries

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

<img alt="output" />

Each bar holds the 12 passages retrieved for one query, 72 in all. At least two thirds of
every bar is excluded. Only the two false-premise queries route anything to conflict, and
two queries accept nothing at all: the one about a 30-day expiry, and *how are refresh
tokens rotated?*

## Open it in the playground

Open the link below to re-run one call live: the first query against the passage that
routed to the conflict block, plus the four questions.

[Code example: see complete pages/cookbooks/classifying_rag_passages.md]

<a href="[long playground URL saved in original]">Open the query + passage and its four questions →</a>




# Self-consistency: choices
Source: https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook

Add an uncertain outcome to moderation decisions and compare label agreement with the share of automatic actions.

This cookbook takes one borderline user post, runs a moderation rubric over it 15 times,
and checks whether each answer holds still across the repeats. Every check is a
`Choice`, so each answer is one label from a fixed set. In a moderation pipeline
that label is the routing decision: remove or leave up, escalate or auto-resolve, send to
the threat, spam, or general queue. When the label wobbles from one run to the next, the
same post routes to different places for no good reason.

The rubric is 8 `Choice` questions, and each run is one call that answers all 8. We do
15
repeats per condition, where a condition is one model plus one setting, and plot every
label that came back.

The conditions:

* Non-reasoning LLMs `claude-haiku-4-5` and `gpt-5.4-mini`, at temperature `0` and the
  API default.
* Reasoning LLMs `gpt-5.5` and `claude-opus-4-8`, which have no temperature dial.
* TypeSafe: one `system_one` call over the 8 `Choice` questions, with a fresh `uid`
  field (a
  throwaway unique value) on each call, matching the noul cookbook setup.

What to look for: picked labels can flip inside a single condition, including TypeSafe,
and conditions disagree with each other.

In this run the LLM distribution settings repeat their plurality labels 87.5% to 100% of
the time, compared with TypeSafe's 90.8%. TypeSafe has lower mean probability variation
than five of the six LLM distribution conditions; Haiku at temperature 0 varies less.
Close probabilities still permit routing changes: TypeSafe flips on 2 of the 8 questions.

For application decisions, we also require a top probability of at least `0.60`; otherwise
the result is `uncertain` and goes to human review. TypeSafe's agreement then rises to
99.2%, with automatic labels on 74.2% of answers. We show the raw outputs and apply the
same threshold to LLM probability conditions, keeping abstentions and changes visible.

## Setup

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

then set `TYPESAFE_API_KEY`, `ANTHROPIC_API_KEY`, and `OPENAI_API_KEY`.
This run uses `jev-latest` on the production API, sampled on 2026-09-11.

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

## The state: a borderline user post, as JSON

The post below is built to sit on the fence. The language is heated and insulting, aimed
partly at one person and partly at the argument and the community. It carries an
off-platform invite (a link pulling people to another site), one prior strike on the
account, and four user reports, and the threat-like wording is never cleanly phrased.

There is no single obvious answer here, and that is the point: small wording differences
should not randomly move the same post between enforcement paths.

The LLMs get `json.dumps(POST)` in the prompt. TypeSafe gets the Python dict directly.

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

## The rubric: 8 `Choice` questions

Each question has a `key`, a line of instructions, and a fixed label set. The labels
within a question are mutually exclusive (exactly one applies), and each carries a
short description. TypeSafe returns a picked `choice` plus a `probabilities`
distribution over the labels. The LLMs are asked to use the same label sets, which
keeps every row comparable.

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

## How we ask

Each LLM call is one prompt holding `json.dumps(POST)`, all 8 questions, and every allowed
label. There are two answer formats. In distribution mode the model returns one JSON object
per question with a probability on each label. In single-pick mode it returns one bare
label per question, and our analysis puts all the probability mass on that label.

The TypeSafe call is one `system_one` request over the same post and the same 8
`Choice` questions, returning one distribution per question.

Every query also gets a fresh `uid`, a throwaway unique value that changes each run while
leaving the post and rubric unchanged. It appears in the LLM prompt and as an extra field
in the TypeSafe state. This setup cannot separate sensitivity to the irrelevant field
from variation that would occur on identical requests.

Each helper returns the answer, an estimated cost, and the round-trip latency.

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

## Experimental Conditions

### Experiment Grid

| Model group          | Model                            | Distribution (t=0) | Distribution (default) | Single-pick (t=0) |
| -------------------- | -------------------------------- | :----------------: | :--------------------: | :---------------: |
| Non-reasoning Models | `claude-haiku-4-5`               |          ✓         |            ✓           |         ✓         |
| Non-reasoning Models | `gpt-5.4-mini`                   |          ✓         |            ✓           |         ✓         |
| Reasoning Models     | `gpt-5.5`                        |          —         |            ✓           |         —         |
| Reasoning Models     | `claude-opus-4-8`                |          —         |            ✓           |         —         |
| TypeSafe             | `jev-latest` (`typesafe_choice`) |          —         |            ✓           |         —         |

* A `✓` marks a condition tested with 15 repeats; a `—` marks a combination that is not
  tested.
* The default column sends no temperature argument: non-reasoning models use the API
  default, and reasoning models and TypeSafe run without a temperature setting.
* Single-pick conditions return one label per question.
* Temperature `0` is commonly suggested for repeatability, so it is compared with the API
  default.

We draw `NUM_SAMPLES` = 15 repeats per condition. Each repeat has its own cache key and
counts as a distinct draw, and the cache (`json_cache.json`) ships with the cookbook, so
re-rendering reuses it and spends no API calls. Delete the cache to sample live again.

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

### Cost + speed (per rubric query)

Costs below use the historical price assumptions in Setup, including the `speed_latest`
rate for TypeSafe. They are not verified `jev-latest` prices or current billing amounts.

One row is one full 8-question rubric call. `time/call` and `cost/call` average the 15
calls, and the `vs ts_choice` columns divide by the TypeSafe figures. The LLMs run in a
16-way pool.

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

In this run `typesafe_choice` has a mean round-trip latency of 114ms. The LLM conditions
range from 826ms to 13.0 seconds per call under the concurrency settings above.

## Plot: every sample's decision as a heatmap

How to read it:

* Outer row group: the question.
* Inner row: the condition.
* Column: one full rubric call.
* Cell text: the application decision plus the probability on the top label.
* Cell color: the label's position within that question, so the same color all the way
  across a row means the same decision every time.
* Gray `uncertain`: the top probability is below `0.60`, so the case goes to human review.
* Hatched `n/a`: the reply did not parse into usable labels (a parse failure).
* Blank rows are just spacers.

Single-pick conditions keep their returned labels: they provide no uncertainty estimate.

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

<img alt="output" />

The clearer questions hold steady: `target` reads Person and `severity` reads High across
the board. The borderline ones split across conditions: `category`, `primary_risk`,
`action`, `review_path`, and `link_handling`. Some conditions also flip within their
own 15 repeats. Before abstention, TypeSafe changes its top label on `primary_risk`
(Harassment 11 times, Violence 4 times) and `link_handling` (RmLink 8 times, Brigade 7
times). Both rows now show `uncertain` throughout because their top probabilities are
below `0.60`.

## Probability std dev

This looks at the full probability vectors, not just the picked label. For each condition
we collect all 15 distributions for every question, take the standard deviation of each
label's probability across the repeats (how much it moves from run to run), then average
those std devs over all labels and questions. We also report the single largest label std
dev, and count parse failures separately.

The table compares every probability-output LLM condition against TypeSafe. The single-pick
rows are left out, since they emit hard labels rather than probability distributions.

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

In this run TypeSafe has a mean probability std dev of `0.0098` and a max single-label std
dev of `0.0515`. Haiku at temperature 0 has a lower mean std dev of `0.0012`. The other
five LLM probability conditions range from `0.0245` to `0.0543`, about `2.5x` to `5.6x`
the TypeSafe mean. Small changes can still switch the top label when two labels are close.

## Plot: decision agreement with an uncertain outcome

Return `uncertain` when the top probability is below `0.60`. For each probability-output
condition and question, count the most common application decision, including `uncertain`,
and divide by all 15 draws. Parse failures count against agreement. Each bar averages the
score over all 8 questions, with the highest agreement first.

Single-pick LLM conditions are excluded because they provide no uncertainty estimate.

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

<img alt="output" />

Under the same `0.60` rule, Haiku at temperature 0 scored 100%. TypeSafe scored 99.2%, and
the other LLM conditions landed between 84.2% and 94.2%. TypeSafe returned `uncertain` on
25.8% of answers and acted automatically on the other 74.2%; Haiku at temperature 0 never
abstained. These percentages measure repeatability only. The table below sets raw agreement
and abstention rates next to the policy agreement in this chart.

## Let uncertain probabilities produce an uncertain decision

A small probability change can swap two close labels. The application does not have to
act on the winner: return `uncertain` when the top probability is below `0.60`, and send
that case to a human. At exactly `0.60`, select the top label. This uses the returned
probabilities, not the API's separate `confidence` field, and adds no model calls.

The threshold is an illustrative application policy, not a calibrated guarantee or a
threshold chosen to maximize this run's agreement. Choose production thresholds using
labeled examples and the cost of incorrect actions and human review.

We apply the same rule to every probability-output condition. Single-pick LLM responses
have no probability estimate; their synthetic one-hot vectors cannot measure uncertainty,
so they are excluded from the agreement chart and table.

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

`policy agree` counts `uncertain` as a decision; parse failures count against agreement.
`automatic` is the share of all answers that select a label. `conflicts` counts questions
with more than one concrete label across the repeats, ignoring abstentions. These measures
describe repeatability and how often the application acts, not whether its actions are
right.

TypeSafe's agreement rose from 90.8% to 99.2%. Of the answers, 25.8% were uncertain and
74.2% automatic. `primary_risk` and `link_handling` came back uncertain on every repeat;
`category` alternated between Violence and `uncertain`, crossing the action threshold on
some repeats and not others. No question produced two different concrete TypeSafe labels.
None of this shows accuracy or superiority: Haiku at temperature 0 had 100% agreement
here, with no abstentions.

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

<img alt="output" />

This policy does not make the model deterministic. Abstaining can replace competing
labels with the same human-review outcome, but a probability near `0.60` can still move
between a concrete label and `uncertain`. The probability statistics and the table's `raw
agree` column still report the original model outputs.

## Open it in the TypeSafe playground

The link below opens the same post and rubric in the playground: one post, the same 8
`Choice`s, and TypeSafe `jev-latest`.

[Code example: see complete pages/cookbooks/consistency_choice_cookbook.md]

<a href="[long playground URL saved in original]">Open this post + rubric in the TypeSafe playground →</a>




# Self-consistency: nouls
Source: https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook

Route uncertain probabilities to human review while keeping the underlying noul values visible.

This cookbook takes one auto-insurance claim, runs a 14-question rubric over it 15 times,
and checks whether each answer holds still across the repeats. Every check is a
`Noul`, so each answer is P(true) for one True/False question. In a claims-triage
pipeline, which sorts incoming claims into pay, deny, or send-to-a-human, probabilities
guide the decision. Small changes near a threshold can change which action is taken.

The rubric is 14 `Noul` questions, and each run is one call that answers all 14. We do
`NUM_SAMPLES` = 15 repeats per condition, where a condition is one model plus one setting,
and show every probability that came back.

The conditions:

* Non-reasoning LLMs `claude-haiku-4-5` and `gpt-5.4-mini`, at temperature `0` and the
  API default.
* The same two non-reasoning models in True/False mode: one bare yes or no per question,
  mapped to 1.0 and 0.0.
* Reasoning LLMs `gpt-5.5` and `claude-opus-4-8`, which have no temperature dial.
* TypeSafe: one `system_one` call over the 14 `Noul` questions, with a fresh `uid` field
  (a throwaway unique value) on each call.

What to look for: the LLM answers move from run to run, at temperature `0` too, and on the
judgment calls the models disagree with *themselves*. TypeSafe's mean per-question
probability standard deviation is `0.0102`, below all LLM probability conditions here.
Its `covered` answers span `0.43` to `0.53`, crossing a `0.5` decision threshold.

We also turn probabilities from `0.30` through `0.70` into an explicit `uncertain` outcome
for human review. The final illustration maps TypeSafe probabilities to these actions
while keeping the underlying probabilities visible.

## Setup

[Code example: see complete pages/cookbooks/consistency_noul_cookbook.md]

then set `TYPESAFE_API_KEY`, `ANTHROPIC_API_KEY`, and `OPENAI_API_KEY`.
This run uses `jev-latest` on the production API, sampled on 2026-09-11.

[Code example: see complete pages/cookbooks/consistency_noul_cookbook.md]

## The state: an auto-insurance claim, as JSON

One claim with a few borderline calls built in:

* The loss happened at a track-day event (the policy excludes "track/competitive driving"),
  but in the parking lot while the car was stationary, not on the circuit.
* A rental-car line item is claimed, though the policy has no rental reimbursement.
* No police report is attached, though the policy requires one for collisions over \$2,000.
* An auto-triage note already marks the claim "approved, pay full amount" before any human
  review, and without withholding the deductible.

Some rubric questions below are clear-cut; several are the borderline kind where sampled
LLM answers scatter and the models disagree.

The claim is a JSON structure. The LLMs get `json.dumps(CLAIM)` in the prompt; TypeSafe
takes the structure as the state directly.

[Code example: see complete pages/cookbooks/consistency_noul_cookbook.md]

## The rubric: 14 `Noul` questions

One `key -> question` entry per row, phrased so a yes means the thing we are checking for
is true. That keeps every row comparable: each model's probability and TypeSafe's `noul`
measure the same thing.

[Code example: see complete pages/cookbooks/consistency_noul_cookbook.md]

## How we ask

Each LLM call is one prompt holding `json.dumps(CLAIM)` and all 14 questions. The model
returns a JSON object mapping each question's key to a probability. Calls route to
Anthropic or OpenAI by model name: non-reasoning models take a `temperature` (`0` or the
API default), reasoning models think first and take no temperature.

The non-reasoning models also run a True/False variant: they answer each question with a
bare yes or no, which we map to 1.0 and 0.0. This forces a hard decision and shows what
these models do when they cannot leave any mass in the uncertain middle.

The TypeSafe call is one `system_one` request over the same claim and the same 14 `Noul`
questions. Each answer's `noul` is P(true).

Every query also gets a fresh `uid`, a throwaway unique value that changes each run while
leaving the claim and rubric unchanged. It appears in the LLM prompt and as an extra field
in the TypeSafe state. This setup cannot separate sensitivity to the irrelevant field
from variation that would occur on identical requests.

> **Note:** despite the "ONLY a JSON object" instruction, `claude-haiku-4-5` wraps nearly >
> every reply in a ` ```json ... ``` ` fence that strict `json.loads` rejects > (the
> other models return bare JSON). The helper peels the fence; a reply that still fails > to
> parse becomes a parse failure, counted but not scored.

Each helper returns the answer, an estimated cost, and the round-trip latency.

[Code example: see complete pages/cookbooks/consistency_noul_cookbook.md]

## Experimental Conditions

### Experiment Grid

| Model group          | Model                          | Probability (t=0) | Probability (default) | Yes/no (t=0) |
| -------------------- | ------------------------------ | :---------------: | :-------------------: | :----------: |
| Non-reasoning Models | `claude-haiku-4-5`             |         ✓         |           ✓           |       ✓      |
| Non-reasoning Models | `gpt-5.4-mini`                 |         ✓         |           ✓           |       ✓      |
| Reasoning Models     | `gpt-5.5`                      |         —         |           ✓           |       —      |
| Reasoning Models     | `claude-opus-4-8`              |         —         |           ✓           |       —      |
| TypeSafe             | `jev-latest` (`typesafe_noul`) |         —         |           ✓           |       —      |

* A check mark is one condition, run 15 times. A dash is a combination that was not tested.
* The default column sends no temperature argument: non-reasoning models use the API
  default, and reasoning models and TypeSafe run without a temperature setting.
* Yes/no answers map to `1.0` / `0.0`.
* Temperature `0` is the usual advice for repeatability, so we compare it with the API
  default.

We draw `NUM_SAMPLES` = 15 repeats per condition. Each repeat has its own cache key and
counts as a distinct draw, and the cache (`json_cache.json`) ships with the cookbook, so
re-rendering reuses it and spends no API calls. Delete the cache to sample live again.

[Code example: see complete pages/cookbooks/consistency_noul_cookbook.md]

[Code example: see complete pages/cookbooks/consistency_noul_cookbook.md]

### Cost + speed (per rubric query)

Costs below use the historical price assumptions in Setup, including the `speed_latest`
rate for TypeSafe. They are not verified `jev-latest` prices or current billing amounts.

One row is one full 14-question rubric call. `time/call` and `cost/call` average the 15
calls, and the `vs ts_noul` columns divide by the TypeSafe figures.

[Code example: see complete pages/cookbooks/consistency_noul_cookbook.md]

[Code example: see complete pages/cookbooks/consistency_noul_cookbook.md]

In this run TypeSafe has a mean round-trip latency of 111ms. The LLM conditions range
from 1.1 to 13.9 seconds per call under the concurrency settings above.

## Plot: every sample as a heatmap

How to read it:

* Outer row group: the question.
* Inner row: the condition.
* Column: one full rubric call.
* Cell color: red is a higher P(yes), green is lower. For the risk questions, a red cell
  is one the rubric flagged.

`typesafe_noul` varies most on `covered` (`0.43` to `0.53`) and `exclusion` (`0.53` to
`0.62`). Some LLM rows vary at temperature `0` too. Conditions disagree on judgment calls.

[Code example: see complete pages/cookbooks/consistency_noul_cookbook.md]

<img alt="output" />

The factual checks hold steady across most conditions. The judgment-heavy ones are where
the LLM rows move: `exclusion`, `rental_eligible`, `fraud_flag`, and `manual_review` shift
across samples or disagree across models. TypeSafe's `covered` row crosses `0.5`; its
other 13 questions stay on one side of that threshold throughout this run.

## Allow an uncertain decision instead of forcing yes or no

With a threshold of `0.5`, probabilities `0.49` and `0.51` cause opposite actions even
though both express substantial uncertainty. The application can instead return:

* `no` below `0.30`;
* `uncertain` from `0.30` through `0.70`, including both boundaries;
* `yes` above `0.70`.

Uncertain cases go to a human. The escalation is application logic over the returned
probability: no new question, no second API call. The band is illustrative; it is neither
a calibrated guarantee nor an optimized threshold. Set production boundaries from labeled
examples and from the cost of incorrect decisions and of review.

The illustration below applies this band to the recorded TypeSafe probabilities.

[Code example: see complete pages/cookbooks/consistency_noul_cookbook.md]

<img alt="output" />

A review band absorbs fluctuation around `0.5` without issuing opposite automatic
actions. It has edges of its own, though. A value near either outer boundary can still
move between `uncertain` and yes or no. The model is no more deterministic for it, and
an automatic decision that clears the band is not shown to be correct.

## Open it in the TypeSafe playground

The link below opens the same claim and rubric in the playground: one claim, the same 14
`Noul` questions, and TypeSafe `jev-latest`. It omits the changing `uid` field used above.

[Code example: see complete pages/cookbooks/consistency_noul_cookbook.md]

<a href="[long playground URL saved in original]">Open this claim + rubric in the TypeSafe playground →</a>


