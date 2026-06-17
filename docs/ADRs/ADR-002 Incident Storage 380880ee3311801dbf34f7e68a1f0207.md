# ADR-002 Incident Storage

incidents/

```
fastapi-001/

    public.json

    private.json

    golden/
        main.py
        routes.py
        db.py

    broken/
        main.py
        routes.py
        db.py
```

---

### public.json

Safe for frontend.

```
{
  "id":"fastapi-001",
  
  "version": 1,

  "title":"Orders API Startup Failure",

  "difficulty":"easy",

  "scenario": {...},

  "logs": [...],

  "visible_files": [
  "main.py",
  "routes.py",
  "db.py"
  ]
  "evaluation": {
    "must_fix": [
      "circular_import"
    ],

    "must_not_introduce": [
      "syntax_error"
    ]
  }
}
```

---

### private.json

Never sent to frontend.

```
{
  "root_cause": {
    "type":"circular_import"
  },

  "learning_objectives": [...],

  "skills": [...],

  "hints": [...],

  "version":1
}
```

## Canonical Public Metadata Example

```json
{
  "id": "fastapi-001",
  "version": 1,
  "title": "Orders API Startup Failure",
  "difficulty": "easy",
  "difficulty_score": 20,
  "scenario": {
    "service": "Orders API",
    "severity": "medium",
    "summary": "Service fails immediately after deployment."
  },
  "logs": [
    "ImportError: cannot import router"
  ],
  "visible_files": [
    "main.py",
    "routes.py",
    "db.py"
  ]
}
```

## Canonical Private Metadata Example

```json
{
  "root_cause": {
    "type": "circular_import",
    "description": "main.py and routes.py import each other"
  },
  "skills": [
    {
      "name": "imports",
      "weight": 1.0
    }
  ],
  "learning_objectives": [
    "Understand Python imports",
    "Recognize circular dependencies",
    "Debug startup failures"
  ],
  "hints": [
    {
      "level": 1,
      "text": "The issue occurs before FastAPI starts serving requests."
    },
    {
      "level": 2,
      "text": "Inspect module imports."
    }
  ]
}
```