"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="bg-red-100 p-4 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">
          Something went wrong!
        </h1>

        {/* Description */}
        <p className="text-gray-300 mb-2">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>

        {/* Error Details (Development) */}
        {process.env.NODE_ENV === "development" && error.message && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-6 text-left">
            <p className="text-xs text-red-300 font-mono break-words">
              {error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/">
              <Home className="w-4 h-4" />
              Go home
            </Link>
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-6">
          Error ID: {error.digest || "unknown"}
        </p>
      </div>
    </div>
  );
}
