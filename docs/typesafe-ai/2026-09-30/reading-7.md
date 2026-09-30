# Type Alias: Question
Source: https://docs.typesafe.ai/sdk/javascript/api/type-aliases/Question



[Code example: see complete pages/sdk/javascript/api/type-aliases/Question.md]

A question identified by its `type` field.




# Type Alias: ResultFor<T>
Source: https://docs.typesafe.ai/sdk/javascript/api/type-aliases/ResultFor



[Code example: see complete pages/sdk/javascript/api/type-aliases/ResultFor.md]

The answer type for a question, preserving its criteria keys.

## Type Parameters

### T

`T` *extends* [`Question`](/sdk/javascript/api/type-aliases/Question)




# Type Alias: ScoreCriteria
Source: https://docs.typesafe.ai/sdk/javascript/api/type-aliases/ScoreCriteria



[Code example: see complete pages/sdk/javascript/api/type-aliases/ScoreCriteria.md]

At least two descriptions indexed by score from zero; `null` leaves a score undescribed.




# Type Alias: ScoreLegend<T>
Source: https://docs.typesafe.ai/sdk/javascript/api/type-aliases/ScoreLegend



[Code example: see complete pages/sdk/javascript/api/type-aliases/ScoreLegend.md]

Rubric descriptions keyed by score.

## Type Parameters

### T

`T` *extends* [`ScoreCriteria`](/sdk/javascript/api/type-aliases/ScoreCriteria)




# Type Alias: ScoreOf<T>
Source: https://docs.typesafe.ai/sdk/javascript/api/type-aliases/ScoreOf



[Code example: see complete pages/sdk/javascript/api/type-aliases/ScoreOf.md]

Score keys inferred from the rubric; a fixed-length tuple yields its indices, otherwise `number`.

## Type Parameters

### T

`T` *extends* [`ScoreCriteria`](/sdk/javascript/api/type-aliases/ScoreCriteria)




# Variable: ENV
Source: https://docs.typesafe.ai/sdk/javascript/api/variables/ENV



[Code example: see complete pages/sdk/javascript/api/variables/ENV.md]

Environment variable names for client configuration. Explicit options take precedence.

## Type Declaration

### apiKey

[Code example: see complete pages/sdk/javascript/api/variables/ENV.md]

Required API key; used when `apiKey` is omitted.

### baseURL

[Code example: see complete pages/sdk/javascript/api/variables/ENV.md]

API root; defaults to `https://api.typesafe.ai`.

### defaultModel

[Code example: see complete pages/sdk/javascript/api/variables/ENV.md]

Default model name; defaults to `jev-latest`.

### logLevel

[Code example: see complete pages/sdk/javascript/api/variables/ENV.md]

Log level; defaults to `warn`.




# Variable: LOG_LEVELS
Source: https://docs.typesafe.ai/sdk/javascript/api/variables/LOG_LEVELS



[Code example: see complete pages/sdk/javascript/api/variables/LOG_LEVELS.md]

Supported log levels, from most to least verbose.




# Variable: VERSION
Source: https://docs.typesafe.ai/sdk/javascript/api/variables/VERSION



[Code example: see complete pages/sdk/javascript/api/variables/VERSION.md]




# Changelog
Source: https://docs.typesafe.ai/sdk/javascript/changelog



## v0.6.0 (2026-09-15)

### Breaking changes

* accept `Score.criteria` as an ordered sequence instead of a dictionary keyed by integers

## v0.5.7 (2026-09-11)

