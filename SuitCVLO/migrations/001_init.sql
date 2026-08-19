CREATE TABLE IF NOT EXISTS detections (
    id              SERIAL PRIMARY KEY,
    user_id         TEXT NOT NULL DEFAULT 'default',
    image_url       TEXT,
    thumbnail_url   TEXT,
    captured_at     TIMESTAMPTZ,
    processed_at    TIMESTAMPTZ DEFAULT NOW(),
    gps_lat         DOUBLE PRECISION,
    gps_lng         DOUBLE PRECISION,
    address         TEXT,
    detected_objects JSONB DEFAULT '[]',
    is_panoramic    BOOLEAN DEFAULT FALSE,
    panoramic_type  TEXT,
    panoramic_text  TEXT,
    classification  TEXT,
    confidence      REAL,
    source          TEXT DEFAULT 'photo',
    device_info     JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_detections_user ON detections(user_id);
CREATE INDEX IF NOT EXISTS idx_detections_date ON detections(captured_at);
CREATE INDEX IF NOT EXISTS idx_detections_class ON detections(classification);
