# Interface: RetryPolicy
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/RetryPolicy



Retry configuration. Partial overrides inherit unset fields from the client or SDK defaults.

## Properties

### apiConnectionError

```ts theme={null}
readonly apiConnectionError: boolean;
```

Retry connection failures, including interrupted response bodies (`APIConnectionError`). Default: true.

***

### apiTimeoutError

```ts theme={null}
readonly apiTimeoutError: boolean;
```

Whether to retry `APITimeoutError`. Default: true.

***

### backoffInitialMs

```ts theme={null}
readonly backoffInitialMs: number;
```

First backoff delay in milliseconds, doubled up to `backoffMaxMs`. Default: 500.

***

### backoffJitter

```ts theme={null}
readonly backoffJitter: number;
```

Fraction of each backoff delay randomly subtracted, from 0 to 1. Default: 0.25.

***

### backoffMaxMs

```ts theme={null}
readonly backoffMaxMs: number;
```

Maximum backoff delay in milliseconds. Default: 5000.

***

### httpStatuses

```ts theme={null}
readonly httpStatuses: ReadonlySet<number>;
```

HTTP status codes to retry. Default: 408, 429, and 500–599.

***

### maxRetries

```ts theme={null}
readonly maxRetries: number;
```

Maximum retries after the initial attempt; `0` disables retries. Default: 2.

***

### maxRetryAfterMs

```ts theme={null}
readonly maxRetryAfterMs: number;
```

Maximum server retry delay in milliseconds; longer delays use backoff. Default: 60000.

***

### respectRetryAfter

```ts theme={null}
readonly respectRetryAfter: boolean;
```

Honor `Retry-After` and `retry-after-ms` up to `maxRetryAfterMs`. Default: true.


