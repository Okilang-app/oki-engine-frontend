"use client";

import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimelineSegment {
  id: string;
  start_time: number;
  end_time: number;
  status: string;
  sponsor_name?: string | null;
}

export interface VideoPlayerHandle {
  seekTo: (time: number) => void;
}

interface VideoPlayerProps {
  src: string;
  segments: TimelineSegment[];
  duration?: number;
  onTimeUpdate?: (time: number) => void;
  onSegmentClick?: (segment: TimelineSegment) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getSegmentColor(status: string): string {
  switch (status) {
    case "detected":
      return "bg-red-500";
    case "approved":
    case "confirmed":
      return "bg-emerald-500";
    case "replaced":
      return "bg-blue-500";
    case "rejected":
      return "bg-slate-400";
    default:
      return "bg-amber-400";
  }
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer({
  src,
  segments,
  duration,
  onTimeUpdate,
  onSegmentClick,
}, ref) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [actualDuration, setActualDuration] = useState(duration || 0);

  useImperativeHandle(ref, () => ({
    seekTo: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
  }));

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    onTimeUpdate?.(video.currentTime);
  }, [onTimeUpdate]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = e.currentTarget;
      const rect = bar.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const time = pct * actualDuration;
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    [actualDuration]
  );

  const jumpToSegment = useCallback(
    (seg: TimelineSegment) => {
      if (videoRef.current) {
        videoRef.current.currentTime = seg.start_time;
        setCurrentTime(seg.start_time);
        onSegmentClick?.(seg);
      }
    },
    [onSegmentClick]
  );

  const progressPct = actualDuration > 0 ? (currentTime / actualDuration) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Video element */}
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full"
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            setLoaded(true);
            if (videoRef.current && videoRef.current.duration && videoRef.current.duration !== Infinity) {
              setActualDuration(videoRef.current.duration);
            }
          }}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
          playsInline
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
            Loading video...
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <span className="text-sm font-mono text-muted-foreground min-w-[80px]">
          {formatTime(currentTime)} / {formatTime(actualDuration)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            if (isMuted) {
              video.volume = volume;
              setIsMuted(false);
            } else {
              video.volume = 0;
              setIsMuted(true);
            }
          }}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Timeline scrubber */}
      <div className="space-y-1">
        <div
          className="relative h-8 bg-slate-100 dark:bg-slate-800 rounded cursor-pointer overflow-hidden"
          onClick={handleSeek}
        >
          {/* Segment overlays */}
          {segments.map((seg) => {
            const left = actualDuration > 0 ? (seg.start_time / actualDuration) * 100 : 0;
            const width =
              actualDuration > 0
                ? ((seg.end_time - seg.start_time) / actualDuration) * 100
                : 0;
            return (
              <div
                key={seg.id}
                className={`absolute top-0 h-full ${getSegmentColor(seg.status)} cursor-pointer hover:brightness-110 transition-opacity`}
                style={{
                  left: `${left}%`,
                  width: `${Math.max(width, 0.5)}%`,
                }}
                title={`${seg.status}: ${formatTime(seg.start_time)}-${formatTime(seg.end_time)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  jumpToSegment(seg);
                }}
              />
            );
          })}

          {/* Playhead */}
          <div
            className="absolute top-0 h-full w-0.5 bg-white shadow-sm pointer-events-none"
            style={{ left: `${progressPct}%` }}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500" />
            Detected Ad
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            Approved
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500" />
            Replaced
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-400" />
            Rejected
          </span>
        </div>
      </div>
    </div>
  );
});
