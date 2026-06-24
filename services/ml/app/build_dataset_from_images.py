"""Convert a folder of labeled ISL images into the dataset.json the trainer reads.

Input layout (one subfolder per class):
    <root>/<label>/<image files .jpg/.png/.jpeg>

Output (exactly what train_isl.py expects):
    { "labels": [...sorted unique...], "samples": [ { "label", "features"[86] } ] }

CPU only — no GPU/CUDA required. The heavy step is MediaPipe reading each image
once.

CRITICAL: the 86-dim feature convention here MUST stay identical to the web
extractor in apps/web/src/lib/sign/landmark-features.ts:
  - per hand: translate to wrist origin, scale by wrist→middle-MCP distance in
    ORIGINAL normalized coords (unusable if ~0), keep 21 (x, y) pairs (42 values);
  - order the two hand slots by ASCENDING MEAN X (leftmost first) — NOT handedness;
  - layout [slot0_present, slot0×42, slot1_present, slot1×42]; absent = 0 + zeros;
  - images are fed un-mirrored.

Usage:
    python -m app.build_dataset_from_images --images-dir ../../path/to/isl_dataset \
        --out dataset.json
"""

from __future__ import annotations

import argparse
import json
import math
import sys
import urllib.request
from pathlib import Path

FEATURE_LENGTH = 86
VALUES_PER_HAND = 42
MIN_REF_LENGTH = 1e-6
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# Same model the web app loads (float16 hand_landmarker).
MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/1/hand_landmarker.task"
)
DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "hand_landmarker.task"


def ensure_model(path: Path) -> Path:
    if path.exists():
        return path
    path.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading hand_landmarker.task to {path} ...")
    urllib.request.urlretrieve(MODEL_URL, path)  # noqa: S310 - fixed trusted URL
    return path


def normalize_hand(landmarks: list) -> list[float] | None:
    """21 landmarks (objects with .x/.y) -> 42 normalized values, or None."""
    wrist = landmarks[0]
    mcp = landmarks[9]
    ref = math.hypot(mcp.x - wrist.x, mcp.y - wrist.y)
    if ref < MIN_REF_LENGTH:
        return None
    out: list[float] = []
    for lm in landmarks[:21]:
        out.append((lm.x - wrist.x) / ref)
        out.append((lm.y - wrist.y) / ref)
    return out


def mean_x(landmarks: list) -> float:
    return sum(lm.x for lm in landmarks[:21]) / 21.0


def build_features(hand_landmarks_list: list) -> list[float] | None:
    """Assemble the canonical 86-dim vector. None if no usable hand."""
    usable: list[tuple[float, list[float]]] = []
    for lms in hand_landmarks_list:
        if len(lms) < 21:
            continue
        norm = normalize_hand(lms)
        if norm is None:
            continue
        usable.append((mean_x(lms), norm))

    if not usable:
        return None

    usable.sort(key=lambda t: t[0])  # leftmost hand first
    usable = usable[:2]

    feats: list[float] = []
    for slot in range(2):
        if slot < len(usable):
            feats.append(1.0)
            feats.extend(usable[slot][1])
        else:
            feats.append(0.0)
            feats.extend([0.0] * VALUES_PER_HAND)
    return feats


def make_detector(model_path: Path):
    """Returns a callable(image_path) -> list of hand-landmark lists.

    Prefers MediaPipe Tasks HandLandmarker (IMAGE mode). Falls back to the legacy
    mp.solutions.hands with static_image_mode=True only if Tasks is unavailable.
    """
    try:
        import mediapipe as mp
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision

        options = vision.HandLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=str(model_path)),
            running_mode=vision.RunningMode.IMAGE,
            num_hands=2,
        )
        landmarker = vision.HandLandmarker.create_from_options(options)

        def detect(image_path: Path) -> list:
            mp_image = mp.Image.create_from_file(str(image_path))
            result = landmarker.detect(mp_image)
            return result.hand_landmarks

        print("Using MediaPipe Tasks HandLandmarker (IMAGE mode).")
        return detect
    except Exception as exc:  # noqa: BLE001 - fall back to legacy solution
        print(f"Tasks HandLandmarker unavailable ({exc}); falling back to mp.solutions.hands.")
        import cv2
        import mediapipe as mp

        hands = mp.solutions.hands.Hands(static_image_mode=True, max_num_hands=2)

        def detect(image_path: Path) -> list:
            image = cv2.imread(str(image_path))
            if image is None:
                return []
            rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            result = hands.process(rgb)
            return result.multi_hand_landmarks or []

        return detect


def main() -> int:
    parser = argparse.ArgumentParser(description="Build dataset.json from labeled images.")
    parser.add_argument("--images-dir", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=Path("dataset.json"))
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL_PATH)
    parser.add_argument("--max-per-label", type=int, default=0, help="0 = no cap.")
    args = parser.parse_args()

    root: Path = args.images_dir
    if not root.is_dir():
        print(f"Not a directory: {root}", file=sys.stderr)
        return 1

    model_path = ensure_model(args.model)
    detect = make_detector(model_path)

    labels = sorted(p.name for p in root.iterdir() if p.is_dir())
    if not labels:
        print(f"No label subfolders found in {root}", file=sys.stderr)
        return 1

    samples: list[dict] = []
    per_label: dict[str, int] = {}
    skipped = 0

    for label in labels:
        label_dir = root / label
        images = [p for p in sorted(label_dir.iterdir()) if p.suffix.lower() in IMAGE_EXTS]
        if args.max_per_label > 0:
            images = images[: args.max_per_label]
        count = 0
        for image_path in images:
            hands = detect(image_path)
            features = build_features(hands)
            if features is None or len(features) != FEATURE_LENGTH:
                skipped += 1
                continue
            samples.append({"label": label, "features": features})
            count += 1
        per_label[label] = count
        print(f"  {label}: {count} samples")

    if not samples:
        print("No usable samples extracted. Are hands visible in the images?", file=sys.stderr)
        return 1

    present_labels = sorted({s["label"] for s in samples})
    args.out.write_text(
        json.dumps({"labels": present_labels, "samples": samples}), encoding="utf-8"
    )

    print(f"\nWrote {len(samples)} samples across {len(present_labels)} labels to {args.out}")
    print(f"Skipped {skipped} images with no usable hand.")
    print("Next: python -m app.train_isl --dataset", args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
