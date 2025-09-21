import React from 'react';

interface VideoUploadProps {
  onVideoUpload: (file: File) => void;
  videoUrl: string | null;
  disabled: boolean;
  videoFile: File | null;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoUpload, videoUrl, disabled, videoFile }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onVideoUpload(file);
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
    if (file && file.type.startsWith('video/')) {
      onVideoUpload(file);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-2">Upload Reference Video</label>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-lg transition duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-700 hover:border-gray-500'}`}
      >
        <input
          id="video-upload"
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        <p className="text-gray-400 text-center">
          {videoFile ? `File: ${videoFile.name}` : 'Drag & drop a video file here, or click to select'}
        </p>
      </div>
      {videoUrl && (
        <div className="mt-4 aspect-video bg-black rounded-lg overflow-hidden">
          <video key={videoUrl} src={videoUrl} controls className="w-full h-full" />
        </div>
      )}
    </div>
  );
};

export default VideoUpload;