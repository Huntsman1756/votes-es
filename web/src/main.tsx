import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Overview from "./pages/Overview";
import Issuers from "./pages/Issuers";
import IssuerDetail from "./pages/IssuerDetail";
import MeetingDetail from "./pages/MeetingDetail";
import Reporters from "./pages/Reporters";
import ReporterDetail from "./pages/ReporterDetail";
import Compare from "./pages/Compare";
import Sources from "./pages/Sources";
import Methodology from "./pages/Methodology";
import "./styles.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Overview /> },
      { path: "issuers", element: <Issuers /> },
      { path: "issuers/:id", element: <IssuerDetail /> },
      { path: "meetings/:id", element: <MeetingDetail /> },
      { path: "reporters", element: <Reporters /> },
      { path: "reporters/:id", element: <ReporterDetail /> },
      { path: "compare", element: <Compare /> },
      { path: "sources", element: <Sources /> },
      { path: "methodology", element: <Methodology /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
