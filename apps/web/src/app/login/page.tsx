import AuthShell from "@/components/auth-shell";
import SignInForm from "@/components/sign-in-form";

export default function LoginPage() {
  return (
    <AuthShell>
      <SignInForm />
    </AuthShell>
  );
}
