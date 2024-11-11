import LiveChat from "@/components/LiveChat";
import PollView from "@/components/PollView";
import VideoJSSynced from "@/components/VideoJSSynced";
import VideoChatbot from "@/components/ChatBot";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/shadcn/ui/button";

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
  const [transitioning, setTransitioning] = useState(false);
  const TRANSITION_DURATION = 500;
  const buttonTextFormat = "text-3xl mx-8 px-8 py-6 font-alatsi text-white";

  // Define consistent dimensions for the content area
  const contentWrapperStyle =
    "w-full h-[500px] md:h-[600px] bg-gray-900 flex items-center justify-center mb-6"; // Adjust height as needed

  const renderContent = () => {
    switch (optionSelected) {
      case "video":
        return (
          <VideoJSSynced
            blockDisposePlayer={blockDisposePlayer}
            options={videoJsOptions}
            roomID={roomID}
            isHost={isHost}
          />
        );
      case "slides":
        return (
          <p className="text-white text-center text-3xl">Slides Placeholder</p>
        );
      case "textarea":
        return (
          <p className="text-white text-center text-3xl">Text Placeholder</p>
        );
      default:
        return null;
    }
  };

  const handleButtonClick = (option: string) => {
    if (optionSelected === option) {
      setTransitioning(true);
      setTimeout(() => {
        setOptionSelected(null);
        setTransitioning(false);
      }, TRANSITION_DURATION);
      return;
    }

    setTransitioning(true);
    try {
      setTimeout(() => {
        setOptionSelected(option);
        setTransitioning(false);
      }, TRANSITION_DURATION);
    } catch (error) {
      console.error(`Error in handleButtonClick: ${error}`);
      setTransitioning(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-y-2 md:grid-cols-4 md:gap-x-4">
        <div className="col-span-3 min-h-80">
          <div className={contentWrapperStyle}>{renderContent()}</div>

          <div className="flex items-center justify-center mt-4">
            <Button
              onClick={() => handleButtonClick("video")}
              variant="ghost"
              className={buttonTextFormat}
            >
              Video
            </Button>
            <Button
              onClick={() => handleButtonClick("slides")}
              variant="ghost"
              className={buttonTextFormat}
            >
              Slides
            </Button>
            <Button
              onClick={() => handleButtonClick("textarea")}
              variant="ghost"
              className={buttonTextFormat}
            >
              Text
            </Button>
          </div>
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
