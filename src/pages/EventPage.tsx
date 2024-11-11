import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent } from "@/components/shadcn/ui/card";
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Alert, AlertDescription } from "@/components/shadcn/ui/alert";
import { Camera, CheckCheck, Copy, Loader, Monitor, Play, StopCircle, Users } from 'lucide-react';
import { useToast } from "@/components/shadcn/ui/use-toast";
import { useParams } from 'react-router-dom';

const EventPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMediaType, setActiveMediaType] = useState<'camera' | 'screen' | null>(null);
  const [viewers, setViewers] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const shareUrl = `${window.location.origin}/viewer/${roomId}`;

  const setupWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8080/stream/${roomId}?type=broadcaster`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setConnected(true);
      setError(null);
      console.log('WebSocket connection established');
      toast({
        title: "Connected",
        description: "Successfully connected to the streaming server",
      });
    };

    wsRef.current.onclose = (event) => {
      setConnected(false);
      if (event.wasClean) {
        console.log(`WebSocket closed cleanly, code=${event.code}, reason=${event.reason}`);
      } else {
        setError('WebSocket connection lost');
        console.error('WebSocket connection died');
        toast({
          title: "Connection Lost",
          description: "WebSocket connection was lost. Please try reconnecting.",
          variant: "destructive"
        });
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection failed');
      toast({
        title: "Connection Error",
        description: "Failed to connect to the streaming server.",
        variant: "destructive"
      });
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }, [roomId, toast]);

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'connection_success':
        console.log('Successfully connected as', message.role);
        break;
      case 'viewer_count':
        setViewers(message.count);
        break;
      case 'heartbeat':
        wsRef.current?.send(JSON.stringify({ type: 'heartbeat_response' }));
        break;
      case 'broadcast_ended':
        stopStream();
        break;
    }
  };

  const initializeMedia = async (type: 'camera' | 'screen') => {
    try {
      setIsLoading(true);
      setError(null);

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      let stream;
      if (type === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      } else {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
      }

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setMediaReady(true);
      setActiveMediaType(type);
      setupWebSocket();
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Failed to access media devices');
      toast({
        title: "Media Access Error",
        description: `Failed to access ${type}. Please check your permissions.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startStreaming = async () => {
    if (!mediaStreamRef.current || !wsRef.current) {
      setError('No media stream available');
      return;
    }
  
    try {
      // Log the current video tracks and their settings
      mediaStreamRef.current.getVideoTracks().forEach(track => {
        console.log('Video Track Settings:', track.getSettings());
        console.log('Video Track Constraints:', track.getConstraints());
      });
  
      // Log the current audio tracks and their settings
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        console.log('Audio Track Settings:', track.getSettings());
        console.log('Audio Track Constraints:', track.getConstraints());
      });
  
      const options = {
        mimeType: 'video/webm; codecs="vp8,opus"',
        videoBitsPerSecond: 1000000,
        audioBitsPerSecond: 128000,
      };
  
      console.log('MediaRecorder Options:', options);
  
      const mediaRecorder = new MediaRecorder(mediaStreamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
  
      // Send initialization message
      wsRef.current.send(JSON.stringify({ type: 'stream_init' }));
  
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          // Log the chunk size and timestamp
          console.log('Media Chunk Size:', event.data.size, 'bytes');
          console.log('Current Video Bitrate:', mediaRecorder.videoBitsPerSecond);
          console.log('Current Audio Bitrate:', mediaRecorder.audioBitsPerSecond);
          
          event.data.arrayBuffer().then(buffer => {
            console.log('Sending buffer size:', buffer.byteLength, 'bytes');
            wsRef.current?.send(buffer);
          });
        }
      };
  
      // Add event listeners for MediaRecorder states
      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started');
        console.log('Initial Video Bitrate:', mediaRecorder.videoBitsPerSecond);
        console.log('Initial Audio Bitrate:', mediaRecorder.audioBitsPerSecond);
      };
  
      mediaRecorder.onpause = () => console.log('MediaRecorder paused');
      mediaRecorder.onresume = () => console.log('MediaRecorder resumed');
      mediaRecorder.onstop = () => console.log('MediaRecorder stopped');
      mediaRecorder.onerror = (error) => console.error('MediaRecorder error:', error);
  
      mediaRecorder.start(1000); // Send chunks every second
      setStreaming(true);
    } catch (error) {
      console.error('Error starting stream:', error);
      setError(`Failed to start streaming: ${error instanceof Error ? error.message : String(error)}`);
    }
  };  

  const stopStream = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stream_ended' }));
      }
    }
    setStreaming(false);
    toast({
      title: "Stream Ended",
      description: "Your stream has been stopped.",
    });
  };

  const stopMedia = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setMediaReady(false);
    setActiveMediaType(null);
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "URL Copied",
        description: "Share URL has been copied to clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy URL:', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy URL. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          {/* Status Indicators */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
            {streaming && (
              <div className="flex items-center ml-4">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
                <span className="text-sm text-gray-500">Live</span>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Video Preview */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full"
            />
            {!mediaReady && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-white text-lg">
                  Initialize camera or screen to preview
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {/* Camera Button */}
              <Button
                onClick={() => initializeMedia('camera')}
                disabled={isLoading || (mediaReady && activeMediaType === 'camera')}
                className="flex items-center"
              >
                <Camera className="mr-2 h-4 w-4" />
                {activeMediaType === 'camera' ? 'Camera Active' : 'Start Camera'}
              </Button>

              {/* Screen Share Button */}
              <Button
                onClick={() => initializeMedia('screen')}
                disabled={isLoading || (mediaReady && activeMediaType === 'screen')}
                className="flex items-center"
              >
                <Monitor className="mr-2 h-4 w-4" />
                {activeMediaType === 'screen' ? 'Screen Active' : 'Share Screen'}
              </Button>

              {/* Go Live Button */}
              {mediaReady && !streaming && (
                <Button
                  onClick={startStreaming}
                  className="flex items-center"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Go Live
                </Button>
              )}

              {/* Stop Stream Button */}
              {streaming && (
                <Button
                  onClick={stopStream}
                  variant="destructive"
                  className="flex items-center"
                >
                  <StopCircle className="mr-2 h-4 w-4" />
                  Stop Stream
                </Button>
              )}

              {/* Stop Preview Button */}
              {mediaReady && (
                <Button
                  onClick={stopMedia}
                  variant="outline"
                  className="flex items-center"
                >
                  Stop Preview
                </Button>
              )}
            </div>

            {/* Viewer Count and Share URL */}
            {streaming && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <span>{viewers} viewer{viewers !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      onClick={copyShareUrl}
                      variant="outline"
                      className="flex items-center"
                    >
                      {copied ? (
                        <CheckCheck className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventPage;