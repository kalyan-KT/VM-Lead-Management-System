import { SignIn } from "@clerk/clerk-react";

const Login = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-4">
                <SignIn
                    appearance={{
                        elements: {
                            footerAction: "hidden", // Hides the "Sign up" link
                            card: "shadow-xl border-none"
                        }
                    }}
                    signUpUrl="/" // Redirects to home if they manage to find a way to signup, effectively disabling the specialized route
                />
            </div>
        </div>
    );
};

export default Login;
