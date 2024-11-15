import React from 'react';
import { Image, FileVideo, Radio, BarChart2, Box } from 'lucide-react';
import VideoRecorder from '../pages/VideoRecorder';
import ModelViewer from '@/pages/ModelPage';
import { ModelProvider } from '@/pages/ModelViewer/ModelContext';

export interface ComponentItem {
  id: string;
  type: string;
  title: string;
  icon: React.ReactNode;
  content?: string;
  imageUrl?: string;
  htmlContent?: React.ReactNode;
  link: string;
  next?: string;
  prev?: string;
}

export const Components: ComponentItem[] = [
  {
    id: "1",
    type: "slide",
    title: "Slide",
    icon: <Image className="w-6 h-6" />,
    content: "Welcome to the presentation!",
    imageUrl: "https://picsum.photos/id/0/600/300",
    link: "/slide/1",
    next: "6",
    prev: "8"
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
    link: "/model",
    htmlContent: (
      <ModelProvider>
        <ModelViewer />
      </ModelProvider>
    ),
  },
  {
    id: "6",
    type: "slide",
    title: "Slide",
    icon: <Image className="w-6 h-6" />,
    content: "Welcome to the presentation!",
    imageUrl: "https://picsum.photos/id/1/600/300",
    link: "/slide/6",
    next: "7",
    prev: "1"
  },
  {
    id: "7",
    type: "slide",
    title: "Slide",
    icon: <Image className="w-6 h-6" />,
    content: "Welcome to the presentation!",
    imageUrl: "https://picsum.photos/id/2/600/300",
    link: "/slide/7",
    next: "8",
    prev: "6"
  },
  {
    id: "8",
    type: "slide",
    title: "Slide",
    icon: <Image className="w-6 h-6" />,
    content: "Welcome to the presentation!",
    imageUrl: "https://picsum.photos/id/3/600/300",
    link: "/slide/8",
    next: "1",
    prev: "7"
  },
];

