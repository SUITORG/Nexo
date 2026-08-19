from db.local import LocalStore
from db.supabase import SupabaseStore


class SyncEngine:
    def __init__(self, local=None, cloud=None):
        self.local = local or LocalStore()
        self.cloud = cloud or SupabaseStore()

    def sync_to_cloud(self, batch_size=50):
        if not self.cloud.is_connected():
            return {"synced": 0, "error": "Supabase not configured"}
        unsynced = self.local.get_unsynced(limit=batch_size)
        if not unsynced:
            return {"synced": 0, "message": "nothing to sync"}
        synced_ids = []
        for row in unsynced:
            data = {
                "user_id": row["user_id"],
                "image_url": row["image_path"],
                "captured_at": row["captured_at"],
                "processed_at": row["processed_at"],
                "gps_lat": row["gps_lat"],
                "gps_lng": row["gps_lng"],
                "address": row["address"],
                "detected_objects": row["detected_objects"],
                "is_panoramic": bool(row["is_panoramic"]),
                "panoramic_type": row["panoramic_type"],
                "panoramic_text": row["panoramic_text"],
                "classification": row["classification"],
                "confidence": row["confidence"],
                "source": row["source"],
            }
            result = self.cloud.upsert_detection(data)
            if result:
                synced_ids.append(row["id"])
        if synced_ids:
            self.local.mark_synced(synced_ids)
        return {"synced": len(synced_ids), "total_unsynced": len(unsynced)}
