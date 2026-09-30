# Speculative fan-out
Source: https://docs.typesafe.ai/patterns/fan-out

Send many questions in a single call, including speculative ones, and let your code decide what's relevant.

Because TypeSafe supports sending many questions in a single API call, we recommend putting all of the questions your system needs in a single request, and then using code to decide what is relevant after the fact. All questions are evaluated in parallel, so adding more questions usually has little effect on response time.

## Example: support ticket triage

Let's imagine you are building a support system that needs to triage support tickets. You need to classify the ticket into a category. If it's a bug report, you also need to determine the severity of the bug.

Instead of asking for the category first and then the severity in a follow-up call, you can ask for both at the same time. If the ticket is not a bug report, you simply ignore the results of the bug severity question.

```mermaid actions={true} theme={null}
%%{init: {"fontFamily": "Inter, sans-serif", "flowchart": {"rankSpacing": 35, "wrappingWidth": 300, "subGraphTitleMargin": {"top": 8, "bottom": 60}}}}%%
flowchart LR
    t["support ticket"]

    subgraph req["TypeSafe AI model<br/>evaluates each question<br/>against the ticket in parallel"]
        direction TB
        c["<b>Choice:</b> category"]
        b["<b>Score:</b> bug severity"]
        r["<b>Noul:</b> reproducible steps?"]
        f["<b>Noul:</b> refund requested?"]
        s["<b>Score:</b> frustration"]
        %% invisible links: without an edge these share a rank and sit side by side
        c ~~~ b ~~~ r ~~~ f ~~~ s
    end

    t -- "one request<br/>ticket + 5 questions" --> req
    req -- "one response: 5 answers<br/>decisions + probabilities" --> route{"<b>filter, combine, and route</b><br/>in your code"}
    route -- "bug_report" --> eng["read severity + repro steps<br/>escalate or backlog"]
    route -- "billing" --> bill["refund requested<br/>send to billing"]
    route -- "feature_request" --> feat["log it<br/>sent to devs"]
```

### Step 1: speculative fan-out

<TypesafeExample title="questions" />

<Note>
  **Speculative questions:** `bug_severity` and `has_reproducible_steps` only matter if the ticket is a bug report. `refund_requested` only matters for billing. We include all upfront because additional questions usually have little effect on response time. If the ticket turns out to be a feature request, the bug severity result will be irrelevant, in which case your code path simply ignores it.
</Note>

### Step 2: route with code

Your code decides what is relevant based on the classification result:

```python title="triage.py" theme={null}
category = response.answers["category"]
bug_severity = response.answers["bug_severity"]
bug_repro = response.answers["has_reproducible_steps"]
refund = response.answers["refund_requested"]
frustration = response.answers["frustration"]

if category.choice == "bug_report":
    if bug_severity.score > 1.5 and bug_repro.noul > 0.6:
        escalate_to_engineering(ticket_id, severity="high")
    else:
        add_to_bug_backlog(ticket_id)

elif category.choice == "billing":
    if refund.noul > 0.7:
        route_to_billing_with_flag(ticket_id, refund_likely=True)
    else:
        route_to_billing(ticket_id)

elif category.choice == "feature_request":
    log_feature_request(ticket_id)

# Frustration is useful regardless of category
if frustration.score > 1.5:
    flag_for_priority_response(ticket_id)
```

Everything needed for the full decision tree comes from one call. Speculative questions are ignored when irrelevant and save a round trip when they are not.


