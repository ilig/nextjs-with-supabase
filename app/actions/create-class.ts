"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type ClassDetails = {
  className: string;
  schoolName: string;
  city: string;
  year: string;
};

type Child = {
  id: string;
  name: string;
  parent1Name: string;
  parent1Phone: string;
  parent2Name?: string;
  parent2Phone?: string;
  address?: string;
};

type Staff = {
  name: string;
  role: "teacher" | "assistant";
  birthday?: string;
};

type BudgetAllocation = {
  eventId: string;
  eventName: string;
  amount: number;
};

type OnboardingData = {
  classDetails: ClassDetails;
  children: Child[];
  staff: Staff[];
  selectedEvents: string[];
  budgetType: "per-child" | "total";
  budgetAmount: number;
  budgetAllocations: BudgetAllocation[];
};

export async function createClass(data: OnboardingData) {
  const supabase = await createClient();

  // Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    // Calculate total budget
    const totalBudget =
      data.budgetType === "per-child"
        ? data.budgetAmount * data.children.length
        : data.budgetAmount;

    // 1. Create the class
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .insert({
        name: data.classDetails.className,
        school_name: data.classDetails.schoolName,
        city: data.classDetails.city,
        year: data.classDetails.year,
        created_by: user.id,
        total_budget: totalBudget,
        budget_type: data.budgetType,
        budget_amount: data.budgetAmount,
      })
      .select()
      .single();

    if (classError) {
      console.error("Error creating class:", classError);
      throw new Error(`Failed to create class: ${classError.message}`);
    }

    const classId = classData.id;
    const inviteCode = classData.invite_code;

    // 2. Create children
    if (data.children.length > 0) {
      const childrenToInsert = data.children.map((child) => ({
        class_id: classId,
        name: child.name,
        address: child.address || null,
      }));

      const { data: insertedChildren, error: childrenError } = await supabase
        .from("children")
        .insert(childrenToInsert)
        .select();

      if (childrenError) {
        console.error("Error creating children:", childrenError);
        throw new Error(`Failed to create children: ${childrenError.message}`);
      }

      // 3. Create parents and link them to children
      for (let i = 0; i < data.children.length; i++) {
        const child = data.children[i];
        const insertedChild = insertedChildren[i];

        // Create parent 1
        if (child.parent1Name && child.parent1Phone) {
          const { data: parent1, error: parent1Error } = await supabase
            .from("parents")
            .insert({
              user_id: user.id,
              name: child.parent1Name,
              phone: child.parent1Phone,
            })
            .select()
            .single();

          if (parent1Error) {
            console.error("Error creating parent 1:", parent1Error);
            // Continue anyway, don't fail the whole operation
          } else {
            // Link parent to child
            await supabase.from("child_parents").insert({
              child_id: insertedChild.id,
              parent_id: parent1.id,
              relationship: "parent1",
            });
          }
        }

        // Create parent 2 if provided
        if (child.parent2Name && child.parent2Phone) {
          const { data: parent2, error: parent2Error } = await supabase
            .from("parents")
            .insert({
              user_id: user.id,
              name: child.parent2Name,
              phone: child.parent2Phone,
            })
            .select()
            .single();

          if (parent2Error) {
            console.error("Error creating parent 2:", parent2Error);
            // Continue anyway
          } else {
            // Link parent to child
            await supabase.from("child_parents").insert({
              child_id: insertedChild.id,
              parent_id: parent2.id,
              relationship: "parent2",
            });
          }
        }
      }
    }

    // 4. Create staff members
    if (data.staff.length > 0) {
      // Helper function to convert DD/MM to YYYY-MM-DD
      const parseBirthdayInput = (input?: string) => {
        if (!input || !input.includes('/')) return null;
        const [day, month] = input.split('/');
        if (!day || !month) return null;
        const currentYear = new Date().getFullYear();
        return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };

      const staffToInsert = data.staff
        .filter((member) => member.name.trim() !== "")
        .map((member) => ({
          class_id: classId,
          name: member.name,
          role: member.role,
          birthday: parseBirthdayInput(member.birthday),
        }));

      if (staffToInsert.length > 0) {
        const { error: staffError } = await supabase
          .from("staff")
          .insert(staffToInsert);

        if (staffError) {
          console.error("Error creating staff:", staffError);
          throw new Error(`Failed to create staff: ${staffError.message}`);
        }
      }
    }

    // 5. Create events
    if (data.budgetAllocations.length > 0) {
      const eventsToInsert = data.budgetAllocations.map((allocation) => ({
        class_id: classId,
        name: allocation.eventName,
        event_type: allocation.eventId,
        icon: getEventIcon(allocation.eventId),
        allocated_budget: allocation.amount,
        spent_amount: 0,
        event_date: getEventDate(allocation.eventId),
      }));

      const { error: eventsError } = await supabase
        .from("events")
        .insert(eventsToInsert);

      if (eventsError) {
        console.error("Error creating events:", eventsError);
        throw new Error(`Failed to create events: ${eventsError.message}`);
      }
    }

    // 6. Add the creator as a class member (admin)
    await supabase.from("class_members").insert({
      class_id: classId,
      user_id: user.id,
      role: "admin",
    });

    // Return success with invite code
    return {
      success: true,
      classId,
      inviteCode,
    };
  } catch (error: any) {
    console.error("Error in createClass:", error);
    return {
      success: false,
      error: error.message || "An unknown error occurred",
    };
  }
}

// Helper function to get event icons
function getEventIcon(eventId: string): string {
  const iconMap: Record<string, string> = {
    "birthdays-kids": "🎂",
    "birthdays-staff": "🎉",
    "rosh-hashana": "🍎",
    "hanukkah": "🕎",
    "tu-bishvat": "🌳",
    "purim": "🎭",
    "pesach": "🍷",
    "independence-day": "🇮🇱",
    "end-year-gifts-kids": "🎁",
    "end-year-gifts-staff": "💐",
    "trips": "🚌",
    "shows": "🎪",
    "other": "➕",
  };

  return iconMap[eventId] || "✨";
}

// Helper function to estimate event dates (you can customize this)
function getEventDate(eventId: string): string | null {
  const currentYear = new Date().getFullYear();
  const dateMap: Record<string, string> = {
    "rosh-hashana": `${currentYear}-09-15`,
    "hanukkah": `${currentYear}-12-07`,
    "tu-bishvat": `${currentYear + 1}-02-05`,
    "purim": `${currentYear + 1}-03-15`,
    "pesach": `${currentYear + 1}-04-10`,
    "independence-day": `${currentYear + 1}-05-14`,
  };

  return dateMap[eventId] || null;
}
