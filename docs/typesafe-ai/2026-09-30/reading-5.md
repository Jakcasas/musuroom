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

[Code example: see complete pages/sdk/javascript/api/classes/TypeSafeError.md]

#### Parameters

##### message

`string`

##### options?

`ErrorOptions`

#### Returns

`TypeSafeError`

#### Overrides

[Code example: see complete pages/sdk/javascript/api/classes/TypeSafeError.md]




# Class: UnprocessableEntityError
Source: https://docs.typesafe.ai/sdk/javascript/api/classes/UnprocessableEntityError



HTTP 422: request validation failed.

## Extends

* [`APIError`](/sdk/javascript/api/classes/APIError)

## Constructors

### Constructor

[Code example: see complete pages/sdk/javascript/api/classes/UnprocessableEntityError.md]

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

`UnprocessableEntityError`

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`constructor`](/sdk/javascript/api/classes/APIError#sdk-constructor)

## Properties

### body

[Code example: see complete pages/sdk/javascript/api/classes/UnprocessableEntityError.md]

Parsed JSON, response text, or `undefined` for an empty body.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`body`](/sdk/javascript/api/classes/APIError#sdk-body)

***

### headers

[Code example: see complete pages/sdk/javascript/api/classes/UnprocessableEntityError.md]

HTTP response headers.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`headers`](/sdk/javascript/api/classes/APIError#sdk-headers)

***

### requestId

[Code example: see complete pages/sdk/javascript/api/classes/UnprocessableEntityError.md]

Request ID from `x-typesafe-request-id`, or `undefined` when absent.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`requestId`](/sdk/javascript/api/classes/APIError#sdk-requestid)

***

### status

[Code example: see complete pages/sdk/javascript/api/classes/UnprocessableEntityError.md]

HTTP response status code.

#### Inherited from

[`APIError`](/sdk/javascript/api/classes/APIError).[`status`](/sdk/javascript/api/classes/APIError#sdk-status)

## Methods

### fromResponse()

[Code example: see complete pages/sdk/javascript/api/classes/UnprocessableEntityError.md]

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




# Function: choice()
Source: https://docs.typesafe.ai/sdk/javascript/api/functions/choice



[Code example: see complete pages/sdk/javascript/api/functions/choice.md]

Create a question that selects between named alternatives.

## Type Parameters

### T

`T` *extends* [`ChoiceCriteria`](/sdk/javascript/api/type-aliases/ChoiceCriteria)

## Parameters

### instructions

[`EntryType`](/sdk/javascript/api/type-aliases/EntryType)

The question as text, a JSON object or array, or `null`.

### criteria

`T`

Labels mapped to descriptions, or `null` for undescribed labels.

## Returns

[`ChoiceQuestion`](/sdk/javascript/api/interfaces/ChoiceQuestion)\<`T`>




# Function: noul()
Source: https://docs.typesafe.ai/sdk/javascript/api/functions/noul



[Code example: see complete pages/sdk/javascript/api/functions/noul.md]

Create a yes/no question with optional descriptions for either outcome.

## Parameters

### instructions?

[`EntryType`](/sdk/javascript/api/type-aliases/EntryType) = `null`

The question as text, a JSON object or array; defaults to `null`.

### criteria?

\| \{
`false?`: [`EntryType`](/sdk/javascript/api/type-aliases/EntryType);
`true?`: [`EntryType`](/sdk/javascript/api/type-aliases/EntryType);
}
\| `null`

Optional descriptions of the yes and no outcomes.

#### Type Literal

\{
`false?`: [`EntryType`](/sdk/javascript/api/type-aliases/EntryType);
`true?`: [`EntryType`](/sdk/javascript/api/type-aliases/EntryType);
}

Optional descriptions of the yes and no outcomes.

##### false?

[`EntryType`](/sdk/javascript/api/type-aliases/EntryType)

Description of the no outcome.

##### true?

[`EntryType`](/sdk/javascript/api/type-aliases/EntryType)

Description of the yes outcome.

***

`null`

## Returns

[`NoulQuestion`](/sdk/javascript/api/interfaces/NoulQuestion)




# Function: score()
Source: https://docs.typesafe.ai/sdk/javascript/api/functions/score



[Code example: see complete pages/sdk/javascript/api/functions/score.md]

Create a score question using an ordered rubric.

## Type Parameters

### T

`T` *extends* [`ScoreCriteria`](/sdk/javascript/api/type-aliases/ScoreCriteria)

## Parameters

### instructions

[`EntryType`](/sdk/javascript/api/type-aliases/EntryType)

The question as text, a JSON object or array, or `null`.

### criteria

`T`

At least two descriptions indexed by score from zero; entries may be `null`.

## Returns

[`ScoreQuestion`](/sdk/javascript/api/interfaces/ScoreQuestion)\<`T`>




# Interface: ChoiceQuestion<T>
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/ChoiceQuestion



A question that selects between named alternatives.

## Type Parameters

### T

`T` *extends* [`ChoiceCriteria`](/sdk/javascript/api/type-aliases/ChoiceCriteria) = [`ChoiceCriteria`](/sdk/javascript/api/type-aliases/ChoiceCriteria)

## Properties

### criteria

[Code example: see complete pages/sdk/javascript/api/interfaces/ChoiceQuestion.md]

Descriptions of the available outcomes.

***

### instructions?

[Code example: see complete pages/sdk/javascript/api/interfaces/ChoiceQuestion.md]

The question as text, a JSON object, or an array; optional or `null`.

***

### type

[Code example: see complete pages/sdk/javascript/api/interfaces/ChoiceQuestion.md]




# Interface: ChoiceResponse<T>
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/ChoiceResponse



A selected label and its probabilities.

## Type Parameters

### T

`T` *extends* [`ChoiceCriteria`](/sdk/javascript/api/type-aliases/ChoiceCriteria) = [`ChoiceCriteria`](/sdk/javascript/api/type-aliases/ChoiceCriteria)

## Properties

### choice

[Code example: see complete pages/sdk/javascript/api/interfaces/ChoiceResponse.md]

The selected label.

***

### confidence

[Code example: see complete pages/sdk/javascript/api/interfaces/ChoiceResponse.md]

Reported confidence in the selected label.

***

### probabilities

[Code example: see complete pages/sdk/javascript/api/interfaces/ChoiceResponse.md]

Probabilities keyed by label.

***

### type

[Code example: see complete pages/sdk/javascript/api/interfaces/ChoiceResponse.md]




# Interface: Logger
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/Logger



Log methods accepting a message and structured values; compatible with `console`.

## Methods

### debug()

[Code example: see complete pages/sdk/javascript/api/interfaces/Logger.md]

#### Parameters

##### message

`string`

##### args

...`unknown`\[]

#### Returns

`void`

***

### error()

[Code example: see complete pages/sdk/javascript/api/interfaces/Logger.md]

#### Parameters

##### message

`string`

##### args

...`unknown`\[]

#### Returns

`void`

***

### info()

[Code example: see complete pages/sdk/javascript/api/interfaces/Logger.md]

#### Parameters

##### message

`string`

##### args

...`unknown`\[]

#### Returns

`void`

***

### warn()

[Code example: see complete pages/sdk/javascript/api/interfaces/Logger.md]

#### Parameters

##### message

`string`

##### args

...`unknown`\[]

#### Returns

`void`




# Interface: ModelCard
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/ModelCard



Metadata for an available model.

## Properties

### description

[Code example: see complete pages/sdk/javascript/api/interfaces/ModelCard.md]

***

### name

[Code example: see complete pages/sdk/javascript/api/interfaces/ModelCard.md]

***

### release\_date

[Code example: see complete pages/sdk/javascript/api/interfaces/ModelCard.md]




# Interface: Models
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/Models



Access to the Models API resource.

## Methods

### list()

[Code example: see complete pages/sdk/javascript/api/interfaces/Models.md]

List the models available to the account.

#### Parameters

##### options?

[`RequestOptions`](/sdk/javascript/api/interfaces/RequestOptions) = `{}`

#### Returns

[`APIPromise`](/sdk/javascript/api/classes/APIPromise)\<[`ModelCard`](/sdk/javascript/api/interfaces/ModelCard)\[]>




# Interface: NoulQuestion
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/NoulQuestion



A yes/no question with optional descriptions for either outcome.

## Properties

### criteria?

[Code example: see complete pages/sdk/javascript/api/interfaces/NoulQuestion.md]

Optional descriptions of the yes and no outcomes.

#### Union Members

##### Type Literal

[Code example: see complete pages/sdk/javascript/api/interfaces/NoulQuestion.md]

##### false?

[Code example: see complete pages/sdk/javascript/api/interfaces/NoulQuestion.md]

Description of the no outcome.

##### true?

[Code example: see complete pages/sdk/javascript/api/interfaces/NoulQuestion.md]

Description of the yes outcome.

***

`null`

***

### instructions?

[Code example: see complete pages/sdk/javascript/api/interfaces/NoulQuestion.md]

The question as text, a JSON object, or an array; optional or `null`.

***

### type

[Code example: see complete pages/sdk/javascript/api/interfaces/NoulQuestion.md]




# Interface: NoulResponse
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/NoulResponse



A yes/no answer.

## Properties

### noul

[Code example: see complete pages/sdk/javascript/api/interfaces/NoulResponse.md]

Probability of a yes answer, from zero to one.

***

### type

[Code example: see complete pages/sdk/javascript/api/interfaces/NoulResponse.md]




# Interface: Questions
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/Questions



Questions keyed by the names used to identify their answers.

## Indexable

[Code example: see complete pages/sdk/javascript/api/interfaces/Questions.md]




# Interface: RequestOptions
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/RequestOptions



Per-call options that override client settings.

## Properties

### headers?

[Code example: see complete pages/sdk/javascript/api/interfaces/RequestOptions.md]

Additional headers, merged over `defaultHeaders`.

***

### retry?

[Code example: see complete pages/sdk/javascript/api/interfaces/RequestOptions.md]

Retry overrides for this call; omitted fields inherit client settings.

***

### signal?

[Code example: see complete pages/sdk/javascript/api/interfaces/RequestOptions.md]

Cancellation signal for the request and pending retries.

***

### timeout?

[Code example: see complete pages/sdk/javascript/api/interfaces/RequestOptions.md]

Timeout per attempt in milliseconds; there is no total retry budget.




# Interface: RetryPolicy
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/RetryPolicy



Retry configuration. Partial overrides inherit unset fields from the client or SDK defaults.

## Properties

### apiConnectionError

[Code example: see complete pages/sdk/javascript/api/interfaces/RetryPolicy.md]

Retry connection failures, including interrupted response bodies (`APIConnectionError`). Default: true.

***

### apiTimeoutError

[Code example: see complete pages/sdk/javascript/api/interfaces/RetryPolicy.md]

Whether to retry `APITimeoutError`. Default: true.

***

### backoffInitialMs

[Code example: see complete pages/sdk/javascript/api/interfaces/RetryPolicy.md]

First backoff delay in milliseconds, doubled up to `backoffMaxMs`. Default: 500.

***

### backoffJitter

[Code example: see complete pages/sdk/javascript/api/interfaces/RetryPolicy.md]

Fraction of each backoff delay randomly subtracted, from 0 to 1. Default: 0.25.

***

### backoffMaxMs

[Code example: see complete pages/sdk/javascript/api/interfaces/RetryPolicy.md]

Maximum backoff delay in milliseconds. Default: 5000.

***

### httpStatuses

[Code example: see complete pages/sdk/javascript/api/interfaces/RetryPolicy.md]

HTTP status codes to retry. Default: 408, 429, and 500–599.

***

### maxRetries

[Code example: see complete pages/sdk/javascript/api/interfaces/RetryPolicy.md]

Maximum retries after the initial attempt; `0` disables retries. Default: 2.

***

### maxRetryAfterMs

[Code example: see complete pages/sdk/javascript/api/interfaces/RetryPolicy.md]

Maximum server retry delay in milliseconds; longer delays use backoff. Default: 60000.

***

### respectRetryAfter

[Code example: see complete pages/sdk/javascript/api/interfaces/RetryPolicy.md]

Honor `Retry-After` and `retry-after-ms` up to `maxRetryAfterMs`. Default: true.


