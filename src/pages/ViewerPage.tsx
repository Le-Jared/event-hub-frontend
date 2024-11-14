import { Card } from "@/components/shadcn/ui/card";
import { ScrollArea } from "@/components/shadcn/ui/scroll-area";
import LiveChat from "@/components/LiveChat";
import Chatbot from "@/components/experimental/AIchatbot";
import LiveIndicator from "./components/LiveIndicator";
import RoomDetailsComponent from "./components/RoomDetail";
import { ModuleConnection, StreamConnection } from "@/utils/messaging-client";
import { useParams } from "react-router-dom";
import { ModuleAction, videoSource } from "./EventPage";
import { Components } from "../data/componentData";
import { getStreamStatus } from "@/utils/api-client";
import VideoJSSynced from "@/components/VideoJSSynced";
import { useEffect, useState } from "react";

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

const ViewerPage: React.FC = () => {
  const [currentComponent, setCurrentComponent] = useState<ComponentItem | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    isLive: false,
    viewerCount: 0,
  });
  const { roomId } = useParams();
  const roomID = roomId ? roomId.toString() : "";

  useEffect(() => {
    const cleanupWebSocket = ModuleConnection({
      roomID: roomID,
      onReceived: (action: ModuleAction) => {
        console.log("Received ModuleAction:", action);
        const component = Components.find(
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
            setStreamStatus((prev: any) => ({ ...prev, isLive: true }));
          } else if (status.TYPE === "STOP_STREAM") {
            setStreamStatus((prev: any) => ({ ...prev, isLive: false }));
          }
        },
      });
      return () => {
        cleanupStreamWebSocket();
      };
    };
    fetchStreamData();
  }, [roomId]);

  const videoJSOptions = {
    sources: [
      {
        src: videoSource,
        type: "application/x-mpegURL",
      },
    ],
  };

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
                {currentComponent.imageUrl && currentComponent.type !== "slide" && !currentComponent.htmlContent && (
                  <img
                    src={currentComponent.imageUrl}
                    alt={currentComponent.title}
                    className="mx-auto mb-4 rounded-lg shadow-md"
                  />
                )}
                {currentComponent.type === "slide" && (
                  <div className="carousel w-full">
                    <img
                      src={currentComponent.imageUrl}
                      alt={currentComponent.title}
                      className="w-full"
                    />
                  </div>
                )}
                {currentComponent.htmlContent && !currentComponent.imageUrl && (
                  <div>{currentComponent.htmlContent}</div>
                )}
                {currentComponent.type === "video" && (
                  <VideoJSSynced
                    options={videoJSOptions}
                    roomID={roomId ?? ""}
                    isHost={false}
                    className="w-full h-full max-w-full max-h-full flex justify-center items-center py-4"
                  />
                )}
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
          {/* Room Details Section */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <RoomDetailsComponent />
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