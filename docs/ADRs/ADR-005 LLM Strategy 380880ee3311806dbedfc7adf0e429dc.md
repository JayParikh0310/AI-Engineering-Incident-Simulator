# ADR-005 LLM Strategy

## Status

Accepted

## Context

The platform requires AI evaluation of debugging attempts.

Future versions may also use AI for recommendations, mentoring, and incident generation.

The architecture should avoid vendor lock-in and support changing models without rewriting application logic.

## Decision

The application will use an LLM Provider abstraction.

The backend communicates only with:

```python
LLMProvider
```

The provider implementation is responsible for interacting with external APIs.

## V1 Model Strategy

Provider:

OpenRouter

Primary Model:

Qwen3 32B

Fallback Model:

DeepSeek V3

Temperature:

0.1

## Evaluation Strategy

Each submission triggers exactly one LLM evaluation call.

The LLM returns structured JSON.

The backend determines:

- pass/fail
- skill updates
- incident completion

The backend generates reports.

No additional LLM call is used for report generation.

## Structured Output

The evaluator returns:

- root_cause_fixed
- introduced_new_issues
- confidence
- concepts_demonstrated
- concepts_missing
- summary
- feedback

Outputs are validated using Pydantic schemas.

## Future Expansion

Future versions may introduce:

- AI mentor
- Recommendation engine
- Dynamic incident generation

These may use different models while preserving the same provider abstraction.