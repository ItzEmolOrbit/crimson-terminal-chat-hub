
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, Upload, Image, Video, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MediaPlayerProps {
  type: 'audio' | 'image' | 'video';
  src: string;
  title?: string;
  duration?: number;
  encrypted?: boolean;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ type, src, title, duration, encrypted = true }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    const media = audioRef.current || videoRef.current;
    if (media) {
      if (isPlaying) {
        media.pause();
      } else {
        media.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRewind = () => {
    const media = audioRef.current || videoRef.current;
    if (media) {
      media.currentTime = Math.max(0, media.currentTime - 10);
    }
  };

  const handleTimeUpdate = () => {
    const media = audioRef.current || videoRef.current;
    if (media) {
      setCurrentTime(media.currentTime);
      setTotalDuration(media.duration || 0);
    }
  };

  if (type === 'image') {
    return (
      <Card className="p-2 bg-card border-border max-w-xs">
        <div className="relative">
          <img 
            src={src} 
            alt={title || 'Shared image'} 
            className="w-full h-auto max-h-64 object-cover rounded terminal-glow"
          />
          {encrypted && (
            <div className="absolute top-2 right-2 bg-primary/80 p-1 rounded">
              <Lock className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </div>
        {title && (
          <p className="text-xs text-muted-foreground mt-2 terminal-text">{title}</p>
        )}
      </Card>
    );
  }

  if (type === 'video') {
    return (
      <Card className="p-2 bg-card border-border max-w-sm">
        <div className="relative">
          <video
            ref={videoRef}
            src={src}
            className="w-full h-auto max-h-48 rounded terminal-glow"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
          />
          {encrypted && (
            <div className="absolute top-2 right-2 bg-primary/80 p-1 rounded">
              <Lock className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 right-2 bg-background/80 p-2 rounded">
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRewind}
                size="sm"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 p-1 h-6 w-6"
              >
                <SkipBack className="w-3 h-3" />
              </Button>
              <Button
                onClick={handlePlayPause}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 p-1 h-6 w-6"
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
              <span className="text-xs text-primary font-mono">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>
            </div>
          </div>
        </div>
        {title && (
          <p className="text-xs text-muted-foreground mt-2 terminal-text">{title}</p>
        )}
      </Card>
    );
  }

  // Audio player
  return (
    <Card className="p-3 bg-card border-border max-w-xs">
      <div className="flex items-center space-x-3">
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
        />
        <Button
          onClick={handleRewind}
          size="sm"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 p-1 h-8 w-8"
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button
          onClick={handlePlayPause}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 p-1 h-8 w-8"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            {encrypted && <Lock className="w-3 h-3 text-primary" />}
            <span className="text-xs text-primary font-mono">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>
          <div className="w-full bg-secondary h-1 rounded mt-1">
            <div 
              className="bg-primary h-1 rounded transition-all duration-100"
              style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
      {title && (
        <p className="text-xs text-muted-foreground mt-2 terminal-text">{title}</p>
      )}
    </Card>
  );
};

export default MediaPlayer;