This is the initial public release of TypeSafe JavaScript and TypeScript SDK. Learn more in the [documentation](https://docs.typesafe.ai/sdk/javascript).




# TypeSafe Python SDK
Source: https://docs.typesafe.ai/sdk/python

Install the TypeSafe Python SDK and get started with asynchronous or synchronous API calls.

Browse the [Python SDK source on GitHub](https://github.com/typesafe-ai/typesafe-sdk-python).

Asynchronous and synchronous Python clients for the [TypeSafe](https://typesafe.ai) API. Learn how to use TypeSafe [here](https://docs.typesafe.ai/).

## Quickstart

1. Install the SDK:

   <Tabs>
     <Tab title="uv">
[Code example: see complete pages/sdk/python.md]
     </Tab>

     <Tab title="pip">
[Code example: see complete pages/sdk/python.md]
     </Tab>
   </Tabs>

   Add the `http2` extra (`typesafe-sdk[http2]`) to enable [HTTP/2 support](/sdk/python/usage#http2).
2. Set `TYPESAFE_API_KEY` in your environment (create it [here](https://console.typesafe.ai/))
3. Call the System One API:

   <Tabs>
     <Tab title="Async">
       With [AsyncTypeSafeClient](/sdk/python/api/clients/async):

[Code example: see complete pages/sdk/python.md]
     </Tab>

     <Tab title="Sync">
       With [TypeSafeClient](/sdk/python/api/clients/sync):

[Code example: see complete pages/sdk/python.md]
     </Tab>
   </Tabs>

## What's next

Visit the [Usage guide](/sdk/python/usage) to learn more about patterns such as [typed responses](/sdk/python/usage#typed-system_one-responses), [model selection](/sdk/python/usage#choosing-a-model), [retries](/sdk/python/usage#retries), [HTTP/2](/sdk/python/usage#http2), or [error handling](/sdk/python/usage#error-handling).




# API reference
Source: https://docs.typesafe.ai/sdk/python/api

Python clients for the TypeSafe AI API

* [Sync client](/sdk/python/api/clients/sync)
* [Async client](/sdk/python/api/clients/async)
* Types: [Common](/sdk/python/api/types/common) · [Questions](/sdk/python/api/types/questions) · [Responses](/sdk/python/api/types/responses)
* [Retries](/sdk/python/api/retries)
* [Exceptions](/sdk/python/api/exceptions)
* [Constants](/sdk/python/api/constants)




# Asynchronous client
Source: https://docs.typesafe.ai/sdk/python/api/clients/async

Use AsyncTypeSafeClient to ask questions, list models, and configure asynchronous TypeSafe API requests.

## typesafe\_sdk.AsyncTypeSafeClient

Create an asynchronous HTTP client for [TypeSafe AI API](https://typesafe.ai).

Explicit options take precedence over environment variables; empty or whitespace-only environment values are ignored.

<Tip>
  **Logging setup**

  The SDK logs to the `typesafe_sdk` logger; configure it through standard logging, or set `TYPESAFE_LOG_LEVEL` (`debug`, `info`, ...) for a quick default. Secret headers are redacted from log output; request and response bodies are not.
</Tip>

Parameters:

* **`api_key`** (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a> | None</code>, default: `None` ) –

  Required API key; may be set via the `TYPESAFE_API_KEY` environment variable. Leading and trailing whitespace is stripped. Empty keys, internal whitespace, control characters, and non-ASCII characters are rejected.
* **`model`** (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a> | None</code>, default: `None` ) –

  Model name; may be set via the `TYPESAFE_DEFAULT_MODEL` environment variable.
* **`retry`** (<code><a href="/sdk/python/api/retries#typesafe_sdk.RetryPolicy">RetryPolicy</a> | None</code>, default: `None` ) –

  A `RetryPolicy` controlling retry behavior; see `RetryPolicy` for the available options and their defaults. Pass `RetryPolicy(max_retries=0)` to disable retries.
* **`timeout`** (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a> | httpx2.Timeout | None</code>, default: `None` ) –

  Timeout for HTTP operations. Inherits `http_client.timeout` when supplied, otherwise the SDK default.
* **`headers`** (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>] | None</code>, default: `None` ) –

  Additional request headers to set.
* **`transport`** (`httpx2.AsyncBaseTransport | None`, default: `None` ) –

  Optional custom HTTP transport, closed when this SDK client closes.
* **`http_client`** (<code>httpx2.<a href="https://pydantic.dev/docs/httpx2/api/api/#httpx2.AsyncClient">AsyncClient</a> | None</code>, default: `None` ) –

  Optional `httpx2.AsyncClient`; mutually exclusive with `transport`. Closed when this SDK client closes.
* **`base_url`** (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a> | None</code>, default: `None` ) –

  API root; may be set via the `TYPESAFE_BASE_URL` environment variable.

Raises:

* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeError">TypeSafeError</a></code> –

  The API key is missing or invalid, or the timeout is invalid.
* <code><a href="https://docs.python.org/3/builtins/exceptions.html#ValueError">ValueError</a></code> –

  Both `transport` and `http_client` are supplied.

Examples:

[Code example: see complete pages/sdk/python/api/clients/async.md]

### models

`cached` `property`

An accessor for the Models API resource.

Examples:

[Code example: see complete pages/sdk/python/api/clients/async.md]

### system\_one

`async`

Answer named questions about text or structured state.

See [System One](https://docs.typesafe.ai/concepts/system-one) for details.

Parameters:

* **`state`** (<code><a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">JSONContent</a></code>) –

  Text, a JSON object, or an array to evaluate. See [state](https://docs.typesafe.ai/concepts/state) for details.
* **`questions`** (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="/sdk/python/api/types/questions#typesafe_sdk.Question">Question</a>]</code>) –

  Nonempty mapping of names to question objects or raw dictionaries.
* **`model`** (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a> | None</code>, default: `None` ) –

  Model override; `None` inherits the client default.
* **`retry`** (<code><a href="/sdk/python/api/retries#typesafe_sdk.RetryPolicy">RetryPolicy</a> | None</code>, default: `None` ) –

  An optional retry policy to override the client-level value for this call only.
* **`timeout`** (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a> | httpx2.Timeout | None</code>, default: `None` ) –

  An optional timeout for http operations to override the client-level value for this call only, in seconds.
* **`extra_headers`** (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>] | None</code>, default: `None` ) –

  Additional request headers to set.
* **`extra_body`** (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="/sdk/python/api/types/common#typesafe_sdk.JSONValue">JSONValue</a> | None] | None</code>, default: `None` ) –

  Additional top-level request-body fields, shallow-merged over the body after `state`, `model`, and `questions` are set. Merging is last-write-wins: a key that collides with `state`, `model`, or `questions` overrides it, and object values are replaced rather than deep-merged.
* **`response_model`** (<code><a href="https://docs.python.org/3/builtins/functions.html#type">type</a>\[ResponseT] | None</code>, default: `None` ) –

  Optional Pydantic `BaseModel` type describing the JSON response body, including any nested answer models.

Returns:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.SystemOneResponse">SystemOneResponse</a> | ResponseT</code> –

  An instance of `response_model`, or `SystemOneResponse` with answers keyed by question
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.SystemOneResponse">SystemOneResponse</a> | ResponseT</code> –

  name and model and token usage details when no custom model is supplied.

Raises:

* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeError">TypeSafeError</a></code> –

  Questions are empty or a score question's criteria list is empty.
* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIError">TypeSafeAPIError</a></code> –

  The server returns an unsuccessful HTTP response after any retries.
* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIConnectionError">TypeSafeAPIConnectionError</a></code> –

  The request cannot connect or times out after any retries.
* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIResponseValidationError">TypeSafeAPIResponseValidationError</a></code> –

  The response body does not match the response model.

Examples:

Create questions with named arguments:

[Code example: see complete pages/sdk/python/api/clients/async.md]

Pass questions as dictionaries:

[Code example: see complete pages/sdk/python/api/clients/async.md]

### aclose

`async`

[Code example: see complete pages/sdk/python/api/clients/async.md]

Release network resources and close the underlying HTTP client, including a supplied one.

## Models resource

Reached through [`AsyncTypeSafeClient.models`](/sdk/python/api/clients/async#typesafe_sdk.AsyncTypeSafeClient.models).

### typesafe\_sdk.AsyncModels

Access to the models available to the account, reached through `AsyncTypeSafeClient.models`.

#### list

`async`

List the models available to the account.

Parameters:

* **`retry`** (<code><a href="/sdk/python/api/retries#typesafe_sdk.RetryPolicy">RetryPolicy</a> | None</code>, default: `None` ) –

  An optional retry policy to override the client-level value for this call only.
* **`timeout`** (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a> | httpx2.Timeout | None</code>, default: `None` ) –

  Per-operation timeout override; `None` inherits the client setting.
* **`extra_headers`** (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>] | None</code>, default: `None` ) –

  Overrides for additional request headers; authentication, SDK identification, and `Accept` remain protected.

Returns:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ListModelsResponse">ListModelsResponse</a></code> –

  A `ListModelsResponse` whose `models` holds each model's name, description,
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ListModelsResponse">ListModelsResponse</a></code> –

  and release date.

Raises:

* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIError">TypeSafeAPIError</a></code> –

  The server returns an unsuccessful HTTP response after any retries.
* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIConnectionError">TypeSafeAPIConnectionError</a></code> –

  The request cannot connect or times out after any retries.

Examples:

[Code example: see complete pages/sdk/python/api/clients/async.md]




# Synchronous client
Source: https://docs.typesafe.ai/sdk/python/api/clients/sync

Use TypeSafeClient to ask questions, list models, and configure synchronous TypeSafe API requests.

## typesafe\_sdk.TypeSafeClient

Create an HTTP client for [TypeSafe AI API](https://typesafe.ai).

Explicit options take precedence over environment variables; empty or whitespace-only environment values are ignored.

<Tip>
  **Logging setup**

  The SDK logs to the `typesafe_sdk` logger; configure it through standard logging, or set `TYPESAFE_LOG_LEVEL` (`debug`, `info`, ...) for a quick default. Secret headers are redacted from log output; request and response bodies are not.
</Tip>

Parameters:

* **`api_key`** (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a> | None</code>, default: `None` ) –

  Required API key; may be set via the `TYPESAFE_API_KEY` environment variable. Leading and trailing whitespace is stripped. Empty keys, internal whitespace, control characters, and non-ASCII characters are rejected.
* **`model`** (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a> | None</code>, default: `None` ) –

  Model name; may be set via the `TYPESAFE_DEFAULT_MODEL` environment variable.
* **`retry`** (<code><a href="/sdk/python/api/retries#typesafe_sdk.RetryPolicy">RetryPolicy</a> | None</code>, default: `None` ) –

  A `RetryPolicy` controlling retry behavior; see `RetryPolicy` for the available options and their defaults. Pass `RetryPolicy(max_retries=0)` to disable retries.
* **`timeout`** (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a> | httpx2.Timeout | None</code>, default: `None` ) –

  Timeout for HTTP operations. Inherits `http_client.timeout` when supplied, otherwise the SDK default.
* **`headers`** (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>] | None</code>, default: `None` ) –

  Additional request headers to set.
* **`transport`** (`httpx2.BaseTransport | None`, default: `None` ) –

  Optional custom HTTP transport, closed when this SDK client closes.
* **`http_client`** (<code>httpx2.<a href="https://pydantic.dev/docs/httpx2/api/api/#httpx2.Client">Client</a> | None</code>, default: `None` ) –

  Optional `httpx2.Client`; mutually exclusive with `transport`. Closed when this SDK client closes.
* **`base_url`** (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a> | None</code>, default: `None` ) –

  API root; may be set via the `TYPESAFE_BASE_URL` environment variable.

Raises:

* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeError">TypeSafeError</a></code> –

  The API key is missing or invalid, or the timeout is invalid.
* <code><a href="https://docs.python.org/3/builtins/exceptions.html#ValueError">ValueError</a></code> –

  Both `transport` and `http_client` are supplied.

Examples:

[Code example: see complete pages/sdk/python/api/clients/sync.md]

### models

`cached` `property`

An accessor for the Models API resource.

Examples:

[Code example: see complete pages/sdk/python/api/clients/sync.md]

### system\_one

Answer named questions about text or structured state.

See [System One](https://docs.typesafe.ai/concepts/system-one) for details.

Parameters:

* **`state`** (<code><a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">JSONContent</a></code>) –

  Text, a JSON object, or an array to evaluate. See [state](https://docs.typesafe.ai/concepts/state) for details.
* **`questions`** (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="/sdk/python/api/types/questions#typesafe_sdk.Question">Question</a>]</code>) –

  Nonempty mapping of names to question objects or raw dictionaries.
* **`model`** (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a> | None</code>, default: `None` ) –

  Model override; `None` inherits the client default.
* **`retry`** (<code><a href="/sdk/python/api/retries#typesafe_sdk.RetryPolicy">RetryPolicy</a> | None</code>, default: `None` ) –

  An optional retry policy to override the client-level value for this call only.
* **`timeout`** (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a> | httpx2.Timeout | None</code>, default: `None` ) –

  An optional timeout for http operations to override the client-level value for this call only, in seconds.
* **`extra_headers`** (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>] | None</code>, default: `None` ) –

  Additional request headers to set.
* **`extra_body`** (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="/sdk/python/api/types/common#typesafe_sdk.JSONValue">JSONValue</a> | None] | None</code>, default: `None` ) –

  Additional top-level request-body fields, shallow-merged over the body after `state`, `model`, and `questions` are set. Merging is last-write-wins: a key that collides with `state`, `model`, or `questions` overrides it, and object values are replaced rather than deep-merged.
* **`response_model`** (<code><a href="https://docs.python.org/3/builtins/functions.html#type">type</a>\[ResponseT] | None</code>, default: `None` ) –

  Optional Pydantic `BaseModel` type describing the JSON response body, including any nested answer models.

Returns:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.SystemOneResponse">SystemOneResponse</a> | ResponseT</code> –

  An instance of `response_model`, or `SystemOneResponse` with answers keyed by question
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.SystemOneResponse">SystemOneResponse</a> | ResponseT</code> –

  name and model and token usage details when no custom model is supplied.

Raises:

* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeError">TypeSafeError</a></code> –

  Questions are empty or a score question's criteria list is empty.
* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIError">TypeSafeAPIError</a></code> –

  The server returns an unsuccessful HTTP response after any retries.
* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIConnectionError">TypeSafeAPIConnectionError</a></code> –

  The request cannot connect or times out after any retries.
* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIResponseValidationError">TypeSafeAPIResponseValidationError</a></code> –

  The response body does not match the response model.

Examples:

Create questions with named arguments:

[Code example: see complete pages/sdk/python/api/clients/sync.md]

Pass questions as dictionaries:

[Code example: see complete pages/sdk/python/api/clients/sync.md]

### close

[Code example: see complete pages/sdk/python/api/clients/sync.md]

Release network resources and close the underlying HTTP client, including a supplied one.

## Models resource

Reached through [`TypeSafeClient.models`](/sdk/python/api/clients/sync#typesafe_sdk.TypeSafeClient.models).

### typesafe\_sdk.Models

Access to the models available to the account, reached through `TypeSafeClient.models`.

#### list

List the models available to the account.

Parameters:

* **`retry`** (<code><a href="/sdk/python/api/retries#typesafe_sdk.RetryPolicy">RetryPolicy</a> | None</code>, default: `None` ) –

  An optional retry policy to override the client-level value for this call only.
* **`timeout`** (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a> | httpx2.Timeout | None</code>, default: `None` ) –

  Per-operation timeout override; `None` inherits the client setting.
* **`extra_headers`** (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>] | None</code>, default: `None` ) –

  Overrides for additional request headers; authentication, SDK identification, and `Accept` remain protected.

Returns:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ListModelsResponse">ListModelsResponse</a></code> –

  A `ListModelsResponse` whose `models` holds each model's name, description,
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ListModelsResponse">ListModelsResponse</a></code> –

  and release date.

Raises:

* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIError">TypeSafeAPIError</a></code> –

  The server returns an unsuccessful HTTP response after any retries.
* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIConnectionError">TypeSafeAPIConnectionError</a></code> –

  The request cannot connect or times out after any retries.

Examples:

[Code example: see complete pages/sdk/python/api/clients/sync.md]




# Constants
Source: https://docs.typesafe.ai/sdk/python/api/constants

Default settings and environment variable names for the TypeSafe Python SDK.

## typesafe\_sdk.constants

Public environment-variable names and client defaults.

### API\_KEY\_ENV

`module-attribute`

[Code example: see complete pages/sdk/python/api/constants.md]

Environment variable for the API key.

### BASE\_URL\_ENV

`module-attribute`

[Code example: see complete pages/sdk/python/api/constants.md]

Environment variable for the API base URL.

### DEFAULT\_MODEL\_ENV

`module-attribute`

[Code example: see complete pages/sdk/python/api/constants.md]

Environment variable for the default model.

### LOG\_LEVEL\_ENV

`module-attribute`

[Code example: see complete pages/sdk/python/api/constants.md]

Environment variable for the logging level.

### DEFAULT\_BASE\_URL

`module-attribute`

[Code example: see complete pages/sdk/python/api/constants.md]

Default API base URL.

### DEFAULT\_MODEL

`module-attribute`

[Code example: see complete pages/sdk/python/api/constants.md]

Default model name.

### DEFAULT\_TIMEOUT

`module-attribute`

[Code example: see complete pages/sdk/python/api/constants.md]

Default timeout in seconds for each HTTP operation.




# Exceptions
Source: https://docs.typesafe.ai/sdk/python/api/exceptions

Handle TypeSafe API errors, rate limits, connection failures, and timeouts.

## Base exception

## typesafe\_sdk.TypeSafeError

Bases: <code><a href="https://docs.python.org/3/builtins/exceptions.html#Exception">Exception</a></code>

Base exception for SDK failures.

## HTTP errors

## typesafe\_sdk.TypeSafeAPIError

Bases: <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeError">TypeSafeError</a></code>

An unsuccessful HTTP response with its body and request metadata.

### status

`instance-attribute`

[Code example: see complete pages/sdk/python/api/exceptions.md]

HTTP response status code.

### body

`instance-attribute`

[Code example: see complete pages/sdk/python/api/exceptions.md]

The server's JSON error body, plain response text, or `None` for an empty body.

### headers

`instance-attribute`

[Code example: see complete pages/sdk/python/api/exceptions.md]

HTTP response headers.

### endpoint

`instance-attribute`

[Code example: see complete pages/sdk/python/api/exceptions.md]

The request method and URL, without credentials, query parameters, or fragment, when available.

### request\_id

`property`

The `x-typesafe-request-id` response header, or `None` if absent.

## typesafe\_sdk.TypeSafeBadRequestError

Bases: <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIError">TypeSafeAPIError</a></code>

The request was invalid (400).

## typesafe\_sdk.TypeSafeAuthenticationError

Bases: <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIError">TypeSafeAPIError</a></code>

Authentication failed (401).

## typesafe\_sdk.TypeSafePermissionDeniedError

Bases: <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIError">TypeSafeAPIError</a></code>

Access was denied (403).

## typesafe\_sdk.TypeSafeNotFoundError

Bases: <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIError">TypeSafeAPIError</a></code>

The resource was not found (404).

## typesafe\_sdk.TypeSafeUnprocessableEntityError

Bases: <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIError">TypeSafeAPIError</a></code>

The request failed server validation (422).

## typesafe\_sdk.TypeSafeRateLimitError

Bases: <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIError">TypeSafeAPIError</a></code>

The rate limit was exceeded (429).

### retry\_after\_ms

`instance-attribute`

[Code example: see complete pages/sdk/python/api/exceptions.md]

The server's requested wait in milliseconds, or `None` if unavailable.

## typesafe\_sdk.TypeSafeInternalServerError

Bases: <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIError">TypeSafeAPIError</a></code>

The server failed to process the request (5xx).

## Connection errors

## typesafe\_sdk.TypeSafeAPIConnectionError

Bases: <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeError">TypeSafeError</a></code>, <code><a href="https://docs.python.org/3/builtins/exceptions.html#ConnectionError">ConnectionError</a></code>

A request failed without an HTTP response.

## typesafe\_sdk.TypeSafeAPITimeoutError

Bases: <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIConnectionError">TypeSafeAPIConnectionError</a></code>, <code><a href="https://docs.python.org/3/builtins/exceptions.html#TimeoutError">TimeoutError</a></code>

A request exceeded its configured timeout.

### timeout

`instance-attribute`

[Code example: see complete pages/sdk/python/api/exceptions.md]

The timeout setting used for the request, in seconds or as an `httpx2.Timeout`.

## Response validation

## typesafe\_sdk.TypeSafeAPIResponseValidationError

Bases: <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIError">TypeSafeAPIError</a></code>

A successful HTTP response whose body was missing or structurally invalid required data.

### field\_path

`instance-attribute`

[Code example: see complete pages/sdk/python/api/exceptions.md]

Dotted path to the offending field, such as `answers.tone.confidence`.

### args

`instance-attribute`

[Code example: see complete pages/sdk/python/api/exceptions.md]


