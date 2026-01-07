import { SignUpForm } from "@/components/sign-up-form";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <SignUpForm />
        </div>
      </div>
      <Footer />
    </div>
  );
}
