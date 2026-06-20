from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import analytics, auth, complaints, meta, uploads
from app.seed import seed_db
from app.database import SessionLocal


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Guard: refuse to start in production with the default JWT secret
    if settings.jwt_secret.startswith("dev-secret") or settings.jwt_secret == "change-me-in-production-use-long-random-string":
        import sys
        if os.environ.get("ENVIRONMENT", "development").lower() == "production":
            print("FATAL: JWT_SECRET is set to the default value. Set a strong secret before deploying.", file=sys.stderr)
            sys.exit(1)
        else:
            import warnings
            warnings.warn(
                "⚠️  JWT_SECRET is the default dev value. Set a real secret in .env before deploying to production.",
                stacklevel=2,
            )

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Delhi CM Grievance Dashboard API",
    description="Chief Minister's Grievance & Complaint Management System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(meta.router)
app.include_router(complaints.router)
app.include_router(analytics.router)
app.include_router(uploads.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "delhi-cm-dashboard"}

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")

os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{catchall:path}")
    def serve_frontend(catchall: str):
        file_path = os.path.join(frontend_dist, catchall)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
