from fastapi import APIRouter, Query
from db.local import LocalStore
from db.supabase import SupabaseStore

router = APIRouter(prefix="/detections", tags=["detections"])
local_db = LocalStore()
cloud_db = SupabaseStore()


@router.get("")
def list_detections(
    user_id: str = Query(None),
    limit: int = Query(100),
    offset: int = Query(0),
    source: str = Query("local"),
):
    if source == "cloud" and cloud_db.is_connected():
        return cloud_db.list_detections(user_id, limit)
    return local_db.get_detections(user_id, limit, offset)


@router.get("/stats")
def get_stats(user_id: str = Query(None)):
    local_count = local_db.get_detection_count(user_id)
    cloud_stats = cloud_db.get_stats(user_id) if cloud_db.is_connected() else {}
    return {"local_count": local_count, **cloud_stats}
