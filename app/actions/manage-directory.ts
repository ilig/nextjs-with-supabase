"use server";

import { createClient } from "@/lib/supabase/server";

// Add a new child with parents
export async function addChild(data: {
  classId: string;
  name: string;
  address?: string;
  birthday?: string; // DD/MM/YYYY format
  parent1_name?: string;
  parent1_phone?: string;
  parent2_name?: string;
  parent2_phone?: string;
}) {
  const supabase = await createClient();

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Convert DD/MM/YYYY to YYYY-MM-DD
    let birthdayDate = null;
    if (data.birthday && data.birthday.includes('/')) {
      const parts = data.birthday.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        birthdayDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    // 1. Create the child
    const { data: child, error: childError } = await supabase
      .from("children")
      .insert({
        class_id: data.classId,
        name: data.name,
        address: data.address || null,
        birthday: birthdayDate,
      })
      .select()
      .single();

    if (childError) throw childError;

    // 2. Create parents if provided
    const parentsToCreate = [];
    if (data.parent1_name) {
      parentsToCreate.push({
        user_id: user.id,
        name: data.parent1_name,
        phone: data.parent1_phone || null,
      });
    }
    if (data.parent2_name) {
      parentsToCreate.push({
        user_id: user.id,
        name: data.parent2_name,
        phone: data.parent2_phone || null,
      });
    }

    if (parentsToCreate.length > 0) {
      const { data: parents, error: parentsError } = await supabase
        .from("parents")
        .insert(parentsToCreate)
        .select();

      if (parentsError) throw parentsError;

      // 3. Create child-parent relationships
      const relationships = parents?.map((parent, idx) => ({
        child_id: child.id,
        parent_id: parent.id,
        relationship: idx === 0 ? "parent1" : "parent2",
      }));

      if (relationships) {
        const { error: relError } = await supabase
          .from("child_parents")
          .insert(relationships);

        if (relError) throw relError;
      }
    }

    return { success: true, data: child };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update a child and parents
export async function updateChild(data: {
  childId: string;
  name: string;
  address?: string;
  birthday?: string; // DD/MM/YYYY format
  parent1_id?: string;
  parent1_name?: string;
  parent1_phone?: string;
  parent2_id?: string;
  parent2_name?: string;
  parent2_phone?: string;
}) {
  const supabase = await createClient();

  try {
    console.log("[updateChild] Received data:", JSON.stringify(data, null, 2));

    // Convert DD/MM/YYYY to YYYY-MM-DD
    let birthdayDate = null;
    if (data.birthday && data.birthday.trim() !== '' && data.birthday !== '//') {
      if (data.birthday.includes('/')) {
        const parts = data.birthday.split('/');
        if (parts.length === 3 && parts.every(p => p && p.trim() !== '')) {
          const [day, month, year] = parts;
          // Validate parts
          const dayNum = parseInt(day);
          const monthNum = parseInt(month);
          const yearNum = parseInt(year);

          if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
            console.log("[updateChild] Non-numeric date parts, setting to null");
            birthdayDate = null; // Don't throw error, just set to null
          } else if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum > 1900) {
            birthdayDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            console.log("[updateChild] Converted birthday to:", birthdayDate);
          } else {
            console.log("[updateChild] Date out of range, setting to null");
            birthdayDate = null; // Don't throw error, just set to null
          }
        } else {
          console.log("[updateChild] Incomplete date parts, setting to null");
          birthdayDate = null; // Don't throw error for incomplete dates
        }
      } else {
        console.log("[updateChild] No / separator found, setting to null");
        birthdayDate = null; // Don't throw error, just set to null
      }
    } else {
      console.log("[updateChild] Empty or invalid birthday, setting to null");
    }

    console.log("[updateChild] Final birthdayDate:", birthdayDate);

    // Validate required fields
    if (!data.name || data.name.trim() === '') {
      throw new Error("Child name is required");
    }

    // 1. Update child
    const { error: childError } = await supabase
      .from("children")
      .update({
        name: data.name.trim(),
        address: data.address?.trim() || null,
        birthday: birthdayDate,
      })
      .eq("id", data.childId);

    if (childError) {
      console.log("[updateChild] Supabase error:", childError);
      throw childError;
    }

    console.log("[updateChild] Child updated successfully");

    // 2. Update parents
    if (data.parent1_id) {
      const { error: parent1Error } = await supabase
        .from("parents")
        .update({
          name: data.parent1_name!,
          phone: data.parent1_phone || null,
        })
        .eq("id", data.parent1_id);

      if (parent1Error) throw parent1Error;
    }

    if (data.parent2_id) {
      const { error: parent2Error } = await supabase
        .from("parents")
        .update({
          name: data.parent2_name!,
          phone: data.parent2_phone || null,
        })
        .eq("id", data.parent2_id);

      if (parent2Error) throw parent2Error;
    }

    console.log("[updateChild] Update completed successfully");
    return { success: true };
  } catch (error: any) {
    console.error("[updateChild] Error:", error);
    return { success: false, error: error.message || String(error) };
  }
}

// Delete a child
export async function deleteChild(childId: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase.from("children").delete().eq("id", childId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Add a new staff member
export async function addStaff(data: {
  classId: string;
  name: string;
  role: "teacher" | "assistant";
  birthday?: string; // DD/MM format
}) {
  const supabase = await createClient();

  try {
    // Convert DD/MM to YYYY-MM-DD
    let birthdayDate = null;
    if (data.birthday && data.birthday.includes('/')) {
      const [day, month] = data.birthday.split('/');
      if (day && month) {
        const currentYear = new Date().getFullYear();
        birthdayDate = `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    const { data: staff, error } = await supabase
      .from("staff")
      .insert({
        class_id: data.classId,
        name: data.name,
        role: data.role,
        birthday: birthdayDate,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: staff };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update a staff member
export async function updateStaff(data: {
  staffId: string;
  name: string;
  role: "teacher" | "assistant";
  birthday?: string; // DD/MM format
}) {
  const supabase = await createClient();

  try {
    // Convert DD/MM to YYYY-MM-DD
    let birthdayDate = null;
    if (data.birthday && data.birthday.includes('/')) {
      const [day, month] = data.birthday.split('/');
      if (day && month) {
        const currentYear = new Date().getFullYear();
        birthdayDate = `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    const { error } = await supabase
      .from("staff")
      .update({
        name: data.name,
        role: data.role,
        birthday: birthdayDate,
      })
      .eq("id", data.staffId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete a staff member
export async function deleteStaff(staffId: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase.from("staff").delete().eq("id", staffId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
