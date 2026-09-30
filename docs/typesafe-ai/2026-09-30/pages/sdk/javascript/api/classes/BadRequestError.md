# Class: BadRequestError
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/BadRequestError



HTTP 400: the request is invalid.

## Extends

* [`APIError`](/sdk/javascript/api/classes/APIError)

## Constructors

### Constructor

```ts theme={null}
new BadRequestError(
   status, 
   body, 
   headers, 
   message?
): BadRequestError;
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

`BadRequestError`

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`constructor`](/sdk/javascript/api/classes/APIError#sdk-constructor)

## Properties

### body

```ts theme={null}
readonly body: unknown;
```

Parsed JSON, response text, or `undefined` for an empty body.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`body`](/sdk/javascript/api/classes/APIError#sdk-body)

***

### headers

```ts theme={null}
readonly headers: Headers;
```

HTTP response headers.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`headers`](/sdk/javascript/api/classes/APIError#sdk-headers)

***

### requestId

```ts theme={null}
readonly requestId: string | undefined;
```

Request ID from `x-typesafe-request-id`, or `undefined` when absent.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`requestId`](/sdk/javascript/api/classes/APIError#sdk-requestid)

***

### status

```ts theme={null}
readonly status: number;
```

HTTP response status code.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`status`](/sdk/javascript/api/classes/APIError#sdk-status)

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

[`APIError`](/sdk/javascript/api/classes/APIError)

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`fromResponse`](/sdk/javascript/api/classes/APIError#sdk-fromresponse)


