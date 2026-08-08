"use client";

import { useState } from "react";

import Header from "@/components/header";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <div className="grid h-svh grid-rows-[auto_1fr]">
      <Header />
      <main className="flex min-h-0 items-center justify-center overflow-auto bg-muted/30 px-4 py-10">
        <div className="w-full max-w-sm">
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
          )}
        </div>
      </main>
    </div>
  );
}
