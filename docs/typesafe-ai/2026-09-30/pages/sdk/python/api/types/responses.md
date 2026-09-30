# Answers and responses
Source: https://docs.typesafe.ai/sdk/python/api/types/responses

Read answers, confidence scores, token usage, and available models returned by the TypeSafe API.

## Response

## typesafe\_sdk.SystemOneResponse

`pydantic-model`

Bases: `Response`

Answers grouped by question type with model and usage metadata.

See [System One](https://docs.typesafe.ai/concepts/system-one) for details.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
    ```json theme={null}
    {
      "$defs": {
        "ChoiceAnswer": {
          "description": "A selected label and its probabilities.\n\nSee the [choice primitive](https://docs.typesafe.ai/primitives/choice) for details.",
          "properties": {
            "type": {
              "const": "choice",
              "default": "choice",
              "title": "Type",
              "type": "string"
            },
            "choice": {
              "description": "The name of the choice with the highest probability among the question's criteria.",
              "examples": [
                "angry"
              ],
              "title": "Choice",
              "type": "string"
            },
            "confidence": {
              "description": "Confidence in the selected choice, from 0 to 1. Higher values indicate greater certainty; use lower values to flag uncertain selections for review.",
              "examples": [
                0.9
              ],
              "title": "Confidence",
              "type": "number"
            },
            "probabilities": {
              "additionalProperties": {
                "type": "number"
              },
              "description": "Probability of each choice in criteria, keyed by choice name, from 0 to 1. Shows how likely the alternatives are; values sum to approximately 1.",
              "examples": [
                {
                  "angry": 0.8,
                  "calm": 0.1,
                  "excited": 0.1
                }
              ],
              "title": "Probabilities",
              "type": "object"
            }
          },
          "required": [
            "choice",
            "confidence",
            "probabilities"
          ],
          "title": "ChoiceAnswer",
          "type": "object"
        },
        "NoulAnswer": {
          "description": "A yes/no answer.\n\nSee the [noul primitive](https://docs.typesafe.ai/primitives/noul) for details.",
          "properties": {
            "type": {
              "const": "noul",
              "default": "noul",
              "title": "Type",
              "type": "string"
            },
            "noul": {
              "description": "Probability of a yes answer or a true statement, from 0 to 1. Values near 1 favor yes or true, values near 0 favor no or false, and values near 0.5 indicate uncertainty.",
              "examples": [
                0.98
              ],
              "title": "Noul",
              "type": "number"
            }
          },
          "required": [
            "noul"
          ],
          "title": "NoulAnswer",
          "type": "object"
        },
        "ScoreAnswer": {
          "description": "An expected score with its rubric and probabilities.\n\nSee the [score primitive](https://docs.typesafe.ai/primitives/score) for details.",
          "properties": {
            "type": {
              "const": "score",
              "default": "score",
              "title": "Type",
              "type": "string"
            },
            "score": {
              "description": "Expected score: the probability-weighted average of the rubric levels. May fall between integer levels.",
              "examples": [
                1.7
              ],
              "title": "Score",
              "type": "number"
            },
            "confidence": {
              "description": "Confidence in the score, from 0 to 1. Higher values indicate greater certainty; use lower values to flag uncertain ratings for review.",
              "examples": [
                0.9
              ],
              "title": "Confidence",
              "type": "number"
            },
            "legend": {
              "additionalProperties": {
                "anyOf": [
                  {
                    "type": "string"
                  },
                  {
                    "additionalProperties": true,
                    "type": "object"
                  },
                  {
                    "items": {},
                    "type": "array"
                  }
                ]
              },
              "title": "Legend",
              "type": "object"
            },
            "probabilities": {
              "additionalProperties": {
                "type": "number"
              },
              "title": "Probabilities",
              "type": "object"
            }
          },
          "required": [
            "score",
            "confidence",
            "legend",
            "probabilities"
          ],
          "title": "ScoreAnswer",
          "type": "object"
        },
        "Usage": {
          "description": "Token counts for a request, when reported by the API.",
          "properties": {
            "input_tokens": {
              "anyOf": [
                {
                  "type": "integer"
                },
                {
                  "type": "null"
                }
              ],
              "default": null,
              "title": "Input Tokens"
            },
            "output_tokens": {
              "anyOf": [
                {
                  "type": "integer"
                },
                {
                  "type": "null"
                }
              ],
              "default": null,
              "title": "Output Tokens"
            }
          },
          "title": "Usage",
          "type": "object"
        }
      },
      "description": "Answers grouped by question type with model and usage metadata.\n\nSee [System One](https://docs.typesafe.ai/concepts/system-one) for details.",
      "properties": {
        "model": {
          "title": "Model",
          "type": "string"
        },
        "usage": {
          "$ref": "#/$defs/Usage"
        },
        "answers": {
          "additionalProperties": {
            "discriminator": {
              "mapping": {
                "choice": "#/$defs/ChoiceAnswer",
                "noul": "#/$defs/NoulAnswer",
                "score": "#/$defs/ScoreAnswer"
              },
              "propertyName": "type"
            },
            "oneOf": [
              {
                "$ref": "#/$defs/NoulAnswer"
              },
              {
                "$ref": "#/$defs/ChoiceAnswer"
              },
              {
                "$ref": "#/$defs/ScoreAnswer"
              }
            ]
          },
          "title": "Answers",
          "type": "object"
        }
      },
      "required": [
        "model",
        "usage"
      ],
      "title": "SystemOneResponse",
      "type": "object"
    }
    ```
  </Accordion>
</Note>

Config:

* `extra`: `ignore`
* `frozen`: `True`
* `strict`: `True`

Fields:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.SystemOneResponse.model">model</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a></code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.SystemOneResponse.usage">usage</a></code> (<code><a href="/sdk/python/api/types/responses#typesafe_sdk.Usage">Usage</a></code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.SystemOneResponse.answers">answers</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#dict">dict</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="/sdk/python/api/types/responses#typesafe_sdk.Answer">Answer</a>]</code>)

