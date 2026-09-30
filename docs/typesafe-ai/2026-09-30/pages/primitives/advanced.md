# Advanced: structure
Source: https://docs.typesafe.ai/primitives/advanced

Instructions, Choice options, Score levels, and Noul criteria all accept JSON structure.

System One models are trained to understand structure.

## Where structure is allowed

Every one of these fields is an [`EntryType`](/sdk/javascript/api/type-aliases/EntryType).

| Field                                   | Applies to          | Accepted shape                         |
| --------------------------------------- | ------------------- | -------------------------------------- |
| `instructions`                          | Choice, Score, Noul | `string`, `object`, `array`, or `null` |
| `criteria` values (option descriptions) | Choice              | `string`, `object`, `array`, or `null` |
| `criteria` entries (level descriptions) | Score               | `string`, `object`, `array`, or `null` |
| `criteria.true` and `criteria.false`    | Noul                | `string`, `object`, `array`, or `null` |

## When to structure a question

* **When it helps with clarity.** When a question has multiple parts, putting them in the form of JSON helps with clarity because the keys are labeled.
* **When question needs supporting data.** A schema, a taxonomy, or a database row is already JSON. Use the JSON entirely or pass in the relevant subfields instead of serializing them into a string template.

## Structured instructions

One `field` object describes the field being checked, and each question refers to it by key. The same shape drives a Noul that verifies a value, a Choice that picks one from candidates, and two Scores that place a value on a scale.

<TypesafeExample />

In code, you could loop over the potential records and build one of these questions per field, all sent in a single call. The [SDE cascade cookbook](/cookbooks/sde_cascade) does something similar to this.

Arrays work too. Use one when the instruction is a list of things to check or to compare:

```json theme={null}
"instructions": {
  "question": "Does the claimed sender identity conflict with the sending domain?",
  "compare": ["ticket.sender.display_name", "ticket.sender.email"],
  "focus": "Compare the named organization with the email domain."
}
```

## Structured Choice options

A Choice option description can be a structured object as well.

### JSON rubric for boundary clarification

<TypesafeExample />

The example tells the model what each option does and does *not* cover. It sharpens the boundary between options.

### Walking a taxonomy

To classify into a deep taxonomy, ask one Choice per level and walk the tree in code. At each step the options are the children of the current node, and each option's value is the child's tree. Doing so lets the model see what lives under a branch before committing to it, which matters when the item belongs to a leaf whose name is not obvious from the branch name alone.

Here the state is a product listing and the first question picks a top-level department.

<TypesafeExample />

The bottle plausibly fits under two departments. Showing the subtrees lets the model see that both `Sporting Goods > Cycling > Bike Bottles & Cages` and `Home & Kitchen > Drinkware > Water Bottles` exist, and weigh the listing's emphasis on bike cages against everyday drinkware. The `probabilities` on this answer tell you whether the split is close enough to explore both branches.

Once a department is chosen, ask the next Choice with that department's children as the options and their subtrees as the values, and repeat until you reach a leaf. In code this could be a loop over a nested dict, where each question's `criteria` is simply the current node. The [Hierarchical Classification cookbook](/cookbooks/hierarchical_classification) shows an example of a similar walk of the tree, including a beam search that keeps several candidate paths alive when the probabilities are close.

<Note>
  Subtrees can get large. If a branch is too large, trim the value to its direct children and a sample of leaves.
</Note>

## Structured Score levels

Each entry in a Score `criteria` array can be an object.

<TypesafeExample />

## Structured Noul criteria

Noul `criteria` is optional, and when the yes/no boundary is subtle, structured `true` and `false` descriptions let you pin it down with a definition and examples on each side.

<TypesafeExample />


