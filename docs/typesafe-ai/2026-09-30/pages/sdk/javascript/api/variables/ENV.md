# Variable: ENV
Source: https://docs.typesafe.ai/sdk/javascript/api/variables/ENV



```ts theme={null}
const ENV: object;
```

Environment variable names for client configuration. Explicit options take precedence.

## Type Declaration

### apiKey

```ts theme={null}
readonly apiKey: "TYPESAFE_API_KEY" = "TYPESAFE_API_KEY";
```

Required API key; used when `apiKey` is omitted.

### baseURL

```ts theme={null}
readonly baseURL: "TYPESAFE_BASE_URL" = "TYPESAFE_BASE_URL";
```

API root; defaults to `https://api.typesafe.ai`.

### defaultModel

```ts theme={null}
readonly defaultModel: "TYPESAFE_DEFAULT_MODEL" = "TYPESAFE_DEFAULT_MODEL";
```

Default model name; defaults to `jev-latest`.

### logLevel

```ts theme={null}
readonly logLevel: "TYPESAFE_LOG_LEVEL" = "TYPESAFE_LOG_LEVEL";
```

Log level; defaults to `warn`.


