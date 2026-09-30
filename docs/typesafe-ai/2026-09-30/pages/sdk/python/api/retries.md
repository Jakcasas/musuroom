# Retries
Source: https://docs.typesafe.ai/sdk/python/api/retries

Configure retries with RetryPolicy — attempt count, retryable statuses, backoff, and retry headers handling.

## typesafe\_sdk.RetryPolicy

`dataclass`

Configuration for SDK retry behavior.

Examples:

```python theme={null}
from typesafe_sdk import RetryPolicy, TypeSafeClient

client = TypeSafeClient(
    retry=RetryPolicy(
        max_retries=3, timeout=10.0, http_statuses={429, 500, 502, 503, 504}
    )
)
```

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


