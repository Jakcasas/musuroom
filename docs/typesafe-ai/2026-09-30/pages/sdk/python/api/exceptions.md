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

```python theme={null}
status = status
```

HTTP response status code.

### body

`instance-attribute`

```python theme={null}
body = body
```

The server's JSON error body, plain response text, or `None` for an empty body.

### headers

`instance-attribute`

```python theme={null}
headers = headers
```

HTTP response headers.

### endpoint

`instance-attribute`

```python theme={null}
endpoint = endpoint
```

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

```python theme={null}
retry_after_ms = parse_retry_after(headers)
```

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

```python theme={null}
timeout = timeout
```

The timeout setting used for the request, in seconds or as an `httpx2.Timeout`.

## Response validation

## typesafe\_sdk.TypeSafeAPIResponseValidationError

Bases: <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIError">TypeSafeAPIError</a></code>

A successful HTTP response whose body was missing or structurally invalid required data.

### field\_path

`instance-attribute`

```python theme={null}
field_path = field_path
```

Dotted path to the offending field, such as `answers.tone.confidence`.

### args

`instance-attribute`

```python theme={null}
args = (
    status,
    body,
    headers,
    field_path,
    endpoint,
)
```


