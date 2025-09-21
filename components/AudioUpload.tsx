import React from 'react';

interface AudioUploadProps {
  onAudioUpload: (file: File) => void;
  audioUrl: string | null;
  disabled: boolean;
  // FIX: Add audioFile to props to make it accessible within the component.
  audioFile: File | null;
}

const AudioUpload: React.FC<AudioUploadProps> = ({ onAudioUpload, audioUrl, disabled, audioFile }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAudioUpload(file);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      onAudioUpload(file);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-2">Upload Audio File</label>
      <div 
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-lg transition duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-700 hover:border-gray-500'}`}
      >
        <input
          id="audio-upload"
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        <p className="text-gray-400 text-center">
          {/* FIX: Use the audioFile prop to display the file name. */}
          {audioFile ? `File: ${audioFile.name}` : 'Drag & drop an audio file here, or click to select'}
        </p>
      </div>
      {audioUrl && (
        <div className="mt-4">
          <audio key={audioUrl} src={audioUrl} controls className="w-full" />
        </div>
      )}
    </div>
  );
};

export default AudioUpload;