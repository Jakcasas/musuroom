# Class: APITimeoutError
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/APITimeoutError



The full response did not arrive within the timeout. A kind of `APIConnectionError`.

## Extends

* [`APIConnectionError`](/sdk/javascript/api/classes/APIConnectionError)

## Constructors

### Constructor

```ts theme={null}
new APITimeoutError(timeoutMs, options?): APITimeoutError;
```

#### Parameters

##### timeoutMs

`number`

##### options?

`ErrorOptions`

#### Returns

`APITimeoutError`

#### Overrides

[`APIConnectionError`](/sdk/javascript/api/classes/APIConnectionError).[`constructor`](/sdk/javascript/api/classes/APIConnectionError#sdk-constructor)

## Properties

### timeoutMs

```ts theme={null}
readonly timeoutMs: number;
```

Configured timeout in milliseconds.


