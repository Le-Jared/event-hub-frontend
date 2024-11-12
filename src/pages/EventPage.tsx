import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/shadcn/ui/card";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@/components/shadcn/ui/dnd";
import { Button } from "@/components/shadcn/ui/button";
import { Alert, AlertDescription } from "@/components/shadcn/ui/alert";
import { Input } from "@/components/shadcn/ui/input";
import {
  Image,
  Camera,
  Monitor,
  Users,
  Copy,
  CheckCheck,
  Loader,
  FileQuestion,
  Video,
  Radio,
  MessageSquare,
  HelpCircle,
  BarChart,
} from "lucide-react";
import { useToast } from "@/components/shadcn/ui/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import { ModuleConnection, sendModuleAction } from "@/utils/messaging-client";
import { Badge } from "@/components/shadcn/ui/badge";
import LiveChat from "@/components/LiveChat";
import { ScrollArea } from "@/components/shadcn/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/ui/select";

// WebSocket connection
const WS_URL = "ws://localhost:8080/event";

export interface ComponentItem {
  ID: string;
  TYPE: string;
  TITLE: string;
  ICON: React.ReactNode;
  CONTENT: string;
  IMAGE_URL?: string;
  SESSION_ID?: string | undefined;
  SENDER?: string | undefined;
}

interface StreamStatus {
  isLive: boolean;
  viewerCount: number;
  roomId?: string;
}

interface WebSocketMessage {
  type: "viewer_count" | "viewer_joined" | "error";
  count?: number;
  message?: string;
}

export type ModuleAction = {
  TYPE: string;
  SESSION_ID: string | undefined;
  SENDER: string | undefined;
  ID: string;
};

export const dummyComponents: ComponentItem[] = [
  {
    ID: "1",
    TYPE: "slide",
    TITLE: "Introduction Slide",
    ICON: <Image className="w-6 h-6" />,
    CONTENT: "Welcome to the presentation!",
    IMAGE_URL: "https://picsum.photos/400/300?random=1",
  },
  {
    ID: "2",
    TYPE: "video",
    TITLE: "Demo Video",
    ICON: <Video className="w-6 h-6" />,
    CONTENT: "Product demonstration video",
    IMAGE_URL: "https://picsum.photos/400/300?random=2",
  },
  {
    ID: "3",
    TYPE: "quiz",
    TITLE: "Knowledge Check",
    ICON: <FileQuestion className="w-6 h-6" />,
    CONTENT: "Test your understanding",
    IMAGE_URL: "https://picsum.photos/400/300?random=3",
  },
];

