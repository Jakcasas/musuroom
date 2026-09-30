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

```python theme={null}
from typesafe_sdk import Choice, Noul, TypeSafeClient

with TypeSafeClient() as client:
    result = client.system_one(
        state="I was charged twice. Please help.",
        questions={
            "billing": Noul(instructions="Is this about billing?"),
            "tone": Choice(
                instructions="What is the tone?",
                criteria={"calm": None, "angry": None},
            ),
        },
    )
    assert 0 <= result.nouls["billing"].noul <= 1
    assert result.choices["tone"].choice in {"calm", "angry"}
```

### models

`cached` `property`

An accessor for the Models API resource.

Examples:

```python theme={null}
with TypeSafeClient() as client:
    models = client.models.list()
```

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

```python theme={null}
with TypeSafeClient() as client:
    result = client.system_one(
        state="I was charged twice. Please help.",
        questions={
            "billing": Noul(instructions="Is this about billing?"),
            "tone": Choice(
                instructions="What is the tone?",
                criteria={"calm": None, "angry": None},
            ),
        },
    )
    assert 0 <= result.nouls["billing"].noul <= 1
    assert result.choices["tone"].choice in {"calm", "angry"}
```

Pass questions as dictionaries:

```python theme={null}
with TypeSafeClient() as client:
    result = client.system_one(
        state={"message": "I was charged twice. Please help."},
        questions={
            "billing": {"type": "noul", "instructions": "Is this about billing?"},
            "tone": {
                "type": "choice",
                "instructions": "What is the tone?",
                "criteria": {"calm": None, "angry": None},
            },
        },
    )
    assert 0 <= result.nouls["billing"].noul <= 1
    assert result.choices["tone"].choice in {"calm", "angry"}
```

### close

```python theme={null}
close() -> None
```

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

```python theme={null}
from typesafe_sdk import TypeSafeClient

with TypeSafeClient() as client:
    models = client.models.list()
```


