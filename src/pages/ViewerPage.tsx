import React, { useState, useEffect } from "react";
import { Card } from "@/components/shadcn/ui/card";
import { ScrollArea } from "@/components/shadcn/ui/scroll-area";
import { Video, Image, FileQuestion } from "lucide-react";
import LiveChat from "@/components/LiveChat";
import Chatbot from "@/components/experimental/ChatBot";
import LiveIndicator from "./components/LiveIndicator";
import PollComponent from "./components/PollComponent";
import { ModuleConnection, StreamConnection } from "@/utils/messaging-client";
import { useParams } from "react-router-dom";
import { dummyComponents, ModuleAction } from "./EventPage";
import { getStreamStatus } from "@/utils/api-client";

// WebSocket connection
const WS_URL = "http://localhost:8080/streamStatus";

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

export interface StatusMessage {
  TYPE: string;
  ID?: string;
  SESSION_ID?: string;
  VIEWER_COUNT?: number;
  IS_LIVE?: any;
}

const componentIcons: { [key: string]: React.ReactNode } = {
  slide: <Image className="w-6 h-6" />,
  video: <Video className="w-6 h-6" />,
  quiz: <FileQuestion className="w-6 h-6" />,
};

const ViewerPage: React.FC = () => {
  const [currentComponent, setCurrentComponent] =
    useState<ComponentItem | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    isLive: false,
    viewerCount: 0,
  });
  const { roomId } = useParams();
  const roomID = roomId ? roomId.toString() : "";

  const handlePollVote = (optionId: number) => {
    // if (socket?.readyState === WebSocket.OPEN) {
    //   socket.send(
    //     JSON.stringify({
    //       type: "POLL_VOTE",
    //       optionId: optionId,
    //       room: roomID,
    //     })
    //   );
    // }
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
          setCurrentComponent(component);
        }
      },
      goLive: (isLive: boolean) => {},
    });

    return cleanupWebSocket;
  }, [roomId]);

  useEffect(() => {
    const fetchStreamData = async () => {
      try {
        const currentStatus = await getStreamStatus(roomID);
        setStreamStatus({
          isLive: currentStatus.isLive,
          viewerCount: currentStatus.viewerCount,
          roomId: roomID,
        });
      } catch (error) {
        console.error("Error fetching stream data:", error);
      }

      const cleanupStreamWebSocket = StreamConnection({
        roomID: roomId ?? "",
        onReceived: (status) => {
          console.log("Received StatusMessage:", status);
          if (status.TYPE === "START_STREAM") {
            setStreamStatus((prev) => ({ ...prev, isLive: true }));
          } else if (status.TYPE === "STOP_STREAM") {
            setStreamStatus((prev) => ({ ...prev, isLive: false }));
          }
        },
      });
      return () => {
        cleanupStreamWebSocket();
      };
    };
    fetchStreamData();
    // return cleanupStreamWebSocket;
  }, [roomId]);

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
                  <div>{currentComponent.htmlContent}</div>
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
