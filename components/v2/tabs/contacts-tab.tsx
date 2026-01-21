"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  User,
  Search,
  Share2,
  Pencil,
  Trash2,
  Phone,
  MapPin,
  Cake,
  Plus,
  Loader2,
  Copy,
  Check,
  UserPlus,
  Baby,
  Briefcase,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addChild,
  updateChild,
  deleteChild,
  addStaff,
  updateStaff,
  deleteStaff,
} from "@/app/actions/manage-directory";
import { AddChildrenSheet } from "@/components/v2/add-children-sheet";
import { AddStaffSheet } from "@/components/v2/add-staff-sheet";
import { Switch } from "@/components/ui/switch";

type Child = {
  id: string;
  name: string;
  address?: string;
  birthday?: string;
  payment_status?: "paid" | "unpaid";
  payment_date?: string;
};

type Staff = {
  id: string;
  name: string;
  role: string;
  birthday?: string;
};

type ChildParent = {
  child_id: string;
  parent_id: string;
  relationship: string;
  children?: { name: string };
  parents?: { name: string; phone: string };
};

type ContactsTabProps = {
  classId: string;
  inviteCode?: string;
  children?: Child[];
  staff?: Staff[];
  childParents?: ChildParent[];
  className?: string;
  openStaffModalOnMount?: boolean;
  openKidsModalOnMount?: boolean;
  onStaffModalOpened?: () => void;
  onKidsModalOpened?: () => void;
  expectedStaff?: number;
  onMarkAsPaid?: (childId: string) => void;
  onMarkAsUnpaid?: (childId: string) => void;
};

type SubTab = "kids" | "staff";

const roleLabels: Record<string, string> = {
  teacher: "מורה",
  kindergarten_teacher: "גננת",
  assistant: "סייע/ת",
  גננת: "גננת",
  סייעת: "סייע/ת",
  מורה: "מורה",
};

// Format birthday from ISO date to DD/MM/YYYY display
function formatBirthdayDisplay(isoDate?: string): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Format staff birthday (month/day only) for display
function formatStaffBirthdayDisplay(isoDate?: string): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  const day = date.getDate();
  const months = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
  ];
  return `${day} ב${months[date.getMonth()]}`;
}

