import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';
import { Card, CardContent } from "@/components/shadcn/ui/card";
import { Button } from "@/components/shadcn/ui/button";
import { useParams } from 'react-router-dom';

const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 'http://localhost:3001';
const socket = io(SIGNALING_SERVER);

const ViewerPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [connected, setConnected] = useState<boolean>(false);
  const [broadcasterExists, setBroadcasterExists] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);

  useEffect(() => {
    socket.on('broadcaster-exists', ({ exists, roomId: broadcastRoomId }) => {
      setBroadcasterExists(exists && broadcastRoomId === roomId);
    });

    socket.emit('check-broadcaster');

    return () => {
      socket.off('broadcaster-exists');
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [roomId]);

  const connectToBroadcaster = () => {
    const peer = new Peer({
      initiator: false,
      trickle: false
    });

    peer.on('signal', (signal) => {
      socket.emit('viewer-signal', { signal });
    });

    peer.on('stream', (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setConnected(true);
      }
    });

    peer.on('close', () => {
      setConnected(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    });

    socket.on('broadcaster-signal', ({ signal }) => {
      peer.signal(signal);
    });

    peerRef.current = peer;
    socket.emit('viewer-join', roomId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-indigo-900 text-white p-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Event Stream</h1>
          {!connected && broadcasterExists && (
            <Button
              onClick={connectToBroadcaster}
              className="mb-4"
            >
              Join Stream
            </Button>
          )}
        </div>

        <Card className="w-full max-w-4xl mx-auto bg-gray-800">
          <CardContent className="p-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              {!connected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-400">
                    {broadcasterExists 
                      ? 'Click "Join Stream" to watch'
                      : 'Waiting for broadcaster...'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewerPage;