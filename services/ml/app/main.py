"""SignBridge ML service.

Phase 1 ships a minimal FastAPI app with a health endpoint so the service is
wired into the monorepo and Docker Compose from day one. The actual ISL model
training, MediaPipe landmark extraction, and TensorFlow.js export pipeline are
implemented in Phase 5.
"""

from __future__ import annotations

import time

from fastapi import FastAPI
from pydantic import BaseModel

START_TIME = time.time()
VERSION = "0.1.0"

app = FastAPI(title="SignBridge ML Service", version=VERSION)


class HealthStatus(BaseModel):
    status: str
    service: str
    version: str
    uptime_seconds: int


@app.get("/health", response_model=HealthStatus)
def health() -> HealthStatus:
    return HealthStatus(
        status="ok",
        service="signbridge-ml",
        version=VERSION,
        uptime_seconds=int(time.time() - START_TIME),
    )