// Format staff birthday to DD/MM for editing
function formatStaffBirthdayEdit(isoDate?: string): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month}`;
}

export function ContactsTab({
  classId,
  inviteCode,
  children = [],
  staff = [],
  childParents = [],
  className,
  openStaffModalOnMount,
  openKidsModalOnMount,
  onStaffModalOpened,
  onKidsModalOpened,
  expectedStaff,
  onMarkAsPaid,
  onMarkAsUnpaid,
}: ContactsTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>(openStaffModalOnMount ? "staff" : "kids");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [addChoiceModalOpen, setAddChoiceModalOpen] = useState(false);

  // Sheet states for bulk adding (V1-style)
  const [addChildrenSheetOpen, setAddChildrenSheetOpen] = useState(false);
  const [addStaffSheetOpen, setAddStaffSheetOpen] = useState(false);

  // Edit states
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "child" | "staff";
    id: string;
    name: string;
  } | null>(null);

  // Form states
  const [childForm, setChildForm] = useState({
    name: "",
    address: "",
    birthday: "",
    parent1_name: "",
    parent1_phone: "",
    parent2_name: "",
    parent2_phone: "",
  });

  const [staffForm, setStaffForm] = useState({
    name: "",
    role: "assistant" as "teacher" | "assistant",
    birthday: "",
  });

  // Share state
  const [copied, setCopied] = useState(false);

  // Open staff sheet directly when triggered from parent (setup banner - Section 3)
  useEffect(() => {
    if (openStaffModalOnMount) {
      setActiveSubTab("staff");
      setAddStaffSheetOpen(true);
      // Reset the parent state so button can be clicked again
      onStaffModalOpened?.();
    }
  }, [openStaffModalOnMount, onStaffModalOpened]);

  // Open kids sheet directly when triggered from parent (setup banner - Section 2)
  useEffect(() => {
    if (openKidsModalOnMount) {
      setActiveSubTab("kids");
      setAddChildrenSheetOpen(true);
      // Reset the parent state so button can be clicked again
      onKidsModalOpened?.();
    }
  }, [openKidsModalOnMount, onKidsModalOpened]);

  // Get parents for a specific child
  const getParentsForChild = (childId: string) => {
    return childParents
      .filter((cp) => cp.child_id === childId)
      .map((cp) => ({
        id: cp.parent_id,
        name: cp.parents?.name || "",
        phone: cp.parents?.phone || "",
        relationship: cp.relationship,
      }));
  };

  // Filter children by search
  const filteredChildren = children.filter((child) =>
    child.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter staff by search
  const filteredStaff = staff.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle toggling payment status
  const handlePaymentToggle = async (childId: string, isPaid: boolean) => {
    if (isPaid) {
      // Mark as paid
      if (onMarkAsPaid) {
        onMarkAsPaid(childId);
      } else {
        const supabase = createClient();
        const { error } = await supabase
          .from("children")
          .update({
            payment_status: "paid",
            payment_date: new Date().toISOString(),
          })
          .eq("id", childId);

        if (!error) {
          router.refresh();
        }
      }
    } else {
      // Mark as unpaid
      if (onMarkAsUnpaid) {
        onMarkAsUnpaid(childId);
      } else {
        const supabase = createClient();
        const { error } = await supabase
          .from("children")
          .update({
            payment_status: "unpaid",
            payment_date: null,
          })
          .eq("id", childId);

        if (!error) {
          router.refresh();
        }
      }
    }
  };

  // Open children sheet for bulk adding (V1-style)
  const openAddChildModal = () => {
    setAddChildrenSheetOpen(true);
  };

  // Open child modal for editing
  const openEditChildModal = (child: Child) => {
    const childParentsList = getParentsForChild(child.id);
    const parent1 = childParentsList.find((p) => p.relationship === "parent1");
    const parent2 = childParentsList.find((p) => p.relationship === "parent2");

    setEditingChild(child);
    setChildForm({
      name: child.name,
      address: child.address || "",
      birthday: formatBirthdayDisplay(child.birthday),
      parent1_name: parent1?.name || "",
      parent1_phone: parent1?.phone || "",
      parent2_name: parent2?.name || "",
      parent2_phone: parent2?.phone || "",
    });
    setChildModalOpen(true);
  };

  // Open staff sheet for bulk adding (V1-style)
  const openAddStaffModal = () => {
    setAddStaffSheetOpen(true);
  };

  // Open staff modal for editing
  const openEditStaffModal = (member: Staff) => {
    setEditingStaff(member);
    setStaffForm({
      name: member.name,
      role: member.role as "teacher" | "assistant",
      birthday: formatStaffBirthdayEdit(member.birthday),
    });
    setStaffModalOpen(true);
  };

  // Handle child form submit
  const handleChildSubmit = async () => {
    startTransition(async () => {
      if (editingChild) {
        // Update existing child
        const childParentsList = getParentsForChild(editingChild.id);
        const parent1 = childParentsList.find(
          (p) => p.relationship === "parent1"
        );
        const parent2 = childParentsList.find(
          (p) => p.relationship === "parent2"
        );

        await updateChild({
          childId: editingChild.id,
          name: childForm.name,
          address: childForm.address,
          birthday: childForm.birthday,
          parent1_id: parent1?.id,
          parent1_name: childForm.parent1_name,
          parent1_phone: childForm.parent1_phone,
          parent2_id: parent2?.id,
          parent2_name: childForm.parent2_name,
          parent2_phone: childForm.parent2_phone,
        });
      } else {
        // Add new child
        await addChild({
          classId,
          name: childForm.name,
          address: childForm.address,
          birthday: childForm.birthday,
          parent1_name: childForm.parent1_name,
          parent1_phone: childForm.parent1_phone,
          parent2_name: childForm.parent2_name,
          parent2_phone: childForm.parent2_phone,
        });
      }

      setChildModalOpen(false);
      router.refresh();
    });
  };

  // Handle staff form submit
  const handleStaffSubmit = async () => {
    startTransition(async () => {
      if (editingStaff) {
        await updateStaff({
          staffId: editingStaff.id,
          name: staffForm.name,
          role: staffForm.role,
          birthday: staffForm.birthday,
        });
      } else {
        await addStaff({
          classId,
          name: staffForm.name,
          role: staffForm.role,
          birthday: staffForm.birthday,
        });
      }

      setStaffModalOpen(false);
      router.refresh();
    });
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      if (deleteTarget.type === "child") {
        await deleteChild(deleteTarget.id);
      } else {
        await deleteStaff(deleteTarget.id);
      }

      setDeleteModalOpen(false);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  // Open delete confirmation
  const openDeleteModal = (
    type: "child" | "staff",
    id: string,
    name: string
  ) => {
    setDeleteTarget({ type, id, name });
    setDeleteModalOpen(true);
  };

  // Copy share link
  const copyShareLink = async () => {
    if (!inviteCode) return;

    const shareUrl = `${window.location.origin}/directory/${inviteCode}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("p-4 md:p-6 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-brand">
            <Users className="h-6 w-6 text-brand-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">דף קשר</h1>
            <p className="text-sm text-muted-foreground">ילדים, הורים וצוות</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl border-2"
          onClick={() => setShareModalOpen(true)}
        >
          <Share2 className="h-4 w-4" />
          <span>שיתוף דף קשר</span>
        </Button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 bg-muted rounded-xl p-1">
        <button
          onClick={() => setActiveSubTab("kids")}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all",
            activeSubTab === "kids"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          ילדים והורים ({children.length})
        </button>
        <button
          onClick={() => setActiveSubTab("staff")}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all",
            activeSubTab === "staff"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          צוות ({staff.length})
        </button>
      </div>

      {/* Search and Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="חיפוש..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button
          size="lg"
          onClick={activeSubTab === "kids" ? openAddChildModal : openAddStaffModal}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>{activeSubTab === "kids" ? "הוסף ילד/ה" : "הוסף איש צוות"}</span>
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {activeSubTab === "kids" ? (
          filteredChildren.length > 0 ? (
            filteredChildren.map((child) => {
              const childParentsList = getParentsForChild(child.id);
              return (
                <div
                  key={child.id}
                  className="bg-card rounded-2xl p-4 border-2 border-border shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-foreground">{child.name}</h3>
                      {/* Payment status toggle */}
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-medium transition-colors",
                          child.payment_status === "paid" ? "text-muted-foreground" : "text-destructive"
                        )}>
                          לא שילם
                        </span>
                        <Switch
                          checked={child.payment_status === "paid"}
                          onCheckedChange={(checked) => handlePaymentToggle(child.id, checked)}
                          aria-label={`סטטוס תשלום עבור ${child.name}`}
                        />
                        <span className={cn(
                          "text-xs font-medium transition-colors",
                          child.payment_status === "paid" ? "text-success" : "text-muted-foreground"
                        )}>
                          שילם
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditChildModal(child)}
                        className="p-2 rounded-xl hover:bg-muted transition-colors"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() =>
                          openDeleteModal("child", child.id, child.name)
                        }
                        className="p-2 rounded-xl hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>

                  {child.birthday && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Cake className="h-4 w-4" />
                      <span>{formatBirthdayDisplay(child.birthday)}</span>
                    </div>
                  )}

                  {childParentsList.map((parent, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-muted-foreground mb-1"
                    >
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span>{parent.name}</span>
                      {parent.phone && (
                        <>
                          <Phone className="h-3 w-3 mr-2" />
                          <a
                            href={`tel:${parent.phone}`}
                            className="hover:text-brand transition-colors"
                          >
                            {parent.phone}
                          </a>
                        </>
                      )}
                    </div>
                  ))}

                  {child.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <MapPin className="h-4 w-4" />
                      <span>{child.address}</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-card rounded-2xl p-8 border-2 border-border text-center">
              <p className="text-muted-foreground">
                {searchQuery ? "לא נמצאו תוצאות" : "אין ילדים רשומים"}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={openAddChildModal}
                >
                  <Plus className="h-4 w-4" />
                  הוסף ילד/ה ראשון
                </Button>
              )}
            </div>
          )
        ) : filteredStaff.length > 0 ? (
          filteredStaff.map((member) => (
            <div
              key={member.id}
              className="bg-card rounded-2xl p-4 border-2 border-border shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-foreground">{member.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditStaffModal(member)}
                    className="p-2 rounded-xl hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() =>
                      openDeleteModal("staff", member.id, member.name)
                    }
                    className="p-2 rounded-xl hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Briefcase className="h-4 w-4 flex-shrink-0" />
                <span>{roleLabels[member.role] || member.role}</span>
              </div>

              {member.birthday && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Cake className="h-4 w-4" />
                  <span>{formatStaffBirthdayDisplay(member.birthday)}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-card rounded-2xl p-8 border-2 border-border text-center">
            <p className="text-muted-foreground">
              {searchQuery ? "לא נמצאו תוצאות" : "אין אנשי צוות רשומים"}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                className="mt-4 gap-2"
                onClick={openAddStaffModal}
              >
                <Plus className="h-4 w-4" />
                הוסף איש צוות ראשון
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Child Modal */}
      <Dialog open={childModalOpen} onOpenChange={setChildModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingChild ? "עריכת פרטי ילד/ה" : "הוספת ילד/ה חדש/ה"}
            </DialogTitle>
            <DialogDescription>
              {editingChild
                ? "עדכן את פרטי הילד/ה והורים"
                : "הזן את פרטי הילד/ה והורים"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="childName">שם הילד/ה *</Label>
              <Input
                id="childName"
                value={childForm.name}
                onChange={(e) =>
                  setChildForm({ ...childForm, name: e.target.value })
                }
                placeholder="שם מלא"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="childBirthday">תאריך לידה</Label>
              <Input
                id="childBirthday"
                value={childForm.birthday}
                onChange={(e) =>
                  setChildForm({ ...childForm, birthday: e.target.value })
                }
                placeholder="DD/MM/YYYY"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="childAddress">כתובת</Label>
              <Input
                id="childAddress"
                value={childForm.address}
                onChange={(e) =>
                  setChildForm({ ...childForm, address: e.target.value })
                }
                placeholder="רחוב, מספר, עיר"
                className="rounded-xl"
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-foreground mb-3">הורה 1</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="parent1Name">שם</Label>
                  <Input
                    id="parent1Name"
                    value={childForm.parent1_name}
                    onChange={(e) =>
                      setChildForm({ ...childForm, parent1_name: e.target.value })
                    }
                    placeholder="שם ההורה"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent1Phone">טלפון</Label>
                  <Input
                    id="parent1Phone"
                    value={childForm.parent1_phone}
                    onChange={(e) =>
                      setChildForm({
                        ...childForm,
                        parent1_phone: e.target.value,
                      })
                    }
                    placeholder="050-1234567"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-foreground mb-3">הורה 2</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="parent2Name">שם</Label>
                  <Input
                    id="parent2Name"
                    value={childForm.parent2_name}
                    onChange={(e) =>
                      setChildForm({ ...childForm, parent2_name: e.target.value })
                    }
                    placeholder="שם ההורה"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent2Phone">טלפון</Label>
                  <Input
                    id="parent2Phone"
                    value={childForm.parent2_phone}
                    onChange={(e) =>
                      setChildForm({
                        ...childForm,
                        parent2_phone: e.target.value,
                      })
                    }
                    placeholder="050-1234567"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setChildModalOpen(false)}
              className="rounded-xl"
            >
              ביטול
            </Button>
            <Button
              onClick={handleChildSubmit}
              disabled={!childForm.name || isPending}
              className="rounded-xl gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingChild ? "שמור שינויים" : "הוסף"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Modal */}
      <Dialog open={staffModalOpen} onOpenChange={setStaffModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? "עריכת איש צוות" : "הוספת איש צוות"}
            </DialogTitle>
            <DialogDescription>
              {editingStaff
                ? "עדכן את פרטי איש הצוות"
                : "הזן את פרטי איש הצוות החדש"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="staffName">שם *</Label>
              <Input
                id="staffName"
                value={staffForm.name}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, name: e.target.value })
                }
                placeholder="שם מלא"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staffRole">תפקיד</Label>
              <Select
                value={staffForm.role}
                onValueChange={(value: "teacher" | "assistant") =>
                  setStaffForm({ ...staffForm, role: value })
                }
              >
                <SelectTrigger className="rounded-xl flex-row-reverse">
                  <SelectValue placeholder="בחר תפקיד" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="teacher">מורה / גננת</SelectItem>
                  <SelectItem value="assistant">סייע/ת</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>יום הולדת (יום/חודש)</Label>
              <div className="flex gap-2">
                {/* Day selector */}
                <Select
                  value={staffForm.birthday ? staffForm.birthday.split("/")[0] : ""}
                  onValueChange={(day) => {
                    const currentMonth = staffForm.birthday ? staffForm.birthday.split("/")[1] : "01";
                    setStaffForm({ ...staffForm, birthday: `${day}/${currentMonth}` });
                  }}
                >
                  <SelectTrigger className="flex-1 rounded-xl flex-row-reverse">
                    <SelectValue placeholder="יום" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString().padStart(2, "0")}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Month selector */}
                <Select
                  value={staffForm.birthday ? staffForm.birthday.split("/")[1] : ""}
                  onValueChange={(month) => {
                    const currentDay = staffForm.birthday ? staffForm.birthday.split("/")[0] : "01";
                    setStaffForm({ ...staffForm, birthday: `${currentDay}/${month}` });
                  }}
                >
                  <SelectTrigger className="flex-1 rounded-xl flex-row-reverse">
                    <SelectValue placeholder="חודש" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {[
                      { value: "01", label: "ינואר" },
                      { value: "02", label: "פברואר" },
                      { value: "03", label: "מרץ" },
                      { value: "04", label: "אפריל" },
                      { value: "05", label: "מאי" },
                      { value: "06", label: "יוני" },
                      { value: "07", label: "יולי" },
                      { value: "08", label: "אוגוסט" },
                      { value: "09", label: "ספטמבר" },
                      { value: "10", label: "אוקטובר" },
                      { value: "11", label: "נובמבר" },
                      { value: "12", label: "דצמבר" },
                    ].map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setStaffModalOpen(false)}
              className="rounded-xl"
            >
              ביטול
            </Button>
            <Button
              onClick={handleStaffSubmit}
              disabled={!staffForm.name || isPending}
              className="rounded-xl gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingStaff ? "שמור שינויים" : "הוסף"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">אישור מחיקה</DialogTitle>
            <DialogDescription className="text-right">
              האם אתה בטוח שברצונך למחוק את{" "}
              <span className="font-bold">{deleteTarget?.name}</span>?
              <br />
              פעולה זו אינה ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              className="rounded-xl"
            >
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-xl gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">שיתוף דף קשר</DialogTitle>
            <DialogDescription className="text-right">
              שתפו קישור לצפייה בדף קשר עם הורים אחרים
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {inviteCode ? (
              <>
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">
                    קישור לצפייה:
                  </p>
                  <p className="text-sm font-mono break-all text-foreground">
                    {typeof window !== "undefined" &&
                      `${window.location.origin}/directory/${inviteCode}`}
                  </p>
                </div>

                <Button
                  onClick={copyShareLink}
                  className="w-full rounded-xl gap-2"
                  variant={copied ? "outline" : "default"}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-success" />
                      הועתק!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      העתק קישור
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="p-4 bg-warning/10 rounded-xl border border-warning/20">
                <p className="text-sm text-warning">
                  לא נמצא קוד הזמנה לכיתה. צור קישור בהגדרות.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Choice Modal - shown when coming from setup banner */}
      <Dialog open={addChoiceModalOpen} onOpenChange={setAddChoiceModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">הוסיפו פרטי קשר</DialogTitle>
            <DialogDescription className="text-right">
              בחרו מה תרצו להוסיף
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 py-4">
            {/* Option 1: Add Children */}
            <button
              onClick={() => {
                setAddChoiceModalOpen(false);
                setAddChildrenSheetOpen(true);
              }}
              className="bg-card rounded-xl p-4 border-2 border-border hover:border-brand/50 transition-colors duration-200 text-right flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-brand-muted">
                <Baby className="h-4 w-4 text-brand" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">ילדים והורים</h3>
                <p className="text-sm text-muted-foreground">
                  הוסיפו שמות ילדים עם פרטי הורים ויום הולדת
                </p>
              </div>
            </button>

            {/* Option 2: Add Staff */}
            <button
              onClick={() => {
                setAddChoiceModalOpen(false);
                setAddStaffSheetOpen(true);
              }}
              className="bg-card rounded-xl p-4 border-2 border-border hover:border-brand/50 transition-colors duration-200 text-right flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-success-muted">
                <UserPlus className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">אנשי צוות</h3>
                <p className="text-sm text-muted-foreground">
                  הוסיפו מורות, גננות וסייעות עם יום הולדת
                </p>
              </div>
            </button>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              onClick={() => setAddChoiceModalOpen(false)}
              className="text-muted-foreground"
            >
              אחר כך
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Children Sheet (V1-style bulk adding) */}
      <AddChildrenSheet
        classId={classId}
        open={addChildrenSheetOpen}
        onOpenChange={setAddChildrenSheetOpen}
        onSuccess={() => {}}
      />

      {/* Add Staff Sheet (V1-style bulk adding) */}
      <AddStaffSheet
        classId={classId}
        open={addStaffSheetOpen}
        onOpenChange={setAddStaffSheetOpen}
        onSuccess={() => {}}
        initialCount={expectedStaff}
      />
    </div>
  );
}
