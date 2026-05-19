import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Display */}
        <div className="mb-6">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            404
          </h1>
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="bg-orange-100 p-4 rounded-full">
            <Search className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-2">
          Page not found
        </h2>

        {/* Description */}
        <p className="text-gray-300 mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700" asChild>
            <Link href="/">
              <Home className="w-4 h-4" />
              Go home
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            Go back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-4">Quick links:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/employee">
                Employee Dashboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/manager">
                Manager Dashboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/admin">
                Admin Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
