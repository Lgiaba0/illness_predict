from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.api.routes.inference import router as inference_router

frontend_dir = Path(__file__).resolve().parents[1] / "frontend"
static_dir = frontend_dir / "static"

app = FastAPI(
    title="Pedigree Genetic Risk Inference API",
    version="0.1.0",
    description="Autosomal recessive risk inference for child affected probability",
)

if static_dir.exists():
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/version", tags=["system"])
def version() -> dict[str, str]:
    return {"version": "0.1.0"}


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(frontend_dir / "index.html")


app.include_router(inference_router)
