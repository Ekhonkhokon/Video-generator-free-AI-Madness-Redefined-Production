const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

export const decodeAudioData = async (file: File): Promise<AudioBuffer> => {
  const arrayBuffer = await file.arrayBuffer();
  return new Promise((resolve, reject) => {
    audioContext.decodeAudioData(
      arrayBuffer,
      (buffer) => resolve(buffer),
      (error) => reject(error)
    );
  });
};

// This function converts an SVG element to a base64 encoded PNG string.
export const svgToPngBase64 = (svgElement: SVGSVGElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    // Add necessary namespaces
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    const canvas = document.createElement('canvas');

    img.onload = () => {
      const viewBox = svgElement.getAttribute('viewBox');
      let width = 800; // Default width
      let height = 150; // Default height
      if (viewBox) {
        const parts = viewBox.split(' ');
        width = parseInt(parts[2], 10);
        height = parseInt(parts[3], 10);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('Could not get canvas context'));
      }

      ctx.drawImage(img, 0, 0, width, height);
      const pngDataUrl = canvas.toDataURL('image/png');
      
      // The API expects just the base64 data, not the full data URL prefix.
      const base64Data = pngDataUrl.split(',')[1];
      
      URL.revokeObjectURL(url);
      resolve(base64Data);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image for conversion.'));
    };

    img.src = url;
  });
};
