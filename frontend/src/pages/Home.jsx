// src/pages/Home.jsx
import React, { useState, useRef, useCallback } from "react";
import { DESIGN_STYLES, COLOR_PALETTES } from "/src/constants.js";
import { fileToBase64, dataUrlToBlob } from "/src/utils/fileUtils.js";
import { generateRoomDesign } from "/src/services/geminiService.js";
import logo from "/images/Logoblack.png"; // ✅ correct path

const CameraIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 mr-2"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 mr-2"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);
const Loader = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
    <p className="text-indigo-700 font-semibold">
      Designing your dream room... this may take a moment!
    </p>
  </div>
);

const App = () => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [budget, setBudget] = useState(2000);
  const [instructions, setInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Add-to-gallery
  const [addingToGallery, setAddingToGallery] = useState(false);
  const [addToGalleryMsg, setAddToGalleryMsg] = useState("");

  // Camera capture overlay
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null); // fallback picker
  const resultRef = useRef(null);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setResult(null);
    setError(null);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
        setResult(null);
        setError(null);
        break;
      }
    }
  };

  const handleCheckboxChange = (
    value,
    list,
    setter,
    maxSelections = Infinity
  ) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else if (list.length < maxSelections) {
      setter([...list, value]);
    }
  };

  const handleBudgetChange = (e) => {
    const value = e.target.value;
    if (value === "") return setBudget("");
    const num = Number(value);
    if (!isNaN(num) && num >= 0) setBudget(num);
  };

  const handleSubmit = async () => {
    if (!imageFile) return setError("Please upload or capture an image first.");
    if (!budget || budget <= 0)
      return setError("Please enter a valid budget amount.");

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const imageBase64 = await fileToBase64(imageFile);
      const designResult = await generateRoomDesign(
        imageBase64,
        imageFile.type,
        selectedStyles,
        selectedColors,
        budget,
        instructions
      );
      setResult(designResult);
      setTimeout(
        () => resultRef.current?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Camera overlay controls
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const closeCamera = useCallback(() => {
    setIsCameraOpen(false);
    stopStream();
  }, []);

  const openCamera = useCallback(async () => {
    setCameraError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        cameraInputRef.current?.click(); // fallback
        return;
      }

      const getStream = (videoConstraints) =>
        navigator.mediaDevices.getUserMedia({
          video: {
            ...videoConstraints,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

      let stream;
      try {
        // force back camera first
        stream = await getStream({ facingMode: { exact: "environment" } });
      } catch {
        try {
          // then try ideal back camera
          stream = await getStream({ facingMode: { ideal: "environment" } });
        } catch {
          // finally any camera
          stream = await getStream({});
        }
      }

      streamRef.current = stream;
      setIsCameraOpen(true);

      // attach and ensure playback after overlay mounts
      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;

        const tryPlay = () =>
          video
            .play()
            .catch(() => setTimeout(() => video.play().catch(() => {}), 50));

        if (video.readyState >= 2) {
          tryPlay();
        } else {
          video.onloadedmetadata = tryPlay;
        }
      });
    } catch {
      setCameraError(
        "Camera access denied or unavailable. Opening file picker…"
      );
      cameraInputRef.current?.click();
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "camera-capture.png", {
        type: "image/png",
      });
      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);

      setResult(null);
      setError(null);
      closeCamera();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, "image/png");
  }, [closeCamera]);

  // Make Edits (reuse generated image as editable input)
  const handleMakeEdits = useCallback(async () => {
    if (!result) return;
    const blob = await dataUrlToBlob(result.imageUrl);
    const newFile = new File([blob], "generated-design.png", {
      type: blob.type,
    });
    setImageFile(newFile);
    setImagePreview(result.imageUrl);
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [result]);

  // Add-to-gallery
  const handleAddToGallery = useCallback(async () => {
    try {
      if (!result?.imageUrl) {
        setAddToGalleryMsg("No generated image to upload.");
        return;
      }
      setAddingToGallery(true);
      setAddToGalleryMsg("");

      let blob;
      if (result.imageUrl.startsWith("data:")) {
        blob = await dataUrlToBlob(result.imageUrl);
      } else {
        const resp = await fetch(result.imageUrl);
        blob = await resp.blob();
      }

      const file = new File([blob], "generated-design.png", {
        type: blob.type || "image/png",
      });
      const fd = new FormData();
      fd.append("image", file);

      const r = await fetch(`/api/gallery/upload`, {
        method: "POST",
        body: fd,
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Upload failed.");

      setAddToGalleryMsg("Added to gallery!");
    } catch (e) {
      setAddToGalleryMsg(`❌ ${e.message || "Failed to add to gallery."}`);
    } finally {
      setAddingToGallery(false);
    }
  }, [result]);

  // Cost calc
  const totalCostRange = result?.furniture.reduce(
    (range, item) => {
      if (item.searchResults?.length) {
        const prices = item.searchResults.map((p) => p.price);
        return {
          min: range.min + Math.min(...prices),
          max: range.max + Math.max(...prices),
        };
      }
      const est = item.estimatedPrice || 0;
      return { min: range.min + est, max: range.max + est };
    },
    { min: 0, max: 0 }
  ) || { min: 0, max: 0 };
  const totalCost = (totalCostRange.min + totalCostRange.max) / 2;

  return (
    <div className="min-h-screen font-sans text-slate-800">
      {/* Title block */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-2 text-center">
          <div className="flex justify-center items-center">
            <img
              src={logo}
              alt="Room Modeler Logo"
              className="h-20 w-auto transform origin-center object-contain drop-shadow-md"
            />
          </div>
          <p className="text-lg text-slate-600 text-center mt-4">
            Smart interior design tailored to your taste and budget.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-4xl mx-auto grid gap-10">
          <div className="p-8 bg-white rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-3xl font-bold mb-8 text-slate-800 text-center">
              1. Upload Your Room
            </h2>

            <div
              className="p-8 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50"
              onPaste={handlePaste}
              tabIndex={0}
            >
              {imagePreview ? (
                <div className="relative group">
                  <img
                    src={imagePreview}
                    alt="Room preview"
                    className="w-full max-h-[400px] object-contain rounded-lg mx-auto"
                  />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      {/* Regular file picker */}
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      {/* Fallback picker that prefers camera on some devices */}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={cameraInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                      />

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        <UploadIcon /> Upload Photo
                      </button>

                      {/* Open real camera overlay; fallback to file picker if unavailable */}
                      <button
                        onClick={openCamera}
                        className="inline-flex items-center justify-center px-8 py-4 border-2 border-slate-300 text-lg font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl"
                      >
                        <CameraIcon /> Use Camera
                      </button>
                    </div>
                    <p className="text-slate-600 text-lg">
                      Upload a picture, paste from clipboard, or use your camera
                      to capture it
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      💡 Tip: You can also paste an image directly (Ctrl+V /
                      Cmd+V)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="p-8 bg-white rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-3xl font-bold mb-8 text-slate-800 text-center">
              2. Your Style Preferences
            </h2>

            <div className="space-y-10">
              {/* Design Features */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-slate-700 flex items-center">
                  <span className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-indigo-600 font-bold text-sm">1</span>
                  </span>
                  Design Features
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    (Select up to 2)
                  </span>
                </h3>
                <p className="text-slate-600 mb-6">
                  Choose the design styles that appeal to you most
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {DESIGN_STYLES.map((style) => (
                    <label
                      key={style}
                      className={`flex items-center space-x-3 cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                        selectedStyles.includes(style)
                          ? "border-indigo-500 bg-indigo-50 shadow-md"
                          : selectedStyles.length >= 2
                          ? "border-slate-200 bg-slate-100 cursor-not-allowed opacity-60"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedStyles.includes(style)}
                        disabled={
                          !selectedStyles.includes(style) &&
                          selectedStyles.length >= 2
                        }
                        onChange={() =>
                          handleCheckboxChange(
                            style,
                            selectedStyles,
                            setSelectedStyles,
                            2
                          )
                        }
                      />
                      <span
                        className={`font-medium ${
                          selectedStyles.includes(style)
                            ? "text-indigo-700"
                            : "text-slate-700"
                        }`}
                      >
                        {style}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-slate-700 flex items-center">
                  <span className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-indigo-600 font-bold text-sm">2</span>
                  </span>
                  Color Palette
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    (Select up to 2)
                  </span>
                </h3>
                <p className="text-slate-600 mb-6">
                  Select color schemes that match your vision
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(COLOR_PALETTES).map(
                    ([paletteName, colors]) => (
                      <label
                        key={paletteName}
                        className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                          selectedColors.includes(paletteName)
                            ? "border-indigo-500 bg-indigo-50 shadow-md"
                            : selectedColors.length >= 2
                            ? "border-slate-200 bg-slate-100 cursor-not-allowed opacity-60"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            checked={selectedColors.includes(paletteName)}
                            disabled={
                              !selectedColors.includes(paletteName) &&
                              selectedColors.length >= 2
                            }
                            onChange={() =>
                              handleCheckboxChange(
                                paletteName,
                                selectedColors,
                                setSelectedColors,
                                2
                              )
                            }
                          />
                          <span
                            className={`font-medium ${
                              selectedColors.includes(paletteName)
                                ? "text-indigo-700"
                                : "text-slate-700"
                            }`}
                          >
                            {paletteName}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          {colors.map((color, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded-full border border-slate-200 shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Budget + Instructions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 text-slate-700 flex items-center">
                    <span className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-indigo-600 font-bold text-sm">
                        3
                      </span>
                    </span>
                    Budget (USD)
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Set your furniture budget
                  </p>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 text-lg">
                      $
                    </span>
                    <input
                      type="number"
                      value={budget}
                      onChange={handleBudgetChange}
                      min="0"
                      step="1"
                      className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-medium"
                      placeholder="2000"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 text-slate-700 flex items-center">
                    <span className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-indigo-600 font-bold text-sm">
                        4
                      </span>
                    </span>
                    Special Instructions
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Any specific requirements or preferences?
                  </p>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full h-24 p-4 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="e.g., Add a large plant in the corner, make sure there's a cozy reading nook, include storage solutions..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="text-center space-y-4">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !imageFile}
              className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 border border-transparent text-lg font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? "Designing..." : "Design for me!"}
            </button>
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        </div>

        {/* Results */}
        <div ref={resultRef} className="mt-12 md:mt-16">
          {isLoading && <Loader />}
          {result && (
            <div className="p-8 bg-white rounded-2xl shadow-lg border border-slate-200 animate-fade-in">
              <h2 className="text-3xl font-bold mb-6 text-center text-slate-800">
                Your New Room!
              </h2>
              <img
                src={result.imageUrl}
                alt="Generated room design"
                className="w-full rounded-xl shadow-md mb-8"
              />

              <h3 className="text-2xl font-semibold mb-4 text-slate-700">
                Shopping List
              </h3>
              <div className="space-y-6">
                {result.furniture.map((item, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-lg p-6 bg-slate-50"
                  >
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-slate-800 mb-2">
                        {item.name}
                      </h4>
                      <p className="text-sm text-slate-600 mb-3">
                        {item.description}
                      </p>
                      <p className="text-sm font-medium text-slate-700">
                        Estimated Price Range: ${item.estimatedPrice}
                      </p>
                    </div>
                    {item.searchResults?.length ? (
                      <div>
                        <h5 className="text-md font-medium text-slate-700 mb-3">
                          Similar Products Found:
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {item.searchResults.slice(0, 4).map((product, i) => (
                            <div
                              key={i}
                              className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow flex flex-col"
                            >
                              {product.thumbnail && (
                                <div className="relative mb-3">
                                  <img
                                    src={product.thumbnail}
                                    alt={product.title}
                                    className="w-full h-24 object-cover rounded-md"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextElementSibling.style.display =
                                        "flex";
                                    }}
                                  />
                                  <div
                                    className="w-full h-24 bg-slate-100 flex items-center justify-center text-slate-400 text-xs rounded-md"
                                    style={{ display: "none" }}
                                  >
                                    No Image
                                  </div>
                                </div>
                              )}
                              <div className="flex-grow">
                                <h6 className="font-medium text-slate-800 text-xs mb-2 line-clamp-2">
                                  {product.title}
                                </h6>
                                <p className="text-sm font-bold text-indigo-600 mb-1">
                                  ${product.price}
                                </p>
                                <p className="text-xs text-slate-500 mb-2">
                                  {product.source}
                                </p>
                              </div>
                              <div className="mt-auto">
                                <a
                                  href={product.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block w-full text-center bg-indigo-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:bg-indigo-700 transition-colors"
                                >
                                  View Product
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-500">
                        <p>No similar products found for this item.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Cost Summary */}
              <div className="mt-8 p-6 bg-slate-100 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-800">
                    Estimated Total Cost Range:
                  </span>
                  <div className="text-right">
                    <span
                      className={`text-2xl font-bold ${
                        totalCost > budget ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      ${totalCostRange.min.toFixed(0)} - $
                      {totalCostRange.max.toFixed(0)}
                    </span>
                    <p className="text-sm text-slate-600 mt-1">
                      Average: ${totalCost.toFixed(0)}
                    </p>
                  </div>
                </div>
                {totalCost > budget && (
                  <p className="text-sm text-red-600 mt-2 text-right">
                    Note: Estimated range is over your specified budget of $
                    {budget}.
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Price range based on available product options for each item
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                <button
                  onClick={handleMakeEdits}
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-slate-700 hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                  Make Edits
                </button>
                <button
                  onClick={handleAddToGallery}
                  disabled={addingToGallery}
                  className={`inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    addingToGallery
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                  }`}
                >
                  {addingToGallery ? "Adding…" : "Add to Gallery"}
                </button>
              </div>
              {addToGalleryMsg && (
                <p className="text-center mt-3 text-sm">{addToGalleryMsg}</p>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-slate-500">
        <p>Created by Base60</p>
      </footer>

      {/* Camera Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 w-full max-w-xl shadow-xl">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="w-full h-auto bg-black"
                autoPlay
                muted
                playsInline
              ></video>
            </div>
            {cameraError && <p className="text-red-600 mt-2">{cameraError}</p>}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={closeCamera}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Capture
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
