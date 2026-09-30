# Interface: TypeSafeClientConfig
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/TypeSafeClientConfig



Client options. Explicit values take precedence over environment variables, then SDK defaults.

## Properties

### apiKey?

```ts theme={null}
optional apiKey?: string;
```

Required API key; falls back to `TYPESAFE_API_KEY`.

***

### baseURL?

```ts theme={null}
optional baseURL?: string;
```

API root; falls back to `TYPESAFE_BASE_URL`, then `https://api.typesafe.ai`.

***

### dangerouslyAllowBrowser?

```ts theme={null}
optional dangerouslyAllowBrowser?: boolean;
```

Allow browser use, exposing the API key to page users. Default: false.

***

### defaultHeaders?

```ts theme={null}
optional defaultHeaders?: Record<string, string>;
```

Additional request headers; per-call headers take precedence.

***

### defaultModel?

```ts theme={null}
optional defaultModel?: string;
```

Default model; falls back to `TYPESAFE_DEFAULT_MODEL`, then `jev-latest`.

***

### fetch?

```ts theme={null}
optional fetch?: Fetch;
```

Custom HTTP fetch implementation for transport configuration or tests. Default: global `fetch`.

***

### logger?

```ts theme={null}
optional logger?: Logger;
```

Logger filtered to `logLevel` and above. Default: prefixed `console`.

***

### logLevel?

```ts theme={null}
optional logLevel?: LogLevel;
```

Log level; falls back to `TYPESAFE_LOG_LEVEL`, then `warn`.
`info` logs request summaries; `debug` adds headers and bodies.
Known credential headers are redacted; bodies are not.

***

### retry?

```ts theme={null}
optional retry?: Partial<RetryPolicy>;
```

Retry overrides; omitted fields use the defaults in `RetryPolicy`.

***

### timeout?

```ts theme={null}
optional timeout?: number;
```

Timeout per attempt in milliseconds, without a total retry budget. Default: 10000.


