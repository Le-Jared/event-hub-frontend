import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer-light';
import 'webrtc-adapter';
import io, { Socket } from 'socket.io-client';
import { Card, CardContent } from "@/components/shadcn/ui/card";
import { Button } from "@/components/shadcn/ui/button";
import { useParams } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/shadcn/ui/alert";

const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 'http://localhost:3000';

const ViewerPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket>();
  const peerRef = useRef<any>();

  useEffect(() => {
    socketRef.current = io(SIGNALING_SERVER);
    
    const socket = socketRef.current;

    socket.on('broadcaster-signal', ({ signal }) => {
      console.log('Received broadcaster signal');
      try {
        peerRef.current?.signal(signal);
      } catch (err) {
        console.error('Error processing broadcaster signal:', err);
        setError('Connection error occurred');
      }
    });

    socket.on('broadcaster-left', () => {
      console.log('Broadcaster left');
      setConnected(false);
      setError('Stream ended by broadcaster');
      cleanupStream();
    });

    return () => {
      cleanupStream();
      socket.disconnect();
    };
  }, []);

  const cleanupStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (err) {
        console.error('Error destroying peer:', err);
      }
    }
  };

  const connectToBroadcaster = async () => {
    if (!roomId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create Peer instance
      const peer = new Peer({
        initiator: true,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      peer.on('signal', (signal) => {
        console.log('Generated viewer signal');
        socketRef.current?.emit('viewer-signal', { 
          signal, 
          roomId,
          viewerId: socketRef.current?.id 
        });
      });

      peer.on('connect', () => {
        console.log('Connected to broadcaster');
        setConnected(true);
        setIsLoading(false);
      });

      peer.on('stream', (stream: MediaStream) => {
        console.log('Received stream from broadcaster');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      });

      peer.on('error', (err: Error) => {
        console.error('Peer connection error:', err);
        setError('Connection error occurred. Please try rejoining.');
        setConnected(false);
        setIsLoading(false);
      });

      peer.on('close', () => {
        console.log('Peer connection closed');
        setConnected(false);
        setIsLoading(false);
        cleanupStream();
      });

      peerRef.current = peer;
      socketRef.current?.emit('viewer-join', roomId);

    } catch (err) {
      console.error('Error creating peer connection:', err);
      setError('Failed to establish connection. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            {!connected && (
              <Button
                onClick={connectToBroadcaster}
                disabled={isLoading}
              >
                {isLoading ? 'Connecting...' : 'Join Stream'}
              </Button>
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
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewerPage;
