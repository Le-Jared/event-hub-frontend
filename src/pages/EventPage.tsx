import LiveChat from "@/components/LiveChat";
import React, { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@/components/shadcn/ui/dnd";
import { Card } from "@/components/shadcn/ui/card";
import { ScrollArea } from "@/components/shadcn/ui/scroll-area";
import {
  Video,
  Image,
  FileVideo,
  Radio,
  MessageSquare,
  HelpCircle,
  BarChart,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/ui/select";
import { useParams, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import LiveIndicator from "./components/LiveIndicator";

interface ComponentItem {
  id: string;
  type: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  imageUrl?: string;
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
    title: "Demo Slide",
    icon: <Image className="w-6 h-6" />,
    content: "Welcome to the presentation!",
    imageUrl: "https://picsum.photos/400/300?random=1",
    link: "/slide/1",
  },
  {
    id: "2",
    type: "video",
    title: "Recording",
    icon: <Video className="w-6 h-6" />,
    content: "Product demonstration video",
    imageUrl: "https://picsum.photos/400/300?random=2",
    link: "/record",
  },
  {
    id: "3",
    type: "video",
    title: "Demo Video",
    icon: <FileVideo className="w-6 h-6" />,
    content: "Demo Video",
    imageUrl: "https://picsum.photos/400/300?random=3",
    link: "/video",
  },
  {
    id: "4",
    type: "video",
    title: "Live Webcam",
    icon: <Radio className="w-6 h-6" />,
    content: "See it Live",
    imageUrl: "https://picsum.photos/400/300?random=4",
    link: "/live",
  },
];

const EventPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [stompClient, setStompClient] = useState<any>(null);
  const [currentComponent, setCurrentComponent] =
    useState<ComponentItem | null>(null);
  const [components] = useState<ComponentItem[]>(dummyComponents);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    isLive: false,
    viewerCount: 0,
    sessionId: sessionId,
  });
  const [interactionType, setInteractionType] = useState<
    "chat" | "qa" | "poll"
  >("chat");
  const { roomId } = useParams();

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

  const handleDragEnd = (result: DropResult): void => {
    const { destination, source, draggableId } = result;

    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    if (destination.droppableId === "main-stage") {
      const component = components.find((item) => item.id === draggableId);
      if (component && stompClient) {
        setCurrentComponent(component);

        const action: ModuleAction = {
          ID: component.id,
          TYPE: component.type,
          SESSION_ID: roomId,
          SENDER: "presenter",
          TIMESTAMP: new Date().toISOString(),
        };
        console.log("sending module action from eventpage");
        stompClient.send("/app/moduleAction", {}, JSON.stringify(action));
      }
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
    if (component.title === "Recording") {
      navigate("/record");
    } else {
      setCurrentComponent(component);
    }
  };

  const renderInteractionComponent = () => {
    switch (interactionType) {
      case "chat":
        return <LiveChat />;
      case "qa":
        return <div>Q&A Component</div>;
      case "poll":
        return <div>Poll Component</div>;
      default:
        return null;
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        {/* Stream Status Bar */}
        <div className="bg-gray-800 p-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleBack}
                variant="secondary"
                className="bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <LiveIndicator {...streamStatus} />
            </div>
            <Button
              onClick={handleGoLive}
              variant={streamStatus.isLive ? "destructive" : "default"}
            >
              {streamStatus.isLive ? "End Stream" : "Go Live"}
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
                  className={`h-full flex items-center justify-center bg-gray-800 ${
                    snapshot.isDraggingOver ? "border-2 border-blue-400" : ""
                  }`}
                >
                  {currentComponent ? (
                    <div className="text-center p-6">
                      <div className="mb-4">{currentComponent.icon}</div>
                      <h2 className="text-xl font-semibold mb-4">
                        {currentComponent.title}
                      </h2>
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
                    <p className="text-gray-400">Drag a component here</p>
                  )}
                  {provided.placeholder}
                </Card>
              )}
            </Droppable>
          </div>

          {/* Right Sidebar */}
          <div className="flex-1 bg-gray-800 shadow-lg flex flex-col">
            {/* Components Panel */}
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Components</h2>
              <Droppable droppableId="components-list">
                {(provided, snapshot) => (
                  <ScrollArea className="h-96">
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 ${snapshot.isDraggingOver ? "bg-gray-700" : ""}`}
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
                              className={`p-4 cursor-pointer bg-gray-700 hover:bg-gray-600 ${
                                snapshot.isDragging ? "shadow-lg" : ""
                              }`}
                              onClick={() => handleComponentClick(item)}
                            >
                              <div className="flex items-center space-x-3">
                                {item.icon}
                                <div>
                                  <h3 className="font-medium text-white">
                                    {item.title}
                                  </h3>
                                  <p className="text-sm text-gray-300">
                                    {item.type}
                                  </p>
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
              <Select
                onValueChange={(value: "chat" | "qa" | "poll") =>
                  setInteractionType(value)
                }
              >
                <SelectTrigger className="w-full mb-2 bg-gray-700 text-white">
                  <SelectValue placeholder="Select interaction type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 text-white">
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
              <Card className="h-full overflow-y-auto bg-gray-700 text-white">
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