const LiveIndicator: React.FC<StreamStatus> = ({ isLive, viewerCount }) => (
  <div className="flex items-center space-x-4 text-white">
    <div className="flex items-center">
      <Badge
        variant={isLive ? "destructive" : "secondary"}
        className="flex items-center gap-2"
      >
        <Radio className="w-4 h-4 animate-pulse" />
        <span>{isLive ? "LIVE" : "OFFLINE"}</span>
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
  const { toast } = useToast();
  const { roomId } = useParams<{ roomId: string }>();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string>("");
  // const [isLoading, setIsLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [shareUrl, setShareUrl] = useState("");
  // const [copied, setCopied] = useState(false);
  const [interactionType, setInteractionType] = useState<
    "chat" | "qa" | "poll"
  >("chat");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [currentComponent, setCurrentComponent] =
    useState<ComponentItem | null>(null);
  const [components] = useState<ComponentItem[]>(dummyComponents);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    isLive: false,
    viewerCount: 0,
  });

  const { user } = useAppContext();

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket>();
  const mediaRecorderRef = useRef<MediaRecorder>();
  const streamRef = useRef<MediaStream>();

  // Initialize share URL when component mounts or roomId changes
  useEffect(() => {
    const baseUrl = window.location.origin;
    setShareUrl(`${baseUrl}/viewer/${roomId}`);

    return () => {
      stopStream();
    };
  }, [roomId]);

  // WebSocket connection management
  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("Connected to WebSocket");
        setStreamStatus((prev) => ({ ...prev, isLive: true }));
        // Join the room as a broadcaster
        ws.send(
          JSON.stringify({
            type: "JOIN_ROOM",
            role: "broadcaster",
          })
        );
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStreamStatus((prev) => ({ ...prev, isLive: false }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case "COMPONENT_CHANGE":
              if (data.component) {
                setCurrentComponent(data.component);
              }
              break;
            case "VIEWER_COUNT":
              setStreamStatus((prev) => ({
                ...prev,
                viewerCount: data.count,
              }));
              break;
            default:
              break;
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("Disconnected from WebSocket");
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
      console.error("Error connecting to WebSocket:", error);
      setStreamStatus((prev) => ({ ...prev, isLive: false }));
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

    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    if (destination.droppableId === "main-stage") {
      const component = components.find((item) => item.ID === draggableId);
      if (component) {
        setCurrentComponent(component);
        // assign props before sending
        component.SENDER = user?.username;
        component.SESSION_ID = roomId;
        console.log(component);
        sendModuleAction(component);

        if (socket?.readyState === WebSocket.OPEN) {
          console.log("changing component");
          socket.send(
            JSON.stringify({
              type: "COMPONENT_CHANGE",
              component,
            })
          );
        }
      }
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

  // Start streaming function
  // const startStream = async (type: "camera" | "screen") => {
  //   try {
  //     setIsLoading(true);

  //     // Get media stream based on type
  //     const stream = await (type === "camera"
  //       ? navigator.mediaDevices.getUserMedia({
  //           video: {
  //             width: { ideal: 1920 },
  //             height: { ideal: 1080 },
  //             frameRate: { ideal: 30 },
  //           },
  //           audio: true,
  //         })
  //       : navigator.mediaDevices.getDisplayMedia({
  //           video: true,
  //           audio: true,
  //         }));

  //     // Set video source
  //     if (videoRef.current) {
  //       videoRef.current.srcObject = stream;
  //     }

  //     // Store stream reference
  //     streamRef.current = stream;

  //     // Initialize WebSocket connection
  //     connectWebSocket();

  //     // Initialize MediaRecorder with optimal settings
  //     const mediaRecorder = new MediaRecorder(stream, {
  //       mimeType: "video/webm;codecs=vp8,opus",
  //       videoBitsPerSecond: 3000000, // 3 Mbps
  //     });

  //     // Handle data available event
  //     mediaRecorder.ondataavailable = (event) => {
  //       if (
  //         event.data.size > 0 &&
  //         wsRef.current?.readyState === WebSocket.OPEN
  //       ) {
  //         wsRef.current.send(event.data);
  //       }
  //     };

  //     // Start recording
  //     mediaRecorder.start(100); // Send chunks every 100ms
  //     mediaRecorderRef.current = mediaRecorder;
  //     setStreaming(true);
  //     setIsLoading(false);

  //     // Handle track end events
  //     stream.getTracks().forEach((track) => {
  //       track.onended = () => {
  //         console.log("Track ended:", track.kind);
  //         stopStream();
  //       };
  //     });

  //     toast({
  //       title: "Stream Started",
  //       description: `Started ${type} stream successfully`,
  //     });
  //   } catch (err) {
  //     console.error("Error accessing media devices:", err);
  //     setError("Failed to access media devices");
  //     setIsLoading(false);
  //     toast({
  //       title: "Stream Error",
  //       description: "Failed to start stream",
  //       variant: "destructive",
  //     });
  //   }
  // };

  // Stop streaming function
  const stopStream = useCallback(() => {
    // Stop MediaRecorder if active
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    // Stop all tracks and clear video source
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Reset state
    setStreaming(false);
    setConnected(false);
    setViewers(0);
    setError("");

    toast({
      title: "Stream Ended",
      description: "Your stream has been stopped",
    });
  }, []);

  // Copy share URL function
  // const copyShareUrl = async () => {
  //   try {
  //     await navigator.clipboard.writeText(shareUrl);
  //     setCopied(true);
  //     toast({
  //       title: "Link Copied",
  //       description: "Stream link has been copied to clipboard",
  //     });
  //     setTimeout(() => setCopied(false), 2000);
  //   } catch (err) {
  //     console.error("Failed to copy:", err);
  //     toast({
  //       title: "Copy Failed",
  //       description: "Failed to copy link to clipboard",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const uuid = () => {
    var S4 = function () {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (
      S4() +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      S4() +
      S4()
    );
  };

  // const changeModule = async (module: string) => {
  //   const moduleAction = {
  //     TYPE: module,
  //     SESSION_ID: roomId,
  //     SENDER: user?.username || "",
  //     ID: uuid(),
  //   };
  //   console.log(moduleAction);
  //   await sendModuleAction(moduleAction);
  // };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        {/* Stream Status Bar */}
        <div className="bg-gray-800 p-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <LiveIndicator {...streamStatus} />
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
              {(provided: any, snapshot: any) => (
                <Card
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`h-full flex items-center justify-center bg-gray-800 ${
                    snapshot.isDraggingOver ? "border-2 border-blue-400" : ""
                  }`}
                >
                  {currentComponent ? (
                    <div className="text-center p-6">
                      <div className="mb-4">{currentComponent.ICON}</div>
                      <h2 className="text-xl font-semibold mb-4">
                        {currentComponent.TITLE}
                      </h2>
                      {currentComponent.IMAGE_URL && (
                        <img
                          src={currentComponent.IMAGE_URL}
                          alt={currentComponent.TITLE}
                          className="mx-auto mb-4 rounded-lg shadow-md"
                        />
                      )}
                      <p className="text-white">{currentComponent.CONTENT}</p>
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
          <div className="flex-1 bg-gray-800 shadow-lg flex flex-col">
            {/* Components Panel */}
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Components</h2>
              <Droppable droppableId="components-list">
                {(provided: any, snapshot: any) => (
                  <ScrollArea className="h-96">
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 ${snapshot.isDraggingOver ? "bg-gray-700" : ""}`}
                    >
                      {components.map((item, index) => (
                        <Draggable
                          key={item.ID}
                          draggableId={item.ID}
                          index={index}
                        >
                          {(provided: any, snapshot: any) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 cursor-move bg-gray-700 hover:bg-gray-600 ${
                                snapshot.isDragging ? "shadow-lg" : ""
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                {item.ICON}
                                <div>
                                  <h3 className="font-medium text-white">
                                    {item.TITLE}
                                  </h3>
                                  <p className="text-sm text-gray-300">
                                    {item.TYPE}
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
