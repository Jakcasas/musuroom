# Retries
Source: https://docs.typesafe.ai/sdk/python/api/retries

Configure retries with RetryPolicy — attempt count, retryable statuses, backoff, and retry headers handling.

## typesafe\_sdk.RetryPolicy

`dataclass`

Configuration for SDK retry behavior.

Examples:

[Code example: see complete pages/sdk/python/api/retries.md]

### max\_retries

`class-attribute` `instance-attribute`

Maximum retries after the initial attempt; `0` disables retries.

### backoff\_initial

`class-attribute` `instance-attribute`

First backoff delay in seconds, doubled each attempt up to `backoff_max`; zero disables backoff.

### backoff\_max

`class-attribute` `instance-attribute`

Maximum backoff delay in seconds; zero disables backoff.

### backoff\_jitter

`class-attribute` `instance-attribute`

Fraction of each backoff delay randomly subtracted, between 0 and 1.

### http\_statuses

`class-attribute` `instance-attribute`

HTTP status codes that are retried.

### respect\_retry\_after

`class-attribute` `instance-attribute`

Whether to honor `Retry-After` and `retry-after-ms` response headers.

### api\_connection\_error

`class-attribute` `instance-attribute`

Whether to retry `TypeSafeAPIConnectionError`, raised when the request cannot reach or read from the server.

### api\_timeout\_error

`class-attribute` `instance-attribute`

Whether to retry `TypeSafeAPITimeoutError`, raised when the request exceeds its timeout.

### exceptions

`class-attribute` `instance-attribute`

Additional exception types that trigger a retry, on top of the built-in rules.

### predicate

`class-attribute` `instance-attribute`

An optional predicate called with the raised exception; returning `True` triggers a retry in addition to the other rules.

### timeout

`class-attribute` `instance-attribute`

Total retry budget in seconds per SDK call, including the initial attempt and delays; `None` disables the limit.

Stops before a retry whose delay would reach or exceed the budget, re-raising the last error.




# Common types
Source: https://docs.typesafe.ai/sdk/python/api/types/common

Common types for TypeSafe API SDK.

## typesafe\_sdk.JSONValue

`module-attribute`

A JSON-like value. May be nested and contain `None`.

## typesafe\_sdk.JSONContent

`module-attribute`

