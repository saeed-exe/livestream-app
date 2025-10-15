API Documentation
Overview

Base URL (default): http://localhost:5000
All API endpoints accept and return JSON unless otherwise noted. Backend serves HLS files at /streams/<stream_id>/index.m3u8. Use these endpoints to manage overlays and start/stop streams.

1. Overlays (CRUD)
Create overlay

POST /api/overlays

Request body (JSON)

{
  "name": "lower-left-watermark",
  "type": "text",        
  "content": "LIVE",     
  "x": 10,               
  "y": 20,               
  "w": 100,              
  "h": 50,               
  "fontsize": 24,        
  "color": "white"      
}


Success response (201)

{
  "_id": "650f1d2f5a8e5b1e6a9f3c2d",
  "name": "lower-left-watermark",
  "type": "text",
  "content": "LIVE",
  "x": 10,
  "y": 20,
  "w": 100,
  "h": 50,
  "fontsize": 24,
  "color": "white",
  "created_at": 1700000000.1234
}

List overlays

GET /api/overlays

Response (200)

[
  { "_id": "...", "name": "...", "type": "text", "content": "...", "...": "..." },
  ...
]


Get single overlay

GET /api/overlays/<id>

Response (200)

{ "_id": "...", "name": "...", "type": "text", "content": "..." }


Errors

404 if overlay not found.


Update overlay

PUT /api/overlays/<id>

Request body (JSON) — include only fields to update:

{ "name": "new-name", "content": "UPDATED", "x": 20, "y": 20 }


Response (200)

{ "_id":"...", "name":"new-name", ... }



Delete overlay

DELETE /api/overlays/<id>

Response (200)

{ "ok": true }



2. Stream control
Start stream

POST /api/start_stream

Request body (JSON)

{
  "rtsp_url": "rtsp://example.com/live/stream",
  "overlay_ids": ["650f1d2f5a8e5b1e6a9f3c2d", "650f1d3f5a8e5b1e6a9f3c2e"]
}


Response (200)

{
  "stream_id": "3f2d1b0a-9c8f-4b2a-8d3e-1234567890ab",
  "m3u8_url": "/streams/3f2d1b0a-9c8f-4b2a-8d3e-1234567890ab/index.m3u8"
}


How it works

Backend spawns an ffmpeg process that connects to the RTSP URL, applies overlays (if any), transcodes to HLS and writes files to backend/streams/<stream_id>/.

m3u8_url is served by the Flask app; prepend the backend origin (e.g., http://localhost:5000) to create a full playable URL.



Errors

400 if rtsp_url missing.

ffmpeg connection or processing issues surface in backend logs.

Stop stream

POST /api/stop_stream/<stream_id>

Response (200)

{ "stopped": true }


Behavior

Terminates ffmpeg process (if running) and removes the HLS folder for that stream.


3. Serving HLS

Static HLS files are served at:

GET /streams/<stream_id>/index.m3u8
GET /streams/<stream_id>/<segment.ts>


Open http://localhost:5000/streams/<stream_id>/index.m3u8 directly to verify HLS is available.

4. Error responses and diagnostics

400 — bad request (missing required fields)

404 — resource not found (overlay or stream folder)

500 — internal server error (inspect Flask logs and ffmpeg stderr)

ffmpeg errors: check backend console where ffmpeg stderr is available via subprocess; common causes are network/RTSP auth, missing fonts for drawtext, inaccessible image URLs.


