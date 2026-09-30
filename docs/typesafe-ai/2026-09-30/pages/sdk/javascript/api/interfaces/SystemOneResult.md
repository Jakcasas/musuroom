# Interface: SystemOneResult<Q>
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/SystemOneResult



Answers keyed by question name, with model and usage metadata.

## Type Parameters

### Q

`Q` *extends* [`Questions`](/sdk/javascript/api/interfaces/Questions)

## Properties

### answers

```ts theme={null}
readonly answers: { readonly [K in string | number | symbol]: ResultFor<Q[K]> };
```

Answers with types inferred from the supplied questions.

***

### model

```ts theme={null}
readonly model: string;
```

The model used to answer the request.

***

### usage

```ts theme={null}
readonly usage: Usage;
```

Token usage for the request.


