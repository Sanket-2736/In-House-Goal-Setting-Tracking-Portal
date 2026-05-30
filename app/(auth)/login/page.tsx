"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/utils/validation";
import { Loader2, Mail, Lock, User, Briefcase, Building2, AlertCircle, Users, CheckCircle2, Copy } from "lucide-react";
import { logger } from "@/lib/utils/logger";

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "register" | "demo">("demo");

  // Sign In Form
  const signInForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register Form
  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      employeeId: "",
      department: "",
    },
  });

  // Demo credentials
  const demoAccounts = [
    {
      role: "Admin",
      email: "admin@atomquest.com",
      password: "Admin@123",
      description: "Full system access, manage users and cycles",
      icon: Building2,
    },
    {
      role: "Manager",
      email: "manager1@atomquest.com",
      password: "Manager@123",
      description: "Approve goals, review team check-ins",
      icon: Users,
    },
    {
      role: "Employee",
      email: "emp1@atomquest.com",
      password: "Employee@123",
      description: "Create and submit goals, track progress",
      icon: CheckCircle2,
    },
  ];

  // Get redirect path based on role
  const getRedirectPath = (role: string) => {
    switch (role) {
      case "admin":
        return "/admin";
      case "manager":
        return "/manager";
      case "employee":
      default:
        return "/employee";
    }
  };

  // Handle Demo Login
  const handleDemoLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      logger.info("Starting demo sign in", { email });
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        const errorMsg = result.error || "Sign in failed";
        toast.error(errorMsg);
        logger.error("Demo sign in failed", { error: errorMsg });
      } else if (result?.ok) {
        toast.success("Signed in successfully!");
        logger.success("Demo sign in successful", { email });
        
        // Fetch user session to get role
        const response = await fetch("/api/auth/session");
        const session = await response.json();
        const redirectPath = getRedirectPath(session?.user?.role || "employee");
        router.push(redirectPath);
      }
    } catch (error) {
      const errorMsg = "An error occurred. Please try again.";
      toast.error(errorMsg);
      logger.error("Demo sign in error", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Handle Sign In
  const onSignIn = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      logger.info("Starting sign in", { email: data.email });
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        const errorMsg = result.error || "Sign in failed";
        toast.error(errorMsg);
        logger.error("Sign in failed", { error: errorMsg });
      } else if (result?.ok) {
        toast.success("Signed in successfully!");
        logger.success("Sign in successful", { email: data.email });
        
        // Fetch user session to get role
        const response = await fetch("/api/auth/session");
        const session = await response.json();
        const redirectPath = getRedirectPath(session?.user?.role || "employee");
        router.push(redirectPath);
      }
    } catch (error) {
      const errorMsg = "An error occurred. Please try again.";
      toast.error(errorMsg);
      logger.error("Sign in error", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      logger.info("Starting Google sign in");
      await signIn("google", { redirect: false });
      toast.success("Signed in with Google!");
      logger.success("Google sign in successful");
      
      // Fetch user session to get role
      const response = await fetch("/api/auth/session");
      const session = await response.json();
      const redirectPath = getRedirectPath(session?.user?.role || "employee");
      router.push(redirectPath);
    } catch (error) {
      toast.error("Google sign in failed");
      logger.error("Google sign in error", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register
  const onRegister = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      logger.info("Starting registration", { email: data.email, name: data.name });
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          employeeId: data.employeeId,
          department: data.department,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Registration failed");
        logger.error("Registration failed", error);
        return;
      }

      toast.success("Account created! Signing you in...");
      logger.success("Registration successful", { email: data.email });

      // Auto sign in after registration
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        // Fetch user session to get role
        const sessionResponse = await fetch("/api/auth/session");
        const session = await sessionResponse.json();
        const redirectPath = getRedirectPath(session?.user?.role || "employee");
        router.push(redirectPath);
      }

      setActiveTab("signin");
      signInForm.setValue("email", data.email);
    } catch (error) {
      const errorMsg = "An error occurred. Please try again.";
      toast.error(errorMsg);
      logger.error("Registration error", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Gradient Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/80 to-accent flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/30 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/30 rounded-full blur-3xl -ml-48 -mb-48 animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }}></div>

        {/* Content */}
        <div className="relative z-10 text-center space-y-8">
          <div className="space-y-4 animate-fade-in">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm hover:bg-white/30 transition-all duration-300 shadow-lg">
              <span className="text-4xl font-bold text-white">AQ</span>
            </div>
            <h1 className="text-5xl font-bold text-white drop-shadow-lg">AtomQuest Goals</h1>
          </div>

          <div className="space-y-6 max-w-md">
            <p className="text-xl text-white/90 font-semibold drop-shadow">Align. Track. Achieve.</p>

            <div className="space-y-4">
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300 shadow-md">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🎯</span>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white group-hover:text-white/95 transition-colors">Set Clear Goals</h3>
                  <p className="text-white/80 text-sm group-hover:text-white/90 transition-colors">Define objectives aligned with organizational strategy</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300 shadow-md">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">📊</span>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white group-hover:text-white/95 transition-colors">Track Progress</h3>
                  <p className="text-white/80 text-sm group-hover:text-white/90 transition-colors">Monitor quarterly achievements and stay on track</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300 shadow-md">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🚀</span>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white group-hover:text-white/95 transition-colors">Achieve Success</h3>
                  <p className="text-white/80 text-sm group-hover:text-white/90 transition-colors">Reach your goals with collaborative support</p>
                </div>
              </div>
            </div>

            {/* Three Dashboards Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 shadow-lg">
              <p className="text-sm font-semibold text-white mb-3">3 Different Dashboards:</p>
              <div className="space-y-2 text-xs text-white/90">
                <div className="flex items-center gap-2 hover:text-white transition-colors">
                  <Building2 className="w-4 h-4" />
                  <span><strong>Admin:</strong> Manage system & users</span>
                </div>
                <div className="flex items-center gap-2 hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                  <span><strong>Manager:</strong> Approve goals & reviews</span>
                </div>
                <div className="flex items-center gap-2 hover:text-white transition-colors">
                  <CheckCircle2 className="w-4 h-4" />
                  <span><strong>Employee:</strong> Create & track goals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 lg:hidden mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">AQ</span>
              </div>
              <h1 className="text-2xl font-bold">AtomQuest</h1>
            </div>
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>Choose how you want to access the system</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "register" | "demo")} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="demo">Demo</TabsTrigger>
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Demo Tab */}
              <TabsContent value="demo" className="space-y-4 mt-6">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Try Demo Accounts</p>
                      <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                        Click any account below to instantly access that dashboard
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {demoAccounts.map((account) => {
                    const Icon = account.icon;
                    return (
                      <div
                        key={account.email}
                        className="border border-border rounded-lg p-4 hover:shadow-lg hover:border-primary/50 hover:bg-accent/30 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{account.role}</p>
                              <p className="text-xs text-muted-foreground">{account.description}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3 bg-muted/50 rounded p-2">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm font-mono">{account.email}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(account.email)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Password</p>
                              <p className="text-sm font-mono">{account.password}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(account.password)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <Button
                          className="w-full"
                          disabled={isLoading}
                          onClick={() => handleDemoLogin(account.email, account.password)}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Signing in...
                            </>
                          ) : (
                            `Sign in as ${account.role}`
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Sign In Tab */}
              <TabsContent value="signin" className="space-y-4 mt-6">
                <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      disabled={isLoading}
                      {...signInForm.register("email")}
                    />
                    {signInForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...signInForm.register("password")}
                    />
                    {signInForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                  onClick={handleGoogleSignIn}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className="text-primary hover:underline font-semibold"
                  >
                    Register here
                  </button>
                </p>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4 mt-6">
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Doe"
                      disabled={isLoading}
                      {...registerForm.register("name")}
                    />
                    {registerForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{registerForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="you@example.com"
                      disabled={isLoading}
                      {...registerForm.register("email")}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-employeeId" className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Employee ID
                      </Label>
                      <Input
                        id="register-employeeId"
                        type="text"
                        placeholder="EMP001"
                        disabled={isLoading}
                        {...registerForm.register("employeeId")}
                      />
                      {registerForm.formState.errors.employeeId && (
                        <p className="text-sm text-destructive">{registerForm.formState.errors.employeeId.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-department" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Department
                      </Label>
                      <Input
                        id="register-department"
                        type="text"
                        placeholder="Engineering"
                        disabled={isLoading}
                        {...registerForm.register("department")}
                      />
                      {registerForm.formState.errors.department && (
                        <p className="text-sm text-destructive">{registerForm.formState.errors.department.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...registerForm.register("password")}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirmPassword" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Confirm Password
                    </Label>
                    <Input
                      id="register-confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...registerForm.register("confirmPassword")}
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signin")}
                    className="text-primary hover:underline font-semibold"
                  >
                    Sign in here
                  </button>
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
