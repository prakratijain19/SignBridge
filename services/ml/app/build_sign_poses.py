"""Build the ISL avatar pose library from the labeled image dataset.

For each label, this picks ONE clean representative hand detection (the medoid —
the real sample closest to the per-label average, NOT an average of landmarks,
which would look mushy) and stores the RAW MediaPipe landmarks in the shared
image frame (both hands, x/y/z in [0,1]).

Why raw shared-frame landmarks (not the 86-dim recognition vector): the
recognition features are wrist-centered PER HAND, which throws away the relative
position between two hands. ISL fingerspelling is often two-handed, so the avatar
needs both hands in one coordinate space; the renderer centers/scales the whole
pose together.

CPU only. Reuses the same hand_landmarker.task as training.

Usage:
    python -m app.build_sign_poses --images-dir ../../isl_dataset \
        --out ../../apps/web/public/models/isl/sign_poses.json
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

from app.build_dataset_from_images import DEFAULT_MODEL_PATH, IMAGE_EXTS, ensure_model

DEFAULT_OUT = (
    Path(__file__).resolve().parents[2]
    / "apps"
    / "web"
    / "public"
    / "models"
    / "isl"
    / "sign_poses.json"
)


def make_pose_detector(model_path: Path):
    """Returns detect(image_path) -> list of {handedness, landmarks:[[x,y,z]x21]}.

    Captures handedness (unlike the dataset detector) and keeps raw image-frame
    coordinates. Prefers MediaPipe Tasks; falls back to mp.solutions.hands.
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
            hands = []
            for i, lms in enumerate(result.hand_landmarks):
                try:
                    handed = result.handedness[i][0].category_name
                except (IndexError, AttributeError):
                    handed = "Right"
                hands.append(
                    {
                        "handedness": handed,
                        "landmarks": [[lm.x, lm.y, lm.z] for lm in lms],
                    }
                )
            return hands

        print("Using MediaPipe Tasks HandLandmarker (IMAGE mode).")
        return detect
    except Exception as exc:  # noqa: BLE001 - fall back to legacy solution
        print(f"Tasks HandLandmarker unavailable ({exc}); falling back to mp.solutions.hands.")
        import cv2
        import mediapipe as mp

        hands_solution = mp.solutions.hands.Hands(static_image_mode=True, max_num_hands=2)

        def detect(image_path: Path) -> list:
            image = cv2.imread(str(image_path))
            if image is None:
                return []
            rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            result = hands_solution.process(rgb)
            hands = []
            multi = result.multi_hand_landmarks or []
            handedness = result.multi_handedness or []
            for i, lms in enumerate(multi):
                try:
                    handed = handedness[i].classification[0].label
                except (IndexError, AttributeError):
                    handed = "Right"
                hands.append(
                    {
                        "handedness": handed,
                        "landmarks": [[lm.x, lm.y, lm.z] for lm in lms.landmark],
                    }
                )
            return hands

        return detect


def mean_x(hand: dict) -> float:
    pts = hand["landmarks"]
    return sum(p[0] for p in pts) / len(pts)


def order_hands(hands: list) -> list:
    """Order hands left-to-right (by mean x) so vectors align across samples."""
    return sorted(hands, key=mean_x)


def flatten(hands: list) -> list:
    out: list[float] = []
    for hand in hands:
        for p in hand["landmarks"]:
            out.extend(p)
    return out


def pick_medoid(candidates: list) -> list | None:
    """Choose the representative detection: most-common hand count, then medoid."""
    if not candidates:
        return None
    counts = Counter(len(c) for c in candidates)
    target_count = counts.most_common(1)[0][0]
    group = [c for c in candidates if len(c) == target_count]

    vectors = [(flatten(c), c) for c in group]
    dim = len(vectors[0][0])
    vectors = [(v, c) for (v, c) in vectors if len(v) == dim]
    if not vectors:
        return None

    mean = [sum(v[i] for (v, _) in vectors) / len(vectors) for i in range(dim)]

    def dist2(vec: list) -> float:
        return sum((vec[i] - mean[i]) ** 2 for i in range(dim))

    best = min(vectors, key=lambda pair: dist2(pair[0]))
    return best[1]


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the ISL avatar pose library.")
    parser.add_argument("--images-dir", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL_PATH)
    parser.add_argument("--samples-per-label", type=int, default=30)
    args = parser.parse_args()

    root: Path = args.images_dir
    if not root.is_dir():
        print(f"Not a directory: {root}", file=sys.stderr)
        return 1

    model_path = ensure_model(args.model)
    detect = make_pose_detector(model_path)

    labels = sorted(p.name for p in root.iterdir() if p.is_dir())
    if not labels:
        print(f"No label subfolders found in {root}", file=sys.stderr)
        return 1

    poses: dict[str, dict] = {}
    failed: list[str] = []

    for label in labels:
        label_dir = root / label
        images = [p for p in sorted(label_dir.iterdir()) if p.suffix.lower() in IMAGE_EXTS]
        images = images[: args.samples_per_label]

        candidates = []
        for image_path in images:
            hands = detect(image_path)
            if hands:
                candidates.append(order_hands(hands))

        chosen = pick_medoid(candidates)
        if chosen is None:
            failed.append(label)
            continue
        poses[label] = {"hands": chosen}
        print(f"  {label}: pose from {len(candidates)} clean detections")

    if not poses:
        print("No poses could be generated. Are hands visible in the images?", file=sys.stderr)
        return 1

    args.out.parent.mkdir(parents=True, exist_ok=True)
    payload = {"labels": sorted(poses.keys()), "poses": poses}
    args.out.write_text(json.dumps(payload), encoding="utf-8")

    print(f"\nWrote poses for {len(poses)} labels to {args.out}")
    if failed:
        print(f"No clean pose for: {', '.join(failed)}")
    print("Refresh /avatar in the web app to load the pose library.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
