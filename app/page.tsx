"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Target, TrendingUp, Users, Zap, Shield, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b border-border backdrop-blur-sm bg-background/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 animate-fade-in">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center animate-pulse-slow">
              <span className="text-primary-foreground font-bold">AQ</span>
            </div>
            <h1 className="text-2xl font-bold">AtomQuest Goals</h1>
          </div>
          <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4 animate-fade-in-up">
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
                Transform Your Team's{" "}
                <span className="text-primary animate-gradient-text">Performance</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                A powerful OKR management platform that helps organizations set, track, and achieve goals with AI-powered insights and seamless collaboration.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <Link href="/login">
                <Button size="lg" className="gap-2 text-lg px-8 hover:scale-105 transition-transform">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 hover:scale-105 transition-transform">
                  Sign In
                </Button>
              </Link>
            </div>

            <div className="flex justify-center gap-8 pt-8 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">95%</div>
                <div className="text-sm text-muted-foreground">Goal Completion</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Organizations</div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 bg-muted/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Succeed</h3>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Comprehensive tools designed for modern goal management and team performance optimization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  title: "Smart Goal Setting",
                  description: "Create SMART goals with AI-powered quality analysis and suggestions for improvement.",
                  delay: "0.1s"
                },
                {
                  icon: TrendingUp,
                  title: "Progress Tracking",
                  description: "Real-time progress visualization with quarterly check-ins and automated scoring.",
                  delay: "0.2s"
                },
                {
                  icon: Users,
                  title: "Team Collaboration",
                  description: "Shared goals, manager approvals, and seamless communication across teams.",
                  delay: "0.3s"
                },
                {
                  icon: Zap,
                  title: "AI-Powered Insights",
                  description: "Cerebras AI generates constructive feedback and goal quality assessments.",
                  delay: "0.4s"
                },
                {
                  icon: Shield,
                  title: "Automated Escalations",
                  description: "Configurable escalation rules ensure deadlines are never missed.",
                  delay: "0.5s"
                },
                {
                  icon: BarChart3,
                  title: "Advanced Analytics",
                  description: "Comprehensive reports and dashboards for data-driven decisions.",
                  delay: "0.6s"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                  style={{ animationDelay: feature.delay }}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-3xl md:text-4xl font-bold">How It Works</h3>
                <p className="text-muted-foreground text-lg">
                  Streamlined workflow from goal creation to achievement tracking.
                </p>
                <div className="space-y-4">
                  {[
                    "Create goal cycles with quarterly timelines",
                    "Employees set SMART goals with weightage allocation",
                    "Managers review and approve goal sheets",
                    "Quarterly check-ins with progress updates",
                    "AI-generated insights and feedback",
                    "Comprehensive reporting and analytics"
                  ].map((step, index) => (
                    <div key={index} className="flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur-3xl animate-pulse-slow"></div>
                <div className="relative bg-card rounded-2xl border border-border p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Goal Completion</span>
                      <span className="text-sm text-primary font-bold">87%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-progress" style={{ width: "87%" }}></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Team Alignment</span>
                      <span className="text-sm text-primary font-bold">92%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-progress" style={{ width: "92%" }}></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Check-in Rate</span>
                      <span className="text-sm text-primary font-bold">95%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-progress" style={{ width: "95%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <h3 className="text-3xl md:text-4xl font-bold">Ready to Transform Your Goal Management?</h3>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of organizations already using AtomQuest to drive performance and achieve their objectives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" variant="secondary" className="gap-2 text-lg px-8 hover:scale-105 transition-transform">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 hover:scale-105 transition-transform bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  Book a Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">AQ</span>
                </div>
                <span className="font-bold">AtomQuest Goals</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional HR management and goal tracking system for modern organizations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 AtomQuest Goals. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
