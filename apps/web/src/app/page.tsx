"use client";

import { useState, useEffect } from "react";
import { PlaceholdersAndVanishInputDemo } from "@/components/landing/vanish-input";
import { ModeToggle } from "@/components/mode-toggle";
import RotatingText from "@/components/landing/rotating-text";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { useLoadingToast } from "@/hooks/use-loading-toast";
import { createDocument } from "@/app/actions/documents";
import { useRouter } from "next/navigation";
import {
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
} from "@clerk/nextjs";

export default function Home() {
  const router = useRouter();
  const [isOverlayActive, setIsOverlayActive] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");

  const loadingTexts = [
    "Thinking",
    "Thinking",
    "Searching papers",
    "Finding relevant content",
    "Almost there",
  ];

  useEffect(() => {
    if (isOverlayActive) {
      const interval = setInterval(() => {
        setCurrentTextIndex((prev) => (prev + 1) % loadingTexts.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isOverlayActive]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearchClick();
  };

  const handleSearchClick = async () => {
    if (!inputValue.trim()) return;

    setIsOverlayActive(true);
    try {
      const documentId = await createDocument(inputValue);
      router.push(`/editor/${documentId}`);
    } catch (error) {
      console.error("Error creating document:", error);
      setIsOverlayActive(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full p-8 flex justify-between">
        <p className="font-light text-xs">
          {new Date().toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })}
        </p>
        <SignedOut>
          <SignInButton>
            <Button variant="link">Sign in</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <SignOutButton>
            <Button variant="link">Sign out</Button>
          </SignOutButton>
        </SignedIn>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-12 relative">
        <div className="flex flex-col items-center gap-6">
          <RotatingText />
          <form
            onSubmit={onSubmit}
            className="flex flex-row items-center justify-center w-full max-w-xl gap-2 relative z-10"
          >
            <Input
              placeholder="What would you like to write about?"
              className="w-full max-w-xl"
              value={inputValue}
              onChange={handleChange}
            />
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 border-blue-900 border-b-4 text-white transition-all duration-300"
              size="icon"
            >
              <SearchIcon className="w-4 h-4 p-0 m-0" />
            </Button>
          </form>
        </div>
        <p className="absolute bottom-12 right-12 font-light text-blue-600">
          write your best work with the help of the best papers on the{" "}
          <span className="italic">internet</span>.
        </p>
        <div
          className={`fixed inset-0 border-b border-blue-600 bg-white z-50 transform transition-transform duration-500 ease-in-out ${
            isOverlayActive ? "translate-y-0" : "-translate-y-full"
          } flex items-center justify-center`}
        >
          <TextShimmer className="text-base font-light" duration={1.4}>
            {loadingTexts[currentTextIndex]}
          </TextShimmer>
        </div>
      </main>
    </div>
  );
}
