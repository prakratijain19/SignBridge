"""Train the ISL static-sign classifier and export it to TensorFlow.js.

This is an OFFLINE tool. Live recognition runs entirely in the browser; this
script only turns collected samples into a model the web app can load.

Pipeline:
  1. Load a dataset (local JSON or the /api/sign-samples/export endpoint).
  2. Train a small Keras MLP on the 86-dim normalized landmark features.
  3. Export to apps/web/public/models/isl/ as model.json + weights, plus a
     labels.json mapping class index -> label.

Usage:
  python -m app.train_isl --dataset dataset.json
  python -m app.train_isl --from-api http://localhost:4000 --token <JWT>

The dataset shape matches /api/sign-samples/export:
  { "labels": [...], "samples": [ { "label": "hello", "features": [...86...] } ] }
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.metrics import confusion_matrix
from sklearn.model_selection import train_test_split

# Must match SIGN_FEATURE_LENGTH in packages/shared-types.
FEATURE_LENGTH = 86
# Refuse to train below this many samples for any present label.
DEFAULT_MIN_PER_LABEL = 20
# Recommended for a usable model.
RECOMMENDED_PER_LABEL = 40

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OUT = REPO_ROOT / "apps" / "web" / "public" / "models" / "isl"


def load_local(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def load_from_api(base_url: str, token: str) -> dict:
    url = base_url.rstrip("/") + "/api/sign-samples/export"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as resp:  # noqa: S310 - operator-supplied URL
        payload = json.loads(resp.read().decode("utf-8"))
    # The API wraps data in the ApiResponse envelope.
    if isinstance(payload, dict) and "data" in payload:
        return payload["data"]
    return payload


def build_model(num_features: int, num_classes: int) -> tf.keras.Model:
    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(num_features,)),
            tf.keras.layers.Dense(128, activation="relu"),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(64, activation="relu"),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(num_classes, activation="softmax"),
        ]
    )
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main() -> int:
    parser = argparse.ArgumentParser(description="Train the ISL sign classifier.")
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--dataset", type=Path, help="Path to a local dataset.json.")
    source.add_argument("--from-api", dest="from_api", help="API base URL to export from.")
    parser.add_argument("--token", help="JWT access token (required with --from-api).")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="Output directory.")
    parser.add_argument("--epochs", type=int, default=60)
    parser.add_argument("--min-per-label", type=int, default=DEFAULT_MIN_PER_LABEL)
    args = parser.parse_args()

    if args.from_api:
        if not args.token:
            parser.error("--token is required with --from-api")
        data = load_from_api(args.from_api, args.token)
    else:
        data = load_local(args.dataset)

    samples = data.get("samples", [])
    if not samples:
        print("No samples found. Collect samples in the app first.", file=sys.stderr)
        return 1

    # Validate feature length and tally per-label counts.
    counts: dict[str, int] = {}
    for s in samples:
        feats = s.get("features", [])
        if len(feats) != FEATURE_LENGTH:
            print(
                f"Sample for '{s.get('label')}' has {len(feats)} features, "
                f"expected {FEATURE_LENGTH}. Aborting.",
                file=sys.stderr,
            )
            return 1
        counts[s["label"]] = counts.get(s["label"], 0) + 1

    labels = sorted(counts)
    if len(labels) < 2:
        print("Need at least 2 distinct labels to train a classifier.", file=sys.stderr)
        return 1

    too_few = {lbl: n for lbl, n in counts.items() if n < args.min_per_label}
    if too_few:
        print("Not enough samples for some labels:", file=sys.stderr)
        for lbl, n in sorted(too_few.items()):
            print(f"  {lbl}: {n} (need >= {args.min_per_label})", file=sys.stderr)
        print(
            f"Collect more samples (>= {RECOMMENDED_PER_LABEL} per label is recommended) "
            "and try again.",
            file=sys.stderr,
        )
        return 1

    label_to_index = {lbl: i for i, lbl in enumerate(labels)}
    x = np.array([s["features"] for s in samples], dtype="float32")
    y = np.array([label_to_index[s["label"]] for s in samples], dtype="int64")

    print(f"Loaded {len(x)} samples across {len(labels)} labels: {labels}")

    x_train, x_val, y_train, y_val = train_test_split(
        x, y, test_size=0.2, random_state=42, stratify=y
    )

    # Class-balance weighting so under-represented labels still get learned.
    class_weight = {
        i: len(y_train) / (len(labels) * int(np.sum(y_train == i)))
        for i in range(len(labels))
        if int(np.sum(y_train == i)) > 0
    }

    model = build_model(FEATURE_LENGTH, len(labels))
    started = time.time()
    model.fit(
        x_train,
        y_train,
        validation_data=(x_val, y_val),
        epochs=args.epochs,
        batch_size=32,
        class_weight=class_weight,
        verbose=2,
    )
    elapsed = time.time() - started

    loss, acc = model.evaluate(x_val, y_val, verbose=0)
    print(f"\nValidation accuracy: {acc:.3f} (loss {loss:.3f})")
    print(f"Training time: {elapsed:.1f}s on CPU ({args.epochs} epochs).")

    preds = np.argmax(model.predict(x_val, verbose=0), axis=1)
    print("\nConfusion matrix (rows = true, cols = predicted):")
    print("labels:", labels)
    print(confusion_matrix(y_val, preds))

    out_dir: Path = args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    # Export plain weights JSON (no tensorflowjs dependency). The browser rebuilds
    # the same MLP in TF.js and calls setWeights() with these arrays in order.
    # Dropout layers carry no weights and are skipped; each Dense layer contributes
    # one { units, activation, W (2D), b (1D) } entry.
    exported_layers = []
    for layer in model.layers:
        layer_weights = layer.get_weights()
        if len(layer_weights) != 2:
            continue  # input/dropout layers have no trainable weights
        kernel, bias = layer_weights
        exported_layers.append(
            {
                "units": int(layer.units),
                "activation": tf.keras.activations.serialize(layer.activation),
                "W": kernel.tolist(),
                "b": bias.tolist(),
            }
        )

    weights_payload = {
        "featureLength": FEATURE_LENGTH,
        "labels": labels,
        "layers": exported_layers,
    }
    (out_dir / "weights.json").write_text(json.dumps(weights_payload), encoding="utf-8")
    (out_dir / "labels.json").write_text(json.dumps(labels), encoding="utf-8")

    print(f"\nExported weights.json + labels.json to {out_dir}")
    print("Refresh the /sign page in the web app to load it.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
