import time
from collections import defaultdict
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from config import CORS_ORIGINS, API_AUTH_TOKEN
from api.routes import upload, detections, reports

app = FastAPI(title="SuitCVLO API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


_rate_limit_store = defaultdict(list)
_RATE_LIMIT = 60
_RATE_WINDOW = 60


@app.middleware("http")
async def security_and_rate_limit(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = _rate_limit_store[client_ip]
    cutoff = now - _RATE_WINDOW
    _rate_limit_store[client_ip] = [t for t in window if t > cutoff]
    if len(_rate_limit_store[client_ip]) >= _RATE_LIMIT:
        return PlainTextResponse("Too many requests", status_code=429)
    _rate_limit_store[client_ip].append(now)

    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'"
    return response


app.include_router(upload.router)
app.include_router(detections.router)
app.include_router(reports.router)


frontend_dir = Path(__file__).parent.parent / "frontend"


@app.get("/health")
def health():
    return {"status": "ok", "service": "SuitCVLO"}


@app.get("/style.css")
def css():
    return FileResponse(frontend_dir / "style.css", media_type="text/css")


@app.get("/uploads/{filename}")
def uploads(filename: str):
    from config import UPLOAD_DIR
    if "/" in filename or ".." in filename or not filename.strip():
        return PlainTextResponse("Invalid filename", status_code=400)
    return FileResponse(UPLOAD_DIR / filename)

@app.get("/app.js")
def js():
    return FileResponse(frontend_dir / "app.js", media_type="application/javascript")


@app.get("/")
def index():
    return FileResponse(frontend_dir / "index.html", media_type="text/html")


if __name__ == "__main__":
    import uvicorn
    from config import API_PORT
    uvicorn.run("api.main:app", host="0.0.0.0", port=API_PORT, reload=True)
