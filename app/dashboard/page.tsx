"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface UserPreferences {
  categories: string[];
  frequency: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export default function DashboardPage() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/user-preferences")
      .then((response) => {
        if (response && response.ok) {
          return response.json();
        }
        throw new Error("Failed to fetch preferences");
      })
      .then((data) => {
        if (data) {
          setPreferences(data);
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  const handleToggleActive = async (newStatus: boolean) => {
    try {
      const response = await fetch("/api/user-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (response.ok) {
        setPreferences((prev) =>
          prev ? { ...prev, is_active: newStatus } : null
        );
      } else {
        console.error("Failed to update is_active status");
      }
    } catch (error) {
      console.error("Error updating is_active status:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#1f618d] p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2ecc71] mx-auto mb-4"></div>
          <p className="text-lg text-[#95a5a6]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#1f618d] text-[#ecf0f1] font-['Inter',_sans-serif] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="flex items-center justify-center text-4xl font-bold mb-2">
            <Image
              src="/newspaper.svg"
              alt="Newsletter Icon"
              width={36}
              height={36}
              className="w-7 h-7 mr-3"
            />
            Your Newsletter Dashboard
          </h1>
          <p className="text-xl text-[#95a5a6]">
            Manage your personalized newsletter preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Preferences Card */}
          <div className="bg-[#212b36] bg-opacity-90 rounded-xl shadow-2xl p-6 border border-[#34495e]">
            <h2 className="text-2xl font-semibold border-b-2 border-[#34495e] pb-3 mb-4">
              Current Preferences
            </h2>

            {preferences ? (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-medium text-[#95a5a6] mb-2">
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {preferences.categories.map((category) => (
                      <span
                        key={category}
                        className="px-3 py-1 bg-[#2c3e50] text-[#ecf0f1] rounded-full text-sm font-medium"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#95a5a6] mb-1">
                    Frequency
                  </h3>
                  <p className="text-base text-[#bdc3c7] capitalize">
                    {preferences.frequency}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#95a5a6] mb-1">
                    Email
                  </h3>
                  <p className="text-base text-[#bdc3c7]">
                    {preferences.email}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[#95a5a6] mb-2">
                    Status
                  </h3>
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        preferences.is_active ? "bg-[#2ecc71]" : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-base text-[#bdc3c7]">
                      {preferences.is_active ? "Active" : "Paused"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[#95a5a6] mb-4">No preferences set yet</p>
                <Link
                  href="/select"
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#27ae60] hover:bg-[#2ecc71] transition-colors"
                >
                  Set Up Newsletter
                </Link>
              </div>
            )}
          </div>

          {/* Actions Card */}
          <div className="bg-[#212b36] bg-opacity-90 rounded-xl shadow-2xl p-6 border border-[#34495e]">
            <h2 className="text-2xl font-semibold border-b-2 border-[#34495e] pb-3 mb-4">
              Actions
            </h2>

            <div className="space-y-4">
              <button
                onClick={() => router.push("/select")}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#27ae60] hover:bg-[#2ecc71] transition-colors"
              >
                Update Preferences
              </button>

              {preferences && (
                <>
                  {preferences.is_active ? (
                    <button
                      onClick={() => handleToggleActive(false)}
                      className="w-full flex items-center justify-center px-4 py-3 border border-red-500 text-base font-medium rounded-md text-white bg-red-500 bg-opacity-40 hover:bg-opacity-60 transition-colors"
                    >
                      Pause Newsletter
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleActive(true)}
                      className="w-full flex items-center justify-center px-4 py-3 border border-[#2ecc71] text-base font-medium rounded-md text-white bg-[#27ae60] hover:bg-[#2ecc71] bg-opacity-40 hover:bg-opacity-60 transition-colors"
                    >
                      Resume Newsletter
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-[#2c3e50] bg-opacity-50 rounded-lg p-6 border border-[#34495e]">
          <h3 className="text-lg font-semibold text-[#ecf0f1] mb-3">
            How It Works
          </h3>
          <ul className="text-[#bdc3c7] space-y-2 list-disc list-inside">
            <li>
              Your newsletter is automatically generated based on your selected
              categories.
            </li>
            <li>
              Newsletters are delivered to your email at 9 AM according to your
              chosen frequency.
            </li>
            <li>
              You can pause or resume your newsletter subscription at any time.
            </li>
            <li>
              Update your preferences to change your topics or delivery
              frequency.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
