# Interface: SystemOneRequest<Q>
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/SystemOneRequest



State and named questions for `systemOne`.

Additional properties on a request variable are forwarded, including `null` values.

## Extended by

* [`SystemOneRequestPayload`](/sdk/javascript/api/interfaces/SystemOneRequestPayload)

## Type Parameters

### Q

`Q` *extends* [`Questions`](/sdk/javascript/api/interfaces/Questions) = [`Questions`](/sdk/javascript/api/interfaces/Questions)

## Properties

### model?

```ts theme={null}
optional model?: string;
```

Model override; omitted values inherit `defaultModel`.

***

### questions

```ts theme={null}
questions: Q;
```

Nonempty questions keyed by the names used to identify their answers.

***

### state

```ts theme={null}
state: EntryType;
```

Text, a JSON object or array, or `null` to evaluate.