Either a plain string or a mapping/sequence of [`JSONValue`](/sdk/python/api/types/common#typesafe_sdk.JSONValue) entries.




# Questions
Source: https://docs.typesafe.ai/sdk/python/api/types/questions

Provide state and ask yes/no, choice, and score questions using objects or dictionaries.

## State

`state` is the text or JSON object you want to ask questions about. It cannot be `None`, but values inside an object may be `None`.

## Question objects

Use `Noul`, `Choice`, and `Score` to define questions with named arguments.

## typesafe\_sdk.NoulCriteria

Bases: <code><a href="https://typing-extensions.readthedocs.io/en/latest/index.html#typing_extensions.TypedDict">TypedDict</a></code>

Optional descriptions of the yes and no outcomes.

See the [noul primitive](https://docs.typesafe.ai/primitives/noul) for details.

### true

`instance-attribute`

Description of the yes outcome as text, a JSON object, or an array; `None` leaves it undescribed.

### false

`instance-attribute`

Description of the no outcome as text, a JSON object, or an array; `None` leaves it undescribed.

## typesafe\_sdk.Noul

`pydantic-model`

Bases: `_Question`, `wire.NoulQuestion`

A yes/no question with optional descriptions for either outcome.

See the [noul primitive](https://docs.typesafe.ai/primitives/noul) for details.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
[Code example: see complete pages/sdk/python/api/types/questions.md]
  </Accordion>
</Note>

Fields:

* `type` (<code><a href="https://docs.python.org/3/library/typing.html#typing.Literal">Literal</a>\['noul']</code>)
* <code><a href="/sdk/python/api/types/questions#typesafe_sdk.Noul.instructions">instructions</a></code> (<code><a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">JSONContent</a> | None</code>)
* <code><a href="/sdk/python/api/types/questions#typesafe_sdk.Noul.criteria">criteria</a></code> (<code><a href="/sdk/python/api/types/questions#typesafe_sdk.NoulCriteria">NoulCriteria</a> | None</code>)

### instructions

`pydantic-field`

The question to ask, expressed as text, a JSON object, or an array; optional.

### criteria

`pydantic-field`

Optional descriptions of the yes and no outcomes.

## typesafe\_sdk.Choice

`pydantic-model`

Bases: `_Question`, `wire.ChoiceQuestion`

A question that selects between named alternatives.

See the [choice primitive](https://docs.typesafe.ai/primitives/choice) for details.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
[Code example: see complete pages/sdk/python/api/types/questions.md]
  </Accordion>
</Note>

Fields:

* `type` (<code><a href="https://docs.python.org/3/library/typing.html#typing.Literal">Literal</a>\['choice']</code>)
* <code><a href="/sdk/python/api/types/questions#typesafe_sdk.Choice.criteria">criteria</a></code> (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">JSONContent</a> | None]</code>)
* <code><a href="/sdk/python/api/types/questions#typesafe_sdk.Choice.instructions">instructions</a></code> (<code><a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">JSONContent</a> | None</code>)

### criteria

`pydantic-field`

Labels mapped to text, object, or array descriptions, or `None` for undescribed labels.

### instructions

`pydantic-field`

The question to ask, expressed as text, a JSON object, or an array; optional.

## typesafe\_sdk.Score

`pydantic-model`

Bases: `_Question`, `wire.ScoreQuestion`

A question that assigns a score using an ordered rubric.

See the [score primitive](https://docs.typesafe.ai/primitives/score) for details.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
[Code example: see complete pages/sdk/python/api/types/questions.md]
  </Accordion>
</Note>

Fields:

* `type` (<code><a href="https://docs.python.org/3/library/typing.html#typing.Literal">Literal</a>\['score']</code>)
* <code><a href="/sdk/python/api/types/questions#typesafe_sdk.Score.criteria">criteria</a></code> (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Sequence">Sequence</a>\[<a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">JSONContent</a>]</code>)
* <code><a href="/sdk/python/api/types/questions#typesafe_sdk.Score.instructions">instructions</a></code> (<code><a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">JSONContent</a> | None</code>)

### criteria

`pydantic-field`

A nonempty, ordered list of text, object, or array descriptions, one per score from zero.

### instructions

`pydantic-field`

The question to ask, expressed as text, a JSON object, or an array; optional.

## typesafe\_sdk.Question

`module-attribute`

A question object or question dictionary.

## typesafe\_sdk.Questions

`module-attribute`

Question inputs keyed by the names used to identify their answers.

## Question dictionaries

Question dictionaries include a `type` key: `"noul"`, `"choice"`, or `"score"`. You can mix dictionaries and question objects in the same request.

## typesafe\_sdk.NoulModel

Bases: <code><a href="https://typing-extensions.readthedocs.io/en/latest/index.html#typing_extensions.TypedDict">TypedDict</a></code>

A yes/no question dictionary with `type="noul"`.

See the [noul primitive](https://docs.typesafe.ai/primitives/noul) for details.

### type

`instance-attribute`

### instructions

`instance-attribute`

The question to ask, expressed as text, a JSON object, or an array; optional.

### criteria

`instance-attribute`

Optional descriptions of the yes and no outcomes.

## typesafe\_sdk.ChoiceModel

Bases: <code><a href="https://typing-extensions.readthedocs.io/en/latest/index.html#typing_extensions.TypedDict">TypedDict</a></code>

A choice question dictionary with `type="choice"`.

See the [choice primitive](https://docs.typesafe.ai/primitives/choice) for details.

### type

`instance-attribute`

### instructions

`instance-attribute`

The question to ask, expressed as text, a JSON object, or an array; optional.

### criteria

`instance-attribute`

Labels mapped to text, object, or array descriptions, or `None` for undescribed labels.

## typesafe\_sdk.ScoreModel

Bases: <code><a href="https://typing-extensions.readthedocs.io/en/latest/index.html#typing_extensions.TypedDict">TypedDict</a></code>

A score question dictionary with `type="score"`.

See the [score primitive](https://docs.typesafe.ai/primitives/score) for details.

### type

`instance-attribute`

### instructions

`instance-attribute`

The question to ask, expressed as text, a JSON object, or an array; optional.

### criteria

`instance-attribute`

A nonempty, ordered list of text, object, or array descriptions, one per score from zero.

## typesafe\_sdk.QuestionModel

`module-attribute`

A question dictionary identified by its `type` key.




# Answers and responses
Source: https://docs.typesafe.ai/sdk/python/api/types/responses

Read answers, confidence scores, token usage, and available models returned by the TypeSafe API.

## Response

## typesafe\_sdk.SystemOneResponse

`pydantic-model`

Bases: `Response`

Answers grouped by question type with model and usage metadata.

See [System One](https://docs.typesafe.ai/concepts/system-one) for details.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
[Code example: see complete pages/sdk/python/api/types/responses.md]
  </Accordion>
</Note>

Config:

* `extra`: `ignore`
* `frozen`: `True`
* `strict`: `True`

Fields:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.SystemOneResponse.model">model</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a></code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.SystemOneResponse.usage">usage</a></code> (<code><a href="/sdk/python/api/types/responses#typesafe_sdk.Usage">Usage</a></code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.SystemOneResponse.answers">answers</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#dict">dict</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="/sdk/python/api/types/responses#typesafe_sdk.Answer">Answer</a>]</code>)

### request\_id

`cached` `property`

The `x-typesafe-request-id` response header.

### raw\_http\_response

`property`

[Code example: see complete pages/sdk/python/api/types/responses.md]

The underlying `httpx2.Response`, exposing status, headers, and body.

### model\_config

`class-attribute` `instance-attribute`

[Code example: see complete pages/sdk/python/api/types/responses.md]

### model

`pydantic-field`

The model used to answer the request.

### usage

`pydantic-field`

Token usage for the request.

### answers

`pydantic-field`

All answer objects keyed by question name.

### nouls

`cached` `property`

Yes/no answers keyed by question name.

### choices

`cached` `property`

Choice answers keyed by question name.

### scores

`cached` `property`

Score answers keyed by question name.

## typesafe\_sdk.Usage

`pydantic-model`

Bases: `wire.Usage`

Token counts for a request, when reported by the API.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
[Code example: see complete pages/sdk/python/api/types/responses.md]
  </Accordion>
</Note>

Config:

* `extra`: `ignore`
* `frozen`: `True`
* `strict`: `True`

Fields:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.Usage.input_tokens">input\_tokens</a></code> (<code><a href="https://docs.python.org/3/builtins/functions.html#int">int</a> | None</code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.Usage.output_tokens">output\_tokens</a></code> (<code><a href="https://docs.python.org/3/builtins/functions.html#int">int</a> | None</code>)

### model\_config

`class-attribute` `instance-attribute`

[Code example: see complete pages/sdk/python/api/types/responses.md]

### input\_tokens

`pydantic-field`

Number of input tokens used, or `None` when the API did not report it.

### output\_tokens

`pydantic-field`

Number of output tokens used, or `None` when the API did not report it.

## Answers

## typesafe\_sdk.NoulAnswer

`pydantic-model`

Bases: `wire.NoulAnswer`

A yes/no answer.

See the [noul primitive](https://docs.typesafe.ai/primitives/noul) for details.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
[Code example: see complete pages/sdk/python/api/types/responses.md]
  </Accordion>
</Note>

Config:

* `extra`: `ignore`
* `frozen`: `True`
* `strict`: `True`

Fields:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.NoulAnswer.noul">noul</a></code> (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a></code>)
* `type` (<code><a href="https://docs.python.org/3/library/typing.html#typing.Literal">Literal</a>\['noul']</code>)

### noul

`pydantic-field`

Probability of a yes answer or a true statement, from 0 to 1. Values near 1 favor yes or true, values near 0 favor no or false, and values near 0.5 indicate uncertainty.

### model\_config

`class-attribute` `instance-attribute`

[Code example: see complete pages/sdk/python/api/types/responses.md]

## typesafe\_sdk.ChoiceAnswer

`pydantic-model`

Bases: `wire.ChoiceAnswer`

A selected label and its probabilities.

See the [choice primitive](https://docs.typesafe.ai/primitives/choice) for details.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
[Code example: see complete pages/sdk/python/api/types/responses.md]
  </Accordion>
</Note>

Config:

* `extra`: `ignore`
* `frozen`: `True`
* `strict`: `True`

Fields:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ChoiceAnswer.choice">choice</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a></code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ChoiceAnswer.confidence">confidence</a></code> (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a></code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ChoiceAnswer.probabilities">probabilities</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#dict">dict</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="https://docs.python.org/3/builtins/functions.html#float">float</a>]</code>)
* `type` (<code><a href="https://docs.python.org/3/library/typing.html#typing.Literal">Literal</a>\['choice']</code>)

### choice

`pydantic-field`

The name of the choice with the highest probability among the question's criteria.

### confidence

`pydantic-field`

Confidence in the selected choice, from 0 to 1. Higher values indicate greater certainty; use lower values to flag uncertain selections for review.

### probabilities

`pydantic-field`

Probability of each choice in criteria, keyed by choice name, from 0 to 1. Shows how likely the alternatives are; values sum to approximately 1.

### model\_config

`class-attribute` `instance-attribute`

[Code example: see complete pages/sdk/python/api/types/responses.md]

## typesafe\_sdk.ScoreAnswer

`pydantic-model`

Bases: `wire.ScoreAnswer`

An expected score with its rubric and probabilities.

See the [score primitive](https://docs.typesafe.ai/primitives/score) for details.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
[Code example: see complete pages/sdk/python/api/types/responses.md]
  </Accordion>
</Note>

Config:

* `extra`: `ignore`
* `frozen`: `True`
* `strict`: `True`

Fields:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ScoreAnswer.score">score</a></code> (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a></code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ScoreAnswer.confidence">confidence</a></code> (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a></code>)
* `type` (<code><a href="https://docs.python.org/3/library/typing.html#typing.Literal">Literal</a>\['score']</code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ScoreAnswer.legend">legend</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#dict">dict</a>\[<a href="https://docs.python.org/3/builtins/functions.html#int">int</a>, <a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a> | <a href="https://docs.python.org/3/builtins/stdtypes.html#dict">dict</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="https://docs.python.org/3/library/typing.html#typing.Any">Any</a>] | <a href="https://docs.python.org/3/builtins/stdtypes.html#list">list</a>\[<a href="https://docs.python.org/3/library/typing.html#typing.Any">Any</a>]]</code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ScoreAnswer.probabilities">probabilities</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#dict">dict</a>\[<a href="https://docs.python.org/3/builtins/functions.html#int">int</a>, <a href="https://docs.python.org/3/builtins/functions.html#float">float</a>]</code>)

### score

`pydantic-field`

Expected score: the probability-weighted average of the rubric levels. May fall between integer levels.

### confidence

`pydantic-field`

Confidence in the score, from 0 to 1. Higher values indicate greater certainty; use lower values to flag uncertain ratings for review.

### model\_config

`class-attribute` `instance-attribute`

[Code example: see complete pages/sdk/python/api/types/responses.md]

### legend

`pydantic-field`

Rubric descriptions keyed by integer score.

### probabilities

`pydantic-field`

Probabilities keyed by integer score.

## typesafe\_sdk.Answer

`module-attribute`

An answer to a single question, identified by its `type`.

## Available models

## typesafe\_sdk.ListModelsResponse

`pydantic-model`

Bases: `Response`

The models available to the account.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
[Code example: see complete pages/sdk/python/api/types/responses.md]
  </Accordion>
</Note>

Fields:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ListModelsResponse.models">models</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#tuple">tuple</a>\[<a href="/sdk/python/api/types/responses#typesafe_sdk.ModelMetadata">ModelMetadata</a>, ...]</code>)

### request\_id

`cached` `property`

The `x-typesafe-request-id` response header.

### raw\_http\_response

`property`

[Code example: see complete pages/sdk/python/api/types/responses.md]

The underlying `httpx2.Response`, exposing status, headers, and body.

### model\_config

`class-attribute` `instance-attribute`

[Code example: see complete pages/sdk/python/api/types/responses.md]

### models

`pydantic-field`

The available models.

## typesafe\_sdk.ModelMetadata

`pydantic-model`

Bases: `Schema`

Metadata describing a single available model.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
[Code example: see complete pages/sdk/python/api/types/responses.md]
  </Accordion>
</Note>

Fields:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ModelMetadata.name">name</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a></code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ModelMetadata.description">description</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a></code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ModelMetadata.release_date">release\_date</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a></code>)

### name

`pydantic-field`

Model name or alias accepted by a request's model field.

### description

`pydantic-field`

Human-readable description of the model and its capabilities.

### release\_date

`pydantic-field`

Model release date, formatted as YYYY-MM-DD.




# Changelog
Source: https://docs.typesafe.ai/sdk/python/changelog

Python clients for the TypeSafe AI API

## v0.7.2 (2026-09-26)

### Miscellaneous

* add `http2` extra to `typesafe-sdk` package

### Documentation

* document `typesafe-sdk` usage with HTTP/2 support

## v0.7.1 (2026-09-21)

### Bug fixes

* validate the API key early and exclude the value from logged exceptions

### Documentation

* add examples for usage with AI gateways

## v0.7.0 (2026-09-18)

### Breaking Changes

* ser/de library has been changed from `msgspec` to `pydantic`

### Bug fixes

* `str` subclasses are now correctly serialized as strings instead of lists of characters

### Features

* the `system_one` method now accepts a new `response_model` argument that can be set to a desired `pydantic` model for additional *type-safety*

## v0.6.0 (2026-09-15)

### Breaking Changes

* accept `Score.criteria` as an ordered sequence instead of a dictionary keyed by integers

### Features

* improve type annotations on SDK inputs to accept abstract types like `Mapping` and `Sequence`
* improve error messages to include http details and metadata

### Bug fixes

* handle invalid values in `RetryPolicy`
* make exceptions and responses picklable

### Documentation

* link more concepts from main [docs](https://docs.typesafe.ai/)

## v0.5.7 (2026-09-14)

This is the initial public release of TypeSafe Python SDK. Learn more in the [documentation](https://docs.typesafe.ai/sdk/python).




# Usage
Source: https://docs.typesafe.ai/sdk/python/usage

Guides and patterns for working with the TypeSafe Python SDK.

## Calling the System One API

<Tabs>
  <Tab title="Async">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>

  <Tab title="Sync">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>
</Tabs>

## Typed <code>system\_one</code> responses

It is possible to provide a response model to `system_one` to make using the response more *type-safe*:

<Tabs>
  <Tab title="Async">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>

  <Tab title="Sync">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>
</Tabs>

### Custom response types

It is also possible to define a completely new response model without inheriting from `SystemOneResponse`:

<Tabs>
  <Tab title="Async">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>

  <Tab title="Sync">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>
</Tabs>

## Choosing a model

Inspect the available models:

<Tabs>
  <Tab title="Async">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>

  <Tab title="Sync">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>
</Tabs>

Select the model when constructing a client:

<Tabs>
  <Tab title="Async">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>

  <Tab title="Sync">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>
</Tabs>

See the [Models resource reference](/sdk/python/api/clients/sync#models-resource) for details.

## Configuring the base URL

In order to use the SDK with a different API url, set `base_url` on the client or the `TYPESAFE_BASE_URL` environment variable. This requires the alternative API to follow the [TypeSafe OpenAPI spec](https://api.typesafe.ai/docs/).

For example, connect through an AI gateway using its API key and model ID.

<Tabs>
  <Tab title="OpenRouter">
    Use an OpenRouter API key and an [OpenRouter model ID](https://openrouter.ai/~typesafe/jev-latest/):

    <Tabs>
      <Tab title="Async client">
[Code example: see complete pages/sdk/python/usage.md]
      </Tab>

      <Tab title="Sync client">
[Code example: see complete pages/sdk/python/usage.md]
      </Tab>
    </Tabs>
  </Tab>

  <Tab title="Vercel AI Gateway">
    [Vercel's TypeSafe-compatible API](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe) can be used with the SDK:

    <Tabs>
      <Tab title="Async client">
[Code example: see complete pages/sdk/python/usage.md]
      </Tab>

      <Tab title="Sync client">
[Code example: see complete pages/sdk/python/usage.md]
      </Tab>
    </Tabs>
  </Tab>

  <Tab title="Pydantic AI Gateway">
    Use a [Pydantic AI Gateway API key](https://pydantic.dev/articles/jev-pydantic-ai-gateway):

    <Tabs>
      <Tab title="Async client">
[Code example: see complete pages/sdk/python/usage.md]
      </Tab>

      <Tab title="Sync client">
[Code example: see complete pages/sdk/python/usage.md]
      </Tab>
    </Tabs>
  </Tab>
</Tabs>

## HTTP/2

<Tip>
  **Tip**

  It is often beneficial to enable HTTP/2 when sending many concurrent requests, because it allows multiple requests to be multiplexed over a single connection. The `'typesafe-sdk[http2]'` extra provides a convenient way to install the required dependencies. See the [`httpx2` HTTP/2 guide](https://pydantic.dev/docs/httpx2/guides/http2/) for details.
</Tip>

<Tabs>
  <Tab title="Async">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>

  <Tab title="Sync">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>
</Tabs>

## Retries

Pass a custom [`RetryPolicy`](/sdk/python/api/retries) as `retry` on the client or per call. Invalid API keys raise `TypeSafeError` during client creation, before any request or retry.

On the client:

<Tabs>
  <Tab title="Async">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>

  <Tab title="Sync">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>
</Tabs>

Per call:

<Tabs>
  <Tab title="Async">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>

  <Tab title="Sync">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>
</Tabs>

## Error handling

Handle [exceptions](/sdk/python/api/exceptions) raised by the SDK:

<Tabs>
  <Tab title="Async">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>

  <Tab title="Sync">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>
</Tabs>

## Logging

The SDK logs to the `typesafe_sdk` logger. Configure it according to [standard logging](https://docs.python.org/3/library/logging.html) guide:

[Code example: see complete pages/sdk/python/usage.md]

Or set `TYPESAFE_LOG_LEVEL` to one of `debug`, `info`, `warning`, `error`, or `off` before importing the SDK.

`info` logs one summary line per request; `debug` also logs request and response headers and bodies. Secret headers — authorization, API keys, cookies, and any header whose name contains `token` or `secret` — are redacted from log output. Request and response bodies are **not** redacted.

## Environment variables

The SDK reads and uses the following environment variables:

| Variable                 | Configures                                          | Default                   |
| ------------------------ | --------------------------------------------------- | ------------------------- |
| `TYPESAFE_API_KEY`       | API key (required)                                  | —                         |
| `TYPESAFE_BASE_URL`      | API root URL                                        | `https://api.typesafe.ai` |
| `TYPESAFE_DEFAULT_MODEL` | Default model                                       | `jev-latest`              |
| `TYPESAFE_LOG_LEVEL`     | `typesafe_sdk` logger level, applied once at import | unset                     |

See the [constants reference](/sdk/python/api/constants) for SDK defaults.

API keys supplied through `api_key` or `TYPESAFE_API_KEY` have leading and trailing whitespace stripped, including newlines from key files. Empty keys, internal whitespace, control characters, and non-ASCII characters are rejected before sending a request. An explicitly empty key does not fall back to the environment.

## Forward compatibility

The SDK keeps working as the TypeSafe API evolves, so you can adopt new API features before an SDK release adds first-class support for them.

### Extra request fields

Send additional API request fields with [`extra_body`](/sdk/python/api/clients/sync). The `beam_width` field below is illustrative; only send fields supported by the API.

<Tabs>
  <Tab title="Async">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>

  <Tab title="Sync">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>
</Tabs>

### Raw question dictionaries

<Tabs>
  <Tab title="Async">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>

  <Tab title="Sync">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>
</Tabs>

<Tip>
  **Tip**

  Unknown fields are a forward-compatibility escape hatch. Ignore their type-checking errors and prefer upgrading the SDK instead.
</Tip>

### Unknown answer kinds

The SDK logs a warning and skips unrecognized answer kinds. Use `raw_http_response` to inspect the complete API response, including those answers:

<Tabs>
  <Tab title="Async">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>

  <Tab title="Sync">
[Code example: see complete pages/sdk/python/usage.md]
  </Tab>
</Tabs>

### Unknown response fields

Unknown extra fields on recognized responses are ignored.


