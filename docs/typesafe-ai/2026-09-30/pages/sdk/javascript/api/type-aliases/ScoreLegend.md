# Type Alias: ScoreLegend<T>
Source: https://docs.typesafe.ai/sdk/javascript/api/type-aliases/ScoreLegend



```ts theme={null}
type ScoreLegend<T> = { readonly [score in ScoreOf<T>]: T[score] };
```

Rubric descriptions keyed by score.

## Type Parameters

### T

`T` *extends* [`ScoreCriteria`](/sdk/javascript/api/type-aliases/ScoreCriteria)