### request\_id

`cached` `property`

The `x-typesafe-request-id` response header.

### raw\_http\_response

`property`

```python theme={null}
raw_http_response: httpx2.Response
```

The underlying `httpx2.Response`, exposing status, headers, and body.

### model\_config

`class-attribute` `instance-attribute`

```python theme={null}
model_config = ConfigDict(
    extra="ignore", frozen=True, strict=True
)
```

### model

`pydantic-field`

The model used to answer the request.

### usage

`pydantic-field`

Token usage for the request.

### answers

`pydantic-field`

All answer objects keyed by question name.

### nouls

`cached` `property`

Yes/no answers keyed by question name.

### choices

`cached` `property`

Choice answers keyed by question name.

### scores

`cached` `property`

Score answers keyed by question name.

## typesafe\_sdk.Usage

`pydantic-model`

Bases: `wire.Usage`

Token counts for a request, when reported by the API.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
    ```json theme={null}
    {
      "description": "Token counts for a request, when reported by the API.",
      "properties": {
        "input_tokens": {
          "anyOf": [
            {
              "type": "integer"
            },
            {
              "type": "null"
            }
          ],
          "default": null,
          "title": "Input Tokens"
        },
        "output_tokens": {
          "anyOf": [
            {
              "type": "integer"
            },
            {
              "type": "null"
            }
          ],
          "default": null,
          "title": "Output Tokens"
        }
      },
      "title": "Usage",
      "type": "object"
    }
    ```
  </Accordion>
</Note>

Config:

* `extra`: `ignore`
* `frozen`: `True`
* `strict`: `True`

Fields:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.Usage.input_tokens">input\_tokens</a></code> (<code><a href="https://docs.python.org/3/builtins/functions.html#int">int</a> | None</code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.Usage.output_tokens">output\_tokens</a></code> (<code><a href="https://docs.python.org/3/builtins/functions.html#int">int</a> | None</code>)

### model\_config

`class-attribute` `instance-attribute`

```python theme={null}
model_config = ConfigDict(
    extra="ignore", frozen=True, strict=True
)
```

### input\_tokens

`pydantic-field`

Number of input tokens used, or `None` when the API did not report it.

### output\_tokens

`pydantic-field`

Number of output tokens used, or `None` when the API did not report it.

## Answers

## typesafe\_sdk.NoulAnswer

`pydantic-model`

Bases: `wire.NoulAnswer`

A yes/no answer.

