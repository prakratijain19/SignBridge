# SignBridge ML Service

Python / FastAPI service responsible for **offline** work in the SignBridge
pipeline:

- ISL dataset ingestion and MediaPipe landmark extraction
- Model training (TensorFlow)
- Exporting trained models to **TensorFlow.js** format for in-browser inference

Per the Phase 0 architecture decision, **live recognition runs in the browser**
(MediaPipe + TF.js). This service is not on the real-time request path for the
MVP — it exists for training and dataset tooling, plus a health endpoint so it
participates in the monorepo and Docker Compose from Phase 1.

## Local development

```bash
cd services/ml
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -e ".[dev]"            # add ",train" when working on Phase 5
uvicorn app.main:app --reload --port 8000
```

Visit http://localhost:8000/health and http://localhost:8000/docs.

## Tests

```bash
pytest
```
