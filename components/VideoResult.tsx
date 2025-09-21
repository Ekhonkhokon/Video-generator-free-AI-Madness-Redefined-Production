
import React from 'react';

interface VideoResultProps {
  videoUrl: string;
}

const VideoResult: React.FC<VideoResultProps> = ({ videoUrl }) => {
  return (
    <div className="mt-8 p-6 bg-gray-800 rounded-2xl">
      <h3 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
        Your Video is Ready!
      </h3>
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <video src={videoUrl} controls autoPlay loop className="w-full h-full" />
      </div>
      <a
        href={videoUrl}
        download="generated-video.mp4"
        className="mt-4 w-full block text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out"
      >
        Download Video
      </a>
    </div>
  );
};

export default VideoResult;
