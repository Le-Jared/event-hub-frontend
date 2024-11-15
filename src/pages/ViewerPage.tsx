import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/shadcn/ui/card";
import { Button } from "@/components/shadcn/ui/button";
import { ArrowLeft } from "lucide-react";
import LiveChat from "@/components/LiveChat";
import LiveIndicator from "./components/LiveIndicator";
import { ModuleConnection, StreamConnection } from "@/utils/messaging-client";
import VideoJSSynced from "@/components/VideoJSSynced";
import { Components, ComponentItem, Poll } from "@/data/componentData";
import PollComponent from "./components/PollComponent";
import SlideShow from "./components/SlideShow";
import RoomDetailsComponent from "./components/RoomDetail";
import AIchatbot from "@/components/experimental/AIchatbot";

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
  CONTENT?: string;
}

export const videoSource = 
  "http://localhost:8080/encoded/steamboatwillie_001/master.m3u8";

const videoJSOptions = {
  sources: [
    {
      src: videoSource,
      type: "application/x-mpegURL",
    },
  ],
};

const ViewerPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [currentComponent, setCurrentComponent] = useState<ComponentItem | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    isLive: false,
    viewerCount: 0,
    sessionId: roomId,
  });
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [pollMode, setPollMode] = useState<"vote" | "result">("vote");
  const [poll, setPoll] = useState(Poll);

  useEffect(() => {
    const cleanupWebSocket = ModuleConnection({
      roomID: roomId ?? "",
      onReceived: (action: ModuleAction) => {
        console.log("Received ModuleAction:", action);

        // Handle slide changes
        if (action.TYPE === "slide_change" && action.CONTENT) {
          try {
            const { slideIndex } = JSON.parse(action.CONTENT);
            setCurrentSlideIndex(slideIndex);
          } catch (error) {
            console.error("Error parsing slide change content:", error);
          }
        }

        // Handle poll mode changes
        if (action.TYPE === "poll_result") {
          setPollMode("result");
          if (action.CONTENT) {
            setPoll(JSON.parse(action.CONTENT));
          }
        } else if (action.TYPE === "poll_view") {
          setPollMode("vote");
          if (action.CONTENT) {
            setPoll(JSON.parse(action.CONTENT));
          }
        }

        const component = Components.find(
          (component) => component.id === action.ID
        );
        if (component) {
          setCurrentComponent(component);
        }
      },
      goLive: (isLive: boolean) => {
        setStreamStatus((prev) => ({ ...prev, isLive }));
      },
    });
    return cleanupWebSocket;
  }, [roomId]);

  useEffect(() => {
    const cleanupStreamWebSocket = StreamConnection({
      roomID: roomId ?? "",
      onReceived: (status) => {
        console.log("Received StatusMessage:", status);
        if (status.TYPE === "VIEWER_JOIN") {
          setStreamStatus((prev) => ({
            ...prev,
            viewerCount: status.VIEWER_COUNT || 0,
          }));
        } else if (status.TYPE === "VIEWER_LEAVE") {
          setStreamStatus((prev) => ({
            ...prev,
            viewerCount: status.VIEWER_COUNT || 0,
          }));
        } else if (status.TYPE === "START_STREAM") {
          setStreamStatus((prev) => ({ ...prev, isLive: true }));
        } else if (status.TYPE === "STOP_STREAM") {
          setStreamStatus((prev) => ({ ...prev, isLive: false }));
        }
      },
    });
    return cleanupStreamWebSocket;
  }, [roomId]);

  const handleBack = () => {
    navigate(-1);
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
          <div className="flex-1">
            <LiveIndicator {...streamStatus} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Stage */}
        <div className="flex-[3] p-6 h-full overflow-hidden">
          <Card className="h-full flex flex-col items-center justify-center bg-gray-800">
            {currentComponent ? (
              <div className="text-center p-2 w-full h-full overflow-hidden flex flex-col place-content-center">
                <h2 className="text-xl font-semibold mb-4 text-white">
                  {currentComponent.title}
                </h2>
                
                {/* Slide Component */}
                {currentComponent.type === "slide" && currentComponent.images && (
                  <div className="w-full h-full">
                    <SlideShow
                      images={currentComponent.images}
                      isHost={false}
                      currentIndex={currentSlideIndex}
                    />
                  </div>
                )}

                {/* 3D Model Content */}
                {currentComponent.htmlContent && !currentComponent.imageUrl && (
                  <div className="max-w-full max-h-full overflow-auto">
                    {currentComponent.htmlContent}
                  </div>
                )}

                {/* Video Component */}
                {currentComponent.type === "video" && (
                  <div className="flex justify-center items-center w-full h-full">
                    <VideoJSSynced
                      options={videoJSOptions}
                      roomID={roomId ?? ""}
                      isHost={false}
                      className="w-full h-full max-w-[80%] max-h-[80%] flex justify-center items-center"
                    />
                  </div>
                )}

                {/* Poll Component */}
                {currentComponent.type === "poll" && roomId && (
                  <PollComponent
                    poll={poll}
                    setPoll={setPoll}
                    pollMode={pollMode}
                    setPollMode={setPollMode}
                    isHost={false}
                    roomId={roomId}
                  />
                )}

                <p className="text-white mb-4">{currentComponent.content}</p>
              </div>
            ) : (
              <div className="text-gray-400 text-center">
                Waiting for host to share content...
              </div>
            )}
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="flex-1 bg-gray-800 shadow-lg flex flex-col">
          {/* Room Details Section */}
          <div className="h-[35%] p-2 border-t border-gray-700">
            <Card className="h-[calc(100%)] overflow-y-auto bg-gray-700 text-white">
              <RoomDetailsComponent />
            </Card>
          </div>

          {/* Live Chat */}
          <div className="h-[65%] p-2 border-t border-gray-700">
            <Card className="h-[calc(100%)] overflow-y-auto bg-gray-700 text-white">
              <LiveChat />
            </Card>
          </div>
        </div>
      </div>
      <AIchatbot />
    </div>
  );
};

export default ViewerPage;
