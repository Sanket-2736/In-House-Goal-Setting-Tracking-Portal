import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">AQ</span>
            </div>
            <h1 className="text-2xl font-bold">AtomQuest Goals</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">
              Achieve Your Goals with{" "}
              <span className="text-primary">AtomQuest</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              A professional HR portal for managing employee goals, tracking progress, and fostering growth.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-2">Goal Tracking</h3>
              <p className="text-muted-foreground">
                Set, track, and achieve your professional goals with ease.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">Progress Analytics</h3>
              <p className="text-muted-foreground">
                Visualize your progress with detailed analytics and insights.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-lg font-semibold mb-2">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Collaborate with managers and team members seamlessly.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 AtomQuest Goals. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
