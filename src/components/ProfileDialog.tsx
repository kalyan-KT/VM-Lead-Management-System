import { useUser, useClerk } from "@clerk/clerk-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, User, Mail } from "lucide-react";

export function ProfileDialog() {
    const { user } = useUser();
    const { signOut } = useClerk();

    if (!user) return null;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-gray-200">
                        <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                        <AvatarFallback>{user.firstName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Account Profile</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-6 py-4">
                    {/* Avatar Section */}
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                        <AvatarFallback className="text-2xl">
                            {user.firstName?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>

                    {/* Details Section */}
                    <div className="w-full space-y-4">
                        <div className="space-y-1 text-center">
                            <h3 className="font-semibold text-xl text-gray-900">
                                {user.fullName}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Mail className="h-4 w-4" />
                                {user.primaryEmailAddress?.emailAddress}
                            </p>
                        </div>

                        <div className="border-t pt-4 mt-4 w-full">
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <span className="text-sm font-medium">Username</span>
                                    <span className="text-sm text-muted-foreground">{user.username || "Not set"}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <span className="text-sm font-medium">User ID</span>
                                    <span className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 12)}...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <Button
                        variant="destructive"
                        className="w-full gap-2"
                        onClick={() => signOut()}
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
