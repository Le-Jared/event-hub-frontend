import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/shadcn/ui/card";
import { Button } from "@/components/shadcn/ui/button";
import { Alert, AlertDescription } from "@/components/shadcn/ui/alert";
import { Slider } from "@/components/shadcn/ui/slider";
import { Play, Pause, Volume2, VolumeX, Loader, Settings } from "lucide-react";
import { useToast } from "@/components/shadcn/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/ui/select";
import LiveChat from "@/components/LiveChat";

const WEBSOCKET_URL = "ws://localhost:8080/stream";

// Buffer size options in minutes
const BUFFER_OPTIONS = [
  { label: "5 minutes", value: 5 * 60 },
  { label: "15 minutes", value: 15 * 60 },
  { label: "30 minutes", value: 30 * 60 },
  { label: "1 hour", value: 60 * 60 },
  { label: "2 hours", value: 120 * 60 },
];

interface StreamSegment {
  timestamp: number;
  data: ArrayBuffer;
  duration: number;
}

const StreamPage: React.FC = () => {
  const { toast } = useToast();
  const { roomId } = useParams<{ roomId: string }>();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLive, setIsLive] = useState(true);
  const [bufferSize, setBufferSize] = useState(BUFFER_OPTIONS[1].value); // Default 15 minutes
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket>();
  const mediaSourceRef = useRef<MediaSource>();
  const sourceBufferRef = useRef<SourceBuffer>();
  const streamBufferRef = useRef<StreamSegment[]>([]);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const totalStreamDurationRef = useRef<number>(0);

  // Utility functions
  const calculateBufferMemoryUsage = useCallback(() => {
    const totalBytes = streamBufferRef.current.reduce((acc, segment) => {
      return acc + segment.data.byteLength;
    }, 0);
    return (totalBytes / (1024 * 1024)).toFixed(2); // Convert to MB
  }, []);

  const handleBufferSizeChange = (newSize: string) => {
    const size = parseInt(newSize, 10);
    setBufferSize(size);

    // Trim existing buffer if necessary
    if (streamBufferRef.current.length > 0) {
      const currentTime = Date.now();
      streamBufferRef.current = streamBufferRef.current.filter(
        (segment) => currentTime - segment.timestamp <= size * 1000
      );

      toast({
        title: "Buffer Size Updated",
        description: `Buffer size set to ${BUFFER_OPTIONS.find((opt) => opt.value === size)?.label}. Memory usage: ${calculateBufferMemoryUsage()}MB`,
      });
    }
  };

  const goLive = useCallback(() => {
    if (videoRef.current && sourceBufferRef.current?.buffered.length) {
      const endTime = sourceBufferRef.current.buffered.end(
        sourceBufferRef.current.buffered.length - 1
      );
      videoRef.current.currentTime = endTime;
      setIsLive(true);
      setIsPlaying(true);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);

      // Check if we're live
      if (sourceBufferRef.current?.buffered.length) {
        const endTime = sourceBufferRef.current.buffered.end(
          sourceBufferRef.current.buffered.length - 1
        );
        const isNearEnd = Math.abs(endTime - videoRef.current.currentTime) < 1;
        setIsLive(isNearEnd);
      }
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleVolumeChange = useCallback((value: number) => {
    if (videoRef.current) {
      videoRef.current.volume = value;
      setVolume(value);
      setIsMuted(value === 0);
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      if (newMutedState) {
        setVolume(0);
      } else {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  }, [isMuted]);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current && sourceBufferRef.current?.buffered.length) {
      videoRef.current.currentTime = time;
      setIsLive(false);
    }
  }, []);

  // MediaSource initialization
  const initializeMediaSource = useCallback(() => {
    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;

    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(mediaSource);
    }

    return new Promise<void>((resolve, reject) => {
      mediaSource.addEventListener("sourceopen", () => {
        try {
          const sourceBuffer = mediaSource.addSourceBuffer(
            'video/webm; codecs="vp8,opus"'
          );
          sourceBufferRef.current = sourceBuffer;

          sourceBuffer.mode = "sequence";
          sourceBuffer.addEventListener("updateend", () => {
            // Remove old segments when buffer exceeds the limit
            if (mediaSource.duration > bufferSize) {
              const removeEnd = mediaSource.duration - bufferSize;
              sourceBuffer.remove(0, removeEnd);

              // Update stream buffer array
              const currentTime = Date.now();
              streamBufferRef.current = streamBufferRef.current.filter(
                (segment) =>
                  currentTime - segment.timestamp <= bufferSize * 1000
              );
            }
          });

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }, [bufferSize]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsLoading(true);
    const ws = new WebSocket(`${WEBSOCKET_URL}/${roomId}`);
    wsRef.current = ws;

    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      setConnected(true);
      setIsLoading(false);
      setError("");
      toast({
        title: "Connected",
        description: "Successfully connected to the stream",
      });
    };

    ws.onmessage = async (event) => {
      if (!sourceBufferRef.current || sourceBufferRef.current.updating) {
        return;
      }

      try {
        const data = event.data;
        const timestamp = Date.now();

        // Calculate segment duration based on previous segment
        const duration = (timestamp - lastUpdateTimeRef.current) / 1000;
        lastUpdateTimeRef.current = timestamp;

        // Add segment to buffer
        streamBufferRef.current.push({
          timestamp,
          data,
          duration,
        });

        // Append to SourceBuffer
        sourceBufferRef.current.appendBuffer(data);
        totalStreamDurationRef.current += duration;
        setDuration(totalStreamDurationRef.current);

        // Auto-play when we have enough data
        if (videoRef.current && videoRef.current.paused && isPlaying) {
          videoRef.current.play().catch(() => {
            // Handle auto-play restriction
            setIsPlaying(false);
            toast({
              title: "Playback Blocked",
              description:
                "Auto-play was blocked by browser. Click play to start.",
              variant: "destructive",
            });
          });
        }
      } catch (error) {
        console.error("Error processing stream data:", error);
      }
    };

    ws.onerror = () => {
      console.error("WebSocket error:", event);
      setError("Connection error occurred");
      setIsLoading(false);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the stream",
        variant: "destructive",
      });
    };

    ws.onclose = () => {
      setConnected(false);
      setIsLoading(false);
      toast({
        title: "Disconnected",
        description: "Connection to stream closed",
        variant: "destructive",
      });

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        }
      }, 5000);
    };
  }, [roomId, isPlaying]);

  // Effect hooks
  useEffect(() => {
    const initializeStream = async () => {
      try {
        await initializeMediaSource();
        connectWebSocket();
      } catch (error) {
        console.error("Failed to initialize stream:", error);
        setError("Failed to initialize stream");
      }
    };

    initializeStream();

    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (
        mediaSourceRef.current &&
        mediaSourceRef.current.readyState === "open"
      ) {
        mediaSourceRef.current.endOfStream();
      }
      if (videoRef.current) {
        videoRef.current.src = "";
      }
    };
  }, [initializeMediaSource, connectWebSocket]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener("timeupdate", handleTimeUpdate);
      return () => video.removeEventListener("timeupdate", handleTimeUpdate);
    }
  }, [handleTimeUpdate]);

  // Render component
  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-sm text-gray-500">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
            <video ref={videoRef} className="w-full h-full" playsInline />
          </div>

          <div className="space-y-4">
            {/* Playback controls */}
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" onClick={handlePlayPause}>
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button variant="outline" size="icon" onClick={handleMuteToggle}>
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <div className="flex-1">
                <Slider
                  value={[volume * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleVolumeChange(value[0] / 100)}
                  className="w-32"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>

              {!isLive && (
                <Button variant="secondary" size="sm" onClick={goLive}>
                  Go Live
                </Button>
              )}
            </div>

            {/* Timeline slider */}
            <div className="flex items-center space-x-2">
              <span className="text-sm">
                {new Date(currentTime * 1000).toISOString().substr(11, 8)}
              </span>
              <Slider
                value={[currentTime]}
                min={0}
                max={duration}
                step={0.1}
                onValueChange={(value) => handleSeek(value[0])}
                className="flex-1"
              />
              <span className="text-sm">
                {new Date(duration * 1000).toISOString().substr(11, 8)}
              </span>
            </div>

            {/* Settings panel */}
            {showSettings && (
              <div className="mt-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Buffer Settings</h3>
                <div className="flex items-center space-x-4">
                  <Select
                    value={bufferSize.toString()}
                    onValueChange={handleBufferSizeChange}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select buffer size" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUFFER_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-500">
                    Memory usage: {calculateBufferMemoryUsage()}MB
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <LiveChat />
    </div>
  );
};

export default StreamPage;
