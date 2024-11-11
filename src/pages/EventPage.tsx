import LiveChat from "@/components/LiveChat";
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@/components/shadcn/ui/dnd';
import { Card } from '@/components/shadcn/ui/card';
import { ScrollArea } from '@/components/shadcn/ui/scroll-area';
import { Video, Image, FileQuestion, Users, Radio, MessageSquare, HelpCircle, BarChart } from 'lucide-react';
import { Badge } from '@/components/shadcn/ui/badge';
import { Button } from '@/components/shadcn/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/ui/select";

// WebSocket connection
const WS_URL = 'ws://localhost:8080/event';

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

const dummyComponents: ComponentItem[] = [
  {
    id: '1',
    type: 'slide',
    title: 'Introduction Slide',
    icon: <Image className="w-6 h-6" />,
    content: 'Welcome to the presentation!',
    imageUrl: 'https://picsum.photos/400/300?random=1'
  },
  {
    id: '2',
    type: 'video',
    title: 'Demo Video',
    icon: <Video className="w-6 h-6" />,
    content: 'Product demonstration video',
    imageUrl: 'https://picsum.photos/400/300?random=2'
  },
  {
    id: '3',
    type: 'quiz',
    title: 'Knowledge Check',
    icon: <FileQuestion className="w-6 h-6" />,
    content: 'Test your understanding',
    imageUrl: 'https://picsum.photos/400/300?random=3'
  },
];

const LiveIndicator: React.FC<StreamStatus> = ({ isLive, viewerCount }) => (
  <div className="flex items-center space-x-4">
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

const EventPage: React.FC = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [currentComponent, setCurrentComponent] = useState<ComponentItem | null>(null);
  const [components] = useState<ComponentItem[]>(dummyComponents);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    isLive: false,
    viewerCount: 0
  });
  const [interactionType, setInteractionType] = useState<'chat' | 'qa' | 'poll'>('chat');

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('Connected to WebSocket');
        setStreamStatus(prev => ({ ...prev, isLive: true }));
        // Join the room as a broadcaster
        ws.send(JSON.stringify({
          type: 'JOIN_ROOM',
          role: 'broadcaster'
        }));
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStreamStatus(prev => ({ ...prev, isLive: false }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'COMPONENT_CHANGE':
              if (data.component) {
                setCurrentComponent(data.component);
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
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (streamStatus.isLive) {
            connectWebSocket();
          }
        }, 5000);
      };

      setSocket(ws);
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setStreamStatus(prev => ({ ...prev, isLive: false }));
    }
  };

  const disconnectWebSocket = () => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
  };

  const handleGoLive = () => {
    if (!streamStatus.isLive) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
  };

  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const handleDragEnd = (result: DropResult): void => {
    const { destination, source, draggableId } = result;

    if (!destination || 
        (destination.droppableId === source.droppableId && 
        destination.index === source.index)) {
      return;
    }

    if (destination.droppableId === 'main-stage') {
      const component = components.find(item => item.id === draggableId);
      if (component) {
        setCurrentComponent(component);
        
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'COMPONENT_CHANGE',
            component
          }));
        }
      }
    }
  };

  const renderInteractionComponent = () => {
    switch (interactionType) {
      case 'chat':
        return <LiveChat />;
      case 'qa':
        return <div>Q&A Component</div>;
      case 'poll':
        return <div>Poll Component</div>;
      default:
        return null;
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen bg-gray-100">
        {/* Stream Status Bar */}
        <div className="bg-white p-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <LiveIndicator {...streamStatus} />
            <Button
              onClick={handleGoLive}
              variant={streamStatus.isLive ? "destructive" : "default"}
            >
              {streamStatus.isLive ? 'End Stream' : 'Go Live'}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Stage */}
          <div className="flex-[3] p-6">
            <Droppable droppableId="main-stage">
              {(provided, snapshot) => (
                <Card 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`h-full flex items-center justify-center bg-white ${
                    snapshot.isDraggingOver ? 'border-2 border-blue-400' : ''
                  }`}
                >
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
                      <p className="text-gray-500">{currentComponent.content}</p>
                    </div>
                  ) : (
                    <p className="text-gray-400">Drag a component here</p>
                  )}
                  {provided.placeholder}
                </Card>
              )}
            </Droppable>
          </div>

          {/* Right Sidebar: Components Panel and Interaction Component */}
          <div className="flex-1 bg-white shadow-lg flex flex-col">
            {/* Components Panel */}
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold mb-4">Components</h2>
              <Droppable droppableId="components-list">
                {(provided, snapshot) => (
                  <ScrollArea className="h-96"> 
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-gray-50' : ''}`}
                    >
                      {components.map((item, index) => (
                        <Draggable
                          key={item.id}
                          draggableId={item.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 cursor-move hover:bg-gray-50 ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                {item.icon}
                                <div>
                                  <h3 className="font-medium">{item.title}</h3>
                                  <p className="text-sm text-gray-500">{item.type}</p>
                                </div>
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </ScrollArea>
                )}
              </Droppable>
            </div>

            {/* Interaction Component */}
            <div className="flex-1 p-4">
              <Select onValueChange={(value: 'chat' | 'qa' | 'poll') => setInteractionType(value)}>
                <SelectTrigger className="w-full mb-2">
                  <SelectValue placeholder="Select interaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">
                    <div className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Live Chat
                    </div>
                  </SelectItem>
                  <SelectItem value="qa">
                    <div className="flex items-center">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Q&A
                    </div>
                  </SelectItem>
                  <SelectItem value="poll">
                    <div className="flex items-center">
                      <BarChart className="w-4 h-4 mr-2" />
                      Poll
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Card className="h-full overflow-y-auto">
                {renderInteractionComponent()}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};

export default EventPage;