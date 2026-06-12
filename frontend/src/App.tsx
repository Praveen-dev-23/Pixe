import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, Loader2, Image as ImageIcon, Settings2, RefreshCw } from 'lucide-react';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pixelated, setPixelated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [pixelSize, setPixelSize] = useState(10);
  const [palette, setPalette] = useState('original');
  const [colors, setColors] = useState(16);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setPixelated(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1
  });

  const handleGenerate = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('pixel_size', pixelSize.toString());
    formData.append('palette', palette);
    formData.append('colors', colors.toString());

    try {
      const response = await fetch('http://localhost:8080/api/pixelate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const blob = await response.blob();
      setPixelated(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (pixelated) {
      const a = document.createElement('a');
      a.href = pixelated;
      a.download = `pixelified_${Date.now()}.png`;
      a.click();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans selection:bg-purple-500/30">
      <header className="border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
              P
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Pixelify AI</h1>
          </div>
          {pixelated && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 transition-colors rounded-lg text-sm font-medium border border-neutral-700"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Workspace */}
          <div className="space-y-6">
            {!file ? (
              <div 
                {...getRootProps()} 
                className={`
                  border-2 border-dashed rounded-2xl h-[600px] flex flex-col items-center justify-center gap-4 transition-all cursor-pointer
                  ${isDragActive ? 'border-purple-500 bg-purple-500/5' : 'border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50'}
                `}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-neutral-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium">Drop your image here</p>
                  <p className="text-sm text-neutral-500 mt-1">Supports PNG, JPG, WEBP</p>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => { setFile(null); setPreview(null); setPixelated(null); }}
                      className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Start Over
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 rounded-full bg-neutral-800 text-xs font-medium text-neutral-300">
                      Original
                    </div>
                    {pixelated && (
                      <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium border border-purple-500/20">
                        Pixelated
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 min-h-[500px] bg-neutral-900 relative">
                  {/* Original */}
                  <div className="relative border-r border-neutral-800 p-4 flex items-center justify-center">
                    <img src={preview!} alt="Original" className="max-w-full max-h-[600px] object-contain rounded drop-shadow-2xl" />
                  </div>
                  
                  {/* Pixelated */}
                  <div className="relative p-4 flex items-center justify-center bg-black/20">
                    {loading ? (
                      <div className="flex flex-col items-center gap-3 text-purple-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-sm font-medium animate-pulse">Processing Image...</span>
                      </div>
                    ) : pixelated ? (
                      <img 
                        src={pixelated} 
                        alt="Pixelated result" 
                        className="max-w-full max-h-[600px] object-contain rounded drop-shadow-2xl"
                        style={{ imageRendering: 'pixelated' }} 
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-neutral-600">
                        <ImageIcon className="w-12 h-12 opacity-50" />
                        <span className="text-sm">Click 'Pixefy' to generate</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Settings Sidebar */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 h-fit sticky top-24 shadow-xl">
            <div className="flex items-center gap-2 mb-6 text-neutral-200">
              <Settings2 className="w-5 h-5" />
              <h2 className="font-medium">Settings</h2>
            </div>

            <div className="space-y-6">
              {/* Pixel Size */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <label className="text-neutral-400 font-medium">Pixel Size</label>
                  <span className="text-neutral-200 bg-neutral-800 px-2 py-0.5 rounded text-xs">{pixelSize}x</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="32"
                  value={pixelSize}
                  onChange={(e) => setPixelSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Palette Selection */}
              <div className="space-y-3">
                <label className="text-sm text-neutral-400 font-medium block">Color Palette</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'original', label: 'Original' },
                    { id: 'gameboy', label: 'Game Boy' },
                    { id: 'nes', label: 'NES' },
                    { id: 'snes', label: 'SNES' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPalette(p.id)}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all text-left border
                        ${palette === p.id 
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'}
                      `}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Count (only if original) */}
              {palette === 'original' && (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <label className="text-neutral-400 font-medium">Colors</label>
                    <span className="text-neutral-200 bg-neutral-800 px-2 py-0.5 rounded text-xs">{colors}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="64"
                    value={colors}
                    onChange={(e) => setColors(Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-neutral-800 mt-6">
                <button
                  onClick={handleGenerate}
                  disabled={!file || loading}
                  className={`
                    w-full py-3 rounded-lg font-medium text-sm transition-all shadow-lg
                    ${!file 
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700' 
                      : loading
                        ? 'bg-purple-500/50 text-white cursor-wait'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/25'}
                  `}
                >
                  {loading ? 'Processing...' : 'Pixefy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
