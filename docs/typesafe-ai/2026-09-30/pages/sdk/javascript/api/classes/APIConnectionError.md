# Class: APIConnectionError
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/APIConnectionError



The request or response-body delivery failed (DNS, TLS, connection closed, etc.).

## Extends

* [`TypeSafeError`](/sdk/javascript/api/classes/TypeSafeError)

## Extended by

* [`APITimeoutError`](/sdk/javascript/api/classes/APITimeoutError)

## Constructors

### Constructor

```ts theme={null}
new APIConnectionError(message?, options?): APIConnectionError;
```

#### Parameters

##### message?

`string` = `"Connection error."`

##### options?

`ErrorOptions`

#### Returns

`APIConnectionError`

#### Overrides

[`TypeSafeError`](/sdk/javascript/api/classes/TypeSafeError).[`constructor`](/sdk/javascript/api/classes/TypeSafeError#sdk-constructor)


