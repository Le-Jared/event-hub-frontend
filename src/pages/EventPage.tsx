import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import io, { Socket } from 'socket.io-client';
import { Camera, Monitor, Users, Copy, CheckCheck } from 'lucide-react';
import { Button } from "@/components/shadcn/ui/button";
import { Card, CardContent } from "@/components/shadcn/ui/card";
import { Alert, AlertDescription } from "@/components/shadcn/ui/alert";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/components/shadcn/ui/use-toast";

const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 'http://localhost:3000';

const EventPage: React.FC = () => {
  const { toast } = useToast();
  const [streaming, setStreaming] = useState<boolean>(false);
  const [viewers, setViewers] = useState<number>(0);
  const [, setStreamType] = useState<'camera' | 'screen' | null>(null);
  const [roomId] = useState<string>(uuidv4());
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket>();
  const peersRef = useRef<{ [key: string]: Peer.Instance }>({});
  const streamRef = useRef<MediaStream>();

  useEffect(() => {
    socketRef.current = io(SIGNALING_SERVER);
    console.log('Connecting to signaling server:', SIGNALING_SERVER);
    
    const baseUrl = window.location.origin;
    setShareUrl(`${baseUrl}/viewer/${roomId}`);

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to signaling server with ID:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError('Failed to connect to signaling server');
    });

    socket.on('viewer-joined', ({ viewerId }) => {
      console.log('Viewer joined:', viewerId);
      if (!streamRef.current) {
        console.error('No stream available for viewer');
        return;
      }

      try {
        const peer = new Peer({
          initiator: true, 
          trickle: true,
          stream: streamRef.current,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        peer.on('signal', (signal) => {
          console.log('Generated signal for viewer:', viewerId);
          socket.emit('broadcaster-signal', { signal, viewerId });
        });

        peer.on('connect', () => {
          console.log('Peer connection established with viewer:', viewerId);
          setViewers(prev => prev + 1);
          toast({
            title: "Viewer Connected",
            description: "A new viewer has joined your stream.",
          });
        });

        peer.on('error', (err) => {
          console.error('Peer connection error:', err);
          toast({
            title: "Connection Error",
            description: "Error connecting to viewer",
            variant: "destructive",
          });
        });

        peer.on('close', () => {
          console.log('Peer connection closed:', viewerId);
          if (peersRef.current[viewerId]) {
            delete peersRef.current[viewerId];
            setViewers(prev => Math.max(0, prev - 1));
          }
        });

        // Store the peer
        peersRef.current[viewerId] = peer;

      } catch (err) {
        console.error('Error creating peer:', err);
        setError('Failed to create peer connection');
      }
    });

    socket.on('viewer-signal', ({ signal, viewerId }) => {
      console.log('Received viewer signal for viewer:', viewerId);
      const peer = peersRef.current[viewerId];
      if (peer) {
        try {
          peer.signal(signal);
        } catch (err) {
          console.error('Error processing viewer signal:', err);
        }
      } else {
        console.warn('No peer found for viewer:', viewerId);
      }
    });

    socket.on('viewer-left', ({ viewerId }) => {
      console.log('Viewer left:', viewerId);
      if (peersRef.current[viewerId]) {
        peersRef.current[viewerId].destroy();
        delete peersRef.current[viewerId];
        setViewers(prev => Math.max(0, prev - 1));
      }
    });

    return () => {
      stopStream();
      Object.values(peersRef.current).forEach(peer => {
        try {
          peer.destroy();
        } catch (err) {
          console.error('Error destroying peer:', err);
        }
      });
      socket.disconnect();
    };
  }, [roomId]);

  const startStream = async (type: 'camera' | 'screen') => {
    try {
      const stream = await (type === 'camera' 
        ? navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        : navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      );

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      streamRef.current = stream;
      setStreamType(type);
      setStreaming(true);
      
      socketRef.current?.emit('start-broadcasting', roomId);
      console.log('Started broadcasting in room:', roomId);

      stream.getTracks().forEach(track => {
        track.onended = () => {
          console.log('Track ended, stopping stream');
          stopStream();
        };
      });

    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Failed to access media devices');
    }
  };

  const stopStream = () => {
    console.log('Stopping stream');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      streamRef.current = undefined;
    }

    Object.values(peersRef.current).forEach(peer => {
      try {
        peer.destroy();
      } catch (err) {
        console.error('Error destroying peer:', err);
      }
    });
    peersRef.current = {};
    
    setStreaming(false);
    setStreamType(null);
    setViewers(0);
    socketRef.current?.emit('stop-broadcasting', roomId);
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Stream link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex space-x-4">
              <Button
                onClick={() => startStream('camera')}
                disabled={streaming}
                className="flex items-center"
              >
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </Button>
              <Button
                onClick={() => startStream('screen')}
                disabled={streaming}
                className="flex items-center"
              >
                <Monitor className="mr-2 h-4 w-4" />
                Share Screen
              </Button>
              {streaming && (
                <Button
                  onClick={stopStream}
                  variant="destructive"
                >
                  Stop Stream
                </Button>
              )}
            </div>

            {streaming && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <span>{viewers} viewer{viewers !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 p-2 border rounded"
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

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventPage;
