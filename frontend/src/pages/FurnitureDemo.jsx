import React, { useEffect, useState } from "react";

const BACKEND_URL = ""; // empty → use relative
// fetch(`/api/gallery`) etc.

const withTransform = (url, t = "w_400,h_400,c_fill,q_auto,f_auto") =>
  url.replace("/upload/", `/upload/${t}/`);

export default function FurnitureDemo() {
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch(`${BACKEND_URL}/api/gallery`);
        const json = await r.json();
        if (!json.ok) throw new Error(json.error || "Failed to load gallery");
        setImages(json.images || []);
      } catch (e) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-8 md:px-16 lg:px-20">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">Gallery</h1>
          <p className="text-gray-600">
            This is a gallery of all uploaded designs
          </p>
        </div>

        {loading && <p className="text-center text-gray-600 mb-4">Loading…</p>}
        {err && <p className="text-center text-red-600 mb-4">{err}</p>}
{/* ─── Upload Button ─────────────────────────────── */}
<div className="flex justify-end mb-6">
  <input
    type="file"
    accept="image/*"
    className="hidden"
    id="gallery-upload"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const fd = new FormData();
        fd.append("image", file); // must be "image"
        const r = await fetch(`/api/gallery/upload`, { method: "POST", body: fd });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || "Upload failed");

        // Refresh the gallery list
        const rr = await fetch(`/api/gallery`);
        const jj = await rr.json();
        setImages(jj.images || []);
      } catch (e) {
        setErr(e.message || String(e));
      } finally {
        e.target.value = "";
      }
    }}
  />

</div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {images.length === 0 &&
            !loading &&
            Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-white rounded-xl shadow-md border border-gray-200
                                      flex items-center justify-center text-gray-300"
              >
                Placeholder {i + 1}
              </div>
            ))}

          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => setSelected(img)}
              className="group relative aspect-square bg-white rounded-xl shadow-md border border-gray-200
                         overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-lg"
              title={img.original_filename || `Image ${img.id}`}
            >
              <img
                src={withTransform(img.url)}
                alt={img.original_filename || `Image ${img.id}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
            </button>
          ))}
        </div>

        {selected && (
          <div
            onClick={() => setSelected(null)}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-4xl w-[95%] shadow-xl"
            >
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                <img
                  src={selected.url}
                  alt={selected.original_filename || `Image ${selected.id}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center justify-between gap-3 text-sm text-gray-600">
                <div className="truncate">
                  {selected.original_filename || `image-${selected.id}`} ·{" "}
                  {selected.width}×{selected.height}px ·{" "}
                  {selected.format?.toUpperCase?.()}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
