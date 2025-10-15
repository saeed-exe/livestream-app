User Documentation (Setup + How to use)
1. System prerequisites

Node.js (16+), npm

Python 3.8+, pip

ffmpeg (available in PATH)

MongoDB (local or remote)

Git (optional)

Verify

node -v
npm -v
python -V
ffmpeg -version
mongo --version

2. Project layout
backend/   
frontend/  

3. Backend setup (step-by-step)

Open terminal, go to backend:

cd backend


Create and activate virtual environment:

macOS / Linux:

python -m venv venv
source venv/bin/activate


Windows (PowerShell):

python -m venv venv
.\venv\Scripts\Activate.ps1


Install dependencies:

pip install -r requirements.txt


Create .env (optional) with:

MONGO_URI=mongodb://localhost:27017
PORT=5000


Confirm ffmpeg is installed:

ffmpeg -version


Run the app:

python app.py


Server listens on http://0.0.0.0:5000.

Verify:

Open http://localhost:5000/api/overlays (should return []).

4. Frontend setup (step-by-step)

Open a new terminal, go to frontend:

cd frontend


Install dependencies:

npm install


Start dev server:

npm start


Open http://localhost:3000.

5. How to input RTSP URL and manage overlays (UI flow)

Open http://localhost:3000. The page is split into left (controls) and right (player).

Input RTSP URL:

Paste a valid RTSP URL into the RTSP URL field.

Use rtsp.me or rtsp-simple-server to host a test stream

If the RTSP stream requires authentication include credentials in the URL: rtsp://user:pass@host/path (beware of exposing creds).

Create overlays:

In the overlay form:

name: a friendly name.

type: text or image.

content: text string or direct image URL.

x, y: positions (pixels or ffmpeg expressions).

w, h: image size (pixels or ffmpeg expressions); for text overlays ignore w/h.

fontsize, color: for text overlays.

Click Create. The overlay will appear in the list.

Edit / Save / Delete overlays:

Make changes inline and click Save to update (sends PUT /api/overlays/<id>).

Click Delete to remove overlay.

Select overlays to apply:

Check the checkbox beside overlays you want applied. Selection is sent when starting the stream.

Start stream:

Click Start Stream. Frontend calls POST /api/start_stream with RTSP and selected overlay IDs.

Backend starts ffmpeg and returns m3u8_url.

Player on the right loads the HLS playlist and begins playback.

Player controls:

Play/Pause button and Volume slider are provided.

To stop the backend ffmpeg and remove HLS files click Stop Stream.