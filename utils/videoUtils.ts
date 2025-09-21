export const extractFrameAsBase64 = (videoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const reader = new FileReader();
    reader.readAsDataURL(videoFile);
    reader.onload = () => {
      video.src = reader.result as string;
    };
    reader.onerror = (error) => reject(error);

    video.onloadedmetadata = () => {
      // Seek to the middle of the video
      video.currentTime = video.duration / 2;
    };

    video.onseeked = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      
      // The Gemini API expects just the base64 data, not the full data URL prefix.
      const base64Data = dataUrl.split(',')[1];
      
      resolve(base64Data);
      
      // Cleanup
      URL.revokeObjectURL(video.src);
    };

    video.onerror = (e) => {
      let errorMsg = 'Unknown video error.';
      switch (video.error?.code) {
        case 1: errorMsg = 'Video loading aborted.'; break;
        case 2: errorMsg = 'A network error caused video download to fail.'; break;
        case 3: errorMsg = 'Video playback aborted due to a corruption problem or because the video used features your browser did not support.'; break;
        case 4: errorMsg = 'The video could not be loaded, either because the server or network failed or because the format is not supported.'; break;
      }
       reject(new Error(errorMsg));
    };

    // Start loading the video
    video.load();
  });
};
