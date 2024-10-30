import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';
import { Camera, Monitor, Users, Copy, CheckCheck } from 'lucide-react';
import { Button } from "@/components/shadcn/ui/button";
import { Card, CardContent } from "@/components/shadcn/ui/card";
import { Alert, AlertDescription } from "@/components/shadcn/ui/alert";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/components/shadcn/ui/use-toast";

const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 'http://localhost:3001';
const socket = io(SIGNALING_SERVER, {
  reconnectionDelayMax: 10000,
  transports: ['websocket']
});

const EventPage: React.FC = () => {
  const { toast } = useToast();
  const [streaming, setStreaming] = useState<boolean>(false);
  const [viewers, setViewers] = useState<number>(0);
  const [streamType, setStreamType] = useState<'camera' | 'screen' | null>(null);
  const [roomId] = useState<string>(uuidv4());
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [peers, setPeers] = useState<{ [key: string]: Peer.Instance }>({});
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Generate shareable URL using the FRONTEND_URL from env
    const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
    const url = new URL(`/viewer/${roomId}`, baseUrl);
    setShareUrl(url.toString());

    socket.on('viewer-joined', ({ viewerId }) => {
      if (streamRef.current) {
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: streamRef.current
        });

        peer.on('signal', (signal) => {
          socket.emit('broadcaster-signal', { signal, viewerId });
        });

        peer.on('connect', () => {
          setViewers(prev => prev + 1);
          toast({
            title: "Viewer Connected",
            description: "A new viewer has joined your stream.",
          });
        });

        peer.on('close', () => {
          setViewers(prev => Math.max(0, prev - 1));
          delete peers[viewerId];
          setPeers({ ...peers });
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
          setError('Connection error occurred. Please try restarting the stream.');
        });

        setPeers(prev => ({ ...prev, [viewerId]: peer }));
      }
    });

    socket.on('viewer-signal', ({ signal, viewerId }) => {
      if (peers[viewerId]) {
        peers[viewerId].signal(signal);
      }
    });

    return () => {
      stopStream();
      socket.off('viewer-joined');
      socket.off('viewer-signal');
    };
  }, [roomId, peers]);

  const startStream = async (type: 'camera' | 'screen') => {
    try {
      setError('');

      if (!navigator.mediaDevices) {
        throw new Error('Media devices API is not supported in your browser');
      }
  
      let stream;
      
      if (type === 'camera') {
        if (!navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia is not supported in your browser');
        }
  
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }, 
          audio: true 
        });
      } else {
        if (!navigator.mediaDevices.getDisplayMedia) {
          throw new Error('Screen sharing is not supported in your browser');
        }
  
        stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
      }
  
      if (!stream) {
        throw new Error('Failed to get media stream');
      }
  
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
  
      setStreamType(type);
      setStreaming(true);
      socket.emit('start-broadcasting', roomId);
  
      stream.getTracks().forEach(track => {
        track.onended = () => {
          stopStream();
        };
      });
  
      toast({
        title: "Stream Started",
        description: `You are now streaming using your ${type === 'camera' ? 'camera' : 'screen'}.`,
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      
      toast({
        title: "Stream Error",
        description: error instanceof Error ? error.message : 'Failed to start stream',
        variant: "destructive"
      });
    }
  };  

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    Object.values(peers).forEach(peer => peer.destroy());
    setPeers({});
    setStreaming(false);
    setStreamType(null);
    setViewers(0);
    socket.emit('stop-broadcasting');
    
    toast({
      title: "Stream Ended",
      description: "Your stream has been stopped.",
      variant: "destructive"
    });
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Share this link with your viewers.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try copying the link manually.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-indigo-900 text-white p-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Event Broadcasting Studio</h1>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {streaming && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="px-4 py-2 rounded bg-gray-800 text-white w-96"
                />
                <Button
                  onClick={copyShareLink}
                  className="flex items-center gap-2"
                  variant="secondary"
                >
                  {copied ? (
                    <CheckCheck className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
                <Users className="w-4 h-4" />
                <span>{viewers} {viewers === 1 ? 'Viewer' : 'Viewers'}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              onClick={() => startStream('camera')}
              disabled={streaming}
              className="flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Start Camera
            </Button>
            <Button
              onClick={() => startStream('screen')}
              disabled={streaming}
              className="flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              Share Screen
            </Button>
            {streaming && (
              <Button
                onClick={stopStream}
                variant="destructive"
                className="flex items-center gap-2"
              >
                Stop Streaming
              </Button>
            )}
          </div>
        </div>

        <Card className="w-full max-w-4xl mx-auto bg-gray-800">
          <CardContent className="p-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
              />
              {!streaming && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-400">
                    {streamType ? 'Stream ended' : 'Start streaming to begin'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {streaming && (
          <div className="mt-4 text-center text-sm text-gray-400">
            <p>
              {streamType === 'camera' 
                ? 'Broadcasting from your camera and microphone'
                : 'Broadcasting your screen and system audio'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventPage;