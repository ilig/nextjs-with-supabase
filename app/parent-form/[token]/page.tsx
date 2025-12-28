import { ParentFormClient } from "@/components/parent-form-client";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ParentFormPage({ params }: PageProps) {
  const { token } = await params;

  return <ParentFormClient token={token} />;
}
