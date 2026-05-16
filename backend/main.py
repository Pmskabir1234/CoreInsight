"""FastAPI application entrypoint."""

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import create_router
from backend.ml.pipeline import MLPipeline
from backend.services.logging_config import configure_logging
from backend.storage.history_store import HistoryStore


def create_app() -> FastAPI:
    configure_logging()
    logger = logging.getLogger(__name__)
    app = FastAPI(title="Innovexa API", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    ml = MLPipeline.bootstrap()
    store = HistoryStore(Path("data/innovexa.db"))
    app.include_router(create_router(ml=ml, store=store))

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request, exc: RequestValidationError):
        logger.warning("validation_error path=%s errors=%s", request.url.path, exc.errors())
        return JSONResponse(
            status_code=422,
            content={"detail": "Invalid request payload.", "errors": exc.errors()},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request, exc: Exception):
        logger.exception("unhandled_exception path=%s error=%s", request.url.path, exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error."},
        )

    @app.get("/health")
    def health():
        return {
            "status": "ok",
            "service": "innovexa-backend",
            "failure_model": ml.model_metadata.get("best_model"),
            "failure_model_accuracy": ml.model_metadata.get("best_accuracy"),
        }

    return app


app = create_app()