See the [noul primitive](https://docs.typesafe.ai/primitives/noul) for details.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
    ```json theme={null}
    {
      "description": "A yes/no answer.\n\nSee the [noul primitive](https://docs.typesafe.ai/primitives/noul) for details.",
      "properties": {
        "type": {
          "const": "noul",
          "default": "noul",
          "title": "Type",
          "type": "string"
        },
        "noul": {
          "description": "Probability of a yes answer or a true statement, from 0 to 1. Values near 1 favor yes or true, values near 0 favor no or false, and values near 0.5 indicate uncertainty.",
          "examples": [
            0.98
          ],
          "title": "Noul",
          "type": "number"
        }
      },
      "required": [
        "noul"
      ],
      "title": "NoulAnswer",
      "type": "object"
    }
    ```
  </Accordion>
</Note>

Config:

* `extra`: `ignore`
* `frozen`: `True`
* `strict`: `True`

Fields:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.NoulAnswer.noul">noul</a></code> (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a></code>)
* `type` (<code><a href="https://docs.python.org/3/library/typing.html#typing.Literal">Literal</a>\['noul']</code>)

### noul

`pydantic-field`

Probability of a yes answer or a true statement, from 0 to 1. Values near 1 favor yes or true, values near 0 favor no or false, and values near 0.5 indicate uncertainty.

### model\_config

`class-attribute` `instance-attribute`

```python theme={null}
model_config = ConfigDict(
    extra="ignore", frozen=True, strict=True
)
```

## typesafe\_sdk.ChoiceAnswer

`pydantic-model`

Bases: `wire.ChoiceAnswer`

A selected label and its probabilities.

See the [choice primitive](https://docs.typesafe.ai/primitives/choice) for details.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
    ```json theme={null}
    {
      "description": "A selected label and its probabilities.\n\nSee the [choice primitive](https://docs.typesafe.ai/primitives/choice) for details.",
      "properties": {
        "type": {
          "const": "choice",
          "default": "choice",
          "title": "Type",
          "type": "string"
        },
        "choice": {
          "description": "The name of the choice with the highest probability among the question's criteria.",
          "examples": [
            "angry"
          ],
          "title": "Choice",
          "type": "string"
        },
        "confidence": {
          "description": "Confidence in the selected choice, from 0 to 1. Higher values indicate greater certainty; use lower values to flag uncertain selections for review.",
          "examples": [
            0.9
          ],
          "title": "Confidence",
          "type": "number"
        },
        "probabilities": {
          "additionalProperties": {
            "type": "number"
          },
          "description": "Probability of each choice in criteria, keyed by choice name, from 0 to 1. Shows how likely the alternatives are; values sum to approximately 1.",
          "examples": [
            {
              "angry": 0.8,
              "calm": 0.1,
              "excited": 0.1
            }
          ],
          "title": "Probabilities",
          "type": "object"
        }
      },
      "required": [
        "choice",
        "confidence",
        "probabilities"
      ],
      "title": "ChoiceAnswer",
      "type": "object"
    }
    ```
  </Accordion>
</Note>

Config:

* `extra`: `ignore`
* `frozen`: `True`
* `strict`: `True`

Fields:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ChoiceAnswer.choice">choice</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a></code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ChoiceAnswer.confidence">confidence</a></code> (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a></code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ChoiceAnswer.probabilities">probabilities</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#dict">dict</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="https://docs.python.org/3/builtins/functions.html#float">float</a>]</code>)
* `type` (<code><a href="https://docs.python.org/3/library/typing.html#typing.Literal">Literal</a>\['choice']</code>)

### choice

`pydantic-field`

The name of the choice with the highest probability among the question's criteria.

### confidence

`pydantic-field`

Confidence in the selected choice, from 0 to 1. Higher values indicate greater certainty; use lower values to flag uncertain selections for review.

### probabilities

`pydantic-field`

Probability of each choice in criteria, keyed by choice name, from 0 to 1. Shows how likely the alternatives are; values sum to approximately 1.

### model\_config

`class-attribute` `instance-attribute`

```python theme={null}
model_config = ConfigDict(
    extra="ignore", frozen=True, strict=True
)
```

## typesafe\_sdk.ScoreAnswer

`pydantic-model`

Bases: `wire.ScoreAnswer`

An expected score with its rubric and probabilities.

See the [score primitive](https://docs.typesafe.ai/primitives/score) for details.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
    ```json theme={null}
    {
      "description": "An expected score with its rubric and probabilities.\n\nSee the [score primitive](https://docs.typesafe.ai/primitives/score) for details.",
      "properties": {
        "type": {
          "const": "score",
          "default": "score",
          "title": "Type",
          "type": "string"
        },
        "score": {
          "description": "Expected score: the probability-weighted average of the rubric levels. May fall between integer levels.",
          "examples": [
            1.7
          ],
          "title": "Score",
          "type": "number"
        },
        "confidence": {
          "description": "Confidence in the score, from 0 to 1. Higher values indicate greater certainty; use lower values to flag uncertain ratings for review.",
          "examples": [
            0.9
          ],
          "title": "Confidence",
          "type": "number"
        },
        "legend": {
          "additionalProperties": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "additionalProperties": true,
                "type": "object"
              },
              {
                "items": {},
                "type": "array"
              }
            ]
          },
          "title": "Legend",
          "type": "object"
        },
        "probabilities": {
          "additionalProperties": {
            "type": "number"
          },
          "title": "Probabilities",
          "type": "object"
        }
      },
      "required": [
        "score",
        "confidence",
        "legend",
        "probabilities"
      ],
      "title": "ScoreAnswer",
      "type": "object"
    }
    ```
  </Accordion>
</Note>

Config:

* `extra`: `ignore`
* `frozen`: `True`
* `strict`: `True`

Fields:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ScoreAnswer.score">score</a></code> (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a></code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ScoreAnswer.confidence">confidence</a></code> (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a></code>)
* `type` (<code><a href="https://docs.python.org/3/library/typing.html#typing.Literal">Literal</a>\['score']</code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ScoreAnswer.legend">legend</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#dict">dict</a>\[<a href="https://docs.python.org/3/builtins/functions.html#int">int</a>, <a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a> | <a href="https://docs.python.org/3/builtins/stdtypes.html#dict">dict</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="https://docs.python.org/3/library/typing.html#typing.Any">Any</a>] | <a href="https://docs.python.org/3/builtins/stdtypes.html#list">list</a>\[<a href="https://docs.python.org/3/library/typing.html#typing.Any">Any</a>]]</code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ScoreAnswer.probabilities">probabilities</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#dict">dict</a>\[<a href="https://docs.python.org/3/builtins/functions.html#int">int</a>, <a href="https://docs.python.org/3/builtins/functions.html#float">float</a>]</code>)

### score

`pydantic-field`

Expected score: the probability-weighted average of the rubric levels. May fall between integer levels.

### confidence

`pydantic-field`

Confidence in the score, from 0 to 1. Higher values indicate greater certainty; use lower values to flag uncertain ratings for review.

### model\_config

`class-attribute` `instance-attribute`

```python theme={null}
model_config = ConfigDict(
    extra="ignore", frozen=True, strict=True
)
```

### legend

`pydantic-field`

Rubric descriptions keyed by integer score.

### probabilities

`pydantic-field`

Probabilities keyed by integer score.

## typesafe\_sdk.Answer

`module-attribute`

An answer to a single question, identified by its `type`.

## Available models

## typesafe\_sdk.ListModelsResponse

`pydantic-model`

Bases: `Response`

The models available to the account.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
    ```json theme={null}
    {
      "$defs": {
        "ModelMetadata": {
          "description": "Metadata describing a single available model.",
          "properties": {
            "name": {
              "title": "Name",
              "type": "string"
            },
            "description": {
              "title": "Description",
              "type": "string"
            },
            "release_date": {
              "title": "Release Date",
              "type": "string"
            }
          },
          "required": [
            "name",
            "description",
            "release_date"
          ],
          "title": "ModelMetadata",
          "type": "object"
        }
      },
      "description": "The models available to the account.",
      "properties": {
        "models": {
          "items": {
            "$ref": "#/$defs/ModelMetadata"
          },
          "title": "Models",
          "type": "array"
        }
      },
      "required": [
        "models"
      ],
      "title": "ListModelsResponse",
      "type": "object"
    }
    ```
  </Accordion>
</Note>

Fields:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ListModelsResponse.models">models</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#tuple">tuple</a>\[<a href="/sdk/python/api/types/responses#typesafe_sdk.ModelMetadata">ModelMetadata</a>, ...]</code>)

