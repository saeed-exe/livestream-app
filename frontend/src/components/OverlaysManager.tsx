import React, { useEffect, useState } from "react";
import { listOverlays, createOverlay, updateOverlay, deleteOverlay } from "../api";

type Overlay = {
    _id?: string;
    name: string;
    type: string;
    content: string;
    x: number;
    y: number;
    w: number;
    h: number;
    fontsize?: number;
    color?: string;
};

export default function OverlaysManager({ onSelect }: { onSelect: (ids: string[]) => void }) {
    const [overlays, setOverlays] = useState<Overlay[]>([]);
    const [form, setForm] = useState<Partial<Overlay>>({ type: "text", name: "", content: "", x: 0, y: 0, w: 100, h: 50, fontsize: 24, color: "white" });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    useEffect(() => {
        refresh();
    }, []);
    function refresh() {
        listOverlays().then((d) => setOverlays(d));
    }
    async function onCreate() {
        await createOverlay(form);
        setForm({ type: "text", name: "", content: "", x: 0, y: 0, w: 100, h: 50, fontsize: 24, color: "white" });
        refresh();
    }
    async function onUpdate(o: Overlay) {
        const payload = { name: o.name, type: o.type, content: o.content, x: o.x, y: o.y, w: o.w, h: o.h, fontsize: o.fontsize, color: o.color };
        await updateOverlay(o._id!, payload);
        refresh();
    }
    async function onDelete(id?: string) {
        if (!id) return;
        await deleteOverlay(id);
        refresh();
    }
    function toggleSelect(id?: string) {
        if (!id) return;
        setSelectedIds((s) => {
            const ex = s.includes(id);
            const next = ex ? s.filter((x) => x !== id) : [...s, id];
            onSelect(next);
            return next;
        });
    }
    return (
        <div className="overlay-manager">
            <h3>Overlays</h3>
            <div className="overlay-form">
                <input placeholder="name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                </select>
                <input placeholder="content (text or image URL)" value={form.content || ""} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                <input type="number" placeholder="x" value={form.x as number | ""} onChange={(e) => setForm({ ...form, x: Number(e.target.value) })} />
                <input type="number" placeholder="y" value={form.y as number | ""} onChange={(e) => setForm({ ...form, y: Number(e.target.value) })} />
                <input type="text" placeholder="w (px or expressions)" value={String(form.w || "")} onChange={(e) => setForm({ ...form, w: e.target.value as any })} />
                <input type="text" placeholder="h (px or expressions)" value={String(form.h || "")} onChange={(e) => setForm({ ...form, h: e.target.value as any })} />
                <input type="number" placeholder="fontsize" value={form.fontsize as number | ""} onChange={(e) => setForm({ ...form, fontsize: Number(e.target.value) })} />
                <input placeholder="color" value={form.color || ""} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                <button onClick={onCreate}>Create</button>
            </div>
            <div className="overlay-list">
                {overlays.map((o) => (
                    <div key={o._id} className="overlay-item">
                        <div>
                            <input type="checkbox" checked={selectedIds.includes(o._id!)} onChange={() => toggleSelect(o._id)} />
                            <strong>{o.name}</strong> ({o.type})
                        </div>
                        <div>
                            <label>content</label>
                            <input value={o.content} onChange={(e) => { o.content = e.target.value; }} />
                        </div>
                        <div className="row">
                            <label>x</label>
                            <input type="number" value={o.x as number | ""} onChange={(e) => { o.x = Number(e.target.value); }} />
                            <label>y</label>
                            <input type="number" value={o.y as number | ""} onChange={(e) => { o.y = Number(e.target.value); }} />
                        </div>
                        <div className="row">
                            <label>w</label>
                            <input value={String(o.w)} onChange={(e) => { o.w = e.target.value as any; }} />
                            <label>h</label>
                            <input value={String(o.h)} onChange={(e) => { o.h = e.target.value as any; }} />
                        </div>
                        <div className="row">
                            <label>fontsize</label>
                            <input type="number" value={o.fontsize as number | ""} onChange={(e) => { o.fontsize = Number(e.target.value); }} />
                            <label>color</label>
                            <input value={o.color || ""} onChange={(e) => { o.color = e.target.value; }} />
                        </div>
                        <div className="actions">
                            <button onClick={() => onUpdate(o)}>Save</button>
                            <button onClick={() => onDelete(o._id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
