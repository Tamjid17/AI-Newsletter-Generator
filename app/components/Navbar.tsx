"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link"; // Import Link for navigation

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  // The navbar is part of the layout for authenticated users,
  // so we can assume the user exists if the component is rendered.
  if (!user) {
    return null; // Or render a version for logged-out users if needed
  }

  return (
    <header className="bg-[#212b36] bg-opacity-80 backdrop-blur-sm border-b border-[#34495e] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-xl">📰</span>
              <h1 className="text-xl font-semibold text-[#ecf0f1] hover:text-white transition-colors">
                Personalized AI Newsletter
              </h1>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-[#95a5a6] hidden sm:block">
              Welcome, {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-red-500 text-sm font-medium rounded-md text-white bg-red-500 bg-opacity-40 hover:bg-opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#212b36] focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
