import json
import streamlit as st
import pandas as pd
from pathlib import Path
from db.local import LocalStore

st.set_page_config(page_title="SuitCVLO Dashboard", layout="wide")
st.title("SuitCVLO - Detection Dashboard")

db = LocalStore()

user_id = st.sidebar.text_input("User ID", value="default")
tab1, tab2, tab3 = st.tabs(["Detections", "Stats", "Export"])

with tab1:
    limit = st.slider("Records", 10, 500, 100)
    dets = db.get_detections(user_id, limit=limit)
    if dets:
        df = pd.DataFrame(dets)
        df["detected_objects"] = df["detected_objects"].apply(
            lambda x: ", ".join([d["label"] for d in json.loads(x)]) if isinstance(x, str) else ""
        )
        st.dataframe(df, use_container_width=True)
        cols = st.columns([1, 1])
        total = db.get_detection_count(user_id)
        cols[0].metric("Total detections", total)

with tab2:
    if dets:
        df2 = pd.DataFrame(dets)
        if "classification" in df2.columns:
            st.subheader("By classification")
            st.bar_chart(df2["classification"].value_counts())
        if "panoramic_type" in df2.columns:
            st.subheader("By panoramic type")
            st.bar_chart(df2["panoramic_type"].value_counts())
        if "captured_at" in df2.columns:
            st.subheader("Over time")
            dates = pd.to_datetime(df2["captured_at"], errors="coerce").dropna()
            st.line_chart(dates.value_counts().sort_index())

with tab3:
    st.markdown("### Export options")
    st.markdown("Use the API endpoint to export PDF:")
    st.code(f"curl http://localhost:3011/reports/pdf?user_id={user_id} --output report.pdf")
    if st.button("Show raw JSON sample"):
        st.json(dets[:2] if dets else [])
