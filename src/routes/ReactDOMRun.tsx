import React, { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import ErrorPage from "@/pages/ErrorPage";
import { ProtectedRoute } from "./ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import NotFoundPage from "@/pages/NotFoundPage";
import WaitingPage from "@/pages/WaitingRoomPage";
import EventPage from "@/pages/EventPage";
import HostHomePage from "@/pages/host/HostHomePage";
import SplineLayout from "../routes/SplineLayout";
import HostCreateEvent from "@/pages/host/HostCreateEvent";
import HostManageEvent from "@/pages/host/HostManageEvent";
import ViewerPage from "@/pages/ViewerPage";
import Record from "@/pages/VideoRecorder";

const router = createBrowserRouter([
  {
    path: "/",
    element: <SplineLayout />,
    children: [
      {
        index: true,
        element: null, // SplinePage is rendered in the layout
      },
    ],
  },
  {
    path: "/",
    errorElement: <ErrorPage />,
    children: [
      {
        path: "home",
        element: <LandingPage />,
      },
      {
        path: "event/:roomId",
        element: <EventPage />,
      },
      {
        path: "waiting/:roomId",
        element: <WaitingPage />,
      },
      {
        path: "viewer/:roomId",
        element: <ViewerPage />,
      },
      {
        path: "host",
        element: <HostHomePage />,
      },
      {
        path: "record",
        element: <Record />,
      },
      {
        path: "host/create",
        element: <HostCreateEvent />,
      },
      {
        path: "host/manage",
        element: <HostManageEvent />,
      },
    ],
  },
  {
    path: "404",
    element: <NotFoundPage />,
  },
  {
    path: "*",
    element: <Navigate to="/404" replace />,
  },
]);

const ReactDOMRun: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default ReactDOMRun;
