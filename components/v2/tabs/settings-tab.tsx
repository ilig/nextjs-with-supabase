"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Settings, User, Users, Link as LinkIcon, Eye, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  EditClassModal,
  AdminManagementModal,
  PayboxLinkModal,
  DirectorySettingsModal,
} from "../settings";

// ============================================
// Types
// ============================================

type Admin = {
  id: string;
  user_id: string;
  email: string;
  is_owner: boolean;
};

type PendingInvitation = {
  id: string;
  email: string;
  created_at: string;
};

type DirectorySettings = {
  show_phone: boolean;
  show_address: boolean;
  show_birthday: boolean;
  is_public: boolean;
};

type SettingsTabProps = {
  classData: {
    id: string;
    name: string;
    school_name: string;
    city: string;
    invite_code?: string;
    paybox_link?: string;
    owner_id?: string;
    directory_settings?: DirectorySettings;
  };
  admins?: Admin[];
  pendingInvitations?: PendingInvitation[];
  currentUserId: string;
  className?: string;
  onLogout?: () => void;
};

// ============================================
// Component
// ============================================

export function SettingsTab({
  classData,
  admins = [],
  pendingInvitations = [],
  currentUserId,
  className,
  onLogout,
}: SettingsTabProps) {
  const router = useRouter();
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isPayboxOpen, setIsPayboxOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);

  // Default directory settings
  const directorySettings: DirectorySettings = classData.directory_settings || {
    show_phone: true,
    show_address: true,
    show_birthday: true,
    is_public: true,
  };

  // ============================================
  // Handlers
  // ============================================

  const handleSaveClassDetails = useCallback(async (data: {
    name: string;
    school_name: string;
    city: string;
  }) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("classes")
      .update({
        name: data.name,
        school_name: data.school_name,
        city: data.city,
      })
      .eq("id", classData.id);

    if (error) {
      console.error("Failed to update class:", error);
      throw error;
    }

    router.refresh();
  }, [classData.id, router]);

  const handleAddAdmin = useCallback(async (email: string) => {
    const supabase = createClient();

    // Create a pending invitation (works for both existing and new users)
    const { error } = await supabase
      .from("admin_invitations")
      .insert({
        class_id: classData.id,
        email: email.toLowerCase(),
        invited_by: currentUserId,
        status: "pending",
      });

    if (error) {
      if (error.code === "23505") {
        throw new Error("הזמנה למשתמש זה כבר קיימת");
      }
      console.error("Failed to create invitation:", error);
      throw new Error("אירעה שגיאה ביצירת ההזמנה");
    }

    router.refresh();
  }, [classData.id, currentUserId, router]);

  const handleRemoveAdmin = useCallback(async (adminId: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("class_members")
      .delete()
      .eq("id", adminId);

    if (error) {
      console.error("Failed to remove admin:", error);
      throw error;
    }

    router.refresh();
  }, [router]);

  const handleCancelInvitation = useCallback(async (invitationId: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("admin_invitations")
      .delete()
      .eq("id", invitationId);

    if (error) {
      console.error("Failed to cancel invitation:", error);
      throw error;
    }

    router.refresh();
  }, [router]);

  const handleSavePayboxLink = useCallback(async (link: string | null) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("classes")
      .update({ paybox_link: link })
      .eq("id", classData.id);

    if (error) {
      console.error("Failed to update paybox link:", error);
      throw error;
    }

    router.refresh();
  }, [classData.id, router]);

  const handleSaveDirectorySettings = useCallback(async (settings: DirectorySettings) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("classes")
      .update({ directory_settings: settings })
      .eq("id", classData.id);

    if (error) {
      console.error("Failed to update directory settings:", error);
      throw error;
    }

    router.refresh();
  }, [classData.id, router]);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    onLogout?.();
  }, [router, onLogout]);

  // ============================================
  // Settings Sections Config
  // ============================================

  const settingsSections = [
    {
      icon: User,
      title: "פרטי הכיתה",
      description: "שם הכיתה, מוסד ויישוב",
      action: "עריכה",
      onClick: () => setIsEditClassOpen(true),
    },
    {
      icon: Users,
      title: "מנהלים",
      description: `${admins.length} מנהלים`,
      action: "עריכה",
      onClick: () => setIsAdminOpen(true),
    },
    {
      icon: LinkIcon,
      title: "קישור לתשלום",
      description: classData.paybox_link ? "קישור מוגדר" : "לא הוגדר קישור",
      action: "עריכה",
      onClick: () => setIsPayboxOpen(true),
    },
    {
      icon: Eye,
      title: "הגדרות דף קשר",
      description: directorySettings.is_public ? "ציבורי" : "פרטי",
      action: "עריכה",
      onClick: () => setIsDirectoryOpen(true),
    },
  ];

  // ============================================
  // Render
  // ============================================

  return (
    <div className={cn("p-4 md:p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-brand">
          <Settings className="h-6 w-6 text-brand-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">הגדרות</h1>
          <p className="text-sm text-muted-foreground">ניהול הכיתה והחשבון</p>
        </div>
      </div>

      {/* Class Info Card */}
      <div className="bg-card rounded-2xl p-4 border-2 border-border shadow-sm">
        <p className="font-bold text-foreground">
          {classData.name} • {classData.school_name} • {classData.city}
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-3">
        {settingsSections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <button
              key={idx}
              onClick={section.onClick}
              className="w-full bg-card rounded-2xl p-4 border-2 border-border shadow-sm flex items-center gap-4 hover:border-brand/50 transition-colors text-right"
            >
              <div className="p-2 rounded-xl bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{section.title}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
              <span className="text-sm font-medium text-brand">{section.action}</span>
            </button>
          );
        })}
      </div>

      {/* Logout Button */}
      <div className="pt-4">
        <Button
          variant="outline"
          className="w-full rounded-xl border-2 border-destructive/50 text-destructive hover:bg-destructive/10 gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          יציאה מהחשבון
        </Button>
      </div>

      {/* Modals */}
      <EditClassModal
        open={isEditClassOpen}
        onOpenChange={setIsEditClassOpen}
        classData={classData}
        onSave={handleSaveClassDetails}
      />

      <AdminManagementModal
        open={isAdminOpen}
        onOpenChange={setIsAdminOpen}
        admins={admins}
        pendingInvitations={pendingInvitations}
        currentUserId={currentUserId}
        inviteCode={classData.invite_code}
        className={classData.name}
        onAddAdmin={handleAddAdmin}
        onRemoveAdmin={handleRemoveAdmin}
        onCancelInvitation={handleCancelInvitation}
      />

      <PayboxLinkModal
        open={isPayboxOpen}
        onOpenChange={setIsPayboxOpen}
        currentLink={classData.paybox_link}
        onSave={handleSavePayboxLink}
      />

      <DirectorySettingsModal
        open={isDirectoryOpen}
        onOpenChange={setIsDirectoryOpen}
        settings={directorySettings}
        onSave={handleSaveDirectorySettings}
      />
    </div>
  );
}
