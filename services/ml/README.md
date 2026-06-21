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

## ISL recognition — training loop (Phase 5)

Live recognition runs in the browser (MediaPipe + TF.js). This service trains the
classifier offline and exports it into the web app's `public/` folder.

The full loop:

1. **Collect** samples in the web app at `/sign/collect` — pick a label, show the
   sign to your webcam, and capture. Aim for **≥ 40 samples per label** across
   varied lighting, angles, and signers.
2. **Export + train.** Install training deps, then run the trainer against either
   a local dataset file or the running API:

   ```bash
   cd services/ml
   pip install -e ".[train,dev]"

   # Option A — from the running API (uses your access token):
   python -m app.train_isl --from-api http://localhost:4000 --token <JWT>

   # Option B — from a local file shaped like /api/sign-samples/export:
   python -m app.train_isl --dataset dataset.json
   ```

   The script trains a small Keras MLP on the 86-dim normalized landmark
   features, prints validation accuracy + a confusion matrix, and **refuses to
   train** if any label has too few samples.

3. **Model lands in the web app.** It exports to
   `apps/web/public/models/isl/` as `model.json` + weight shards, plus
   `labels.json` (class index → label).
4. **Refresh** the `/sign` page — it loads the model and recognizes held signs.

Before any model exists, `/sign` shows a "model not trained yet" state and links
to the collection tool — the app never crashes on a missing model.

> The model weight files under `apps/web/public/models/isl/` are git-ignored
> (they are build artifacts); `labels.json` is committed via a `.gitkeep`'d
> folder so the path always exists.
