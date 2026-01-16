import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: PageProps) {
  const { code } = await params;

  // Redirect to the parent form with the invite code
  redirect(`/parent-form/${code}`);
}
