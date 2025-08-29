// Fix: Add imports for React, ReactDOM, and Framer Motion because the file is treated as a module.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';

// Fix: Add type declarations for global variables from CDN scripts.
declare const lucide: any;
declare const imageCompression: any;

// Since we are using CDN, lucide is on the window object. This component
// creates an `<i>` tag that the lucide.createIcons() script can find and replace with an SVG.
const Icon = ({ name, ...props }) => {
  // lucide from CDN expects kebab-case names for the data-lucide attribute.
  const iconName = name.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  return <i data-lucide={iconName} {...props} />;
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const App = () => {
  const [originalFile, setOriginalFile] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [compressedImageUrl, setCompressedImageUrl] = useState('');
  
  const [compressionLevel, setCompressionLevel] = useState('Medium');
  const [customQuality, setCustomQuality] = useState(70);

  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState('');
  const [appState, setAppState] = useState('upload'); // 'upload', 'compressing', 'done'
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    lucide.createIcons();
  }, [appState]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setOriginalFile(file);
      setOriginalImageUrl(URL.createObjectURL(file));
      setError('');
      setAppState('compressing');
    } else {
      setError('Please upload a valid JPG, PNG, or WebP image.');
    }
  };

  const getCompressionOptions = useCallback(() => {
    switch (compressionLevel) {
      case 'Low':
        return { maxSizeMB: 1, initialQuality: 0.8 };
      case 'High':
        return { maxSizeMB: 0.1, initialQuality: 0.4 };
      case 'Custom':
        return { maxSizeMB: 2, initialQuality: customQuality / 100 };
      case 'Medium':
      default:
        return { maxSizeMB: 0.5, initialQuality: 0.6 };
    }
  }, [compressionLevel, customQuality]);

  const handleCompress = async () => {
    if (!originalFile) return;

    setIsCompressing(true);
    setError('');

    const options = {
      ...getCompressionOptions(),
      useWebWorker: true,
      onProgress: (p) => console.log(`Compression progress: ${p}%`),
    };

    try {
      const compressed = await imageCompression(originalFile, options);
      setCompressedFile(compressed);
      setCompressedImageUrl(URL.createObjectURL(compressed));
      setAppState('done');
    } catch (e) {
      console.error(e);
      setError('Failed to compress image. It might be too small or in an unsupported format.');
      setAppState('upload'); // Reset on error
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedFile) return;
    const link = document.createElement('a');
    link.href = compressedImageUrl;
    link.download = `compressed-${originalFile.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleReset = () => {
    URL.revokeObjectURL(originalImageUrl);
    URL.revokeObjectURL(compressedImageUrl);
    setOriginalFile(null);
    setCompressedFile(null);
    setOriginalImageUrl('');
    setCompressedImageUrl('');
    setCompressionLevel('Medium');
    setCustomQuality(70);
    setError('');
    setAppState('upload');
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const renderUploadState = () => (
    <motion.div
      key="upload"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <div
        className="relative border-2 border-dashed border-slate-600 rounded-2xl p-12 transition-colors hover:border-violet-500 hover:bg-slate-800/50 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center">
            <Icon name="UploadCloud" className="w-8 h-8 text-violet-400" />
          </div>
          <p className="text-lg font-semibold">Drag & Drop or Click to Upload</p>
          <p className="text-sm text-slate-400">Supports JPG, PNG, WebP</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />
      </div>
      {error && <p className="mt-4 text-red-400">{error}</p>}
    </motion.div>
  );

  const renderCompressingState = () => (
    <motion.div
      key="compressing"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto"
    >
        <div className="bg-slate-800/50 rounded-2xl p-8 shadow-2xl backdrop-blur-lg border border-slate-700">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center space-y-4">
                    <h3 className="text-xl font-semibold text-slate-300">Original Image</h3>
                    <img src={originalImageUrl} alt="Original" className="rounded-lg max-h-64 object-contain" />
                    <p className="text-slate-400">{formatBytes(originalFile?.size)}</p>
                </div>
                <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6">
                    <h3 className="text-xl font-semibold text-center md:text-left">Compression Settings</h3>
                    <div className="flex justify-around bg-slate-700/50 p-1 rounded-lg">
                        {['Low', 'Medium', 'High', 'Custom'].map(level => (
                            <button
                                key={level}
                                onClick={() => setCompressionLevel(level)}
                                className={`w-full py-2 text-sm rounded-md transition-colors ${compressionLevel === level ? 'bg-violet-600 text-white font-semibold' : 'hover:bg-slate-600/50'}`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence>
                    {compressionLevel === 'Custom' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 overflow-hidden"
                        >
                            <label className="text-sm text-slate-400">Quality: {customQuality}</label>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={customQuality}
                                onChange={(e) => setCustomQuality(parseInt(e.target.value, 10))}
                            />
                        </motion.div>
                    )}
                    </AnimatePresence>
                    
                    <button
                        onClick={handleCompress}
                        disabled={isCompressing}
                        className="w-full flex items-center justify-center bg-violet-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-violet-700 disabled:bg-slate-500 transition-all transform hover:scale-105"
                    >
                         {isCompressing ? (
                             <>
                                <Icon name="Loader" className="animate-spin mr-2" /> Compressing...
                             </>
                         ) : (
                             <>
                                <Icon name="Zap" className="mr-2" /> Compress Image
                             </>
                         )}
                    </button>
                </div>
            </div>
        </div>
    </motion.div>
  );

  const renderDoneState = () => (
    <motion.div
      key="done"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl mx-auto"
    >
        <div className="bg-slate-800/50 rounded-2xl p-8 shadow-2xl backdrop-blur-lg border border-slate-700">
            <h2 className="text-3xl font-bold text-center mb-8">Compression Complete!</h2>
            <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center space-y-2">
                    <h3 className="text-xl font-semibold text-slate-300">Original</h3>
                    <img src={originalImageUrl} alt="Original" className="rounded-lg max-h-64 object-contain" />
                    <p className="text-slate-400">{formatBytes(originalFile?.size)}</p>
                </div>
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center space-y-2">
                    <h3 className="text-xl font-semibold text-violet-400">Compressed</h3>
                    <img src={compressedImageUrl} alt="Compressed" className="rounded-lg max-h-64 object-contain" />
                    <p className="text-violet-400 font-bold">{formatBytes(compressedFile?.size)}</p>
                </div>
            </div>
            <div className="text-center mb-8">
                <div className="bg-green-500/10 text-green-300 font-bold py-3 px-6 rounded-lg inline-block">
                    Saved {formatBytes(originalFile?.size - compressedFile?.size)} (
                    {Math.round(((originalFile?.size - compressedFile?.size) / originalFile?.size) * 100)}% reduction)
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                    onClick={handleDownload}
                    className="flex items-center justify-center bg-violet-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-violet-700 transition-all transform hover:scale-105"
                >
                    <Icon name="Download" className="mr-2" /> Download
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center justify-center bg-slate-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-700 transition-colors"
                >
                    <Icon name="RotateCw" className="mr-2" /> Compress Another
                </button>
            </div>
        </div>
    </motion.div>
  );

  return (
    <main className="w-full max-w-md mx-auto">
      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-400">Image Compressor Pro</h1>
        <p className="text-slate-400 mt-2">Fast, private, and powerful image compression.</p>
      </header>
      <AnimatePresence mode="wait">
        {appState === 'upload' && renderUploadState()}
        {appState === 'compressing' && renderCompressingState()}
        {appState === 'done' && renderDoneState()}
      </AnimatePresence>
    </main>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);