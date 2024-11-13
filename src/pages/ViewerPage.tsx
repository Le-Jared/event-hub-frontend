import React, { useState, useEffect } from "react";
import { Card } from "@/components/shadcn/ui/card";
import { ScrollArea } from "@/components/shadcn/ui/scroll-area";
import { Video, Image, FileQuestion } from "lucide-react";
import LiveChat from "@/components/LiveChat";
import Chatbot from "@/components/experimental/ChatBot";
import LiveIndicator from "./components/LiveIndicator";
import PollComponent from "./components/PollComponent";
import { ModuleConnection } from "@/utils/messaging-client";
import { useParams } from "react-router-dom";
import { dummyComponents, ModuleAction } from "./EventPage";
import PollView from "@/components/PollView";

// WebSocket connection
const WS_URL = "ws://localhost:8080/moduleAction";

interface ComponentItem {
  id: string;
  type: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  imageUrl?: string;
  htmlContent?: any;
}

interface StreamStatus {
  isLive: boolean;
  viewerCount: number;
  roomId?: string;
}

interface WebSocketMessage {
  TYPE: string;
  ID?: string;
  SENDER?: string;
  count?: number;
  data?: any;
}

const componentIcons: { [key: string]: React.ReactNode } = {
  slide: <Image className="w-6 h-6" />,
  video: <Video className="w-6 h-6" />,
  quiz: <FileQuestion className="w-6 h-6" />,
};

const ViewerPage: React.FC = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [currentComponent, setCurrentComponent] =
    useState<ComponentItem | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    isLive: false,
    viewerCount: 0,
  });
  const { roomId } = useParams();
  const roomID = roomId ? roomId.toString() : "";

  const handlePollVote = (optionId: number) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "POLL_VOTE",
          optionId: optionId,
        })
      );
    }
  };

  useEffect(() => {
    const cleanupWebSocket = ModuleConnection({
      roomID: roomID,
      onReceived: (action: ModuleAction) => {
        console.log("Received ModuleAction:", action);
        const component = dummyComponents.find(
          (component) => component.id === action.ID
        );
        if (component) {
          if (component.type == "poll") {
            component.htmlContent = <PollView roomID={roomID}/>
          }
          setCurrentComponent(component);
        }
      },
    });

    return cleanupWebSocket;
  }, [roomId]);

  const handleWebSocketMessage = (data: WebSocketMessage) => {
    switch (data.TYPE) {
      case "COMPONENT_CHANGE":
        if (data.ID && data.SENDER) {
          setCurrentComponent({
            id: data.ID,
            type: data.TYPE,
            title: `Component from ${data.SENDER}`,
            icon: componentIcons[data.TYPE] || (
              <FileQuestion className="w-6 h-6" />
            ),
            content: `Content for ${data.TYPE}`,
          });
        }
        break;
      case "VIEWER_COUNT":
        setStreamStatus((prev) => ({
          ...prev,
          viewerCount: data.count || 0,
        }));
        break;
      case "POLL_UPDATE":
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("Connected to WebSocket");
      setStreamStatus((prev) => ({ ...prev, isLive: true }));
      // Join the room as a viewer
      ws.send(
        JSON.stringify({
          type: "JOIN_ROOM",
          role: "viewer",
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
        console.log(event.data, "received");
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from WebSocket");
      setStreamStatus({ isLive: false, viewerCount: 0 });
    };

    setSocket(ws);

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
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
              <div className="text-center p-6 w-full">
                {/* <div className="mb-4">{currentComponent.icon}</div> */}
                {/* <h2 className="text-xl font-semibold mb-4">
                  {currentComponent.title}
                </h2> */}
                {currentComponent.imageUrl && !currentComponent.htmlContent && (
                  <img
                    src={currentComponent.imageUrl}
                    alt={currentComponent.title}
                    className="mx-auto mb-4 rounded-lg shadow-md"
                  />
                )}
                {currentComponent.htmlContent && !currentComponent.imageUrl && (
                  <div>
                    {currentComponent.htmlContent}
                  </div>
                )}
                {/* <p className="text-white">{currentComponent.content}</p> */}
              </div>
            ) : (
              <p className="text-gray-400">
                Waiting for presenter to share content...
              </p>
            )}
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="flex-1 bg-gray-800 shadow-lg flex flex-col">
          {/* Poll Section */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <PollComponent onVote={handlePollVote} />
            </ScrollArea>
          </div>

          {/* Live Chat */}
          <div className="flex-1 border-b border-gray-700">
            <ScrollArea className="h-full">
              <LiveChat />
            </ScrollArea>
          </div>
        </div>
      </div>
      <Chatbot />
    </div>
  );
};

export default ViewerPage;
