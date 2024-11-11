import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/shadcn/ui/card";
import { Alert, AlertDescription } from "@/components/shadcn/ui/alert";
import { Loader } from 'lucide-react';

// Constants
const MIME_TYPE = 'video/webm; codecs="vp8,opus"';
const MAX_BUFFER_LENGTH = 60; // Maximum buffer length in seconds
const MIN_BUFFER_LENGTH = 0.5; // Minimum buffer length in seconds

const ViewerPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const bufferQueue = useRef<ArrayBuffer[]>([]);
  const isProcessing = useRef<boolean>(false);
  const hasInitSegment = useRef<boolean>(false);

  const clearBuffers = useCallback(() => {
    if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
      try {
        const buffered = sourceBufferRef.current.buffered;
        if (buffered.length > 0) {
          sourceBufferRef.current.remove(0, buffered.end(buffered.length - 1));
        }
      } catch (e) {
        console.warn('Clear buffer error:', e);
      }
    }
    bufferQueue.current = [];
    isProcessing.current = false;
    hasInitSegment.current = false;
  }, []);

  const initializeMediaSource = useCallback(() => {
    if (!videoRef.current) return;

    try {
      const ms = new MediaSource();
      mediaSourceRef.current = ms;
      videoRef.current.src = URL.createObjectURL(ms);

      ms.addEventListener('sourceopen', () => {
        try {
          if (!sourceBufferRef.current && ms.readyState === 'open') {
            sourceBufferRef.current = ms.addSourceBuffer(MIME_TYPE);
            sourceBufferRef.current.mode = 'segments';
            
            sourceBufferRef.current.addEventListener('updateend', () => {
              isProcessing.current = false;
              processNextChunk();
            });

            sourceBufferRef.current.addEventListener('error', () => {
              clearBuffers();
              initializeMediaSource();
            });
          }
        } catch (e) {
          console.error('Source buffer creation error:', e);
          setError('Failed to initialize video player. Please refresh.');
        }
      });

    } catch (e) {
      console.error('MediaSource initialization error:', e);
      setError('Your browser may not support this video format.');
    }
  }, [clearBuffers]);

  const processNextChunk = useCallback(() => {
    if (!sourceBufferRef.current || isProcessing.current || bufferQueue.current.length === 0) {
      return;
    }

    try {
      const sourceBuffer = sourceBufferRef.current;
      
      if (sourceBuffer && sourceBuffer.buffered.length > 0) {
        const currentTime = videoRef.current?.currentTime || 0;
        const bufferEnd = sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1);
        
        if (bufferEnd - currentTime > MAX_BUFFER_LENGTH) {
          const removeEnd = currentTime - MIN_BUFFER_LENGTH;
          if (removeEnd > sourceBuffer.buffered.start(0)) {
            sourceBuffer.remove(sourceBuffer.buffered.start(0), removeEnd);
            return;
          }
        }
      }

      if (!sourceBuffer.updating) {
        const chunk = bufferQueue.current.shift();
        if (chunk) {
          isProcessing.current = true;
          sourceBuffer.appendBuffer(chunk);
          
          if (videoRef.current?.paused && sourceBuffer.buffered.length > 0) {
            videoRef.current.play().catch(console.error);
          }
        }
      }
    } catch (e) {
      console.warn('Process chunk error:', e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        clearBuffers();
      }
    }
  }, [clearBuffers]);

  const handleVideoChunk = useCallback((chunk: ArrayBuffer) => {
    if (!hasInitSegment.current) {
      hasInitSegment.current = true;
      bufferQueue.current = [chunk];
    } else {
      bufferQueue.current.push(chunk);
    }

    if (!isProcessing.current) {
      processNextChunk();
    }
  }, [processNextChunk]);

  const setupWebSocket = useCallback(() => {
    if (!roomId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.hostname}:8080/stream/${roomId}?type=viewer`);
    wsRef.current = ws;
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      setConnected(true);
      setError(null);
      initializeMediaSource();
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        handleVideoChunk(event.data);
      }
    };

    ws.onerror = () => {
      setConnected(false);
      setError('Connection error occurred');
    };

    ws.onclose = () => {
      setConnected(false);
      clearBuffers();
      setTimeout(() => setupWebSocket(), 5000);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomId, handleVideoChunk, initializeMediaSource, clearBuffers]);

  useEffect(() => {
    const cleanup = setupWebSocket();
    return () => {
      cleanup?.();
      if (videoRef.current) {
        videoRef.current.src = '';
      }
      if (mediaSourceRef.current) {
        URL.revokeObjectURL(videoRef.current?.src || '');
      }
      clearBuffers();
    };
  }, [setupWebSocket, clearBuffers]);

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8">
      <CardContent className="p-6">
        <h1 className="text-2xl font-bold mb-4">Live Stream Viewer</h1>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
          {!connected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader className="w-8 h-8 animate-spin" />
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full"
            onError={() => {
              setError('Video playback error. Attempting to reconnect...');
              clearBuffers();
              initializeMediaSource();
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ViewerPage;










