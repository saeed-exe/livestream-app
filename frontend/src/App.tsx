import React, { useState } from "react";
import OverlaysManager from "./components/OverlaysManager";
import VideoPlayer from "./components/VideoPlayer";
import { startStream, stopStream } from "./api";

export default function App() {
  const [selectedOverlayIds, setSelectedOverlayIds] = useState<string[]>([]);
  const [rtspUrl, setRtspUrl] = useState("");
  const [streamId, setStreamId] = useState<string | null>(null);
  const [m3u8Url, setM3u8Url] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  async function handleStart() {
    setStarting(true);
    const res = await startStream(rtspUrl, selectedOverlayIds);
    if (res && res.stream_id) {
      setStreamId(res.stream_id);
      setM3u8Url(res.m3u8_url);
    }
    setStarting(false);
  }

  async function handleStop() {
    if (!streamId) return;
    await stopStream(streamId);
    setStreamId(null);
    setM3u8Url(null);
  }

  return (
    <div className="app">
      <div className="left">
        <h1>Livestream Landing</h1>
        <div className="starter">
          <input placeholder="RTSP URL" value={rtspUrl} onChange={(e) => setRtspUrl(e.target.value)} />
          <div className="row">
            <button onClick={handleStart} disabled={starting || !rtspUrl}>Start Stream</button>
            <button onClick={handleStop} disabled={!streamId}>Stop Stream</button>
          </div>
          <div>
            <small>After starting, the HLS playlist will appear and video will play.</small>
          </div>
        </div>
        <OverlaysManager onSelect={(ids) => setSelectedOverlayIds(ids)} />
      </div>
      <div className="right">
        <h2>Player</h2>
        {m3u8Url ? <VideoPlayer m3u8Url={m3u8Url} /> : <div className="placeholder">Start a stream to preview here</div>}
      </div>
    </div>
  );
}
