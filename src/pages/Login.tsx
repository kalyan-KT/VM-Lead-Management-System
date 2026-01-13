import { SignIn } from "@clerk/clerk-react";

/**
 * Login Page - Full Width Fix
 * 
 * Changes:
 * 1. Force Clerk internal containers to have 100% width and NO max-width to fix the "indentation" issue.
 * 2. Ensure inputs stretch edge-to-edge within the card padding.
 */
const Login = () => {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-12">

            {/* CSS Overrides for Full Width Alignment */}
            <style>{`
                /* Hide "Last Used" badge */
                .cl-formFieldRow span { 
                    display: none !important; 
                }
                
                /* Ensure NO inner card background/shadow */
                .cl-card, .cl-rootBox {
                    background: transparent !important;
                    box-shadow: none !important;
                    border: none !important;
                }

                /* FORCE FULL WIDTH on all internal containers */
                .cl-main, .cl-signIn-start, .cl-form, .cl-formFieldRow {
                    width: 100% !important;
                    max-width: none !important; /* Remove any 25rem limits */
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: stretch !important; /* Ensure children stretch */
                }

                /* Ensure Input fills the row */
                .cl-formFieldInput {
                    width: 100% !important;
                    max-width: 100% !important;
                    box-sizing: border-box !important; 
                }
            `}</style>

            {/* Main Login Card - Reduced padding slightly to give more room if needed, but keeping p-10 for now as requested design */}
            <div className="flex w-full max-w-[440px] flex-col items-center rounded-2xl bg-white p-10 shadow-xl ring-1 ring-gray-200">

                {/* 1. Header Section (Logo + Title) */}
                <div className="mb-8 flex flex-col items-center text-center">
                    {/* Logo */}
                    <img
                        src="/logo.png"
                        alt="VentureMond"
                        className="mb-6 h-12 w-auto object-contain"
                    />

                    {/* Title */}
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Login to Lead Management System
                    </h1>

                    {/* Subtitle */}
                    <p className="mt-2 text-sm text-gray-500">
                        Welcome back
                    </p>
                </div>

                {/* 2. Clerk Form Section */}
                <div className="w-full">
                    <SignIn
                        appearance={{
                            variables: {
                                colorPrimary: "#059669",
                                colorBackground: "transparent",
                                borderRadius: "0.5rem",
                                fontSize: "0.875rem",
                                spacingUnit: "1rem",
                            },
                            layout: {
                                socialButtonsPlacement: "bottom",
                                socialButtonsVariant: "iconButton",
                                headerPlacement: "inside",
                            },
                            elements: {
                                rootBox: "w-full",
                                card: "shadow-none border-none w-full p-0 bg-transparent",
                                main: "w-full gap-4",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                header: "hidden",

                                // Ensure row is full width
                                formFieldRow: "w-full min-w-full",

                                // Label: Centered
                                formFieldLabel: "w-full text-center block text-gray-700 font-medium mb-1 mx-auto",

                                // Input: Full width
                                formFieldInput: "w-full min-w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-all bg-white box-border",

                                // Button: Full width
                                formButtonPrimary: "w-full min-w-full py-2.5 font-semibold shadow-sm hover:!bg-emerald-700 active:scale-[0.99] transition-transform",

                                footer: "hidden",
                                footerAction: "hidden"
                            }
                        }}
                        signUpUrl="/"
                    />
                </div>

                {/* 3. Footer Section */}
                <div className="mt-8 text-center text-xs text-gray-400">
                    &copy; 2026 VentureMond. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Login;
