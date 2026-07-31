import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / os.getenv("UPLOAD_DIR", "uploads")
DB_DIR = BASE_DIR / "data"
SQLITE_PATH = DB_DIR / os.getenv("SQLITE_PATH", "suitcvlo.db")
YOLO_MODEL = os.getenv("YOLO_MODEL", "yolov8n.pt")
CONFIDENCE = float(os.getenv("CONFIDENCE_THRESHOLD", "0.25"))
API_PORT = int(os.getenv("API_PORT", "3011"))

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "50"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3011").split(",")
API_AUTH_TOKEN = os.getenv("API_AUTH_TOKEN", "")

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DB_DIR.mkdir(parents=True, exist_ok=True)