### request\_id

`cached` `property`

The `x-typesafe-request-id` response header.

### raw\_http\_response

`property`

```python theme={null}
raw_http_response: httpx2.Response
```

The underlying `httpx2.Response`, exposing status, headers, and body.

### model\_config

`class-attribute` `instance-attribute`

```python theme={null}
model_config = ConfigDict(
    extra="ignore", frozen=True, strict=True
)
```

### models

`pydantic-field`

The available models.

## typesafe\_sdk.ModelMetadata

`pydantic-model`

Bases: `Schema`

Metadata describing a single available model.

<Note>
  **Show JSON schema:**

  <Accordion title="Details">
    ```json theme={null}
    {
      "description": "Metadata describing a single available model.",
      "properties": {
        "name": {
          "title": "Name",
          "type": "string"
        },
        "description": {
          "title": "Description",
          "type": "string"
        },
        "release_date": {
          "title": "Release Date",
          "type": "string"
        }
      },
      "required": [
        "name",
        "description",
        "release_date"
      ],
      "title": "ModelMetadata",
      "type": "object"
    }
    ```
  </Accordion>
</Note>

Fields:

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ModelMetadata.name">name</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a></code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ModelMetadata.description">description</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a></code>)
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ModelMetadata.release_date">release\_date</a></code> (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a></code>)

### name

`pydantic-field`

Model name or alias accepted by a request's model field.

### description

`pydantic-field`

Human-readable description of the model and its capabilities.

### release\_date

`pydantic-field`

Model release date, formatted as YYYY-MM-DD.


