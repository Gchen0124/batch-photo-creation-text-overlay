
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Sparkles, Download, RefreshCw, Layers, ClipboardPaste, X, Eraser, Type, Settings2, Palette, AlignCenter } from 'lucide-react';
import { BatchImage, TextSettings } from './types';
import { generateImageFromBase } from './services/geminiService';

const DEFAULT_TEXT_SETTINGS: TextSettings = {
  fontFamily: 'Inter',
  fontSize: 48,
  color: '#ffffff',
  yPosition: 50,
  shadow: true,
  uppercase: true
};

const App: React.FC = () => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [batchItems, setBatchItems] = useState<BatchImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBulkInput, setShowBulkInput] = useState<'ideas' | 'titles' | null>(null);
  const [bulkText, setBulkText] = useState('');
  const [textSettings, setTextSettings] = useState<TextSettings>(DEFAULT_TEXT_SETTINGS);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBaseImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addBatchItem = () => {
    const newItem: BatchImage = {
      id: Math.random().toString(36).substr(2, 9),
      prompt: '',
      status: 'idle',
    };
    setBatchItems([...batchItems, newItem]);
  };

  const handleBulkAdd = () => {
    const lines = bulkText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    if (showBulkInput === 'ideas') {
      const newItems: BatchImage[] = lines.map(line => ({
        id: Math.random().toString(36).substr(2, 9),
        prompt: line.trim(),
        status: 'idle',
      }));
      setBatchItems([...batchItems, ...newItems]);
    } else if (showBulkInput === 'titles') {
      // Apply titles sequentially to existing items
      const updatedItems = [...batchItems];
      lines.forEach((line, index) => {
        if (updatedItems[index]) {
          updatedItems[index].title = line.trim();
        } else {
          updatedItems.push({
            id: Math.random().toString(36).substr(2, 9),
            prompt: '', // Empty prompt for items added via title
            title: line.trim(),
            status: 'idle'
          });
        }
      });
      setBatchItems(updatedItems);
    }

    setBulkText('');
    setShowBulkInput(null);
  };

  const removeBatchItem = (id: string) => {
    setBatchItems(batchItems.filter(item => item.id !== id));
  };

  const clearAllItems = () => {
    if (window.confirm('Are you sure you want to clear all items?')) {
      setBatchItems([]);
    }
  };

  const updatePrompt = (id: string, prompt: string) => {
    setBatchItems(batchItems.map(item => item.id === id ? { ...item, prompt } : item));
  };

  const updateTitle = (id: string, title: string) => {
    setBatchItems(batchItems.map(item => item.id === id ? { ...item, title } : item));
  };

  const generateSingle = async (id: string) => {
    if (!baseImage) return;
    
    setBatchItems(prev => prev.map(item => item.id === id ? { ...item, status: 'generating', error: undefined } : item));

    const item = batchItems.find(i => i.id === id);
    if (!item) return;

    try {
      const imageUrl = await generateImageFromBase(baseImage, item.prompt || 'Professional design variant');
      setBatchItems(prev => prev.map(item => item.id === id ? { ...item, imageUrl, status: 'completed' } : item));
    } catch (error: any) {
      setBatchItems(prev => prev.map(item => item.id === id ? { ...item, status: 'error', error: error.message } : item));
    }
  };

  const generateAll = async () => {
    if (!baseImage || batchItems.length === 0) return;
    setIsProcessing(true);

    for (const item of batchItems) {
      if (item.prompt.trim() !== '' && item.status !== 'completed') {
        await generateSingle(item.id);
      }
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Layers className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              CoverFlow Studio
            </h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Batch Image & Typography Studio</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={generateAll}
            disabled={!baseImage || isProcessing || batchItems.length === 0}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-sm"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Images
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4 flex flex-col gap-6">
          {/* Base Image Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-500" />
              Base Reference
            </h2>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden aspect-video flex flex-col items-center justify-center
                ${baseImage ? 'border-transparent' : 'border-slate-300 hover:border-indigo-400 bg-slate-50'}
              `}
            >
              {baseImage ? (
                <>
                  <img src={baseImage} alt="Base" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-medium flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" /> Change Image
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 font-medium">Click to upload</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          </div>

          {/* Typography Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Type className="w-5 h-5 text-emerald-500" />
              Global Typography
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Font Family</label>
                <select 
                  value={textSettings.fontFamily}
                  onChange={(e) => setTextSettings({...textSettings, fontFamily: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Inter">Inter (Modern)</option>
                  <option value="Georgia">Georgia (Classic)</option>
                  <option value="Impact">Impact (Bold)</option>
                  <option value="Courier New">Courier (Retro)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Size ({textSettings.fontSize}px)</label>
                  <input 
                    type="range" min="10" max="200" 
                    value={textSettings.fontSize}
                    onChange={(e) => setTextSettings({...textSettings, fontSize: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Position Y ({textSettings.yPosition}%)</label>
                  <input 
                    type="range" min="5" max="95" 
                    value={textSettings.yPosition}
                    onChange={(e) => setTextSettings({...textSettings, yPosition: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={textSettings.color}
                      onChange={(e) => setTextSettings({...textSettings, color: e.target.value})}
                      className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                    />
                    <Palette className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => setTextSettings({...textSettings, shadow: !textSettings.shadow})}
                    className={`px-3 py-1 text-xs rounded-full font-bold transition-all ${textSettings.shadow ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                   >Shadow</button>
                   <button 
                    onClick={() => setTextSettings({...textSettings, uppercase: !textSettings.uppercase})}
                    className={`px-3 py-1 text-xs rounded-full font-bold transition-all ${textSettings.uppercase ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                   >ABC</button>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Items Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                Batch Editor
              </h2>
              <div className="flex gap-1">
                <button 
                  onClick={() => setShowBulkInput('ideas')}
                  className={`p-1.5 rounded-lg transition-colors ${showBulkInput === 'ideas' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}
                  title="Bulk Paste Ideas"
                >
                  <ClipboardPaste className="w-5 h-5" />
                </button>
                <button 
                   onClick={() => setShowBulkInput('titles')}
                   className={`p-1.5 rounded-lg transition-colors ${showBulkInput === 'titles' ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-slate-100 text-slate-500'}`}
                   title="Bulk Paste Titles"
                >
                  <Type className="w-5 h-5" />
                </button>
                <button onClick={addBatchItem} className="p-1.5 hover:bg-slate-100 rounded-lg text-indigo-600 transition-colors" title="Add Single">
                  <Plus className="w-5 h-5" />
                </button>
                {batchItems.length > 0 && (
                   <button onClick={clearAllItems} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Clear All">
                     <Eraser className="w-5 h-5" />
                   </button>
                )}
              </div>
            </div>

            {showBulkInput ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-bold text-slate-400 uppercase">
                     Paste your {showBulkInput} (one per line)
                   </p>
                   <button onClick={() => setShowBulkInput(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4"/></button>
                </div>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={showBulkInput === 'ideas' ? "Vintage 1970s aesthetic\nDark neon cityscape..." : "The Future of AI\nWeekly Newsletter\nNew Album Drop..."}
                  className="w-full h-48 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
                <button 
                  onClick={handleBulkAdd}
                  className={`w-full py-2.5 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${showBulkInput === 'ideas' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  <Plus className="w-4 h-4" /> Import {showBulkInput}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {batchItems.map((item, index) => (
                  <div key={item.id} className="group flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">ITEM #{index + 1}</span>
                      <button onClick={() => removeBatchItem(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <input 
                          value={item.prompt} 
                          onChange={(e) => updatePrompt(item.id, e.target.value)}
                          placeholder="Image theme..."
                          className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Type className="w-3 h-3 text-emerald-400" />
                        <input 
                          value={item.title || ''} 
                          onChange={(e) => updateTitle(item.id, e.target.value)}
                          placeholder="Overlay text..."
                          className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {batchItems.map((item, index) => (
              <BatchResultCard 
                key={item.id}
                item={item}
                index={index}
                textSettings={textSettings}
                onRegenerate={() => generateSingle(item.id)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

interface BatchResultCardProps {
  item: BatchImage;
  index: number;
  textSettings: TextSettings;
  onRegenerate: () => void;
}

const BatchResultCard: React.FC<BatchResultCardProps> = ({ item, index, textSettings, onRegenerate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !item.imageUrl) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = item.imageUrl;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw base image
      ctx.drawImage(img, 0, 0);

      // Draw text if exists
      if (item.title) {
        const text = textSettings.uppercase ? item.title.toUpperCase() : item.title;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Dynamic font size relative to image width (approx 1024 base)
        const scale = img.width / 512;
        ctx.font = `${textSettings.fontSize * scale}px ${textSettings.fontFamily}`;
        ctx.fillStyle = textSettings.color;

        if (textSettings.shadow) {
          ctx.shadowColor = 'rgba(0,0,0,0.7)';
          ctx.shadowBlur = 10 * scale;
          ctx.shadowOffsetX = 2 * scale;
          ctx.shadowOffsetY = 2 * scale;
        }

        const y = (textSettings.yPosition / 100) * img.height;
        ctx.fillText(text, img.width / 2, y);
      }
    };
  }, [item.imageUrl, item.title, textSettings]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `cover-${index + 1}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group h-full transition-all hover:shadow-md">
      <div className="relative aspect-[4/5] bg-slate-100 flex items-center justify-center overflow-hidden">
        {item.status === 'generating' && (
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-indigo-900 font-bold animate-pulse uppercase tracking-widest text-xs">Processing...</p>
          </div>
        )}

        {item.imageUrl ? (
          <canvas 
            ref={canvasRef} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" 
          />
        ) : (
          <div className="text-slate-300 p-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Variant #{index+1}</p>
          </div>
        )}

        {item.imageUrl && (
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={handleDownload} className="bg-white/95 hover:bg-white p-2.5 rounded-xl shadow-lg text-slate-700 hover:text-indigo-600">
              <Download className="w-5 h-5" />
            </button>
            <button onClick={onRegenerate} className="bg-white/95 hover:bg-white p-2.5 rounded-xl shadow-lg text-slate-700 hover:text-violet-600">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="p-4 bg-white flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Variant {index + 1}</span>
            {item.status === 'completed' && <span className="text-emerald-500 flex items-center gap-1 text-[10px] font-bold">READY</span>}
          </div>
          <p className="text-slate-600 text-xs italic line-clamp-1 mb-1">Theme: {item.prompt || 'Default'}</p>
          <p className="text-slate-900 text-sm font-bold line-clamp-1">Text: {item.title || '(No Text)'}</p>
        </div>
        
        {item.status === 'idle' && (
          <button onClick={onRegenerate} className="mt-4 w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
            Generate Now
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
