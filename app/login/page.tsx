"use client";

import { createClient } from "@/lib/client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

export default function LogInPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleAuth(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading(
      isSignUp ? "Creating account..." : "Signing in..."
    );

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Optional: Redirect to your dashboard after email confirmation
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

        toast.success("Check your email for the confirmation link.", {
          id: toastId,
          duration: 6000,
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success("Signed in successfully!", { id: toastId });
        router.push("/dashboard");
      }
    } // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (error: any) {
      toast.error(
        error.error_description || error.message || "An error occurred.",
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] to-[#1f618d] text-[#ecf0f1] font-['Inter',_sans-serif] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">
            📰 Personalized AI Newsletter
          </h1>
          <p className="text-xl text-[#95a5a6]">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        <div className="bg-[#212b36] bg-opacity-90 rounded-xl shadow-2xl p-8 border border-[#34495e]">
          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#95a5a6]"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 bg-[#2c3e50] border border-[#4a627a] rounded-md shadow-sm placeholder-[#7a8a99] text-white focus:outline-none focus:ring-2 focus:ring-[#2ecc71] focus:border-[#2ecc71] transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#95a5a6]"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 bg-[#2c3e50] border border-[#4a627a] rounded-md shadow-sm placeholder-[#7a8a99] text-white focus:outline-none focus:ring-2 focus:ring-[#2ecc71] focus:border-[#2ecc71] transition"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-[#27ae60] hover:bg-[#2ecc71] cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#212b36] focus:ring-[#2ecc71] transition-colors disabled:bg-[#4a627a] disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "Processing..."
                  : isSignUp
                  ? "Create Account"
                  : "Sign In"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp((prev) => !prev)}
              className="text-[#aab8c2] hover:text-[#2ecc71] text-sm font-medium transition-colors cursor-pointer"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
