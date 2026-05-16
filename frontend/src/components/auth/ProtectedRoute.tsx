import type { JSX } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  // Check if the token exists in the browser's storage
  const token = localStorage.getItem("token");
  // If there is no token, kick them back to the login screen
  if (!token) {
    return <Navigate to="/" replace />;
  }
  // If they have a token, let them enter the page
  return children;
}
