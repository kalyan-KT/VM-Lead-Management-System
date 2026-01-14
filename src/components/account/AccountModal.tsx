import { useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    User,
    Shield,
    LogOut,
    Mail,
    Smartphone,
    Laptop,
    CheckCircle2,
    Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

type ActiveTab = "profile" | "security";

export function AccountModal() {
    const { user } = useUser();
    const { signOut, session } = useClerk();
    const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
    const [isOpen, setIsOpen] = useState(false);

    if (!user) return null;

    // Simple device detection based on user agent (rough approximation for display)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const deviceName = isMobile ? "Mobile Device" : "Desktop Computer";

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-transparent">
                    <Avatar className="h-10 w-10 border border-gray-200 shadow-sm transition-transform hover:scale-105">
                        <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                            {user.firstName?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-[800px] p-0 gap-0 overflow-hidden rounded-xl border-none shadow-2xl bg-white sm:h-[500px] flex flex-col sm:flex-row">

                {/* Left Sidebar */}
                <div className="w-full sm:w-[240px] bg-gray-50/50 border-r border-gray-100 p-6 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.imageUrl} />
                                <AvatarFallback>{user.firstName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
                                <p className="text-xs text-gray-500 truncate">{user.primaryEmailAddress?.emailAddress}</p>
                            </div>
                        </div>

                        <nav className="space-y-1">
                            <button
                                onClick={() => setActiveTab("profile")}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                    activeTab === "profile"
                                        ? "bg-white text-emerald-600 shadow-sm ring-1 ring-gray-200"
                                        : "text-gray-600 hover:bg-gray-100/50 hover:text-gray-900"
                                )}
                            >
                                <User className="h-4 w-4" />
                                Profile
                            </button>
                            <button
                                onClick={() => setActiveTab("security")}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                    activeTab === "security"
                                        ? "bg-white text-emerald-600 shadow-sm ring-1 ring-gray-200"
                                        : "text-gray-600 hover:bg-gray-100/50 hover:text-gray-900"
                                )}
                            >
                                <Shield className="h-4 w-4" />
                                Security
                            </button>
                        </nav>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => signOut()}
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 p-8 overflow-y-auto bg-white">

                    {/* PROFILE TAB */}
                    {activeTab === "profile" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                                <p className="text-sm text-gray-500 mt-1">View your account details</p>
                            </div>

                            <div className="flex items-start gap-6 pb-8 border-b border-gray-100">
                                <Avatar className="h-20 w-20 ring-4 ring-gray-50">
                                    <AvatarImage src={user.imageUrl} />
                                    <AvatarFallback className="text-2xl">{user.firstName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1 mt-2">
                                    <h3 className="font-medium text-lg text-gray-900">{user.fullName}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium ring-1 ring-inset ring-emerald-600/20">
                                            Active Account
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6">
                                <div className="grid gap-1">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                                    <div className="flex items-center gap-2 text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        {user.primaryEmailAddress?.emailAddress}
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                                    </div>
                                </div>

                                <div className="grid gap-1">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</label>
                                    <div className="font-mono text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 select-all">
                                        {user.id}
                                    </div>
                                </div>

                                <div className="grid gap-1">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Member Since</label>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        {new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === "security" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Security</h2>
                                <p className="text-sm text-gray-500 mt-1">Manage your security preferences</p>
                            </div>

                            <div className="grid gap-6">
                                <div className="bg-white rounded-xl border border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                                                <Shield className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Password</p>
                                                <p className="text-sm text-gray-500">Your password is set and secure</p>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-gray-900">Active Session</h3>
                                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                                                {isMobile ? (
                                                    <Smartphone className="h-5 w-5 text-blue-600" />
                                                ) : (
                                                    <Laptop className="h-5 w-5 text-blue-600" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900">{deviceName}</p>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
                                                        Current Device
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Logged in via {session?.expireAt ? "Secure Session" : "Web"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    );
}
