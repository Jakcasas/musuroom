# Type Alias: ScoreOf<T>
Source: https://docs.typesafe.ai/sdk/javascript/api/type-aliases/ScoreOf



```ts theme={null}
type ScoreOf<T> = number extends T["length"] ? number : Extract<keyof T, `${number}`>;
```

Score keys inferred from the rubric; a fixed-length tuple yields its indices, otherwise `number`.

## Type Parameters

### T

`T` *extends* [`ScoreCriteria`](/sdk/javascript/api/type-aliases/ScoreCriteria)


