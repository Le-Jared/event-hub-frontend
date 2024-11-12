import React, { useState, useEffect } from 'react';
import { Card } from '@/components/shadcn/ui/card';
import { ScrollArea } from '@/components/shadcn/ui/scroll-area';
import { Video, Image, FileQuestion, Users, Radio, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/shadcn/ui/badge';
import LiveChat from "@/components/experimental/LiveChat";

// WebSocket connection
const WS_URL = 'ws://localhost:8080/moduleAction';

interface ComponentItem {
  id: string;
  type: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  imageUrl?: string;
}

interface StreamStatus {
  isLive: boolean;
  viewerCount: number;
  roomId?: string;
}

const componentIcons: { [key: string]: React.ReactNode } = {
  slide: <Image className="w-6 h-6" />,
  video: <Video className="w-6 h-6" />,
  quiz: <FileQuestion className="w-6 h-6" />,
};

const LiveIndicator: React.FC<StreamStatus> = ({ isLive, viewerCount }) => (
  <div className="flex items-center space-x-4 text-white">
    <div className="flex items-center">
      <Badge 
        variant={isLive ? "destructive" : "secondary"}
        className="flex items-center gap-2"
      >
        <Radio className="w-4 h-4 animate-pulse" />
        <span>{isLive ? 'LIVE' : 'OFFLINE'}</span>
      </Badge>
    </div>
    {isLive && (
      <div className="flex items-center space-x-2">
        <Users className="w-4 h-4" />
        <span className="text-sm font-medium">{viewerCount} viewers</span>
      </div>
    )}
  </div>
);

const ViewerPage: React.FC = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [currentComponent, setCurrentComponent] = useState<ComponentItem | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    isLive: false,
    viewerCount: 0
  });

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setStreamStatus(prev => ({ ...prev, isLive: true }));
      // Join the room as a viewer
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        role: 'viewer'
      }));
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStreamStatus(prev => ({ ...prev, isLive: false }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.TYPE) {
          case 'COMPONENT_CHANGE':
            if (data.ID && data.SENDER) {
              setCurrentComponent({
                id: data.ID,
                type: data.TYPE,
                title: `Component from ${data.SENDER}`,
                icon: componentIcons[data.TYPE] || <FileQuestion className="w-6 h-6" />,
                content: `Content for ${data.TYPE}`,
              });
            }
            break;
          case 'VIEWER_COUNT':
            setStreamStatus(prev => ({
              ...prev,
              viewerCount: data.count
            }));
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setStreamStatus({ isLive: false, viewerCount: 0 });
    };

    setSocket(ws);

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Stream Status Bar */}
      <div className="bg-gray-800 p-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <LiveIndicator {...streamStatus} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Stage */}
        <div className="flex-[3] p-6">
          <Card className="h-full flex items-center justify-center bg-gray-800">
            {currentComponent ? (
              <div className="text-center p-6">
                <div className="mb-4">{currentComponent.icon}</div>
                <h2 className="text-xl font-semibold mb-4">{currentComponent.title}</h2>
                {currentComponent.imageUrl && (
                  <img
                    src={currentComponent.imageUrl}
                    alt={currentComponent.title}
                    className="mx-auto mb-4 rounded-lg shadow-md"
                  />
                )}
                <p className="text-white">{currentComponent.content}</p>
              </div>
            ) : (
              <p className="text-gray-400">Waiting for presenter to share content...</p>
            )}
          </Card>
        </div>

        {/* Right Sidebar: Live Chat */}
        <div className="flex-1 bg-gray-800 shadow-lg flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Live Chat
            </h2>
          </div>
          <ScrollArea className="flex-1">
            <LiveChat />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default ViewerPage;