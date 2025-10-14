import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

type Props = {
    m3u8Url: string | null;
};

export default function VideoPlayer({ m3u8Url }: Props) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    useEffect(() => {
        const video = videoRef.current!;
        video.volume = volume;
    }, [volume]);
    useEffect(() => {
        if (!m3u8Url) return;
        const video = videoRef.current!;
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(window.location.origin + m3u8Url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                video.play();
                setPlaying(true);
            });
            return () => {
                hls.destroy();
            };
        } else {
            video.src = window.location.origin + m3u8Url;
            video.addEventListener("loadedmetadata", () => {
                video.play();
                setPlaying(true);
            });
        }
    }, [m3u8Url]);
    function togglePlay() {
        const v = videoRef.current!;
        if (v.paused) {
            v.play();
            setPlaying(true);
        } else {
            v.pause();
            setPlaying(false);
        }
    }
    return (
        <div className="player">
            <video ref={videoRef} controls={false} className="video" />
            <div className="controls">
                <button onClick={togglePlay}>{playing ? "Pause" : "Play"}</button>
                <label>Volume</label>
                <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
            </div>
        </div>
    );
}
