import LiveChat from "@/components/LiveChat";
import PollView from "@/components/PollView";
import VideoJSSynced from "@/components/VideoJSSynced";
import VideoChatbot from "@/components/ChatBot";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/shadcn/ui/button";
import { ModuleConnection } from "@/utils/messaging-client";
import { ComponentItem, dummyComponents, ModuleAction } from "./EventPage";

export interface WatchParty {
  id: number;
  partyName: string;
  scheduledDate: string;
  scheduledTime: string;
  code: string;
  createdDate: number[];
  password: string;
}

const ViewerPage = () => {
  const params = useParams();

  let location = useLocation();
  const data = {
    videoSource:
      "http://localhost:8080/encoded/steamboatwillie_001/master.m3u8",
    isHost: false,
  };
  const isHost = false;

  const sessionId = params.sessionId ? params.sessionId.toString() : "1";
  const videoJsOptions = {
    sources: [
      {
        src: data.videoSource,
        type: "application/x-mpegURL",
      },
    ],
  };
  const { roomId } = useParams();
  let roomID = roomId === undefined ? "" : roomId;

  const [blockDisposePlayer, setBlockDisposePlayer] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { user } = useAppContext();

  const [optionSelected, setOptionSelected] = useState<string | null>("video"); // Default to "video"
  const [currentComponent, setCurrentComponent] =
    useState<ComponentItem | null>(null); //
  const [transitioning, setTransitioning] = useState(false);
  const TRANSITION_DURATION = 500;
  const buttonTextFormat = "text-3xl mx-8 px-8 py-6 font-alatsi text-white";

  // Define consistent dimensions for the content area
  const contentWrapperStyle =
    "w-full h-[500px] md:h-[600px] flex items-center justify-center mb-6"; // Adjust height as needed

  useEffect(() => {
    const cleanupWebSocket = ModuleConnection({
      roomID: roomId!,
      onReceived: (action: ModuleAction) => {
        console.log("Received ModuleAction:", action);
        setOptionSelected(action.TYPE);

        // Find and set the current component based on the incoming action ID
        const component = dummyComponents.find(
          (component) => component.ID === action.ID
        );

        if (component) {
          // Use a functional update to ensure it’s considered a new state even if identical
          setCurrentComponent((prev) => ({
            ...component,
            ID: `${component.ID}-${Date.now()}`, // ensure unique ID for each update
          }));
        } else {
          console.error(`No component found with ID: ${action.ID}`);
        }
      },
    });

    return cleanupWebSocket;
  }, [roomId]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-y-2 md:grid-cols-4 md:gap-x-4">
        <div className="col-span-3 min-h-80">
          {currentComponent ? (
            <div className={contentWrapperStyle}>
              {currentComponent.IMAGE_URL && (
                <img
                  src={currentComponent.IMAGE_URL}
                  alt={currentComponent.TITLE}
                  className="mx-auto mb-4 rounded-lg shadow-md w-full h-full"
                />
              )}
              {/* <p className="text-white">{currentComponent.CONTENT}</p> */}
            </div>
          ) : (
            <p className="text-gray-400">Waiting for content...</p>
          )}
        </div>
        <div className="col-span-1">
          <LiveChat />
        </div>
      </div>

      <VideoChatbot />
    </div>
  );
};

export default ViewerPage;
