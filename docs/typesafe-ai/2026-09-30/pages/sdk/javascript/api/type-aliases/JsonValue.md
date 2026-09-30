# Type Alias: JsonValue
Source: https://docs.typesafe.ai/sdk/javascript/api/type-aliases/JsonValue



```ts theme={null}
type JsonValue = 
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | {
[key: string]: JsonValue;
};
```

A JSON-compatible value.


