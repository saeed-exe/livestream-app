const API_ROOT = "http://localhost:5000";
export async function listOverlays() {
    const res = await fetch(`${API_ROOT}/api/overlays`);
    return res.json();
}
export async function createOverlay(payload: any) {
    const res = await fetch(`${API_ROOT}/api/overlays`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return res.json();
}
export async function updateOverlay(id: string, payload: any) {
    const res = await fetch(`${API_ROOT}/api/overlays/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return res.json();
}
export async function deleteOverlay(id: string) {
    const res = await fetch(`${API_ROOT}/api/overlays/${id}`, { method: "DELETE" });
    return res.json();
}
export async function startStream(rtsp_url: string, overlay_ids: string[]) {
    const res = await fetch(`${API_ROOT}/api/start_stream`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rtsp_url, overlay_ids }) });
    return res.json();
}
export async function stopStream(stream_id: string) {
    const res = await fetch(`${API_ROOT}/api/stop_stream/${stream_id}`, { method: "POST" });
    return res.json();
}
