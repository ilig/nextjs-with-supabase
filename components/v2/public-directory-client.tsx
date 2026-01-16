"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2,
  AlertCircle,
  Search,
  User,
  Phone,
  MapPin,
  Calendar,
  Users,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

// ============================================
// Types
// ============================================

type DirectorySettings = {
  show_phone: boolean;
  show_address: boolean;
  show_birthday: boolean;
  is_public: boolean;
};

type Parent = {
  id: string;
  name: string;
  phone: string;
  relationship: string;
};

type Child = {
  id: string;
  name: string;
  birthday: string | null;
  address: string | null;
  parents: Parent[];
};

type Staff = {
  id: string;
  name: string;
  role: string;
  birthday: string | null;
};

type ClassData = {
  id: string;
  name: string;
  school_name: string;
  city: string;
  settlement: string | null;
  directory_settings: DirectorySettings | null;
};

// ============================================
// Component
// ============================================

interface PublicDirectoryClientProps {
  code: string;
}

export function PublicDirectoryClient({ code }: PublicDirectoryClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("children");

  // Default directory settings (all visible)
  const settings: DirectorySettings = classData?.directory_settings || {
    show_phone: true,
    show_address: true,
    show_birthday: true,
    is_public: true,
  };

  // Load data on mount
  useEffect(() => {
    loadDirectoryData();
  }, [code]);

  const loadDirectoryData = async () => {
    try {
      const supabase = createClient();

      // Get class by invite code
      const { data: classResult, error: classError } = await supabase
        .from("classes")
        .select("id, name, school_name, city, settlement, directory_settings")
        .eq("invite_code", code)
        .single();

      if (classError || !classResult) {
        setError("קישור לא תקין");
        setLoading(false);
        return;
      }

      // Check if directory is public
      const dirSettings = classResult.directory_settings as DirectorySettings | null;
      if (dirSettings && !dirSettings.is_public) {
        setError("דף הקשר אינו ציבורי");
        setLoading(false);
        return;
      }

      setClassData(classResult);

      // Load children with parents
      const { data: childrenData } = await supabase
        .from("children")
        .select(`
          id,
          name,
          birthday,
          address,
          child_parents (
            relationship,
            parent:parents (
              id,
              name,
              phone
            )
          )
        `)
        .eq("class_id", classResult.id)
        .order("name");

      if (childrenData) {
        const formattedChildren: Child[] = childrenData.map((child) => ({
          id: child.id,
          name: child.name,
          birthday: child.birthday,
          address: child.address,
          parents: (child.child_parents || [])
            .filter((cp: { parent: unknown }) => cp.parent)
            .map((cp: { relationship: string; parent: { id: string; name: string; phone: string }[] | { id: string; name: string; phone: string } }) => {
              // Handle both array and object formats from Supabase
              const parent = Array.isArray(cp.parent) ? cp.parent[0] : cp.parent;
              return {
                id: parent?.id || "",
                name: parent?.name || "",
                phone: parent?.phone || "",
                relationship: cp.relationship,
              };
            }),
        }));
        setChildren(formattedChildren);
      }

      // Load staff
      const { data: staffData } = await supabase
        .from("staff")
        .select("id, name, role, birthday")
        .eq("class_id", classResult.id)
        .order("name");

      if (staffData) {
        setStaff(staffData);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading directory:", err);
      setError("שגיאה בטעינת הנתונים");
      setLoading(false);
    }
  };

  // Filter children based on search query
  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim()) return children;

    const query = searchQuery.toLowerCase();
    return children.filter(
      (child) =>
        child.name.toLowerCase().includes(query) ||
        child.parents.some((p) => p.name.toLowerCase().includes(query))
    );
  }, [children, searchQuery]);

  // Filter staff based on search query
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staff;

    const query = searchQuery.toLowerCase();
    return staff.filter((s) => s.name.toLowerCase().includes(query));
  }, [staff, searchQuery]);

  // Format birthday for display
  const formatBirthday = (dateStr: string | null): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("he-IL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  // Format staff birthday (month/day only)
  const formatStaffBirthday = (dateStr: string | null): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("he-IL", {
        day: "numeric",
        month: "long",
      });
    } catch {
      return "";
    }
  };

  // Get role display name in Hebrew
  const getRoleDisplay = (role: string): string => {
    const roles: Record<string, string> = {
      teacher: "מורה",
      assistant: "סייעת",
      גננת: "גננת",
      סייעת: "סייעת",
      מורה: "מורה",
    };
    return roles[role] || role;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir="rtl">
        <SimpleHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-brand" />
            <p className="text-muted-foreground">טוען דף קשר...</p>
          </div>
        </div>
        <SimpleFooter />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir="rtl">
        <SimpleHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              {error === "דף הקשר אינו ציבורי" ? (
                <Lock className="h-16 w-16 text-muted-foreground mx-auto" />
              ) : (
                <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
              )}
              <h2 className="text-xl font-bold text-foreground">{error}</h2>
              <p className="text-muted-foreground">
                {error === "דף הקשר אינו ציבורי"
                  ? "המנהלים הגדירו את דף הקשר כפרטי"
                  : "אנא פנו לנציג ועד ההורים לקבלת קישור תקין"}
              </p>
            </CardContent>
          </Card>
        </div>
        <SimpleFooter />
      </div>
    );
  }

  // Main directory view
  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <SimpleHeader />
      <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">דף קשר</h1>
              <p className="text-sm text-muted-foreground">
                {classData?.name} • {classData?.school_name}
                {classData?.settlement && ` • ${classData.settlement}`}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="חיפוש לפי שם..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 rounded-xl"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4 rounded-xl">
            <TabsTrigger value="staff" className="flex-1 rounded-lg gap-2">
              <Users className="h-4 w-4" />
              צוות ({staff.length})
            </TabsTrigger>
            <TabsTrigger value="children" className="flex-1 rounded-lg gap-2">
              <User className="h-4 w-4" />
              ילדים והורים ({children.length})
            </TabsTrigger>
          </TabsList>

          {/* Children Tab */}
          <TabsContent value="children" className="space-y-3">
            {filteredChildren.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? "לא נמצאו תוצאות" : "אין ילדים רשומים"}
                </p>
              </Card>
            ) : (
              filteredChildren.map((child) => (
                <Card key={child.id} className="overflow-hidden">
                  <CardContent className="p-4" dir="rtl">
                    {/* Child name */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-brand" />
                      </div>
                      <h3 className="font-bold text-foreground text-lg">{child.name}</h3>
                    </div>

                    {/* Birthday */}
                    {settings.show_birthday && child.birthday && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>{formatBirthday(child.birthday)}</span>
                      </div>
                    )}

                    {/* Address */}
                    {settings.show_address && child.address && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{child.address}</span>
                      </div>
                    )}

                    {/* Parents */}
                    {child.parents.length > 0 && (
                      <div className="border-t border-border pt-3 space-y-2">
                        {child.parents.map((parent) => (
                          <div key={parent.id} className="flex items-center justify-between">
                            <span className="text-foreground font-medium text-sm">{parent.name}</span>
                            {settings.show_phone && (
                              <a
                                href={`tel:${parent.phone}`}
                                className="flex items-center gap-1 text-sm text-brand hover:underline"
                                dir="ltr"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                {parent.phone}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-3">
            {filteredStaff.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? "לא נמצאו תוצאות" : "אין אנשי צוות רשומים"}
                </p>
              </Card>
            ) : (
              filteredStaff.map((member) => (
                <Card key={member.id} className="overflow-hidden">
                  <CardContent className="p-4" dir="rtl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getRoleDisplay(member.role)}
                        </p>
                      </div>
                      {settings.show_birthday && member.birthday && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatStaffBirthday(member.birthday)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

      </div>
      <SimpleFooter />
    </div>
  );
}

// ============================================
// Simple Header/Footer for public pages
// ============================================

function SimpleHeader() {
  return (
    <nav
      className="w-full flex justify-center border-b-2 border-border bg-background/90 backdrop-blur-lg sticky top-0 z-50 shadow-sm"
    >
      <div className="w-full max-w-7xl flex justify-center items-center py-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 md:gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-[#A78BFA] to-[#60A5FA] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-xl md:text-2xl">✨</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-accent-yellow rounded-full border-2 border-white dark:border-gray-900"></div>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl md:text-2xl font-extrabold text-foreground group-hover:text-brand transition-colors">
              ClassEase
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              ניהול ועד הורים חכם
            </span>
          </div>
        </Link>
      </div>
    </nav>
  );
}

function SimpleFooter() {
  return (
    <footer
      className="py-6 px-4 text-center text-sm text-muted-foreground bg-background border-t-2 border-border"
    >
      <p>ClassEase © 2025</p>
    </footer>
  );
}
