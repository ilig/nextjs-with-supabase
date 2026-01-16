import { PublicDirectoryClient } from "@/components/v2/public-directory-client";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function PublicDirectoryPage({ params }: PageProps) {
  const { code } = await params;

  return <PublicDirectoryClient code={code} />;
}
