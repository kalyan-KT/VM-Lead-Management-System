import { useSignIn } from "@clerk/clerk-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

type ViewState = "login" | "forgot" | "reset";

const Login = () => {
    const { isLoaded, signIn, setActive } = useSignIn();
    const [view, setView] = useState<ViewState>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [code, setCode] = useState("");
    const [error, setError] = useState("");

    // 1. Handle Login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;
        setError("");

        try {
            const result = await signIn.create({
                identifier: email,
                password: password,
            });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
            } else {
                console.log(result);
                // Handle incomplete sign-in (e.g. 2FA) if needed
                if (result.status === "needs_first_factor") {
                    setError("Username requires email verification. Please check your email settings.");
                } else {
                    setError("Login failed. Please check your credentials.");
                }
            }
        } catch (err: any) {
            console.error("error", err.errors[0].longMessage);
            setError(err.errors[0].longMessage);
        }
    };

    // 2. Request Password Reset Code
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;
        setError("");

        try {
            await signIn.create({
                strategy: "reset_password_email_code",
                identifier: email,
            });
            setView("reset");
            setError("");
        } catch (err: any) {
            console.error("error", err.errors[0].longMessage);
            setError(err.errors[0].longMessage);
        }
    };

    // 3. Verify Code and Set New Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;
        setError("");

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: "reset_password_email_code",
                code,
                password,
            });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
            } else {
                console.log(result);
            }
        } catch (err: any) {
            console.error("error", err.errors[0].longMessage);
            setError(err.errors[0].longMessage);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-12">
            <div className="flex w-full max-w-[440px] flex-col items-center rounded-2xl bg-white p-10 shadow-xl ring-1 ring-gray-200">

                {/* Header */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <img
                        src="/logo.png"
                        alt="VentureMond"
                        className="mb-6 h-12 w-auto object-contain"
                    />
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        {view === "login" && "Lead Management System"}
                        {view === "forgot" && "Reset Password"}
                        {view === "reset" && "Set New Password"}
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        {view === "login" && "Welcome back"}
                        {view === "forgot" && "Enter your email to receive a reset code"}
                        {view === "reset" && "Enter the code sent to your email"}
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="w-full mb-6 p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-100">
                        {error}
                    </div>
                )}

                {/* VIEW: LOGIN */}
                {view === "login" && (
                    <form onSubmit={handleLogin} className="w-full space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-700 font-normal text-base">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 px-4 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-600"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-gray-700 font-normal text-base">Password</Label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError("");
                                            setView("forgot");
                                        }}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 px-4 pr-10 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-600"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all">
                            Sign In
                        </Button>
                    </form>
                )}

                {/* VIEW: FORGOT PASSWORD */}
                {view === "forgot" && (
                    <form onSubmit={handleForgotPassword} className="w-full space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="reset-email" className="text-gray-700 font-normal text-base">Email Address</Label>
                            <Input
                                id="reset-email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 px-4 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-600"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button type="submit" className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all">
                                Send Reset Code
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setError("");
                                    setView("login");
                                }}
                                className="w-full text-gray-600"
                            >
                                Back to Sign In
                            </Button>
                        </div>
                    </form>
                )}

                {/* VIEW: RESET PASSWORD (CODE + NEW PASS) */}
                {view === "reset" && (
                    <form onSubmit={handleResetPassword} className="w-full space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-gray-700 font-normal text-base">Verification Code</Label>
                                <Input
                                    id="code"
                                    type="text"
                                    placeholder="Enter 6-digit code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="h-12 px-4 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-600"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password" className="text-gray-700 font-normal text-base">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 px-4 pr-10 bg-gray-50/50 border-gray-200 focus-visible:ring-blue-600"
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button type="submit" className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all">
                                Reset Password
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setError("");
                                    setView("login");
                                }}
                                className="w-full text-gray-600"
                            >
                                Back to Sign In
                            </Button>
                        </div>
                    </form>
                )}

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-gray-400">
                    &copy; 2026 VentureMond. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Login;
