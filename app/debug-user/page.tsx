import { createClient } from "@/lib/supabase/server";

export default async function DebugUserPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .eq("created_by", user?.id || "");

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">Current User:</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Classes for this user:</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(classes, null, 2)}
        </pre>
      </div>
    </div>
  );
}
