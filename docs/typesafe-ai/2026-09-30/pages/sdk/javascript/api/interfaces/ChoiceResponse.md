# Interface: ChoiceResponse<T>
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/ChoiceResponse



A selected label and its probabilities.

## Type Parameters

### T

`T` *extends* [`ChoiceCriteria`](/sdk/javascript/api/type-aliases/ChoiceCriteria) = [`ChoiceCriteria`](/sdk/javascript/api/type-aliases/ChoiceCriteria)

## Properties

### choice

```ts theme={null}
readonly choice: keyof T & string;
```

The selected label.

***

### confidence

```ts theme={null}
readonly confidence: number;
```

Reported confidence in the selected label.

***

### probabilities

```ts theme={null}
readonly probabilities: { readonly [label in string | number | symbol]: number };
```

Probabilities keyed by label.

***

### type

```ts theme={null}
readonly type: "choice";
```


