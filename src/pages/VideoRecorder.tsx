import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { useReactMediaRecorder } from 'react-media-recorder';
import { Video, StopCircle, Save, Trash2, RefreshCcw } from 'lucide-react';
import { Progress } from "@/components/shadcn/ui/progress";  // Make sure this points to your Progress component file

const VideoRecorder: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  const { status, startRecording, stopRecording } = useReactMediaRecorder({
    video: true,
    audio: true,
    onStop: (blobUrl: string) => {
      setRecordedVideoUrl(blobUrl);
      setRecordingDuration(0);
    },
  });

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    startRecording();
    showNotification('Recording started');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    stopRecording();
    showNotification('Recording stopped');
  };

  const deleteVideo = () => {
    setRecordedVideoUrl(null);
    showNotification('Video deleted');
  };

  const saveVideo = async () => {
    if (!recordedVideoUrl) return;

    try {
      const response = await fetch(recordedVideoUrl);
      const blob = await response.blob();
      
      if ('showSaveFilePicker' in window) {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: `recorded-video-${new Date().toISOString()}.webm`,
          types: [{
            description: 'WebM video',
            accept: { 'video/webm': ['.webm'] },
          }],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        showNotification('Video saved successfully!');
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `recorded-video-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        showNotification('Video download started');
      }
    } catch (error) {
      console.error('Error saving video:', error);
      showNotification('Failed to save video');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {notification && (
        <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {notification}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div className="relative">
          <Webcam
            audio={false}
            ref={webcamRef}
            width={1280}
            height={720}
            className="rounded-lg shadow-lg w-full"
          />
          {isRecording && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>{formatTime(recordingDuration)}</span>
            </div>
          )}
        </div>

        {isRecording && (
          <Progress value={recordingDuration % 60 * (100/60)} className="w-full" />
        )}

        <div className="flex flex-wrap gap-4 justify-center">
          {!isRecording ? (
            <button 
              onClick={handleStartRecording} 
              disabled={status === 'recording'}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 min-w-[160px] disabled:opacity-50"
            >
              <Video className="w-5 h-5" /> 
              <span>Start Recording</span>
            </button>
          ) : (
            <button 
              onClick={handleStopRecording} 
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 min-w-[160px]"
            >
              <StopCircle className="w-5 h-5" /> 
              <span>Stop Recording</span>
            </button>
          )}
          
          <button 
            onClick={saveVideo} 
            disabled={!recordedVideoUrl}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 min-w-[160px] disabled:opacity-50"
          >
            <Save className="w-5 h-5" /> 
            <span>Save Video</span>
          </button>

          {recordedVideoUrl && (
            <>
              <button 
                onClick={deleteVideo}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 min-w-[160px]"
              >
                <Trash2 className="w-5 h-5" /> 
                <span>Delete Video</span>
              </button>
              <button 
                onClick={() => {
                  setRecordedVideoUrl(null);
                  handleStartRecording();
                }}
                className="border border-gray-300 hover:bg-gray-100 px-6 py-2 rounded-lg flex items-center space-x-2 min-w-[160px]"
              >
                <RefreshCcw className="w-5 h-5" /> 
                <span>Record New</span>
              </button>
            </>
          )}
        </div>

        {recordedVideoUrl && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Preview</h3>
            <video 
              src={recordedVideoUrl} 
              controls 
              className="rounded-lg shadow-lg w-full" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoRecorder;