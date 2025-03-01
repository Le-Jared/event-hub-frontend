import { Card } from "@/components/shadcn/ui/card";
import { ScrollArea } from "@/components/shadcn/ui/scroll-area";
import LiveChat from "@/components/LiveChat";
import Chatbot from "@/components/experimental/AIchatbot";
import LiveIndicator from "./components/LiveIndicator";
import RoomDetailsComponent from "./components/RoomDetail";
import {ModuleConnection,sendModuleAction,StreamConnection} from "@/utils/messaging-client";
import { useParams } from "react-router-dom";
import { ModuleAction, videoSource } from "./EventPage";
import { Components, Poll } from "../data/componentData";
import { getStreamStatus } from "@/utils/api-client";
import VideoJSSynced from "@/components/VideoJSSynced";
import { useEffect, useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import PollComponent from "./components/PollComponent";
import QuestionComponent from "./components/QuestionComponent";

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
  const [poll, setPoll] = useState(Poll);
  const [currentComponent, setCurrentComponent] =
    useState<ComponentItem | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    isLive: false,
    viewerCount: 0,
  });
  const { roomId } = useParams();
  const roomID = roomId ? roomId.toString() : "";
  const { user } = useAppContext();
  const [pollMode, setPollMode] = useState<"vote" | "result">("vote");

  useEffect(() => {
    const cleanupWebSocket = ModuleConnection({
      roomID: roomID,
      onReceived: (action: ModuleAction) => {
        console.log("Received ModuleAction:", action);
        // to switch to result view
        if (action.TYPE == "poll_result" && action.CONTENT) {
          setPoll(JSON.parse(action.CONTENT));
          setPollMode("result");
        }
        // to switch to poll view
        if (action.TYPE == "poll_view" && action.CONTENT) {
          setPoll(JSON.parse(action.CONTENT));
          setPollMode("vote");
        }
        const component = Components.find(
          (component) => component.id === action.ID
        );
        if (component) {
          setCurrentComponent({
            ...component,
            content: component.content ?? "",
          });
        }
      },
      goLive: (isLive: boolean) => {
        console.log(isLive);
      },
    });

    return cleanupWebSocket;
  }, [roomId]);

  useEffect(() => {
    let cleanupFunction: (() => void) | undefined;

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

      cleanupFunction = StreamConnection({
        roomID: roomId ?? "",
        onReceived: (status) => {
          console.log("Received StatusMessage:", status);
          if (status.TYPE === "START_STREAM") {
            setStreamStatus((prev) => ({ ...prev, isLive: true }));
          } else if (status.TYPE === "STOP_STREAM") {
            setStreamStatus((prev) => ({ ...prev, isLive: false }));
          } else if (
            status.TYPE === "VIEWER_JOIN" ||
            status.TYPE === "VIEWER_LEAVE"
          ) {
            setStreamStatus((prev) => ({
              ...prev,
              viewerCount: status.VIEWER_COUNT ?? prev.viewerCount,
            }));
          }
        },
      });
    };

    fetchStreamData();

    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [roomId]);

  const videoJSOptions = {
    sources: [
      {
        src: videoSource,
        type: "application/x-mpegURL",
      },
    ],
  };

  const sendPollVote = (pollId: number, optionId: number) => {
    console.log("voting for " + optionId + " in poll with id " + pollId);
    sendModuleAction({
      ID: "54",
      TYPE: "poll_vote",
      SESSION_ID: roomId ?? "",
      SENDER: user?.username ?? "",
      TIMESTAMP: new Date().toISOString(),
      CONTENT: pollId + "_" + optionId,
    });
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
                {currentComponent.imageUrl &&
                  currentComponent.type !== "slide" &&
                  !currentComponent.htmlContent && (
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
                {currentComponent.type === "poll" && roomId && (
                  <PollComponent
                    poll={poll}
                    setPoll={setPoll}
                    isHost={false}
                    roomId={roomId}
                    onVoteSubmit={sendPollVote}
                    pollMode={pollMode}
                    setPollMode={setPollMode}
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
        <div className="flex-1 bg-gray-800 shadow-lg flex flex-col h-full">
          {/* Room Details Section */}
          <div className="h-[200px] min-h-[200px]">
            <ScrollArea className="h-full">
              <RoomDetailsComponent />
            </ScrollArea>
          </div>

          {/* Questions Section */}
          <div className="flex-1 border-y border-gray-700 overflow-hidden">
              <QuestionComponent />
          </div>

          {/* Live Chat */}
          <div className="h-[550px] min-h-[550px]">
            <LiveChat />
          </div>
        </div>
      </div>
      <Chatbot />
    </div>
  );
};

export default ViewerPage;
