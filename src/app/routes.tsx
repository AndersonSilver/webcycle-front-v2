import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/curso/:id",
    element: <App />,
  },
  {
    path: "/checkout",
    element: <App />,
  },
  {
    path: "/meus-cursos",
    element: <App />,
  },
  {
    path: "/minhas-compras",
    element: <App />,
  },
  {
    path: "/auth/callback",
    element: <App />,
  },
  {
    path: "/curso/:id/assistir",
    element: <App />,
  },
  {
    path: "/podcast/:id/assistir",
    element: <App />,
  },
  {
    path: "/admin",
    element: <App />,
  },
  {
    path: "/newsletter/unsubscribe",
    element: <App />,
  },
  {
    path: "/purchase/success",
    element: <App />,
  },
  {
    path: "/purchase/failure",
    element: <App />,
  },
  {
    path: "/purchase/pending",
    element: <App />,
  },
  {
    path: "/landing",
    element: <App />,
  },
  {
    path: "/image-landing",
    element: <App />,
  },
  {
    path: "/produtos",
    element: <App />,
  },
  {
    path: "/produto/:id",
    element: <App />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
