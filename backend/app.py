import os
import shutil
import threading
import time
import uuid
import subprocess
from urllib.parse import urlparse, quote_plus
from flask import Flask, request, jsonify, send_from_directory, abort, redirect
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
STREAM_ROOT = os.path.abspath("./streams")
os.makedirs(STREAM_ROOT, exist_ok=True)
client = MongoClient(MONGO_URI)
db = client["livestream_app"]
overlays_col = db["overlays"]
app = Flask(__name__, static_folder=None)
CORS(app)
ffmpeg_processes = {}
process_lock = threading.Lock()

def hls_folder_for_stream(stream_id):
    return os.path.join(STREAM_ROOT, stream_id)

def start_hls_stream(rtsp_url, stream_id, overlays):
    folder = hls_folder_for_stream(stream_id)
    if os.path.exists(folder):
        shutil.rmtree(folder)
    os.makedirs(folder, exist_ok=True)
    out_path = os.path.join(folder, "index.m3u8")
    filter_parts = []
    inputs = []
    filter_index = 0
    for o in overlays:
        if o.get("type") == "image":
            url = o.get("content", "")
            inputs.append("-i")
            inputs.append(url)
        filter_index += 1
    overlay_filters = []
    drawtext_filters = []
    stream_map = "[0:v]"
    image_input_index = 1
    for o in overlays:
        if o.get("type") == "image":
            x = o.get("x", 0)
            y = o.get("y", 0)
            w = o.get("w", "iw*0.2")
            h = o.get("h", "ih*0.2")
            overlay_filters.append(f"[{image_input_index}:v] scale={w}:{h} [img{image_input_index}];")
            overlay_filters.append(f"{stream_map}[img{image_input_index}] overlay={x}:{y} [v{image_input_index}];")
            stream_map = f"[v{image_input_index}]"
            image_input_index += 1
        if o.get("type") == "text":
            text = o.get("content", "")
            x = o.get("x", 0)
            y = o.get("y", 0)
            fontsize = o.get("fontsize", 24)
            fontcolor = o.get("color", "white")
            drawtext_filters.append(f"drawtext=text='{text}':x={x}:y={y}:fontsize={fontsize}:fontcolor={fontcolor}")
    filter_complex = ""
    if overlay_filters:
        filter_complex += "".join(overlay_filters)
        filter_complex += f"{stream_map} copy[vout]"
    if drawtext_filters:
        in_map = "[vout]" if overlay_filters else "[0:v]"
        filter_complex += f";{in_map}" if overlay_filters else ""
        join_text = ",".join(drawtext_filters)
        if overlay_filters:
            filter_complex += f"{in_map} {join_text} [vout2]"
            final_map = "[vout2]"
        else:
            filter_complex += f"{join_text} [vout]"
            final_map = "[vout]"
    else:
        final_map = "[vout]" if overlay_filters else None
    cmd = ["ffmpeg", "-rtsp_transport", "tcp", "-i", rtsp_url]
    if inputs:
        cmd += inputs
    if filter_complex:
        cmd += ["-filter_complex", filter_complex]
        if final_map:
            cmd += ["-map", final_map]
    cmd += ["-c:v", "libx264", "-preset", "veryfast", "-g", "50", "-sc_threshold", "0", "-f", "hls", "-hls_time", "2", "-hls_list_size", "3", "-hls_flags", "delete_segments+append_list", out_path]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    with process_lock:
        ffmpeg_processes[stream_id] = p
    def monitor():
        p.wait()
        with process_lock:
            if stream_id in ffmpeg_processes and ffmpeg_processes[stream_id].pid == p.pid:
                ffmpeg_processes.pop(stream_id, None)
    t = threading.Thread(target=monitor, daemon=True)
    t.start()
    return p.pid

def stop_hls_stream(stream_id):
    with process_lock:
        p = ffmpeg_processes.get(stream_id)
        if p:
            p.terminate()
            try:
                p.wait(timeout=5)
            except Exception:
                p.kill()
            ffmpeg_processes.pop(stream_id, None)
    folder = hls_folder_for_stream(stream_id)
    if os.path.exists(folder):
        shutil.rmtree(folder)

@app.route("/api/overlays", methods=["POST"])
def create_overlay():
    data = request.json or {}
    doc = {
        "name": data.get("name", str(uuid.uuid4())),
        "type": data.get("type", "text"),
        "content": data.get("content", ""),
        "x": data.get("x", 0),
        "y": data.get("y", 0),
        "w": data.get("w", 100),
        "h": data.get("h", 50),
        "fontsize": data.get("fontsize", 24),
        "color": data.get("color", "white"),
        "created_at": time.time()
    }
    res = overlays_col.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return jsonify(doc), 201

@app.route("/api/overlays", methods=["GET"])
def list_overlays():
    docs = []
    for d in overlays_col.find().sort("created_at", -1):
        d["_id"] = str(d["_id"])
        docs.append(d)
    return jsonify(docs)

@app.route("/api/overlays/<id>", methods=["GET"])
def get_overlay(id):
    from bson.objectid import ObjectId
    d = overlays_col.find_one({"_id": ObjectId(id)})
    if not d:
        abort(404)
    d["_id"] = str(d["_id"])
    return jsonify(d)

@app.route("/api/overlays/<id>", methods=["PUT"])
def update_overlay(id):
    from bson.objectid import ObjectId
    data = request.json or {}
    update = {"$set": {}}
    for k in ["name", "type", "content", "x", "y", "w", "h", "fontsize", "color"]:
        if k in data:
            update["$set"][k] = data[k]
    overlays_col.update_one({"_id": ObjectId(id)}, update)
    d = overlays_col.find_one({"_id": ObjectId(id)})
    d["_id"] = str(d["_id"])
    return jsonify(d)

@app.route("/api/overlays/<id>", methods=["DELETE"])
def delete_overlay(id):
    from bson.objectid import ObjectId
    overlays_col.delete_one({"_id": ObjectId(id)})
    return jsonify({"ok": True})

@app.route("/api/start_stream", methods=["POST"])
def start_stream():
    data = request.json or {}
    rtsp_url = data.get("rtsp_url")
    overlay_ids = data.get("overlay_ids", [])
    if not rtsp_url:
        return jsonify({"error": "rtsp_url required"}), 400
    overlays = []
    from bson.objectid import ObjectId
    for oid in overlay_ids:
        try:
            d = overlays_col.find_one({"_id": ObjectId(oid)})
            if d:
                d["_id"] = str(d["_id"])
                overlays.append(d)
        except Exception:
            continue
    stream_id = str(uuid.uuid4())
    start_hls_stream(rtsp_url, stream_id, overlays)
    return jsonify({"stream_id": stream_id, "m3u8_url": f"/streams/{stream_id}/index.m3u8"})

@app.route("/api/stop_stream/<stream_id>", methods=["POST"])
def stop_stream(stream_id):
    stop_hls_stream(stream_id)
    return jsonify({"stopped": True})

@app.route("/streams/<stream_id>/<path:filename>")
def serve_stream_file(stream_id, filename):
    folder = hls_folder_for_stream(stream_id)
    if not os.path.exists(folder):
        abort(404)
    return send_from_directory(folder, filename)

@app.route("/")
def index_redirect():
    return redirect("/")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
