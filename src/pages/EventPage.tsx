import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card } from "@/components/shadcn/ui/card";
import { ScrollArea } from "@/components/shadcn/ui/scroll-area";
import { Button } from "@/components/shadcn/ui/button";
import { BarChart2, Box, Image, FileVideo, Radio, ArrowLeft, Plus, ExternalLink, Trash2, GripVertical } from "lucide-react";
import LiveChat from "@/components/LiveChat";
import LiveIndicator from "./components/LiveIndicator";
import VideoRecorder from "./VideoRecorder";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/shadcn/ui/dialog";

export interface ComponentItem {
  id: string;
  type: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  imageUrl?: string;
  htmlContent?: any;
  link: string;
}

interface StreamStatus {
  isLive: boolean;
  viewerCount: number;
  sessionId?: string;
}

export interface ModuleAction {
  ID: string;
  TYPE: string;
  SESSION_ID: string;
  SENDER: string;
  TIMESTAMP: string;
}

export const dummyComponents: ComponentItem[] = [
  {
    id: "1",
    type: "slide",
    title: "Slide",
    icon: <Image className="w-6 h-6" />,
    content: "Welcome to the presentation!",
    imageUrl: "https://picsum.photos/seed/picsum/600/400",
    link: "/slide/1",
  },
  {
    id: "2",
    type: "video",
    title: "Demo Video",
    icon: <FileVideo className="w-6 h-6" />,
    content: "Demo Video",
    imageUrl: `https://picsum.photos/seed/timothy/600/400`,
    link: "/record",
  },
  {
    id: "3",
    type: "live-webcam",
    title: "Live Webcam",
    icon: <Radio className="w-6 h-6" />,
    content: "See it Live",
    link: "/live",
    htmlContent: <VideoRecorder viewOnly/>
  },
  {
    id: "4",
    type: "poll",
    title: "Create Poll",
    icon: <BarChart2 className="w-6 h-6" />,
    content: "Create an interactive poll",
    imageUrl: `https://picsum.photos/seed/poll/600/400`,
    link: "/poll",
  },
  {
    id: "5",
    type: "model",
    title: "3D Model",
    icon: <Box className="w-6 h-6" />,
    content: "Upload 3D Model",
    imageUrl: `https://picsum.photos/seed/model/600/400`,
    link: "/model",
  },
  {
    id: "4",
    type: "poll",
    title: "Create Poll",
    icon: <BarChart2 className="w-6 h-6" />,
    content: "Create an interactive poll",
    imageUrl: `https://picsum.photos/seed/poll/600/400`,
    link: "/poll",
  },
  {
    id: "5",
    type: "model",
    title: "3D Model",
    icon: <Box className="w-6 h-6" />,
    content: "Upload 3D Model",
    imageUrl: `https://picsum.photos/seed/model/600/400`,
    link: "/model",
  },
];

const EventPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [stompClient, setStompClient] = useState<any>(null);
  const [currentComponent, setCurrentComponent] = useState<ComponentItem | null>(null);
  const [components, setComponents] = useState<ComponentItem[]>(dummyComponents);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({isLive: false, viewerCount: 0, sessionId: sessionId,});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    const connectWebSocket = () => {
      const socket = new SockJS("http://localhost:8080/moduleAction");
      const stomp = Stomp.over(socket);

      stomp.connect(
        {},
        () => {
          console.log("Connected to WebSocket");
          setStreamStatus((prev) => ({ ...prev, isLive: true }));

          stomp.subscribe(`/topic/moduleAction/${sessionId}`, (message) => {
            try {
              const action: ModuleAction = JSON.parse(message.body);
              handleModuleAction(action);
            } catch (error) {
              console.error("Error parsing message:", error);
            }
          });

          setStompClient(stomp);
        },
        (error: any) => {
          console.error("WebSocket connection error:", error);
          setStreamStatus((prev) => ({ ...prev, isLive: false }));
        }
      );
    };

    connectWebSocket();

    return () => {
      if (stompClient) {
        stompClient.disconnect();
      }
    };
  }, [sessionId]);

  const handleModuleAction = (action: ModuleAction) => {
    console.log("Received module action:", action);

    const component = components.find((item) => item.id === action.ID);
    if (component) {
      
      setCurrentComponent(component);
    }
  };

  const handleGoLive = () => {
    if (!streamStatus.isLive && stompClient) {
      setStreamStatus((prev) => ({ ...prev, isLive: true }));
    } else {
      setStreamStatus((prev) => ({ ...prev, isLive: false }));
      if (stompClient) {
        stompClient.disconnect();
      }
    }
  };

  const handleComponentClick = (component: ComponentItem) => {
    setCurrentComponent(component);
  };

  const handleRedirectToComponent = () => {
    if (currentComponent) {
      navigate(currentComponent.link);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) {
      return;
    }
    if (result.destination.droppableId === 'main-stage') {
      const draggedComponent = components[result.source.index];
      setCurrentComponent(draggedComponent);
      return;
    }
    if (result.destination.droppableId === 'components') {
      const items = Array.from(components);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setComponents(items);
    }
  };

  const handleAddComponent = (componentToAdd: ComponentItem) => {
    const newId = (components.length + 1).toString();
    const newComponent = { ...componentToAdd, id: newId };
    setComponents([...components, newComponent]);
    setCurrentComponent(newComponent);
    setIsAddDialogOpen(false);
  };  

  const handleDeleteComponent = (id: string) => {
    const updatedComponents = components.filter(component => component.id !== id);
    setComponents(updatedComponents);
    if (currentComponent && currentComponent.id === id) {
      setCurrentComponent(updatedComponents[0] || null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Top Navigation Bar */}
      <div className="bg-gray-800 p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center">
          <Button
            onClick={handleBack}
            variant="secondary"
            className="bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 mr-8"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div className="flex-1 flex justify-between items-center">
            <LiveIndicator {...streamStatus} />
            <Button
              onClick={handleGoLive}
              variant={streamStatus.isLive ? "destructive" : "default"}
            >
              {streamStatus.isLive ? "End Stream" : "Go Live"}
            </Button>
          </div>
        </div>
      </div>
  
      {/* Main Content */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          {/* Main Stage */}
          <div className="flex-[3] p-6">
            <Droppable droppableId="main-stage">
              {(provided, snapshot) => (
                <Card 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`h-full flex items-center justify-center bg-gray-800 transition-colors ${
                    snapshot.isDraggingOver ? 'border-2 border-blue-500' : ''
                  }`}
                >
                  {currentComponent ? (
                    <div className="text-center p-6 relative w-full h-full">
                      <div className="mb-4">{currentComponent.icon}</div>
                      <h2 className="text-xl font-semibold mb-4">
                        {currentComponent.title}
                      </h2>
                      {!currentComponent.htmlContent && currentComponent.imageUrl && (
                        <img
                          src={currentComponent.imageUrl}
                          alt={currentComponent.title}
                          className="mx-auto mb-4 rounded-lg shadow-md w-full h-[400px] object-cover"
                        />
                      )}
                       {currentComponent.htmlContent &&  !currentComponent.imageUrl && (
                        <div>
                         {currentComponent.htmlContent}
                        </div>
                      )}
                      <p className="text-white mb-4">{currentComponent.content}</p>
                      <Button
                        onClick={handleRedirectToComponent}
                        className="absolute top-4 right-4"
                      >
                        Go to Component
                      </Button>
                    </div>
                  ) : (
                    <div className={`text-gray-400 text-center ${
                      snapshot.isDraggingOver ? 'text-blue-400' : ''
                    }`}>
                      {snapshot.isDraggingOver 
                        ? "Drop component here"
                        : "Drag a component here or select from the sidebar"
                      }
                    </div>
                  )}
                  {provided.placeholder}
                </Card>
              )}
            </Droppable>
          </div>
        {/* Right Sidebar */}
        <div className="flex-1 bg-gray-800 shadow-lg flex flex-col">
          <div className="h-[50%] p-2 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Components</h2>
              <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
              <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
                <DialogHeader>
                  <DialogTitle>Add New Component</DialogTitle>
                </DialogHeader>
                <DialogContent>
                  <div className="grid gap-4 py-4">
                    {dummyComponents.map((component) => (
                      <Button
                        key={component.id}
                        onClick={() => {
                          handleAddComponent(component);
                          setIsAddDialogOpen(false);
                        }}
                        className="flex items-center justify-start"
                      >
                        {component.icon}
                        <span className="ml-2">{component.title}</span>
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
              <ScrollArea className="h-[calc(100%-2rem)]">
                <Droppable droppableId="components">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {components.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-2 cursor-pointer bg-gray-700 hover:bg-gray-600 relative ${
                                snapshot.isDragging ? 'opacity-50' : ''
                              }`}
                              onClick={() => handleComponentClick(item)}
                            >
                              <div className="flex items-center">
                                <div {...provided.dragHandleProps} className="mr-2">
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                {item.icon}
                                <div className="flex-1 ml-3">
                                  <h3 className="font-medium text-white">{item.title}</h3>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(item.link);
                                  }}
                                  className="ml-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteComponent(item.id);
                                  }}
                                  className="ml-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </ScrollArea>
            </div>
            {/* Chat Component */}
            <div className="h-[50%] p-2 border-t border-gray-700">
              <Card className="h-[calc(100%)] overflow-y-auto bg-gray-700 text-white">
                <LiveChat />
              </Card>
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );  
};

export default EventPage;
