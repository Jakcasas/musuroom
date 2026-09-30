# Interface: ScoreQuestion<T>
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/ScoreQuestion



A question that assigns a score using an ordered rubric.

## Type Parameters

### T

`T` *extends* [`ScoreCriteria`](/sdk/javascript/api/type-aliases/ScoreCriteria) = [`ScoreCriteria`](/sdk/javascript/api/type-aliases/ScoreCriteria)

## Properties

### criteria

[Code example: see complete pages/sdk/javascript/api/interfaces/ScoreQuestion.md]

Descriptions of the available outcomes.

***

### instructions?

[Code example: see complete pages/sdk/javascript/api/interfaces/ScoreQuestion.md]

The question as text, a JSON object, or an array; optional or `null`.

***

### type

[Code example: see complete pages/sdk/javascript/api/interfaces/ScoreQuestion.md]




# Interface: ScoreResponse<T>
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/ScoreResponse



An expected score with its rubric and probabilities.

## Type Parameters

### T

`T` *extends* [`ScoreCriteria`](/sdk/javascript/api/type-aliases/ScoreCriteria) = [`ScoreCriteria`](/sdk/javascript/api/type-aliases/ScoreCriteria)

## Properties

### confidence

[Code example: see complete pages/sdk/javascript/api/interfaces/ScoreResponse.md]

Reported confidence in the score.

***

### legend

[Code example: see complete pages/sdk/javascript/api/interfaces/ScoreResponse.md]

Rubric descriptions keyed by score.

***

### probabilities

[Code example: see complete pages/sdk/javascript/api/interfaces/ScoreResponse.md]

Probabilities keyed by score.

***

### score

[Code example: see complete pages/sdk/javascript/api/interfaces/ScoreResponse.md]

Expected score, which may fall between integer rubric levels.

***

### type

[Code example: see complete pages/sdk/javascript/api/interfaces/ScoreResponse.md]




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

[Code example: see complete pages/sdk/javascript/api/interfaces/SystemOneRequest.md]

Model override; omitted values inherit `defaultModel`.

***

### questions

[Code example: see complete pages/sdk/javascript/api/interfaces/SystemOneRequest.md]

Nonempty questions keyed by the names used to identify their answers.

***

### state

[Code example: see complete pages/sdk/javascript/api/interfaces/SystemOneRequest.md]

Text, a JSON object or array, or `null` to evaluate.




# Interface: SystemOneRequestPayload
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/SystemOneRequestPayload



Request body for `POST /v1/systemone`, with the model resolved.

## Extends

* [`SystemOneRequest`](/sdk/javascript/api/interfaces/SystemOneRequest)

## Properties

### model

[Code example: see complete pages/sdk/javascript/api/interfaces/SystemOneRequestPayload.md]

Model override; omitted values inherit `defaultModel`.

#### Overrides

