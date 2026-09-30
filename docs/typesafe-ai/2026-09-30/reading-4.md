# Client SDKs
Source: https://docs.typesafe.ai/sdk

Install a TypeSafe client SDK and use typed questions and answers in your application.

Our client SDKs provide typed questions and answers for the TypeSafe API and handle retries automatically with their default retry policy.

Choose a client SDK for installation instructions, examples, and API details.

<Card title="Python" href="/sdk/python">
  Install the Python client SDK and make your first request.
</Card>

<Card title="JavaScript / TypeScript" href="/sdk/javascript">
  Install the JavaScript client SDK and make your first typed request.
</Card>

You can also call the [HTTP API](/api) directly from any language.




# JavaScript SDK
Source: https://docs.typesafe.ai/sdk/javascript



JavaScript and TypeScript SDK for [TypeSafe AI](https://typesafe.ai).

## Quickstart

Install the SDK (Node.js 20 or newer):

[Code example: see complete pages/sdk/javascript.md]

Set `TYPESAFE_API_KEY` in your environment, then create and use the client:

[Code example: see complete pages/sdk/javascript.md]

Answer types are inferred from your questions. The package includes ESM, CommonJS, and TypeScript declarations.

## Documentation

Learn what TypeSafe can do in the [TypeSafe docs](https://docs.typesafe.ai/).
See the SDK's [client](https://github.com/typesafe-ai/typesafe-sdk-js/blob/v0.6.0/src/client.ts) and [types](https://github.com/typesafe-ai/typesafe-sdk-js/blob/v0.6.0/src/types.ts) for API options and defaults.




# API reference
Source: https://docs.typesafe.ai/sdk/javascript/api



## Classes

* [APIConnectionError](/sdk/javascript/api/classes/APIConnectionError)
* [APIError](/sdk/javascript/api/classes/APIError)
* [APIPromise](/sdk/javascript/api/classes/APIPromise)
* [APITimeoutError](/sdk/javascript/api/classes/APITimeoutError)
* [APIUserAbortError](/sdk/javascript/api/classes/APIUserAbortError)
* [AuthenticationError](/sdk/javascript/api/classes/AuthenticationError)
* [BadRequestError](/sdk/javascript/api/classes/BadRequestError)
* [InternalServerError](/sdk/javascript/api/classes/InternalServerError)
* [NotFoundError](/sdk/javascript/api/classes/NotFoundError)
* [PermissionDeniedError](/sdk/javascript/api/classes/PermissionDeniedError)
* [RateLimitError](/sdk/javascript/api/classes/RateLimitError)
* [TypeSafeClient](/sdk/javascript/api/classes/TypeSafeClient)
* [TypeSafeError](/sdk/javascript/api/classes/TypeSafeError)
* [UnprocessableEntityError](/sdk/javascript/api/classes/UnprocessableEntityError)

## Interfaces

* [ChoiceQuestion](/sdk/javascript/api/interfaces/ChoiceQuestion)
* [ChoiceResponse](/sdk/javascript/api/interfaces/ChoiceResponse)
* [Logger](/sdk/javascript/api/interfaces/Logger)
* [ModelCard](/sdk/javascript/api/interfaces/ModelCard)
* [Models](/sdk/javascript/api/interfaces/Models)
* [NoulQuestion](/sdk/javascript/api/interfaces/NoulQuestion)
* [NoulResponse](/sdk/javascript/api/interfaces/NoulResponse)
* [Questions](/sdk/javascript/api/interfaces/Questions)
* [RequestOptions](/sdk/javascript/api/interfaces/RequestOptions)
* [RetryPolicy](/sdk/javascript/api/interfaces/RetryPolicy)
* [ScoreQuestion](/sdk/javascript/api/interfaces/ScoreQuestion)
* [ScoreResponse](/sdk/javascript/api/interfaces/ScoreResponse)
* [SystemOneRequest](/sdk/javascript/api/interfaces/SystemOneRequest)
* [SystemOneRequestPayload](/sdk/javascript/api/interfaces/SystemOneRequestPayload)
* [SystemOneResult](/sdk/javascript/api/interfaces/SystemOneResult)
* [TypeSafeClientConfig](/sdk/javascript/api/interfaces/TypeSafeClientConfig)
* [Usage](/sdk/javascript/api/interfaces/Usage)
* [WithResponse](/sdk/javascript/api/interfaces/WithResponse)

## Type Aliases

* [ChoiceCriteria](/sdk/javascript/api/type-aliases/ChoiceCriteria)
* [Description](/sdk/javascript/api/type-aliases/Description)
* [EntryType](/sdk/javascript/api/type-aliases/EntryType)
* [EnvVar](/sdk/javascript/api/type-aliases/EnvVar)
* [Fetch](/sdk/javascript/api/type-aliases/Fetch)
* [JsonValue](/sdk/javascript/api/type-aliases/JsonValue)
* [LogLevel](/sdk/javascript/api/type-aliases/LogLevel)
* [Question](/sdk/javascript/api/type-aliases/Question)
* [ResultFor](/sdk/javascript/api/type-aliases/ResultFor)
* [ScoreCriteria](/sdk/javascript/api/type-aliases/ScoreCriteria)
* [ScoreLegend](/sdk/javascript/api/type-aliases/ScoreLegend)
* [ScoreOf](/sdk/javascript/api/type-aliases/ScoreOf)

## Variables

* [ENV](/sdk/javascript/api/variables/ENV)
* [LOG\_LEVELS](/sdk/javascript/api/variables/LOG_LEVELS)
* [VERSION](/sdk/javascript/api/variables/VERSION)

## Functions

* [choice](/sdk/javascript/api/functions/choice)
* [noul](/sdk/javascript/api/functions/noul)
* [score](/sdk/javascript/api/functions/score)




# Class: APIConnectionError
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/APIConnectionError



The request or response-body delivery failed (DNS, TLS, connection closed, etc.).

## Extends

* [`TypeSafeError`](/sdk/javascript/api/classes/TypeSafeError)

## Extended by

* [`APITimeoutError`](/sdk/javascript/api/classes/APITimeoutError)

## Constructors

### Constructor

[Code example: see complete pages/sdk/javascript/api/classes/APIConnectionError.md]

#### Parameters

##### message?

`string` = `"Connection error."`

##### options?

`ErrorOptions`

#### Returns

`APIConnectionError`

#### Overrides

[`TypeSafeError`](/sdk/javascript/api/classes/TypeSafeError).[`constructor`](/sdk/javascript/api/classes/TypeSafeError#sdk-constructor)




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

[Code example: see complete pages/sdk/javascript/api/classes/APIError.md]

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

[Code example: see complete pages/sdk/javascript/api/classes/APIError.md]

Parsed JSON, response text, or `undefined` for an empty body.

***

### headers

[Code example: see complete pages/sdk/javascript/api/classes/APIError.md]

HTTP response headers.

***

### requestId

[Code example: see complete pages/sdk/javascript/api/classes/APIError.md]

Request ID from `x-typesafe-request-id`, or `undefined` when absent.

***

### status

[Code example: see complete pages/sdk/javascript/api/classes/APIError.md]

HTTP response status code.

## Methods

### fromResponse()

[Code example: see complete pages/sdk/javascript/api/classes/APIError.md]

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




# Class: APIPromise<T>
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/APIPromise



A promise for the parsed result with access to the HTTP response.

Non-2xx responses reject with an `APIError`, including through `asResponse()`.

## Extends

* `Promise`\<`T`>

## Type Parameters

### T

`T`

## Constructors

### Constructor

[Code example: see complete pages/sdk/javascript/api/classes/APIPromise.md]

#### Parameters

##### responsePromise

`Promise`\<`Response`>

##### parseResponse

(`response`) => `Promise`\<`T`>

#### Returns

`APIPromise`\<`T`>

#### Overrides

[Code example: see complete pages/sdk/javascript/api/classes/APIPromise.md]

## Methods

### asResponse()

[Code example: see complete pages/sdk/javascript/api/classes/APIPromise.md]

Resolves to the raw `Response` without parsing the body. SDK requests buffer the full
body under the request timeout before handoff; reading it afterwards is caller-owned.
The caller owns the body; don't also `await` the parsed result on the same promise.

#### Returns

`Promise`\<`Response`>

***

### catch()

[Code example: see complete pages/sdk/javascript/api/classes/APIPromise.md]

Attaches a callback for only the rejection of the Promise.

#### Type Parameters

##### TResult

`TResult` = `never`

#### Parameters

##### onrejected?

((`reason`) => `TResult` | `PromiseLike`\<`TResult`>) | `null`

The callback to execute when the Promise is rejected.

#### Returns

`Promise`\<`T` | `TResult`>

A Promise for the completion of the callback.

#### Overrides

[Code example: see complete pages/sdk/javascript/api/classes/APIPromise.md]

***

### finally()

[Code example: see complete pages/sdk/javascript/api/classes/APIPromise.md]

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.

#### Parameters

##### onfinally?

(() => `void`) | `null`

The callback to execute when the Promise is settled (fulfilled or rejected).

#### Returns

`Promise`\<`T`>

A Promise for the completion of the callback.

#### Overrides

[Code example: see complete pages/sdk/javascript/api/classes/APIPromise.md]

***

### map()

[Code example: see complete pages/sdk/javascript/api/classes/APIPromise.md]

Transform the parsed result, sharing the HTTP response and a single body parse.

#### Type Parameters

##### U

`U`

#### Parameters

##### fn

(`data`) => `U`

#### Returns

`APIPromise`\<`U`>

***

### then()

[Code example: see complete pages/sdk/javascript/api/classes/APIPromise.md]

Attaches callbacks for the resolution and/or rejection of the Promise.

#### Type Parameters

##### TResult1

`TResult1` = `T`

##### TResult2

`TResult2` = `never`

#### Parameters

##### onfulfilled?

((`value`) => `TResult1` | `PromiseLike`\<`TResult1`>) | `null`

The callback to execute when the Promise is resolved.

##### onrejected?

((`reason`) => `TResult2` | `PromiseLike`\<`TResult2`>) | `null`

The callback to execute when the Promise is rejected.

#### Returns

`Promise`\<`TResult1` | `TResult2`>

A Promise for the completion of which ever callback is executed.

#### Overrides

[Code example: see complete pages/sdk/javascript/api/classes/APIPromise.md]

***

### withResponse()

[Code example: see complete pages/sdk/javascript/api/classes/APIPromise.md]

Return the parsed result, HTTP response, and request ID.

#### Returns

`Promise`\<[`WithResponse`](/sdk/javascript/api/interfaces/WithResponse)\<`T`>>




# Class: APITimeoutError
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/APITimeoutError



The full response did not arrive within the timeout. A kind of `APIConnectionError`.

## Extends

* [`APIConnectionError`](/sdk/javascript/api/classes/APIConnectionError)

## Constructors

### Constructor

[Code example: see complete pages/sdk/javascript/api/classes/APITimeoutError.md]

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

[Code example: see complete pages/sdk/javascript/api/classes/APITimeoutError.md]

Configured timeout in milliseconds.




# Class: APIUserAbortError
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/APIUserAbortError



The caller cancelled the request through an `AbortSignal`.

## Extends

* [`TypeSafeError`](/sdk/javascript/api/classes/TypeSafeError)

## Constructors

### Constructor

[Code example: see complete pages/sdk/javascript/api/classes/APIUserAbortError.md]

#### Parameters

##### message?

`string` = `"Request was aborted."`

##### options?

`ErrorOptions`

#### Returns

`APIUserAbortError`

#### Overrides

[`TypeSafeError`](/sdk/javascript/api/classes/TypeSafeError).[`constructor`](/sdk/javascript/api/classes/TypeSafeError#sdk-constructor)




# Class: AuthenticationError
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/AuthenticationError



HTTP 401: authentication failed.

## Extends

* [`APIError`](/sdk/javascript/api/classes/APIError)

## Constructors

### Constructor

[Code example: see complete pages/sdk/javascript/api/classes/AuthenticationError.md]

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

`AuthenticationError`

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`constructor`](/sdk/javascript/api/classes/APIError#sdk-constructor)

## Properties

### body

[Code example: see complete pages/sdk/javascript/api/classes/AuthenticationError.md]

Parsed JSON, response text, or `undefined` for an empty body.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`body`](/sdk/javascript/api/classes/APIError#sdk-body)

***

### headers

[Code example: see complete pages/sdk/javascript/api/classes/AuthenticationError.md]

HTTP response headers.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`headers`](/sdk/javascript/api/classes/APIError#sdk-headers)

***

### requestId

[Code example: see complete pages/sdk/javascript/api/classes/AuthenticationError.md]

Request ID from `x-typesafe-request-id`, or `undefined` when absent.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`requestId`](/sdk/javascript/api/classes/APIError#sdk-requestid)

***

### status

[Code example: see complete pages/sdk/javascript/api/classes/AuthenticationError.md]

HTTP response status code.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`status`](/sdk/javascript/api/classes/APIError#sdk-status)

## Methods

### fromResponse()

[Code example: see complete pages/sdk/javascript/api/classes/AuthenticationError.md]

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




# Class: BadRequestError
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/BadRequestError



HTTP 400: the request is invalid.

## Extends

* [`APIError`](/sdk/javascript/api/classes/APIError)

## Constructors

### Constructor

[Code example: see complete pages/sdk/javascript/api/classes/BadRequestError.md]

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

[Code example: see complete pages/sdk/javascript/api/classes/BadRequestError.md]

Parsed JSON, response text, or `undefined` for an empty body.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`body`](/sdk/javascript/api/classes/APIError#sdk-body)

***

### headers

[Code example: see complete pages/sdk/javascript/api/classes/BadRequestError.md]

HTTP response headers.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`headers`](/sdk/javascript/api/classes/APIError#sdk-headers)

***

### requestId

[Code example: see complete pages/sdk/javascript/api/classes/BadRequestError.md]

Request ID from `x-typesafe-request-id`, or `undefined` when absent.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`requestId`](/sdk/javascript/api/classes/APIError#sdk-requestid)

***

### status

[Code example: see complete pages/sdk/javascript/api/classes/BadRequestError.md]

HTTP response status code.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`status`](/sdk/javascript/api/classes/APIError#sdk-status)

## Methods

### fromResponse()

[Code example: see complete pages/sdk/javascript/api/classes/BadRequestError.md]

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




# Class: InternalServerError
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/InternalServerError



HTTP 5xx: the server failed to handle the request.

## Extends

* [`APIError`](/sdk/javascript/api/classes/APIError)

## Constructors

### Constructor

[Code example: see complete pages/sdk/javascript/api/classes/InternalServerError.md]

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

`InternalServerError`

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`constructor`](/sdk/javascript/api/classes/APIError#sdk-constructor)

## Properties

### body

[Code example: see complete pages/sdk/javascript/api/classes/InternalServerError.md]

Parsed JSON, response text, or `undefined` for an empty body.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`body`](/sdk/javascript/api/classes/APIError#sdk-body)

***

### headers

[Code example: see complete pages/sdk/javascript/api/classes/InternalServerError.md]

HTTP response headers.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`headers`](/sdk/javascript/api/classes/APIError#sdk-headers)

***

### requestId

[Code example: see complete pages/sdk/javascript/api/classes/InternalServerError.md]

Request ID from `x-typesafe-request-id`, or `undefined` when absent.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`requestId`](/sdk/javascript/api/classes/APIError#sdk-requestid)

***

### status

[Code example: see complete pages/sdk/javascript/api/classes/InternalServerError.md]

HTTP response status code.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`status`](/sdk/javascript/api/classes/APIError#sdk-status)

## Methods

### fromResponse()

[Code example: see complete pages/sdk/javascript/api/classes/InternalServerError.md]

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




# Class: NotFoundError
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/NotFoundError



HTTP 404: the resource was not found.

## Extends

* [`APIError`](/sdk/javascript/api/classes/APIError)

## Constructors

### Constructor

[Code example: see complete pages/sdk/javascript/api/classes/NotFoundError.md]

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

`NotFoundError`

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`constructor`](/sdk/javascript/api/classes/APIError#sdk-constructor)

## Properties

### body

[Code example: see complete pages/sdk/javascript/api/classes/NotFoundError.md]

Parsed JSON, response text, or `undefined` for an empty body.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`body`](/sdk/javascript/api/classes/APIError#sdk-body)

***

### headers

[Code example: see complete pages/sdk/javascript/api/classes/NotFoundError.md]

HTTP response headers.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`headers`](/sdk/javascript/api/classes/APIError#sdk-headers)

***

### requestId

[Code example: see complete pages/sdk/javascript/api/classes/NotFoundError.md]

Request ID from `x-typesafe-request-id`, or `undefined` when absent.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`requestId`](/sdk/javascript/api/classes/APIError#sdk-requestid)

***

### status

[Code example: see complete pages/sdk/javascript/api/classes/NotFoundError.md]

HTTP response status code.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`status`](/sdk/javascript/api/classes/APIError#sdk-status)

## Methods

### fromResponse()

[Code example: see complete pages/sdk/javascript/api/classes/NotFoundError.md]

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




# Class: PermissionDeniedError
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/PermissionDeniedError



HTTP 403: access is denied.

## Extends

* [`APIError`](/sdk/javascript/api/classes/APIError)

## Constructors

### Constructor

[Code example: see complete pages/sdk/javascript/api/classes/PermissionDeniedError.md]

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

`PermissionDeniedError`

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`constructor`](/sdk/javascript/api/classes/APIError#sdk-constructor)

## Properties

### body

[Code example: see complete pages/sdk/javascript/api/classes/PermissionDeniedError.md]

Parsed JSON, response text, or `undefined` for an empty body.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`body`](/sdk/javascript/api/classes/APIError#sdk-body)

***

### headers

[Code example: see complete pages/sdk/javascript/api/classes/PermissionDeniedError.md]

HTTP response headers.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`headers`](/sdk/javascript/api/classes/APIError#sdk-headers)

***

### requestId

[Code example: see complete pages/sdk/javascript/api/classes/PermissionDeniedError.md]

Request ID from `x-typesafe-request-id`, or `undefined` when absent.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`requestId`](/sdk/javascript/api/classes/APIError#sdk-requestid)

***

### status

[Code example: see complete pages/sdk/javascript/api/classes/PermissionDeniedError.md]

HTTP response status code.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`status`](/sdk/javascript/api/classes/APIError#sdk-status)

## Methods

### fromResponse()

[Code example: see complete pages/sdk/javascript/api/classes/PermissionDeniedError.md]

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




# Class: RateLimitError
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/RateLimitError



HTTP 429: the rate limit was exceeded.

## Extends

* [`APIError`](/sdk/javascript/api/classes/APIError)

## Constructors

### Constructor

[Code example: see complete pages/sdk/javascript/api/classes/RateLimitError.md]

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

`RateLimitError`

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`constructor`](/sdk/javascript/api/classes/APIError#sdk-constructor)

## Properties

### body

[Code example: see complete pages/sdk/javascript/api/classes/RateLimitError.md]

Parsed JSON, response text, or `undefined` for an empty body.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`body`](/sdk/javascript/api/classes/APIError#sdk-body)

***

### headers

[Code example: see complete pages/sdk/javascript/api/classes/RateLimitError.md]

HTTP response headers.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`headers`](/sdk/javascript/api/classes/APIError#sdk-headers)

***

### requestId

[Code example: see complete pages/sdk/javascript/api/classes/RateLimitError.md]

Request ID from `x-typesafe-request-id`, or `undefined` when absent.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`requestId`](/sdk/javascript/api/classes/APIError#sdk-requestid)

***

### retryAfterMs

[Code example: see complete pages/sdk/javascript/api/classes/RateLimitError.md]

Server retry delay in milliseconds, or `undefined` when absent or invalid.

***

### status

[Code example: see complete pages/sdk/javascript/api/classes/RateLimitError.md]

HTTP response status code.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`status`](/sdk/javascript/api/classes/APIError#sdk-status)

## Methods

### fromResponse()

[Code example: see complete pages/sdk/javascript/api/classes/RateLimitError.md]

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




# Class: TypeSafeClient
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/TypeSafeClient



Client for the TypeSafe AI API.

## Constructors

### Constructor

[Code example: see complete pages/sdk/javascript/api/classes/TypeSafeClient.md]

Create a client for the TypeSafe AI API.

Explicit options take precedence over environment variables, then SDK defaults.
Empty or whitespace-only environment values are ignored.

#### Parameters

##### config?

[`TypeSafeClientConfig`](/sdk/javascript/api/interfaces/TypeSafeClientConfig) = `{}`

#### Returns

`TypeSafeClient`

#### Throws

The API key is missing, configuration is invalid, or the runtime is unsupported.

## Properties

### baseURL

[Code example: see complete pages/sdk/javascript/api/classes/TypeSafeClient.md]

API root with trailing slashes removed.

***

### defaultHeaders

[Code example: see complete pages/sdk/javascript/api/classes/TypeSafeClient.md]

Additional headers sent with each request.

***

### defaultModel

[Code example: see complete pages/sdk/javascript/api/classes/TypeSafeClient.md]

Model used when a request omits `model`.

***

### fetch

[Code example: see complete pages/sdk/javascript/api/classes/TypeSafeClient.md]

HTTP fetch implementation.

***

### logger

[Code example: see complete pages/sdk/javascript/api/classes/TypeSafeClient.md]

The configured logger, filtered to `logLevel`.

***

### logLevel

[Code example: see complete pages/sdk/javascript/api/classes/TypeSafeClient.md]

Configured log verbosity.

***

### models

[Code example: see complete pages/sdk/javascript/api/classes/TypeSafeClient.md]

The models available to the account.

***

### retry

[Code example: see complete pages/sdk/javascript/api/classes/TypeSafeClient.md]

Retry settings with constructor overrides applied.

***

### timeout

[Code example: see complete pages/sdk/javascript/api/classes/TypeSafeClient.md]

Timeout per attempt in milliseconds.

## Methods

### systemOne()

[Code example: see complete pages/sdk/javascript/api/classes/TypeSafeClient.md]

Answer named questions about text or structured state.

#### Type Parameters

##### Q

`Q` *extends* [`Questions`](/sdk/javascript/api/interfaces/Questions)

#### Parameters

##### request

[`SystemOneRequest`](/sdk/javascript/api/interfaces/SystemOneRequest)\<`Q`>

State, questions, and an optional model override.

##### options?

[`RequestOptions`](/sdk/javascript/api/interfaces/RequestOptions) = `{}`

Per-call timeout, retry, headers, and cancellation settings.

#### Returns

[`APIPromise`](/sdk/javascript/api/classes/APIPromise)\<[`SystemOneResult`](/sdk/javascript/api/interfaces/SystemOneResult)\<`Q`>>

Answers typed by question name and criteria, with model and token usage.

#### Throws

Questions are empty, or score criteria are not a list of at least two entries.

#### Throws

The server returns a non-2xx response after retries.

#### Throws

The request cannot connect or times out after retries.

#### Throws

The caller aborts the request.

#### Example

[Code example: see complete pages/sdk/javascript/api/classes/TypeSafeClient.md]


