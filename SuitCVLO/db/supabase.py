from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY


class SupabaseStore:
    def __init__(self, url=None, key=None):
        self.url = url or SUPABASE_URL
        self.key = key or SUPABASE_KEY
        self.client = None
        if self.url and self.key:
            self.client = create_client(self.url, self.key)

    def is_connected(self):
        return self.client is not None

    def upsert_detection(self, data):
        if not self.client:
            return None
        try:
            result = self.client.table("detections").insert(data).execute()
            return result.data
        except Exception as e:
            print(f"[supabase] insert error: {e}")
            return None

    def list_detections(self, user_id=None, limit=100):
        if not self.client:
            return []
        try:
            query = self.client.table("detections").select("*").order("id", desc=True).limit(limit)
            if user_id:
                query = query.eq("user_id", user_id)
            result = query.execute()
            return result.data
        except Exception as e:
            print(f"[supabase] list error: {e}")
            return []

    def get_stats(self, user_id=None):
        if not self.client:
            return {}
        try:
            query = self.client.table("detections").select("*")
            if user_id:
                query = query.eq("user_id", user_id)
            all_rows = query.execute().data
            return {
                "total": len(all_rows),
                "panoramic": sum(1 for r in all_rows if r.get("is_panoramic")),
                "with_gps": sum(1 for r in all_rows if r.get("gps_lat")),
            }
        except Exception as e:
            print(f"[supabase] stats error: {e}")
            return {}