[`SystemOneRequest`](/sdk/javascript/api/interfaces/SystemOneRequest).[`model`](/sdk/javascript/api/interfaces/SystemOneRequest#sdk-model)

***

### questions

[Code example: see complete pages/sdk/javascript/api/interfaces/SystemOneRequestPayload.md]

Nonempty questions keyed by the names used to identify their answers.

#### Inherited from

[`SystemOneRequest`](/sdk/javascript/api/interfaces/SystemOneRequest).[`questions`](/sdk/javascript/api/interfaces/SystemOneRequest#sdk-questions)

***

### state

[Code example: see complete pages/sdk/javascript/api/interfaces/SystemOneRequestPayload.md]

Text, a JSON object or array, or `null` to evaluate.

#### Inherited from

[`SystemOneRequest`](/sdk/javascript/api/interfaces/SystemOneRequest).[`state`](/sdk/javascript/api/interfaces/SystemOneRequest#sdk-state)




# Interface: SystemOneResult<Q>
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/SystemOneResult



Answers keyed by question name, with model and usage metadata.

## Type Parameters

### Q

`Q` *extends* [`Questions`](/sdk/javascript/api/interfaces/Questions)

## Properties

### answers

[Code example: see complete pages/sdk/javascript/api/interfaces/SystemOneResult.md]

Answers with types inferred from the supplied questions.

***

### model

[Code example: see complete pages/sdk/javascript/api/interfaces/SystemOneResult.md]

The model used to answer the request.

***

### usage

[Code example: see complete pages/sdk/javascript/api/interfaces/SystemOneResult.md]

Token usage for the request.




# Interface: TypeSafeClientConfig
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/TypeSafeClientConfig



Client options. Explicit values take precedence over environment variables, then SDK defaults.

## Properties

### apiKey?

[Code example: see complete pages/sdk/javascript/api/interfaces/TypeSafeClientConfig.md]

Required API key; falls back to `TYPESAFE_API_KEY`.

***

### baseURL?

[Code example: see complete pages/sdk/javascript/api/interfaces/TypeSafeClientConfig.md]

API root; falls back to `TYPESAFE_BASE_URL`, then `https://api.typesafe.ai`.

***

### dangerouslyAllowBrowser?

[Code example: see complete pages/sdk/javascript/api/interfaces/TypeSafeClientConfig.md]

Allow browser use, exposing the API key to page users. Default: false.

***

### defaultHeaders?

[Code example: see complete pages/sdk/javascript/api/interfaces/TypeSafeClientConfig.md]

Additional request headers; per-call headers take precedence.

***

### defaultModel?

[Code example: see complete pages/sdk/javascript/api/interfaces/TypeSafeClientConfig.md]

Default model; falls back to `TYPESAFE_DEFAULT_MODEL`, then `jev-latest`.

***

### fetch?

[Code example: see complete pages/sdk/javascript/api/interfaces/TypeSafeClientConfig.md]

Custom HTTP fetch implementation for transport configuration or tests. Default: global `fetch`.

***

### logger?

[Code example: see complete pages/sdk/javascript/api/interfaces/TypeSafeClientConfig.md]

Logger filtered to `logLevel` and above. Default: prefixed `console`.

***

### logLevel?

[Code example: see complete pages/sdk/javascript/api/interfaces/TypeSafeClientConfig.md]

Log level; falls back to `TYPESAFE_LOG_LEVEL`, then `warn`.
`info` logs request summaries; `debug` adds headers and bodies.
Known credential headers are redacted; bodies are not.

***

### retry?

[Code example: see complete pages/sdk/javascript/api/interfaces/TypeSafeClientConfig.md]

Retry overrides; omitted fields use the defaults in `RetryPolicy`.

***

### timeout?

[Code example: see complete pages/sdk/javascript/api/interfaces/TypeSafeClientConfig.md]

Timeout per attempt in milliseconds, without a total retry budget. Default: 10000.




# Interface: Usage
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/Usage



Token usage for a request.

## Properties

### input\_tokens

[Code example: see complete pages/sdk/javascript/api/interfaces/Usage.md]

Number of input tokens used.

***

### output\_tokens

[Code example: see complete pages/sdk/javascript/api/interfaces/Usage.md]

Number of output tokens used.




# Interface: WithResponse<T>
Source: https://docs.typesafe.ai/sdk/javascript/api/interfaces/WithResponse



Parsed data with its HTTP response and request ID.

## Type Parameters

### T

`T`

## Properties

### data

[Code example: see complete pages/sdk/javascript/api/interfaces/WithResponse.md]

The parsed response body.

***

### requestId

[Code example: see complete pages/sdk/javascript/api/interfaces/WithResponse.md]

Request ID from `x-typesafe-request-id`, or `undefined` when absent.

***

### response

[Code example: see complete pages/sdk/javascript/api/interfaces/WithResponse.md]

The HTTP response, with its body consumed by parsing.




# Type Alias: ChoiceCriteria
Source: https://docs.typesafe.ai/sdk/javascript/api/type-aliases/ChoiceCriteria



[Code example: see complete pages/sdk/javascript/api/type-aliases/ChoiceCriteria.md]

Labels mapped to descriptions, or `null` for undescribed labels.

## Index Signature

[Code example: see complete pages/sdk/javascript/api/type-aliases/ChoiceCriteria.md]




# Type Alias: Description
Source: https://docs.typesafe.ai/sdk/javascript/api/type-aliases/Description



[Code example: see complete pages/sdk/javascript/api/type-aliases/Description.md]

A criterion description; `null` leaves the label undescribed.




# Type Alias: EntryType
Source: https://docs.typesafe.ai/sdk/javascript/api/type-aliases/EntryType



[Code example: see complete pages/sdk/javascript/api/type-aliases/EntryType.md]

Text, a JSON object or array, or `null` for state, instructions, and criteria.




# Type Alias: EnvVar
Source: https://docs.typesafe.ai/sdk/javascript/api/type-aliases/EnvVar



[Code example: see complete pages/sdk/javascript/api/type-aliases/EnvVar.md]




# Type Alias: Fetch
Source: https://docs.typesafe.ai/sdk/javascript/api/type-aliases/Fetch



[Code example: see complete pages/sdk/javascript/api/type-aliases/Fetch.md]

HTTP fetch implementation compatible with the global `fetch`.

## Parameters

### input

`string`

### init?

`RequestInit`

## Returns

`Promise`\<`Response`>




# Type Alias: JsonValue
Source: https://docs.typesafe.ai/sdk/javascript/api/type-aliases/JsonValue



[Code example: see complete pages/sdk/javascript/api/type-aliases/JsonValue.md]

A JSON-compatible value.




# Type Alias: LogLevel
Source: https://docs.typesafe.ai/sdk/javascript/api/type-aliases/LogLevel



[Code example: see complete pages/sdk/javascript/api/type-aliases/LogLevel.md]

Log verbosity; `off` disables logging.


