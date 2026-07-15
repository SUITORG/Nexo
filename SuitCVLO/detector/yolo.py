import cv2
from ultralytics import YOLO
from config import YOLO_MODEL, CONFIDENCE


class YOLODetector:
    def __init__(self, model_path=None):
        path = model_path or YOLO_MODEL
        self.model = YOLO(path)
        self.class_names = self.model.names

    def detect_frame(self, frame):
        results = self.model(frame, conf=CONFIDENCE)[0]
        detections = []
        for box in results.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            detections.append({
                "bbox": [x1, y1, x2, y2],
                "label": self.class_names[cls_id],
                "confidence": round(conf, 3),
            })
        return detections, results.plot()

    def detect_image(self, image_path):
        frame = cv2.imread(str(image_path))
        if frame is None:
            raise ValueError(f"Cannot read image: {image_path}")
        return self.detect_frame(frame)

    def detect_video(self, video_path, callback=None):
        cap = cv2.VideoCapture(str(video_path))
        results = []
        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            dets, _ = self.detect_frame(frame)
            results.append({"frame": frame_idx, "detections": dets})
            if callback:
                callback(frame_idx, dets)
            frame_idx += 1
        cap.release()
        return results
