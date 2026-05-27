import React, { useRef } from 'react';
import { Upload, FileCheck, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (e.dataTransfer.files[0].type === "application/pdf") {
        onFileSelect(e.dataTransfer.files[0]);
      } else {
        alert("Por favor, selecione um arquivo PDF.");
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full mb-8">
      {!selectedFile ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-camerite-main hover:bg-gray-800 transition-all group"
        >
          <Upload className="w-10 h-10 text-gray-400 group-hover:text-camerite-main mb-3" />
          <p className="text-gray-300 font-medium text-center">
            Clique para fazer upload ou arraste o PDF base
          </p>
          <p className="text-gray-500 text-sm mt-1">Apenas arquivos PDF</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept="application/pdf"
            className="hidden"
          />
        </div>
      ) : (
        <div className="bg-gray-800 border border-camerite-main/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-camerite-main/20 p-2 rounded-full">
              <FileCheck className="w-6 h-6 text-camerite-main" />
            </div>
            <div>
              <p className="text-white font-medium">{selectedFile.name}</p>
              <p className="text-gray-400 text-xs">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button
            onClick={onClear}
            className="text-gray-400 hover:text-red-400 p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
