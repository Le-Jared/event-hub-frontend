import React from 'react';
import { Image, FileVideo, Radio, BarChart2, Box } from 'lucide-react';
import VideoRecorder from '../pages/VideoRecorder';
import ModelViewer from '../pages/ModelPage';

export interface ComponentItem {
  id: string;
  type: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  imageUrl?: string;
  htmlContent?: React.ReactNode;
  link: string;
}

export const Components: ComponentItem[] = [
  {
    id: "1",
    type: "slide",
    title: "Slide",
    icon: <Image className="w-6 h-6" />,
    content: "Welcome to the presentation!",
    imageUrl: "https://picsum.photos/seed/picsum/600/400",
    link: "/slide/1",
  },
  {
    id: "2",
    type: "video",
    title: "Demo Video",
    icon: <FileVideo className="w-6 h-6" />,
    content: "Demo Video",
    link: "/record",
  },
  {
    id: "3",
    type: "live-webcam",
    title: "Live Webcam",
    icon: <Radio className="w-6 h-6" />,
    content: "See it Live",
    link: "/live",
    htmlContent: <VideoRecorder viewOnly />,
  },
  {
    id: "4",
    type: "poll",
    title: "Create Poll",
    icon: <BarChart2 className="w-6 h-6" />,
    content: "Create an interactive poll",
    imageUrl: `https://picsum.photos/seed/poll/600/400`,
    link: "/poll",
  },
  {
    id: "5",
    type: "model",
    title: "3D Model",
    icon: <Box className="w-6 h-6" />,
    content: "Upload 3D Model",
    link: "/model",
    htmlContent: <ModelViewer viewOnly />,
  },
];

