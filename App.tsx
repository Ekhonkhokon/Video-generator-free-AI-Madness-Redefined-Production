import React, { useState, useRef } from 'react';
import Header from './components/Header';
import AudioUpload from './components/AudioUpload';
import VideoUpload from './components/VideoUpload';
import AudioVisualizer from './components/AudioVisualizer';
import LoadingIndicator from './components/LoadingIndicator';
import VideoResult from './components/VideoResult';
import { decodeAudioData, svgToPngBase64 } from './utils/audioUtils';
import { extractFrameAsBase64 } from './utils/videoUtils';
import { generateVideo } from './services/geminiService';

const App: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [referenceVideoFile, setReferenceVideoFile] = useState<File | null>(null);
  const [referenceVideoUrl, setReferenceVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [characterDescription, setCharacterDescription] = useState<string>('');
  const [characterVoice, setCharacterVoice] = useState<string>('Default');
  const [dialogue, setDialogue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioSourceOption, setAudioSourceOption] = useState<'upload' | 'generate'>('upload');
  const [videoDuration, setVideoDuration] = useState<number>(10);

  const svgRef = useRef<SVGSVGElement>(null);

  const handleAudioUpload = async (file: File) => {
    setVideoUrl(null);
    setError(null);
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    try {
      const buffer = await decodeAudioData(file);
      setAudioBuffer(buffer);
    } catch (err) {
      console.error('Error decoding audio data:', err);
      setError('Failed to process audio file. Please try a different one.');
    }
  };
  
  const handleVideoUpload = (file: File) => {
    setVideoUrl(null);
    setError(null);
    setReferenceVideoFile(file);
    const url = URL.createObjectURL(file);
    setReferenceVideoUrl(url);
  };

  const handleGenerateVideo = async () => {
    if (!prompt || (audioSourceOption === 'upload' && !audioFile)) {
      setError('Please provide a scene prompt and ensure an audio file is uploaded if required.');
      return;
    }
    setError(null);
    setVideoUrl(null);
    setIsLoading(true);

    const createFinalPrompt = () => {
        let finalPrompt = `You are a world-class AI filmmaker and sound designer. Your task is to generate a single, continuous, photorealistic video of exactly ${videoDuration} seconds in duration, complete with fully synchronized audio.

**Cinematography & Realism:**
- **Duration:** The final video MUST be exactly ${videoDuration} seconds long.
- **Visual Style:** The video must be cinematic, with professional-grade lighting that creates depth and mood. Use a shallow depth of field to keep the focus on the character.
- **Realism:** Render all elements with photorealistic detail. Pay extreme attention to realistic textures, reflections, shadows, and subtle environmental animations (e.g., wind in hair, dust motes in light).

**Scene & Mood:**
- The setting is: "${prompt}". Establish a cinematic atmosphere that complements this scene.

**Character Focus:**`;

      if (characterDescription) {
        finalPrompt += `
- **Appearance:** The character is described as: "${characterDescription}". Render them with ultra-realistic skin textures, hair that moves naturally, and detailed clothing.`;
      }

      let demeanorInstruction = "The character should deliver their lines with a natural and convincing expression.";
      if (characterVoice && characterVoice !== 'Default') {
        switch(characterVoice) {
            case 'Enthusiastic':
                demeanorInstruction = "The character is **enthusiastic**. Their performance should be energetic and highly expressive, with bright eyes, smiles, and dynamic gestures that match their excited tone.";
                break;
            case 'Calm':
                demeanorInstruction = "The character is **calm and composed**. Their performance should be subtle and thoughtful, with gentle expressions, controlled movements, and a serene demeanor.";
                break;
            case 'Standard Male':
            case 'Standard Female':
                demeanorInstruction = `The character has a **standard ${characterVoice.split(' ')[1].toLowerCase()} voice**. Their performance should be clear, direct, and believable, with natural expressions suitable for conversation.`;
                break;
        }
      }
      
      finalPrompt += `
- **Personality & Demeanor:** ${demeanorInstruction}
- **Non-Verbal Communication:** This is critical for realism. Enhance the performance with natural, non-verbal cues. Include subtle eye movements (saccades, blinks), head tilts, micro-expressions, and gestures that align with the dialogue's emotional content and the character's demeanor.`;

      if (dialogue) {
        finalPrompt += `

**Performance & Dialogue:**
- **Action:** The character will perform and speak the following dialogue: "${dialogue}".`;
      }

      if (audioSourceOption === 'upload' && audioFile) {
        finalPrompt += `
- **CRITICAL: Flawless Lip-Sync:** You are provided with a pre-recorded audio track. The character's mouth movements **must** be perfectly and flawlessly synchronized to this provided audio. This is the most important requirement. Analyze the audio's phonemes and timing to create a 100% accurate and believable lip-sync.`;
      } else if (audioSourceOption === 'generate') {
         finalPrompt += `
- **CRITICAL: Generated Audio & Lip-Sync:** You must generate the audio for this scene.
    - **Voice:** The character's voice should match the '${characterVoice}' style.
    - **Dialogue:** If dialogue is provided ("${dialogue}"), the character must speak it. The delivery must match their described demeanor.
    - **Soundscape:** Generate a rich, immersive soundscape that matches the scene ("${prompt}"). Include ambient sounds, and subtle foley effects.
    - **Synchronization:** The generated dialogue must be perfectly lip-synced to the character's mouth movements.`;
      }
      return finalPrompt;
    }

    try {
      const finalPrompt = createFinalPrompt();
      
      // Attempt 1: Use Reference Video Frame if available
      if (referenceVideoFile) {
        try {
          setLoadingMessage('Extracting frame from reference video...');
          const imageBase64 = await extractFrameAsBase64(referenceVideoFile);
          setLoadingMessage('Generating video using reference frame...');
          const generatedUrl = await generateVideo(finalPrompt, imageBase64, setLoadingMessage);
          setVideoUrl(generatedUrl);
          setIsLoading(false);
          return; // Success, so we exit the function
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          // Check for the specific safety error
          if (errorMessage.includes("blocked by your current safety settings for person/face generation")) {
            console.warn("Reference video frame blocked. Falling back to audio waveform.");
            setLoadingMessage("Reference frame blocked by safety settings. Retrying with audio waveform...");
            // Do not re-throw; let the code proceed to the fallback logic below.
          } else {
            // It's a different error, so fail completely.
            throw err;
          }
        }
      }

      // Fallback or Default Path: Use audio waveform or no image
      let imageBase64 = '';
      if (svgRef.current && audioSourceOption === 'upload') {
        setLoadingMessage('Processing audio waveform...');
        imageBase64 = await svgToPngBase64(svgRef.current);
      }
      
      setLoadingMessage('Generating video...');
      const generatedUrl = await generateVideo(finalPrompt, imageBase64, setLoadingMessage);
      setVideoUrl(generatedUrl);

    } catch (err) {
      console.error('Error generating video:', err);
      setError(`Video generation failed. ${err instanceof Error ? err.message : 'An unknown error occurred.'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const isGenerateDisabled = isLoading || !prompt || (audioSourceOption === 'upload' && !audioFile);

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Header />
        <main className="mt-8">
          <div className="p-8 bg-gray-800 rounded-2xl shadow-xl space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Audio Source</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input type="radio" name="audioSource" value="upload" checked={audioSourceOption === 'upload'} onChange={() => setAudioSourceOption('upload')} className="form-radio h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500" />
                  <span className="ml-2 text-white">Upload Audio</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="audioSource" value="generate" checked={audioSourceOption === 'generate'} onChange={() => setAudioSourceOption('generate')} className="form-radio h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500" />
                  <span className="ml-2 text-white">Generate Audio</span>
                </label>
              </div>
            </div>

            {audioSourceOption === 'upload' && (
              <AudioUpload 
                onAudioUpload={handleAudioUpload} 
                audioUrl={audioUrl} 
                disabled={isLoading}
                audioFile={audioFile}
              />
            )}
            
            <VideoUpload 
              onVideoUpload={handleVideoUpload}
              videoUrl={referenceVideoUrl}
              disabled={isLoading}
              videoFile={referenceVideoFile}
            />
            
            {audioBuffer && audioSourceOption === 'upload' && <AudioVisualizer audioBuffer={audioBuffer} ref={svgRef} />}

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2">
                Video Duration
              </label>
              <select
                id="duration"
                value={videoDuration}
                onChange={(e) => setVideoDuration(Number(e.target.value))}
                className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                disabled={isLoading}
              >
                <option value={10}>10 Seconds</option>
                <option value={30}>30 Seconds</option>
                <option value={60}>60 Seconds</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                Scene Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A cinematic shot of a futuristic city with flying cars"
                className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 resize-none"
                rows={2}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="character" className="block text-sm font-medium text-gray-300 mb-2">
                Character Description (Optional)
              </label>
              <textarea
                id="character"
                value={characterDescription}
                onChange={(e) => setCharacterDescription(e.target.value)}
                placeholder="e.g., A grizzled detective with a cybernetic eye, wearing a trench coat."
                className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 resize-none"
                rows={2}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="voice" className="block text-sm font-medium text-gray-300 mb-2">
                Character Voice (Optional)
              </label>
              <select
                id="voice"
                value={characterVoice}
                onChange={(e) => setCharacterVoice(e.target.value)}
                className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                disabled={isLoading}
              >
                <option value="Default">Default</option>
                <option value="Standard Male">Standard Male</option>
                <option value="Standard Female">Standard Female</option>
                <option value="Enthusiastic">Enthusiastic</option>
                <option value="Calm">Calm</option>
              </select>
            </div>

             <div>
              <label htmlFor="dialogue" className="block text-sm font-medium text-gray-300 mb-2">
                Dialogue/Action (Optional)
              </label>
              <textarea
                id="dialogue"
                value={dialogue}
                onChange={(e) => setDialogue(e.target.value)}
                placeholder="e.g., He looks at the camera and says, 'This city... it never sleeps.'"
                className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 resize-none"
                rows={2}
                disabled={isLoading}
              />
            </div>
            
            <button
              onClick={handleGenerateVideo}
              disabled={isGenerateDisabled}
              className={`w-full font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out text-lg ${
                isGenerateDisabled
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105'
              }`}
            >
              {isLoading ? 'Generating...' : 'Generate Video'}
            </button>
          </div>
          
          {error && (
            <div className="mt-8 p-4 bg-red-900 border border-red-700 text-red-200 rounded-lg text-center">
              <p>{error}</p>
            </div>
          )}

          {isLoading && <LoadingIndicator message={loadingMessage} />}
          {videoUrl && !isLoading && <VideoResult videoUrl={videoUrl} />}
        </main>
      </div>
    </div>
  );
};

export default App;