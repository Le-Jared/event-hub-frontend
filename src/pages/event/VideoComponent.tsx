import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface VideoProps {
  title: string;
  videoUrl: string;
  description?: string;
}

const VideoComponent: React.FC<VideoProps> = ({
  title,
  videoUrl,
  description,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
        <video
          ref={videoRef}
          className="w-full h-full"
          src={videoUrl}
          onEnded={() => setIsPlaying(false)}
        />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {description && (
        <div className="mt-4 text-gray-400">
          {description}
        </div>
      )}
    </div>
  );
};

export default VideoComponent;