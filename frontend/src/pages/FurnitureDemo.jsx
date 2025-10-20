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
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch(`${BACKEND_URL}/api/gallery`);
        const json = await r.json();
        if (!json.ok) throw new Error(json.error || "Failed to load gallery");

        // Parse design_data for each image
        const imagesWithDesignData = (json.images || []).map((img) => ({
          ...img,
          design_data: img.design_data ? JSON.parse(img.design_data) : null,
        }));

        setImages(imagesWithDesignData);
      } catch (e) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (imageId) => {
    if (
      !confirm("Are you sure you want to delete this image from the gallery?")
    ) {
      return;
    }

    setDeleting(true);
    setErr("");
    try {
      const response = await fetch(`/api/gallery/${imageId}`, {
        method: "DELETE",
      });
      const json = await response.json();

      if (!json.ok) {
        throw new Error(json.error || "Failed to delete image");
      }

      // Remove the image from the local state
      setImages(images.filter((img) => img.id !== imageId));
      setSelected(null); // Close the modal
    } catch (e) {
      setErr(e.message || "Failed to delete image");
    } finally {
      setDeleting(false);
    }
  };

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
                const r = await fetch(`/api/gallery/upload`, {
                  method: "POST",
                  body: fd,
                });
                const j = await r.json();
                if (!j.ok) throw new Error(j.error || "Upload failed");

                // Refresh the gallery list
                const rr = await fetch(`/api/gallery`);
                const jj = await rr.json();

                // Parse design_data for each image
                const imagesWithDesignData = (jj.images || []).map((img) => ({
                  ...img,
                  design_data: img.design_data
                    ? JSON.parse(img.design_data)
                    : null,
                }));

                setImages(imagesWithDesignData);
              } catch (e) {
                setErr(e.message || String(e));
              } finally {
                e.target.value = "";
              }
            }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {images.length === 0 && !loading && (
            <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5">
              <div className="w-full bg-white rounded-xl shadow-md border border-gray-200 py-12 flex items-center justify-center">
                <p className="text-gray-500 text-lg font-medium">
                  No ReVibes Uploaded To Gallery
                </p>
              </div>
            </div>
          )}

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
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-7xl w-[95%] max-h-[90vh] shadow-xl overflow-y-auto"
            >
              {/* Header with close button */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selected.original_filename || `Image ${selected.id}`}
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Close"
                >
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Image Section */}
              <div className="mb-8">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center shadow-lg">
                  <img
                    src={selected.url}
                    alt={selected.original_filename || `Image ${selected.id}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-gray-600">
                  <div className="truncate">
                    {selected.width}×{selected.height}px ·{" "}
                    {selected.format?.toUpperCase?.()} ·{" "}
                    {selected.created_at && new Date(selected.created_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    disabled={deleting}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Design Details Section */}
              {selected.design_data ? (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    Design Details
                  </h3>

                  {/* Shopping List */}
                  {selected.design_data.furniture &&
                    selected.design_data.furniture.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-xl font-semibold text-gray-800 mb-4">
                          Shopping List
                        </h4>
                        <div className="space-y-6">
                          {selected.design_data.furniture.map((item, index) => (
                            <div
                              key={index}
                              className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <h5 className="text-lg font-semibold text-gray-800">
                                  {item.name}
                                </h5>
                                <span className="text-lg font-bold text-indigo-600">
                                  ${item.estimatedPrice || "N/A"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                {item.description}
                              </p>

                              {/* Product Links */}
                              {item.searchResults &&
                                item.searchResults.length > 0 && (
                                  <div className="mt-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <p className="text-sm font-semibold text-gray-700">
                                        Similar Products ({item.searchResults.length} found):
                                      </p>
                                      <span className="text-xs text-gray-500">
                                        Click to view on retailer website
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {item.searchResults
                                        .slice(0, 6)
                                        .map((product, i) => (
                                          <a
                                            key={i}
                                            href={product.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-indigo-300"
                                          >
                                            {product.thumbnail && (
                                              <div className="flex-shrink-0">
                                                <img
                                                  src={product.thumbnail}
                                                  alt={product.title}
                                                  className="w-12 h-12 object-cover rounded-md"
                                                  onError={(e) => {
                                                    e.target.style.display = "none";
                                                    e.target.nextElementSibling.style.display = "flex";
                                                  }}
                                                />
                                                <div
                                                  className="w-12 h-12 bg-gray-200 flex items-center justify-center text-gray-400 text-xs rounded-md"
                                                  style={{ display: "none" }}
                                                >
                                                  No Image
                                                </div>
                                              </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-800 truncate leading-tight">
                                                {product.title}
                                              </p>
                                              <div className="flex items-center justify-between mt-1">
                                                <p className="text-sm font-bold text-indigo-600">
                                                  ${product.price}
                                                </p>
                                                {product.source && (
                                                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                                    {product.source}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="mt-1">
                                                <span className="inline-flex items-center text-xs text-indigo-600 group-hover:text-indigo-700">
                                                  View Product
                                                  <svg
                                                    className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                    />
                                                  </svg>
                                                </span>
                                              </div>
                                            </div>
                                          </a>
                                        ))}
                                    </div>
                                    {item.searchResults.length > 6 && (
                                      <p className="text-xs text-gray-500 mt-2 text-center">
                                        Showing 6 of {item.searchResults.length} products
                                      </p>
                                    )}
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Budget Summary */}
                  {selected.design_data.furniture &&
                    selected.design_data.furniture.length > 0 && (
                      <div className="bg-indigo-50 rounded-lg p-6">
                        <h4 className="text-xl font-semibold text-gray-800 mb-4">
                          Budget Summary
                        </h4>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium text-gray-700">
                            Estimated Total Cost Range:
                          </span>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-indigo-600">
                              $
                              {selected.design_data.totalCostRange?.min?.toFixed(
                                0
                              ) || "0"}{" "}
                              - $
                              {selected.design_data.totalCostRange?.max?.toFixed(
                                0
                              ) || "0"}
                            </span>
                            <p className="text-sm text-gray-600 mt-1">
                              Average: $
                              {selected.design_data.averageCost?.toFixed(0) ||
                                "0"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Design Preferences */}
                  {(selected.design_data.styles ||
                    selected.design_data.colors ||
                    selected.design_data.budget) && (
                    <div className="bg-purple-50 rounded-lg p-6">
                      <h4 className="text-xl font-semibold text-gray-800 mb-4">
                        Design Preferences
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selected.design_data.styles &&
                          selected.design_data.styles.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Styles:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {selected.design_data.styles.map((style, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full"
                                  >
                                    {style}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        {selected.design_data.colors &&
                          selected.design_data.colors.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Colors:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {selected.design_data.colors.map((color, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full"
                                  >
                                    {color}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        {selected.design_data.budget && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Budget:
                            </p>
                            <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full">
                              ${selected.design_data.budget}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="w-16 h-16 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No Design Data Available
                  </h3>
                  <p className="text-gray-500">
                    This image was uploaded without design analysis data. 
                    Images generated through the AI design tool will include furniture recommendations and shopping links.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
