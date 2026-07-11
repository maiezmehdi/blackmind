import React, { useState, useCallback } from 'react';
import { Box, Upload, X, BoxSelect, Maximize2 } from 'lucide-react';

interface ArModelBlockProps {
  value: string;
  onUpload: (url: string) => void;
  isEditable: boolean;
}

const ArModelBlock: React.FC<ArModelBlockProps> = ({ value, onUpload, isEditable }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isEditable) setIsDragging(true);
  }, [isEditable]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!isEditable) return;

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
      const url = URL.createObjectURL(file);
      onUpload(url);
    }
  }, [isEditable, onUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
      const url = URL.createObjectURL(file);
      onUpload(url);
    }
  }, [onUpload]);

  // Use a variable cast to any to avoid TypeScript errors with the custom element
  const ModelViewer = 'model-viewer' as any;

  if (!value && isEditable) {
    return (
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative aspect-video rounded-[2.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 group ${isDragging ? 'border-gemini-accent bg-gemini-accent/5' : 'border-gemini-border hover:border-gemini-dim bg-gemini-surface/30'}`}
      >
        <div className="w-16 h-16 rounded-3xl bg-gemini-bg border border-gemini-border flex items-center justify-center text-gemini-dim group-hover:text-gemini-accent group-hover:scale-110 transition-all shadow-xl">
          <BoxSelect size={32} />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gemini-text">Modèle 3D ARCore</p>
          <p className="text-[10px] text-gemini-dim uppercase tracking-widest mt-1 font-bold">Glissez un fichier .GLB ici</p>
        </div>
        <input 
          type="file" 
          accept=".glb,.gltf" 
          onChange={handleFileInput} 
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
    );
  }

  if (!value) return null;

  return (
    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-gemini-surface border border-gemini-border shadow-2xl group">
      <ModelViewer
        src={value}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        touch-action="pan-y"
        alt="A 3D model"
        shadow-intensity="1"
        auto-rotate
      >
        <button 
          slot="ar-button" 
          className="absolute bottom-6 right-6 px-6 py-3 bg-gemini-accent text-gemini-bg rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
        >
          <Maximize2 size={14} /> Voir en Réalité Augmentée
        </button>
      </ModelViewer>
      
      {isEditable && (
        <button 
          onClick={() => onUpload('')}
          className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default ArModelBlock;