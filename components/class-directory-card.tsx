"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Phone, MapPin, Search, UserCheck, GraduationCap, Baby, Edit2, Trash2, Save, X, Download, Plus, UserPlus, Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { addChild, updateChild, deleteChild, addStaff, updateStaff, deleteStaff } from "@/app/actions/manage-directory";

type Child = {
  id: string;
  name: string;
  address: string | null;
  birthday: string | null;
};

type Parent = {
  id: string;
  name: string;
  phone: string | null;
  user_id: string | null;
};

type Staff = {
  id: string;
  name: string;
  role: "teacher" | "assistant";
  birthday: string | null;
};

type ChildParent = {
  child_id: string;
  parent_id: string;
  relationship: "parent1" | "parent2";
  children?: { name: string };
  parents?: { name: string; phone: string | null };
};

type ClassDirectoryCardProps = {
  classId: string;
  children: Child[];
  parents: Parent[];
  staff: Staff[];
  childParents: ChildParent[];
  className?: string;
  isAdmin?: boolean;
  onInviteParents?: () => void;
};

type ViewMode = "children" | "parents" | "staff";

export function ClassDirectoryCard({
  classId,
  children,
  parents,
  staff,
  childParents,
  className,
  isAdmin = false,
  onInviteParents,
}: ClassDirectoryCardProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("children");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newEntryData, setNewEntryData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);

  // Format birthday from YYYY-MM-DD to DD/MM (for staff - no year)
  const formatBirthdayDisplay = (birthday: string | null) => {
    if (!birthday) return "";
    const date = new Date(birthday);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  // Format birthday from YYYY-MM-DD to DD/MM/YYYY (for children - with year)
  const formatBirthdayFull = (birthday: string | null) => {
    if (!birthday) return "";
    const date = new Date(birthday);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Parse DD/MM input to YYYY-MM-DD (using current year as default)
  const parseBirthdayInput = (input: string) => {
    if (!input || !input.includes('/')) return null;
    const [day, month] = input.split('/');
    if (!day || !month) return null;
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Get parents for a specific child
  const getParentsForChild = (childId: string) => {
    return childParents
      .filter((cp) => cp.child_id === childId)
      .map((cp) => parents.find((p) => p.id === cp.parent_id))
      .filter(Boolean) as Parent[];
  };

  // Get children for a specific parent
  const getChildrenForParent = (parentId: string) => {
    return childParents
      .filter((cp) => cp.parent_id === parentId)
      .map((cp) => children.find((c) => c.id === cp.child_id))
      .filter(Boolean) as Child[];
  };

  // Filter based on search
  const filteredChildren = children.filter((child) =>
    child.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredParents = parents.filter((parent) =>
    parent.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStaff = staff.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Edit handlers
  const handleStartEdit = (id: string, data: any) => {
    setEditingId(id);
    setEditData(data);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      if (viewMode === "children") {
        // Validate name
        if (!editData.name || editData.name.trim() === '') {
          setSaveError("שם הילד הוא שדה חובה");
          setIsSaving(false);
          return;
        }

        // Get parent IDs from childParents
        const childParentsList = childParents.filter(cp => cp.child_id === editingId);
        const parent1 = childParentsList[0];
        const parent2 = childParentsList[1];

        console.log("Saving child with birthday:", editData.birthdayDisplay);
        console.log("Edit data:", editData);

        const result = await updateChild({
          childId: editingId!,
          name: editData.name,
          address: editData.address,
          birthday: editData.birthdayDisplay || '',
          parent1_id: parent1?.parent_id,
          parent1_name: editData.parent1_name,
          parent1_phone: editData.parent1_phone,
          parent2_id: parent2?.parent_id,
          parent2_name: editData.parent2_name,
          parent2_phone: editData.parent2_phone,
        });

        if (result.success) {
          router.refresh();
          setEditingId(null);
          setEditData({});
          setSaveError(null);
        } else {
          const errorMsg = `שגיאה בשמירה: ${result.error}`;
          setSaveError(errorMsg);
          console.error("Update failed:", result.error);
          // Don't use alert, show error in UI instead
        }
      } else if (viewMode === "staff") {
        console.log("Saving staff with birthday:", editData.birthdayDisplay);

        const result = await updateStaff({
          staffId: editingId!,
          name: editData.name,
          role: editData.role,
          birthday: editData.birthdayDisplay,
        });

        if (result.success) {
          router.refresh();
          setEditingId(null);
          setEditData({});
          setSaveError(null);
        } else {
          const errorMsg = `שגיאה בשמירה: ${result.error}`;
          setSaveError(errorMsg);
          console.error("Update failed:", result.error);
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      const errorMsg = `שגיאה בשמירה: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setSaveError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    setIsSaving(true);
    try {
      let result;
      if (type === "child") {
        result = await deleteChild(id);
      } else if (type === "staff") {
        result = await deleteStaff(id);
      }

      if (result?.success) {
        router.refresh();
      } else {
        alert(`Error: ${result?.error}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setNewEntryData({});
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewEntryData({});
  };

  const handleSaveNew = async () => {
    setIsSaving(true);
    try {
      if (viewMode === "children") {
        const result = await addChild({
          classId,
          name: newEntryData.name,
          address: newEntryData.address,
          birthday: newEntryData.birthdayDisplay,
          parent1_name: newEntryData.parent1_name,
          parent1_phone: newEntryData.parent1_phone,
          parent2_name: newEntryData.parent2_name,
          parent2_phone: newEntryData.parent2_phone,
        });

        if (result.success) {
          router.refresh();
          setIsAdding(false);
          setNewEntryData({});
        } else {
          alert(`Error: ${result.error}`);
        }
      } else if (viewMode === "staff") {
        const result = await addStaff({
          classId,
          name: newEntryData.name,
          role: newEntryData.role || "teacher",
          birthday: newEntryData.birthdayDisplay,
        });

        if (result.success) {
          router.refresh();
          setIsAdding(false);
          setNewEntryData({});
        } else {
          alert(`Error: ${result.error}`);
        }
      }
    } catch (error) {
      console.error("Add error:", error);
      alert("Failed to add new entry");
    } finally {
      setIsSaving(false);
    }
  };

  // Download to Excel
  const downloadToExcel = () => {
    if (viewMode === "children") {
      // Prepare children data with parents info
      const data = children.map((child) => {
        const childParentsList = getParentsForChild(child.id);
        const parent1 = childParentsList[0];
        const parent2 = childParentsList[1];

        return {
          "שם הילד": child.name,
          "תאריך לידה": formatBirthdayFull(child.birthday) || "",
          "כתובת": child.address || "",
          "הורה 1 - שם": parent1?.name || "",
          "הורה 1 - טלפון": parent1?.phone || "",
          "הורה 2 - שם": parent2?.name || "",
          "הורה 2 - טלפון": parent2?.phone || "",
        };
      });

      // Convert to CSV
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers.map((header) => `"${row[header as keyof typeof row]}"`).join(",")
        ),
      ].join("\n");

      // Download
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `ילדים_והורים_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    } else if (viewMode === "staff") {
      // Prepare staff data
      const data = staff.map((member) => ({
        "שם": member.name,
        "תפקיד": member.role === "teacher" ? "מורה" : "עוזר/ת",
        "תאריך לידה": formatBirthdayDisplay(member.birthday),
      }));

      // Convert to CSV
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers.map((header) => `"${row[header as keyof typeof row]}"`).join(",")
        ),
      ].join("\n");

      // Download
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `צוות_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    }
  };

  const renderChildrenView = () => (
    <div className="space-y-1">
      {isAdding && (
        <Card className="p-4 space-y-3 border-2 border-blue-200 bg-blue-50/30 mb-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">ילד חדש</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelAdd}
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">שם הילד *</Label>
              <Input
                value={newEntryData.name || ""}
                onChange={(e) => setNewEntryData({ ...newEntryData, name: e.target.value })}
                placeholder="שם מלא"
                className="text-right"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">כתובת</Label>
              <Input
                value={newEntryData.address || ""}
                onChange={(e) => setNewEntryData({ ...newEntryData, address: e.target.value })}
                placeholder="אופציונלי"
                className="text-right"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">שם הורה 1 *</Label>
              <Input
                value={newEntryData.parent1_name || ""}
                onChange={(e) => setNewEntryData({ ...newEntryData, parent1_name: e.target.value })}
                placeholder="שם מלא"
                className="text-right"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">טלפון הורה 1 *</Label>
              <Input
                value={newEntryData.parent1_phone || ""}
                onChange={(e) => setNewEntryData({ ...newEntryData, parent1_phone: e.target.value })}
                placeholder="05XXXXXXXX"
                type="tel"
                className="text-right"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">שם הורה 2</Label>
              <Input
                value={newEntryData.parent2_name || ""}
                onChange={(e) => setNewEntryData({ ...newEntryData, parent2_name: e.target.value })}
                placeholder="אופציונלי"
                className="text-right"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">טלפון הורה 2</Label>
              <Input
                value={newEntryData.parent2_phone || ""}
                onChange={(e) => setNewEntryData({ ...newEntryData, parent2_phone: e.target.value })}
                placeholder="אופציונלי"
                type="tel"
                className="text-right"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">תאריך לידה (DD/MM/YYYY)</Label>
              <Input
                value={newEntryData.birthdayDisplay || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  // Remove non-numeric characters except /
                  const cleaned = value.replace(/[^0-9/]/g, "");
                  // Auto-format as DD/MM/YYYY
                  let formatted = cleaned;
                  const numeric = cleaned.replace(/\//g, "");
                  if (numeric.length <= 2) {
                    formatted = numeric;
                  } else if (numeric.length <= 4) {
                    formatted = `${numeric.slice(0, 2)}/${numeric.slice(2)}`;
                  } else if (numeric.length <= 8) {
                    formatted = `${numeric.slice(0, 2)}/${numeric.slice(2, 4)}/${numeric.slice(4)}`;
                  }
                  setNewEntryData({ ...newEntryData, birthdayDisplay: formatted });
                }}
                placeholder="01/01/2020"
                maxLength={10}
                className="text-right"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              onClick={handleCancelAdd}
              className="flex-1"
            >
              ביטול
            </Button>
            <Button
              onClick={handleSaveNew}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? "שומר..." : (
                <>
                  <Check className="h-4 w-4 ml-2" />
                  אישור ושמירה
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
      {filteredChildren.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Baby className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>לא נמצאו ילדים</p>
        </div>
      ) : (
        filteredChildren.map((child) => {
          const childParentsList = getParentsForChild(child.id);
          const isEditing = editingId === child.id;
          const isExpanded = expandedChildId === child.id || isEditing;

          return (
            <div
              key={child.id}
              className={cn(
                "rounded-lg border transition-colors",
                isExpanded
                  ? "border-orange-300 bg-orange-50 p-4"
                  : "border-gray-200 hover:border-orange-200 hover:bg-orange-50/50"
              )}
            >
              {/* Compact row - always visible */}
              <div
                className={cn(
                  "flex items-center justify-between cursor-pointer",
                  !isExpanded && "py-2 px-3"
                )}
                onClick={() => {
                  if (!isEditing) {
                    setExpandedChildId(isExpanded ? null : child.id);
                  }
                }}
              >
                <div className="flex items-center gap-2 flex-1">
                  <Baby className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <span className="font-medium text-foreground">{child.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {isAdmin && !isEditing && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          const birthdayParts = child.birthday ? formatBirthdayFull(child.birthday).split('/') : ['', '', ''];
                          const editDataObj: any = {
                            name: child.name,
                            address: child.address,
                            birthdayDisplay: formatBirthdayFull(child.birthday),
                            birthdayDay: birthdayParts[0] ? String(parseInt(birthdayParts[0])) : '',
                            birthdayMonth: birthdayParts[1] ? String(parseInt(birthdayParts[1])) : '',
                            birthdayYear: birthdayParts[2] || '',
                          };
                          childParentsList.forEach((parent, idx) => {
                            editDataObj[`parent${idx + 1}_name`] = parent.name;
                            editDataObj[`parent${idx + 1}_phone`] = parent.phone;
                          });
                          setExpandedChildId(child.id);
                          handleStartEdit(child.id, editDataObj);
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(child.id, "child");
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </>
                  )}
                  {!isEditing && (
                    isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">שם הילד</label>
                        <Input
                          value={editData.name || child.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          placeholder="שם הילד"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">כתובת</label>
                        <Input
                          value={editData.address || child.address || ""}
                          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                          placeholder="כתובת"
                        />
                      </div>
                      <div className="border-t pt-2">
                        <label className="text-xs font-medium text-gray-600 mb-1 block">תאריך לידה</label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <select
                              value={editData.birthdayDay || (child.birthday ? String(parseInt(formatBirthdayFull(child.birthday).split('/')[0])) : "")}
                              onChange={(e) => {
                                const currentMonth = editData.birthdayMonth || (child.birthday ? String(parseInt(formatBirthdayFull(child.birthday).split('/')[1])) : "");
                                const currentYear = editData.birthdayYear || (child.birthday ? formatBirthdayFull(child.birthday).split('/')[2] : "");
                                setEditData({
                                  ...editData,
                                  birthdayDay: e.target.value,
                                  birthdayDisplay: e.target.value && currentMonth && currentYear
                                    ? `${e.target.value.padStart(2, '0')}/${currentMonth.padStart(2, '0')}/${currentYear}`
                                    : ""
                                });
                              }}
                              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="">יום</option>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                <option key={day} value={day}>{day}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <select
                              value={editData.birthdayMonth || (child.birthday ? String(parseInt(formatBirthdayFull(child.birthday).split('/')[1])) : "")}
                              onChange={(e) => {
                                const currentDay = editData.birthdayDay || (child.birthday ? String(parseInt(formatBirthdayFull(child.birthday).split('/')[0])) : "");
                                const currentYear = editData.birthdayYear || (child.birthday ? formatBirthdayFull(child.birthday).split('/')[2] : "");
                                setEditData({
                                  ...editData,
                                  birthdayMonth: e.target.value,
                                  birthdayDisplay: currentDay && e.target.value && currentYear
                                    ? `${currentDay.padStart(2, '0')}/${e.target.value.padStart(2, '0')}/${currentYear}`
                                    : ""
                                });
                              }}
                              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="">חודש</option>
                              <option value="1">ינואר</option>
                              <option value="2">פברואר</option>
                              <option value="3">מרץ</option>
                              <option value="4">אפריל</option>
                              <option value="5">מאי</option>
                              <option value="6">יוני</option>
                              <option value="7">יולי</option>
                              <option value="8">אוגוסט</option>
                              <option value="9">ספטמבר</option>
                              <option value="10">אוקטובר</option>
                              <option value="11">נובמבר</option>
                              <option value="12">דצמבר</option>
                            </select>
                          </div>
                          <div>
                            <select
                              value={editData.birthdayYear || (child.birthday ? formatBirthdayFull(child.birthday).split('/')[2] : "")}
                              onChange={(e) => {
                                const currentDay = editData.birthdayDay || (child.birthday ? String(parseInt(formatBirthdayFull(child.birthday).split('/')[0])) : "");
                                const currentMonth = editData.birthdayMonth || (child.birthday ? String(parseInt(formatBirthdayFull(child.birthday).split('/')[1])) : "");
                                setEditData({
                                  ...editData,
                                  birthdayYear: e.target.value,
                                  birthdayDisplay: currentDay && currentMonth && e.target.value
                                    ? `${currentDay.padStart(2, '0')}/${currentMonth.padStart(2, '0')}/${e.target.value}`
                                    : ""
                                });
                              }}
                              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="">שנה</option>
                              {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      {childParentsList.length > 0 && (
                        <>
                          {childParentsList.map((parent, idx) => (
                            <div key={parent.id} className="border-t pt-2">
                              <label className="text-xs font-medium text-gray-600 mb-1 block">הורה {idx + 1}</label>
                              <div className="space-y-2">
                                <Input
                                  value={editData[`parent${idx + 1}_name`] || parent.name}
                                  onChange={(e) => setEditData({ ...editData, [`parent${idx + 1}_name`]: e.target.value })}
                                  placeholder={`שם הורה ${idx + 1}`}
                                />
                                <Input
                                  value={editData[`parent${idx + 1}_phone`] || parent.phone || ""}
                                  onChange={(e) => setEditData({ ...editData, [`parent${idx + 1}_phone`]: e.target.value })}
                                  placeholder={`טלפון הורה ${idx + 1}`}
                                  type="tel"
                                />
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      {saveError && editingId === child.id && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          {saveError}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            handleCancelEdit();
                            setExpandedChildId(null);
                          }}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 ml-1" />
                          ביטול
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                          className="flex-1"
                        >
                          <Save className="h-4 w-4 ml-1" />
                          {isSaving ? "שומר..." : "שמור"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {child.birthday && (
                        <div className="text-sm text-muted-foreground">
                          🎂 תאריך לידה: {formatBirthdayFull(child.birthday)}
                        </div>
                      )}
                      {child.address && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {child.address}
                        </div>
                      )}
                      {childParentsList.length > 0 && (
                        <div className="space-y-1 pt-2">
                          {childParentsList.map((parent, idx) => (
                            <div
                              key={parent.id}
                              className="text-sm flex items-center justify-between bg-white/60 rounded px-2 py-1.5"
                            >
                              <span className="text-gray-700">
                                הורה {idx + 1}: {parent.name}
                              </span>
                              {parent.phone && (
                                <a
                                  href={`tel:${parent.phone}`}
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Phone className="h-3 w-3" />
                                  {parent.phone}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );


  const renderStaffView = () => (
    <div className="space-y-2">
      {isAdding && (
        <Card className="p-4 space-y-3 border-2 border-blue-200 bg-blue-50/30">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">איש צוות חדש</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelAdd}
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">שם מלא *</Label>
              <Input
                value={newEntryData.name || ""}
                onChange={(e) => setNewEntryData({ ...newEntryData, name: e.target.value })}
                placeholder="לדוגמה: רחל כהן"
                className="text-right"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">תפקיד *</Label>
              <select
                value={newEntryData.role || "teacher"}
                onChange={(e) => setNewEntryData({ ...newEntryData, role: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="teacher">מורה</option>
                <option value="assistant">עוזר/ת</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">יום הולדת (DD/MM)</Label>
              <Input
                value={newEntryData.birthdayDisplay || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  // Remove non-numeric characters except /
                  const cleaned = value.replace(/[^0-9/]/g, "");
                  // Auto-format as DD/MM
                  let formatted = cleaned;
                  const numeric = cleaned.replace(/\//g, "");
                  if (numeric.length <= 2) {
                    formatted = numeric;
                  } else if (numeric.length <= 4) {
                    formatted = `${numeric.slice(0, 2)}/${numeric.slice(2)}`;
                  }
                  setNewEntryData({ ...newEntryData, birthdayDisplay: formatted });
                }}
                placeholder="15/03"
                maxLength={5}
                className="text-right"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              onClick={handleCancelAdd}
              className="flex-1"
            >
              ביטול
            </Button>
            <Button
              onClick={handleSaveNew}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? "שומר..." : (
                <>
                  <Check className="h-4 w-4 ml-2" />
                  אישור ושמירה
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
      {filteredStaff.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>לא נמצאו צוות</p>
        </div>
      ) : (
        filteredStaff.map((member) => {
          const isEditing = editingId === member.id;

          return (
            <div
              key={member.id}
              className="p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">שם</label>
                        <Input
                          value={editData.name || member.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          placeholder="שם"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">תפקיד</label>
                        <select
                          value={editData.role || member.role}
                          onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="teacher">מורה</option>
                          <option value="assistant">עוזר/ת</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">יום</label>
                          <select
                            value={editData.birthdayDay || (member.birthday ? String(parseInt(formatBirthdayDisplay(member.birthday).split('/')[0])) : "")}
                            onChange={(e) => {
                              const currentMonth = editData.birthdayMonth || (member.birthday ? String(parseInt(formatBirthdayDisplay(member.birthday).split('/')[1])) : "");
                              setEditData({
                                ...editData,
                                birthdayDay: e.target.value,
                                birthdayDisplay: e.target.value && currentMonth
                                  ? `${e.target.value.padStart(2, '0')}/${currentMonth.padStart(2, '0')}`
                                  : ""
                              });
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">בחר יום</option>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">חודש</label>
                          <select
                            value={editData.birthdayMonth || (member.birthday ? String(parseInt(formatBirthdayDisplay(member.birthday).split('/')[1])) : "")}
                            onChange={(e) => {
                              const currentDay = editData.birthdayDay || (member.birthday ? String(parseInt(formatBirthdayDisplay(member.birthday).split('/')[0])) : "");
                              setEditData({
                                ...editData,
                                birthdayMonth: e.target.value,
                                birthdayDisplay: currentDay && e.target.value
                                  ? `${currentDay.padStart(2, '0')}/${e.target.value.padStart(2, '0')}`
                                  : ""
                              });
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">בחר חודש</option>
                            <option value="1">ינואר</option>
                            <option value="2">פברואר</option>
                            <option value="3">מרץ</option>
                            <option value="4">אפריל</option>
                            <option value="5">מאי</option>
                            <option value="6">יוני</option>
                            <option value="7">יולי</option>
                            <option value="8">אוגוסט</option>
                            <option value="9">ספטמבר</option>
                            <option value="10">אוקטובר</option>
                            <option value="11">נובמבר</option>
                            <option value="12">דצמבר</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold text-foreground">{member.name}</span>
                      <Badge variant={member.role === "teacher" ? "default" : "secondary"}>
                        {member.role === "teacher" ? "מורה" : "עוזר/ת"}
                      </Badge>
                      {member.birthday && (
                        <span className="text-sm text-muted-foreground mr-auto">
                          {formatBirthdayDisplay(member.birthday)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-1 mr-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                          className="h-8 w-8 p-0"
                        >
                          <Save className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4 text-gray-600" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const birthdayParts = member.birthday ? formatBirthdayDisplay(member.birthday).split('/') : ['', ''];
                            handleStartEdit(member.id, {
                              name: member.name,
                              role: member.role,
                              birthdayDisplay: formatBirthdayDisplay(member.birthday),
                              birthdayDay: birthdayParts[0] ? String(parseInt(birthdayParts[0])) : '',
                              birthdayMonth: birthdayParts[1] ? String(parseInt(birthdayParts[1])) : '',
                            });
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(member.id, "staff")}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const getViewIcon = (): React.ComponentType<{ className?: string }> => {
    switch (viewMode) {
      case "children":
        return Baby;
      case "parents":
        return Users;
      case "staff":
        return GraduationCap;
    }
  };

  const ViewIcon = getViewIcon();

  const getViewTitle = () => {
    switch (viewMode) {
      case "children":
        return "ילדים והורים";
      case "parents":
        return "הורים";
      case "staff":
        return "צוות";
    }
  };

  const getCount = () => {
    switch (viewMode) {
      case "children":
        return children.length;
      case "parents":
        return parents.length;
      case "staff":
        return staff.length;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        {/* Main Header - always shown */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-extrabold text-[#222222]">מדריך הכיתה</CardTitle>
              <CardDescription className="text-base">ילדים, הורים וצוות</CardDescription>
            </div>
          </div>
          {onInviteParents && (
            <Button
              onClick={onInviteParents}
              variant="outline"
              className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
            >
              <UserPlus className="h-4 w-4 ml-2" />
              הזמן הורים
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
              <ViewIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{getViewTitle()}</CardTitle>
              <CardDescription>
                {getCount()} {viewMode === "children" ? "ילדים" : viewMode === "parents" ? "הורים" : "צוות"}
              </CardDescription>
            </div>
          </div>
        </div>

        {/* View Mode Buttons and Download */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "children" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("children")}
            className="flex-1"
          >
            <Baby className="h-4 w-4 ml-1" />
            ילדים והורים ({children.length})
          </Button>
          <Button
            variant={viewMode === "staff" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("staff")}
            className="flex-1"
          >
            <GraduationCap className="h-4 w-4 ml-1" />
            צוות ({staff.length})
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartAdd}
              className="px-3 bg-green-50 hover:bg-green-100 border-green-300"
              title={viewMode === "children" ? "הוסף ילד חדש" : "הוסף איש צוות"}
              disabled={isAdding}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadToExcel}
            className="px-3"
            title="הורד לאקסל"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="חיפוש..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto">
        {viewMode === "children" && renderChildrenView()}
        {viewMode === "staff" && renderStaffView()}
      </CardContent>
    </Card>
  );
}
