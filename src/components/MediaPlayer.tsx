
import React from 'react';
import { Lock } from 'lucide-react';

interface MediaPlayerProps {
  type: 'image' | 'video' | 'audio';
  src: string;
  title: string;
  encrypted?: boolean;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ type, src, title, encrypted }) => {
  return (
    <div className="relative">
      {encrypted && (
        <div className="flex items-center space-x-1 text-xs text-primary mb-1">
          <Lock className="w-3 h-3" />
          <span>Encrypted</span>
        </div>
      )}
      
      {type === 'image' && (
        <img 
          src={src} 
          alt={title}
          className="max-w-full h-auto rounded-lg"
          style={{ maxHeight: '300px' }}
        />
      )}
      
      {type === 'video' && (
        <video 
          src={src}
          controls
          className="max-w-full h-auto rounded-lg"
          style={{ maxHeight: '300px' }}
        >
          Your browser does not support the video tag.
        </video>
      )}
      
      {type === 'audio' && (
        <audio 
          src={src}
          controls
          className="w-full max-w-sm"
        >
          Your browser does not support the audio tag.
        </audio>
      )}
    </div>
  );
};

export default MediaPlayer;
