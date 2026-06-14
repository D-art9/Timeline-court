import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl = '/lobby_music.mp3'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.volume = 0.25; // comfortable background lobby music level
    audioRef.current = audio;

    // Browser autoplay bypass: start playing on first user click anywhere on page
    const handleFirstUserInteraction = () => {
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(err => {
            console.log("Autoplay blocked, waiting for explicit user interaction.", err);
          });
      }
      // Remove listeners once interaction starts
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('keydown', handleFirstUserInteraction);
    };

    window.addEventListener('click', handleFirstUserInteraction);
    window.addEventListener('keydown', handleFirstUserInteraction);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('keydown', handleFirstUserInteraction);
    };
  }, [audioUrl]);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => console.error("Playback failed", err));
    }
  };

  return (
    <div className="flex items-center gap-3 bg-zinc-950/60 border border-white/5 px-3 py-2 rounded-xl backdrop-blur-md">
      {/* Visual Equalizer Animation */}
      {isPlaying ? (
        <div className="flex items-end gap-0.5 h-3 w-4">
          <span className="w-[3px] bg-[#C9082A] rounded-full animate-bounce [animation-duration:0.8s] h-full" />
          <span className="w-[3px] bg-[#C9082A] rounded-full animate-bounce [animation-duration:0.5s] h-[60%]" />
          <span className="w-[3px] bg-[#C9082A] rounded-full animate-bounce [animation-duration:0.7s] h-[80%]" />
        </div>
      ) : (
        <div className="flex items-end gap-0.5 h-3 w-4">
          <span className="w-[3px] bg-zinc-700 rounded-full h-[30%]" />
          <span className="w-[3px] bg-zinc-700 rounded-full h-[30%]" />
          <span className="w-[3px] bg-zinc-700 rounded-full h-[30%]" />
        </div>
      )}

      <button
        onClick={togglePlayback}
        className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-all text-[11px] font-bold tracking-wider uppercase cursor-pointer"
        title={isPlaying ? "Mute Background Music" : "Play Background Music"}
      >
        {isPlaying ? (
          <>
            <Volume2 className="h-3.5 w-3.5 text-[#C9082A] animate-pulse" />
            <span className="text-[10px] text-zinc-300">Lobby Music On</span>
          </>
        ) : (
          <>
            <VolumeX className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-[10px] text-zinc-500">Lobby Music Off</span>
          </>
        )}
      </button>
    </div>
  );
};
