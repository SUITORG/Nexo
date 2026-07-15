from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import upload, detections, reports

app = FastAPI(title="SuitCVLO API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(detections.router)
app.include_router(reports.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "SuitCVLO"}


if __name__ == "__main__":
    import uvicorn
    from config import API_PORT
    uvicorn.run("api.main:app", host="0.0.0.0", port=API_PORT, reload=True)
