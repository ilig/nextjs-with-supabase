import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PublicCalendarView } from "./public-calendar-view";

type PageProps = {
  params: Promise<{ code: string }>;
};

export default async function PublicCalendarPage({ params }: PageProps) {
  const { code } = await params;
  const supabase = await createClient();

  // Find the class by invite code
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id, name, school_name, city")
    .eq("invite_code", code)
    .single();

  if (classError || !classData) {
    notFound();
  }

  // Fetch events for this class
  const { data: events } = await supabase
    .from("events")
    .select(`
      id,
      name,
      event_type,
      event_date,
      allocated_for_kids,
      allocated_for_staff,
      amount_per_kid,
      amount_per_staff,
      is_paid
    `)
    .eq("class_id", classData.id)
    .order("event_date", { ascending: true });

  // Fetch children for birthdays (only name and birthday, no sensitive info)
  const { data: children } = await supabase
    .from("children")
    .select("id, name, birthday")
    .eq("class_id", classData.id);

  // Fetch staff for birthdays
  const { data: staff } = await supabase
    .from("staff")
    .select("id, name, birthday")
    .eq("class_id", classData.id);

  // Transform events to include allocated_budget
  const transformedEvents = (events || []).map((e) => ({
    id: e.id,
    name: e.name,
    event_type: e.event_type,
    event_date: e.event_date,
    allocated_budget:
      (e.allocated_for_kids || 0) + (e.allocated_for_staff || 0),
    amount_per_kid: e.amount_per_kid,
    amount_per_staff: e.amount_per_staff,
    is_paid: e.is_paid,
  }));

  return (
    <PublicCalendarView
      classData={classData}
      events={transformedEvents}
      children={children || []}
      staff={staff || []}
    />
  );
}
