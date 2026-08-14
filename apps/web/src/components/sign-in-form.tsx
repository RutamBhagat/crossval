"use client";

import { Field, FieldGroup } from "@crossval/ui/components/field";

import { authClient } from "@/lib/auth-client";

import GoogleSignInButton from "./google-sign-in-button";
import Loader from "./loader";

export default function SignInForm() {
  const { isPending } = authClient.useSession();

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Sign in to CrossVal</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Continue with Google to open your planning workspace.
          </p>
        </div>

        <Field>
          <GoogleSignInButton />
        </Field>
      </FieldGroup>
    </div>
  );
}
