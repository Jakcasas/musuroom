# Class: APIError
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/APIError



An unsuccessful HTTP response from the API.

## Extends

* [`TypeSafeError`](/sdk/javascript/api/classes/TypeSafeError)

## Extended by

* [`AuthenticationError`](/sdk/javascript/api/classes/AuthenticationError)
* [`BadRequestError`](/sdk/javascript/api/classes/BadRequestError)
* [`InternalServerError`](/sdk/javascript/api/classes/InternalServerError)
* [`NotFoundError`](/sdk/javascript/api/classes/NotFoundError)
* [`PermissionDeniedError`](/sdk/javascript/api/classes/PermissionDeniedError)
* [`RateLimitError`](/sdk/javascript/api/classes/RateLimitError)
* [`UnprocessableEntityError`](/sdk/javascript/api/classes/UnprocessableEntityError)

## Constructors

### Constructor

```ts theme={null}
new APIError(
   status, 
   body, 
   headers, 
   message?
): APIError;
```

#### Parameters

##### status

`number`

##### body

`unknown`

##### headers

`Headers`

##### message?

`string`

#### Returns

`APIError`

#### Overrides

[`TypeSafeError`](/sdk/javascript/api/classes/TypeSafeError).[`constructor`](/sdk/javascript/api/classes/TypeSafeError#sdk-constructor)

## Properties

### body

```ts theme={null}
readonly body: unknown;
```

Parsed JSON, response text, or `undefined` for an empty body.

***

### headers

```ts theme={null}
readonly headers: Headers;
```

HTTP response headers.

***

### requestId

```ts theme={null}
readonly requestId: string | undefined;
```

Request ID from `x-typesafe-request-id`, or `undefined` when absent.

***

### status

```ts theme={null}
readonly status: number;
```

HTTP response status code.

## Methods

### fromResponse()

```ts theme={null}
static fromResponse(
   status, 
   body, 
   headers
): APIError;
```

Create the error subclass for an HTTP status code.

#### Parameters

##### status

`number`

##### body

`unknown`

##### headers

`Headers`

#### Returns

`APIError`


