import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardLayout } from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Medications from "./pages/Medications";
import Schedule from "./pages/Schedule";
import Reports from "./pages/Reports";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import CaregiverPage from "./pages/Caregiver";
import ScannerPage from "./pages/Scanner";
import MedicationDetailsPage from "./pages/MedicationDetailsPage";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "medications",
        element: <Medications />,
      },
      {
        path: "medications/:id",
        element: <MedicationDetailsPage />,
      },
      {
        path: "schedule",
        element: <Schedule />,
      },
      {
        path: "reports",
        element: <Reports />,
      },
      {
        path: "chat",
        element: <Chat />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "caregiver",
        element: <CaregiverPage />,
      },
      {
        path: "scan",
        element: <ScannerPage />,
      },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
