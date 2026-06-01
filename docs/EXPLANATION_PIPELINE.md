# Explanation Pipeline

Indica uses DeepSeek to write prose after data has been fetched and locked. The model is not a data source. It receives a limited evidence packet built from local artifacts and must return structured JSON containing a short explanation and a longer article.

DeepSeek's API is called through its OpenAI-compatible `POST /chat/completions` endpoint with `response_format: { "type": "json_object" }`.

## Output Levels

Each question gets two written layers:

1. `short`: a headline, dek, and 90-150 word explanation for chart pages.
2. `article`: a 900-1400 word article that is scholarly in structure but written for a general reader.

If data coverage is weak, the article must say so and the artifact should use `status: "needs_data"`.

## Guardrails

The prompt enforces these rules:

- Use only numbers from the evidence packet.
- Do not invent current-year values.
- Do not infer causes from trends without evidence.
- Do not mention state, district, or city patterns unless the evidence includes those geographies.
- Avoid common AI prose patterns and filler transitions.
- Explain measure definitions and limitations plainly.

## Workflow

Generate evidence packets without using API credits:

```bash
npm run explain:v1:dry-run
```

Generate prose for a small batch:

```bash
npm run explain:v1 -- --limit=2
```

Generate selected questions:

```bash
npm run explain:v1 -- --questions=q.econ.size,q.health.life
```

Validate generated prose artifacts:

```bash
npm run explain:v1:sanitize
npm run explain:v1:validate
```

Artifacts are written to:

```text
data/explanations/en/<question-id>.json
```

Each explanation stores the evidence packet used to generate it. That makes prose review possible without re-running the model.
