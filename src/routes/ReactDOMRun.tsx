import React from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import ErrorPage from "@/pages/ErrorPage.tsx";
import { ProtectedRoute } from "./ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import NotFoundPage from "@/pages/NotFoundPage";
import WaitingPage from "@/pages/WaitingRoomPage";
import ViewerPage from "@/pages/ViewerPage";
import EventPage from "@/pages/EventPage";
import HostHomePage from "@/pages/host/HostHomePage.tsx";
import HostCreateEvent from "@/pages/host/HostCreateEvent";
import HostManageEvent from "@/pages/host/HostManageEvent";

interface ReactDOMRunProps {
}

const ReactDOMRun: React.FC<ReactDOMRunProps> = () => {
  return (
      <>
        <RouterProvider router={router} />
      </>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorPage />,
    children: [
      {
        index: true, // This will serve at the root path ("/")
        element: <LandingPage />, // Render LandingPage at the root
      },
      {
        path: "home",
        element: (
            <ProtectedRoute>
              <HostHomePage />
            </ProtectedRoute>
        ),
      },
      {
        path: "event/:roomId",
        element: (
              <EventPage />
        ),
      },
      {
        path: "waiting",
        element: (
              <WaitingPage />
        ),
      },
      {
        path: "viewer/:roomId",  
        element: <ViewerPage />
      },
      {
        path: "host",
        element: (
            <HostHomePage />
        ),
      },
      {
        path: "host/create",
        element: (
            <HostCreateEvent/>
        ),
      },
      {
        path: "host/manage",
        element: (
            <HostManageEvent/>
        ),
      },
    ],
  },
  {
    path: "404",
    element: <NotFoundPage />,
  },
  // catches all invalid routes
  {
    path: "*",
    element: <Navigate to="/404" replace />,
  },
]);

export default ReactDOMRun;
