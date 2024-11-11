import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/shadcn/ui/card";
import { Button } from "@/components/shadcn/ui/button";
import { Alert, AlertDescription } from "@/components/shadcn/ui/alert";
import { Input } from "@/components/shadcn/ui/input";
import { Camera, Monitor, Users, Copy, CheckCheck, Loader } from "lucide-react";
import { useToast } from "@/components/shadcn/ui/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import { ModuleConnection, sendModuleAction } from "@/utils/messaging-client";

const WEBSOCKET_URL = "ws://localhost:8080/stream";

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

const EventPage: React.FC = () => {
  const { toast } = useToast();
  const { roomId } = useParams<{ roomId: string }>();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

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
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsLoading(true);
    const ws = new WebSocket(`${WEBSOCKET_URL}/${roomId}?type=broadcaster`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setIsLoading(false);
      setError("");
      toast({
        title: "Connected",
        description: "Successfully connected to the stream",
      });
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        switch (data.type) {
          case "viewer_count":
            setViewers(data.count || 0);
            break;
          case "viewer_joined":
            toast({
              title: "Viewer Joined",
              description: "A new viewer has joined your stream.",
            });
            break;
          case "error":
            setError(data.message || "An error occurred");
            break;
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onerror = () => {
      console.error("WebSocket error:", event);
      setError("Connection error occurred");
      setIsLoading(false);
      setConnected(false);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the stream",
        variant: "destructive",
      });
    };

    ws.onclose = () => {
      setConnected(false);
      setIsLoading(false);
      setStreaming(false);
      toast({
        title: "Disconnected",
        description: "Connection to stream closed",
        variant: "destructive",
      });

      // Attempt to reconnect after 5 seconds if we were streaming
      if (streaming) {
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 5000);
      }
    };
  }, [roomId, streaming]);

  // Start streaming function
  const startStream = async (type: "camera" | "screen") => {
    try {
      setIsLoading(true);

      // Get media stream based on type
      const stream = await (type === "camera"
        ? navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            },
            audio: true,
          })
        : navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          }));

      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Store stream reference
      streamRef.current = stream;

      // Initialize WebSocket connection
      connectWebSocket();

      // Initialize MediaRecorder with optimal settings
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
        videoBitsPerSecond: 3000000, // 3 Mbps
      });

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (
          event.data.size > 0 &&
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          wsRef.current.send(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(100); // Send chunks every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setStreaming(true);
      setIsLoading(false);

      // Handle track end events
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          console.log("Track ended:", track.kind);
          stopStream();
        };
      });

      toast({
        title: "Stream Started",
        description: `Started ${type} stream successfully`,
      });
    } catch (err) {
      console.error("Error accessing media devices:", err);
      setError("Failed to access media devices");
      setIsLoading(false);
      toast({
        title: "Stream Error",
        description: "Failed to start stream",
        variant: "destructive",
      });
    }
  };

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
  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Stream link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

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

  const changeModule = async (module: string) => {
    const moduleAction = {
      TYPE: module,
      SESSION_ID: roomId,
      SENDER: user?.username || "",
      ID: uuid(),
    };
    console.log(moduleAction);
    await sendModuleAction(moduleAction);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          {/* Connection Status */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-sm text-gray-500">
              {connected ? "Connected" : "Disconnected"}
            </span>
            {streaming && (
              <div className="flex items-center ml-4">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
                <span className="text-sm text-gray-500">Live</span>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Video Preview */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full"
            />
            {!streaming && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-white text-lg">
                  Start streaming to preview your video
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Stream Control Buttons */}
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => startStream("camera")}
                disabled={streaming || isLoading}
                className="flex items-center"
              >
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </Button>
              <Button
                onClick={() => startStream("screen")}
                disabled={streaming || isLoading}
                className="flex items-center"
              >
                <Monitor className="mr-2 h-4 w-4" />
                Share Screen
              </Button>
              {streaming && (
                <Button onClick={stopStream} variant="destructive">
                  Stop Stream
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center mt-4">
              <Button
                onClick={() => {
                  changeModule("video");
                }}
                className="text-3xl mx-8 px-8 py-6 font-alatsi"
              >
                Video
              </Button>
              <Button
                onClick={() => {
                  changeModule("slides");
                }}
                className="text-3xl mx-8 px-8 py-6 font-alatsi"
              >
                Slides
              </Button>
              <Button
                onClick={() => {
                  changeModule("text");
                }}
                className="text-3xl mx-8 px-8 py-6 font-alatsi"
              >
                Text
              </Button>
            </div>

            {/* Stream Info and Share URL */}
            {streaming && (
              <>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    <span>
                      {viewers} viewer{viewers !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Input value={shareUrl} readOnly className="flex-1" />
                      <Button
                        onClick={copyShareUrl}
                        variant="outline"
                        className="flex items-center"
                      >
                        {copied ? (
                          <CheckCheck className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Stream Information Panel */}
                <div className="mt-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">
                    Stream Information
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Room ID: {roomId}</p>
                    <p className="text-sm text-gray-500">
                      Active Viewers: {viewers}
                    </p>
                    <p className="text-sm text-gray-500">
                      Share URL: {shareUrl}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventPage;
