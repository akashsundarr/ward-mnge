import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Citizen from "./pages/Citizen";
import Ward from "./pages/Ward";
import Eligibility from "./pages/Eligibility";
import Landing from "./pages/Landing";
import CitizenApplications from "./pages/CitizenApplications";

const ProtectedRoute = ({ children, role }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (role && !profile) return <div className="p-6">Loading profile...</div>;

  if (role && profile.role !== role) return <Navigate to="/login" />;

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Citizen */}
        <Route
          path="/citizen"
          element={
            <ProtectedRoute role="CITIZEN">
              <Citizen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/citizen/eligibility"
          element={
            <ProtectedRoute role="CITIZEN">
              <Eligibility />
            </ProtectedRoute>
          }
        />

        {/* Ward */}
        <Route
          path="/ward"
          element={
            <ProtectedRoute role="WARD_MEMBER">
              <Ward />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />

        <Route
          path="/citizen/applications"
          element={
            <ProtectedRoute role="CITIZEN">
              <CitizenApplications />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
