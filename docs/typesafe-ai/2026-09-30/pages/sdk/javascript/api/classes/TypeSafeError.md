# Class: TypeSafeError
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/TypeSafeError



Base class for SDK errors.

## Extends

* `Error`

## Extended by

* [`APIConnectionError`](/sdk/javascript/api/classes/APIConnectionError)
* [`APIError`](/sdk/javascript/api/classes/APIError)
* [`APIUserAbortError`](/sdk/javascript/api/classes/APIUserAbortError)

## Constructors

### Constructor

```ts theme={null}
new TypeSafeError(message, options?): TypeSafeError;
```

#### Parameters

##### message

`string`

##### options?

`ErrorOptions`

#### Returns

`TypeSafeError`

#### Overrides

```ts theme={null}
Error.constructor
```


