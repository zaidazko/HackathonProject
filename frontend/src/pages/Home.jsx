import React, { useState, useRef, useCallback } from 'react';
import { DESIGN_STYLES, COLOR_PALETTES } from '/src/constants.js';
import { fileToBase64, dataUrlToBlob } from '/src/utils/fileUtils.js';
import { generateRoomDesign } from '/src/services/geminiService.js';

// --- Helper & UI Components (defined outside main App to prevent re-creation on re-renders) ---

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const Loader = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
        <p className="text-indigo-700 font-semibold">Designing your dream room... this may take a moment!</p>
    </div>
);

// --- Main Application Component ---

const App = () => {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedStyles, setSelectedStyles] = useState([]);
    const [selectedColors, setSelectedColors] = useState([]);
    const [budget, setBudget] = useState(2000);
    const [instructions, setInstructions] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const resultRef = useRef(null);

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            setResult(null); // Clear previous result when new image is uploaded
            setError(null);
        }
    };

    const handleCheckboxChange = (
        value,
        list,
        setter
    ) => {
        const newList = list.includes(value)
            ? list.filter((item) => item !== value)
            : [...list, value];
        setter(newList);
    };

    const handleSubmit = async () => {
        if (!imageFile) {
            setError("Please upload or capture an image first.");
            return;
        }
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
            setTimeout(() => {
              resultRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (err) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleMakeEdits = useCallback(async () => {
        if (!result) return;
        
        // Convert the generated image data URL to a File object
        const blob = await dataUrlToBlob(result.imageUrl);
        const newFile = new File([blob], "generated-design.png", { type: blob.type });

        setImageFile(newFile);
        setImagePreview(result.imageUrl);
        setResult(null);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [result]);

    const totalCost = result?.furniture.reduce((sum, item) => sum + item.price, 0) || 0;

    return (
        <div className="min-h-screen font-sans text-slate-800">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-3xl font-bold text-center text-slate-900 tracking-tight">
                        <span role="img" aria-label="sofa icon" className="mr-2">🛋️</span>
                        AI Interior Designer
                    </h1>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="max-w-4xl mx-auto grid gap-10">
                    <div className="p-8 bg-white rounded-2xl shadow-lg border border-slate-200">
                        <h2 className="text-2xl font-semibold mb-6 text-slate-700">1. Your Room</h2>
                        <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center">
                            {imagePreview ? (
                                <div className="relative group">
                                    <img src={imagePreview} alt="Room preview" className="w-full max-h-[400px] object-contain rounded-lg mx-auto" />
                                    <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-4">
                                     <div className="flex flex-col sm:flex-row gap-4">
                                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                                        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleImageChange} className="hidden" />
                                        <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-all">
                                            <UploadIcon /> Upload Photo
                                        </button>
                                        <button onClick={() => cameraInputRef.current?.click()} className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-all">
                                            <CameraIcon /> Use Camera
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-2">Upload a picture or use your camera</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 bg-white rounded-2xl shadow-lg border border-slate-200">
                        <h2 className="text-2xl font-semibold mb-6 text-slate-700">2. Your Style</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div>
                                <h3 className="text-lg font-medium mb-3 text-slate-600">Design Features</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {DESIGN_STYLES.map(style => (
                                        <label key={style} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-100 transition-colors">
                                            <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 custom-checkbox" checked={selectedStyles.includes(style)} onChange={() => handleCheckboxChange(style, selectedStyles, setSelectedStyles)} />
                                            <span className="text-slate-700">{style}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium mb-3 text-slate-600">Color Palette</h3>
                                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {COLOR_PALETTES.map(color => (
                                        <label key={color} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-100 transition-colors">
                                            <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 custom-checkbox" checked={selectedColors.includes(color)} onChange={() => handleCheckboxChange(color, selectedColors, setSelectedColors)} />
                                            <span className="text-slate-700">{color}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium mb-3 text-slate-600">Budget (USD)</h3>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-300">$</span>
                                    <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} className="w-full pl-7 pr-4 py-2 border border-slate-500 bg-slate-600 text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-300" placeholder="e.g., 2000" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <h3 className="text-lg font-medium mb-3 text-slate-600">Instructions</h3>
                                <textarea value={instructions} onChange={e => setInstructions(e.target.value)} className="w-full h-24 p-2 border border-slate-500 bg-slate-600 text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-300" placeholder="e.g., Add a large plant in the corner, make sure there's a cozy reading nook..."></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <button onClick={handleSubmit} disabled={isLoading || !imageFile} className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 border border-transparent text-lg font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            {isLoading ? 'Designing...' : 'Design for me!'}
                        </button>
                        {error && <p className="text-red-500 mt-4">{error}</p>}
                    </div>
                </div>

                <div ref={resultRef} className="mt-12 md:mt-16">
                     {isLoading && <Loader />}
                     {result && (
                        <div className="p-8 bg-white rounded-2xl shadow-lg border border-slate-200 animate-fade-in">
                            <h2 className="text-3xl font-bold mb-6 text-center text-slate-800">Your New Room!</h2>
                            <img src={result.imageUrl} alt="Generated room design" className="w-full rounded-xl shadow-md mb-8" />

                            <h3 className="text-2xl font-semibold mb-4 text-slate-700">Shopping List</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="border-b-2 border-slate-300">
                                        <tr>
                                            <th className="p-4 text-sm font-semibold text-slate-600 uppercase">FURNITURE / DECOR</th>
                                            <th className="p-4 text-sm font-semibold text-slate-600 uppercase text-right">ESTIMATED PRICE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.furniture.map((item, index) => (
                                            <tr key={index} className="border-b border-slate-200">
                                                <td className="p-4">
                                                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium transition-colors">
                                                        {item.name}
                                                    </a>
                                                </td>
                                                <td className="p-4 text-right font-mono text-slate-700">${item.price.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50">
                                            <td className="p-4 font-bold text-slate-800">Estimated Total</td>
                                            <td className={`p-4 text-right font-bold font-mono ${totalCost > budget ? 'text-red-600' : 'text-green-600'}`}>
                                                ${totalCost.toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                                {totalCost > budget && <p className="text-sm text-red-600 text-right mt-2">Note: Estimated total is over your specified budget of ${budget}.</p>}
                            </div>
                            
                            <div className="text-center mt-8">
                                <button onClick={handleMakeEdits} className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-slate-700 hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                                    Make Edits
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <footer className="text-center py-6 text-sm text-slate-500">
                <p>Powered by Google Gemini</p>
            </footer>
        </div>
    );
};

export default App;