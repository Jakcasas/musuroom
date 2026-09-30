# Interface: SystemOneRequestPayload
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/SystemOneRequestPayload



Request body for `POST /v1/systemone`, with the model resolved.

## Extends

* [`SystemOneRequest`](/sdk/javascript/api/interfaces/SystemOneRequest)

## Properties

### model

```ts theme={null}
model: string;
```

Model override; omitted values inherit `defaultModel`.

#### Overrides

[`SystemOneRequest`](/sdk/javascript/api/interfaces/SystemOneRequest).[`model`](/sdk/javascript/api/interfaces/SystemOneRequest#sdk-model)

***

### questions

```ts theme={null}
questions: Questions;
```

Nonempty questions keyed by the names used to identify their answers.

#### Inherited from

[`SystemOneRequest`](/sdk/javascript/api/interfaces/SystemOneRequest).[`questions`](/sdk/javascript/api/interfaces/SystemOneRequest#sdk-questions)

***

### state

```ts theme={null}
state: EntryType;
```

Text, a JSON object or array, or `null` to evaluate.

#### Inherited from

[`SystemOneRequest`](/sdk/javascript/api/interfaces/SystemOneRequest).[`state`](/sdk/javascript/api/interfaces/SystemOneRequest#sdk-state)


