"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const categories = [
  {
    id: "technology",
    name: "Technology",
    description: "Latest tech news and innovations",
  },
  {
    id: "business",
    name: "Business",
    description: "Business trends and market updates",
  },
  { id: "sports", name: "Sports", description: "Sports news and highlights" },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Movies, TV, and celebrity news",
  },
  {
    id: "science",
    name: "Science",
    description: "Scientific discoveries and research",
  },
  { id: "health", name: "Health", description: "Health and wellness updates" },
  {
    id: "politics",
    name: "Politics",
    description: "Political news and current events",
  },
  {
    id: "environment",
    name: "Environment",
    description: "Climate and environmental news",
  },
];

const frequencyOptions = [
  { id: "daily", name: "Daily", description: "Every day" },
  { id: "weekly", name: "Weekly", description: "Once a week" },
  { id: "biweekly", name: "Bi-weekly", description: "Twice a week" },
];

export default function SelectPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(
    "weekly"
  );
  const [isLoading, setIsLoading] = useState(false); // For submission state
  const { user } = useAuth();
  const router = useRouter();

  // Fetch existing preferences to pre-populate the form
  useEffect(() => {
    fetch("/api/user-preferences")
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        if (data) {
          setSelectedCategories(data.categories || []);
          setSelectedFrequency(data.frequency || "weekly");
        }
      })
      .catch((error) => {
        console.log("No existing preferences found, starting fresh.");
      });
  }, []);

  const handleFrequencyToggle = (frequencyId: string) => {
    setSelectedFrequency(frequencyId);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  async function handleSavePreferences(e: FormEvent) {
    e.preventDefault();
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category.");
      return;
    }

    if (!user) {
      toast.error("Please sign in to continue");
      router.push("/login");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: selectedCategories,
          frequency: selectedFrequency,
          email: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      toast.success("Preferences saved successfully!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#1f618d] text-[#ecf0f1] font-['Inter',_sans-serif] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">Customize Your Newsletter</h1>
          <p className="text-xl text-[#95a5a6]">
            Select your interests and delivery frequency to get started.
          </p>
        </div>

        <form
          onSubmit={handleSavePreferences}
          className="bg-[#212b36] bg-opacity-90 rounded-xl shadow-2xl p-8 border border-[#34495e]"
        >
          {/* Categories Section */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Choose Your Categories
            </h2>
            <p className="text-[#95a5a6] mb-6">
              Select the topics you&apos;d like to see in your personalized
              newsletter.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <label
                    key={category.id}
                    className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#2ecc71] bg-[#2c3e50]"
                        : "border-[#34495e] hover:border-[#4a627a]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => handleCategoryToggle(category.id)}
                    />
                    <div className="flex-shrink-0 flex items-center h-6">
                      <div
                        className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-[#2ecc71] bg-[#2ecc71]"
                            : "border-[#4a627a]"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">
                        {category.name}
                      </div>
                      <div className="text-sm text-[#95a5a6]">
                        {category.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Frequency Section */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Delivery Frequency
            </h2>
            <p className="text-[#95a5a6] mb-6">
              How often would you like to receive your newsletter?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {frequencyOptions.map((frequency) => {
                const isSelected = selectedFrequency === frequency.id;
                return (
                  <label
                    key={frequency.id}
                    className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#2ecc71] bg-[#2c3e50]"
                        : "border-[#34495e] hover:border-[#4a627a]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="frequency"
                      className="sr-only"
                      value={frequency.id}
                      checked={isSelected}
                      onChange={() => handleFrequencyToggle(frequency.id)}
                    />
                    <div className="flex-shrink-0 flex items-center h-6">
                      <div
                        className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-colors ${
                          isSelected ? "border-[#2ecc71]" : "border-[#4a627a]"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 bg-[#2ecc71] rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">
                        {frequency.name}
                      </div>
                      <div className="text-sm text-[#95a5a6]">
                        {frequency.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* --- START: RESTORED SUBMIT SECTION --- */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#34495e] pt-6 gap-4">
            <div className="text-sm text-[#95a5a6] capitalize">
              {selectedCategories.length} categor
              {selectedCategories.length !== 1 ? "ies" : "y"} selected •{" "}
              {selectedFrequency} delivery
            </div>
            <button
              type="submit"
              disabled={isLoading || selectedCategories.length === 0}
              className={`w-full sm:w-auto px-8 py-3 rounded-lg font-medium text-white transition-colors duration-300 flex items-center justify-center ${
                isLoading || selectedCategories.length === 0
                  ? "bg-[#4a627a] cursor-not-allowed"
                  : "bg-[#27ae60] hover:bg-[#2ecc71]"
              }`}
            >
              {isLoading ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
