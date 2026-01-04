"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  Trophy,
  FileSpreadsheet,
  Edit3,
  ArrowLeft
} from "lucide-react";

export type SetupTask = {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "pending";
  icon: string;
  iconType?: "emoji" | "image";
  whyImportant?: string[];
  actionButton?: string;
  onAction?: () => void;
};

interface SetupChecklistProps {
  classId: string;
  estimatedChildren: number;
  estimatedStaff: number;
  currentStaffCount?: number;
  onTaskComplete?: (taskId: string) => void;
  onTaskAction?: (taskId: string, method?: string) => void;
  onSkip?: () => void;
}

export function SetupChecklist({
  classId,
  estimatedChildren,
  estimatedStaff,
  currentStaffCount = 0,
  onTaskAction,
  onSkip,
}: SetupChecklistProps) {
  const [tasks, setTasks] = useState<SetupTask[]>([]);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [collapsedCompletedTasks, setCollapsedCompletedTasks] = useState(false);

  // Initialize tasks
  useEffect(() => {
    const storedProgress = localStorage.getItem(`setup_progress_${classId}`);
    let completedTasks: string[] = [];
    let childrenCount = 0;

    if (storedProgress) {
      const progress = JSON.parse(storedProgress);
      completedTasks = progress.completedTasks || [];
      childrenCount = progress.childrenCount || 0;
    }

    const initialTasks: SetupTask[] = [
      {
        id: "basic_info",
        title: "פרטי כיתה בסיסיים",
        description: `הושלם`,
        status: "completed",
        icon: "✅",
      },
      {
        id: "upload_children",
        title: "העלאת רשימת ילדים והורים",
        description: childrenCount > 0
          ? `נוספו ${childrenCount} מתוך ${estimatedChildren} ילדים`
          : `יש לכם ${estimatedChildren} ילדים בכיתה, אבל עדיין לא הוספתם את הפרטים`,
        status: childrenCount >= estimatedChildren ? "completed" : (childrenCount > 0 ? "in_progress" : "pending"),
        icon: "👨‍👩‍👧‍👦",
        whyImportant: [
          "תוכלו לעקוב אחרי תשלומים לפי הורה",
          "לקבל תזכורות אוטומטיות לימי הולדת",
          "לשלוח עדכונים בקלות",
        ],
        actionButton: "📤 העלאה מאקסל",
      },
      {
        id: "parent_form_links",
        title: "מילוי פרטי ילדים על ידי הורים",
        description: childrenCount > 0
          ? "שלחו קישור לכל הורה למילוי פרטי הילד/ה"
          : "יש להוסיף ילדים לפני שליחת קישורים",
        status: completedTasks.includes("parent_form_links") ? "completed" : (childrenCount > 0 ? "pending" : "pending"),
        icon: "📝",
        whyImportant: [
          "ההורים ימלאו בעצמם את הפרטים המדויקים",
          "תקבלו תאריכי לידה, כתובות ופרטי קשר",
          "חוסך לכם זמן ומונע טעויות",
        ],
        actionButton: "📤 שלח קישורים להורים",
      },
      {
        id: "add_staff",
        title: "הוספת פרטי צוות",
        description: completedTasks.includes("add_staff")
          ? `נוספו ${currentStaffCount} אנשי צוות`
          : currentStaffCount > 0
          ? `נוספו ${currentStaffCount} אנשי צוות - לחצו לעריכה או אישור`
          : `יש לכם ${estimatedStaff} אנשי צוות - בואו נוסיף שמות ותאריכי לידה`,
        status: completedTasks.includes("add_staff") ? "completed" : (currentStaffCount > 0 ? "in_progress" : "pending"),
        icon: "👩‍🏫",
        whyImportant: [
          "תקבלו תזכורות לימי הולדת של הצוות",
          "תוכלו להקצות תקציב למתנות",
        ],
        actionButton: currentStaffCount > 0 ? "✏️ ערוך/אשר" : "+ הוסף פרטים",
      },
      {
        id: "setup_budget",
        title: "בניית תקציב",
        description: "הגדירו כמה כסף תרצו לאסוף ואילו אירועים יתוקצבו",
        status: completedTasks.includes("setup_budget") ? "completed" : "pending",
        icon: "💰",
        whyImportant: [
          "תדעו תמיד כמה כסף נשאר",
          "תקבלו התראות כשהתקציב אוזל",
          "תוכלו לתכנן אירועים מראש",
        ],
        actionButton: "📊 בניית תקציב",
      },
      {
        id: "invite_parents",
        title: "הזמנת הורים לועד",
        description: "שלחו קישור הזמנה למערכת",
        status: completedTasks.includes("invite_parents") ? "completed" : "pending",
        icon: "📧",
        whyImportant: [
          "ההורים יראו עדכונים בזמן אמת",
          "יוכלו לאשר השתתפות באירועים",
          "יקבלו התראות על תשלומים",
        ],
        actionButton: "📧 קבל קישור הזמנה",
      },
      {
        id: "request_payment",
        title: "שליחת בקשת תשלום",
        description: "שלחו להורים בקשה להעביר את התשלום דרך PayBox",
        status: completedTasks.includes("request_payment") ? "completed" : "pending",
        icon: "💳",
        whyImportant: [
          "ההורים יקבלו את הסכום המדויק לתשלום",
          "קישור ישיר ל-PayBox לתשלום נוח",
          "תוכלו לעקוב אחרי מי שילם",
        ],
        actionButton: "💳 שלח בקשת תשלום",
      },
    ];

    setTasks(initialTasks);
  }, [classId, estimatedChildren, estimatedStaff, currentStaffCount]);

  // Calculate progress
  const completedTasksCount = tasks.filter((t) => t.status === "completed").length;
  const totalTasks = tasks.length;
  const progressPercentage = Math.round((completedTasksCount / totalTasks) * 100);

  const toggleTaskExpansion = (taskId: string) => {
    if (expandedTask === taskId) {
      setExpandedTask(null);
    } else {
      setExpandedTask(taskId);
    }
  };

  const handleTaskAction = (task: SetupTask, method?: string) => {
    // Call parent's onTaskAction to open the appropriate modal/panel
    if (onTaskAction) {
      onTaskAction(task.id, method);
    }
  };

  const handleSkipTask = (taskId: string) => {
    // Mark task as completed in localStorage (skipped = completed for our purposes)
    const storedProgress = localStorage.getItem(`setup_progress_${classId}`);
    const progress = storedProgress ? JSON.parse(storedProgress) : {};
    progress.completedTasks = progress.completedTasks || [];

    if (!progress.completedTasks.includes(taskId)) {
      progress.completedTasks.push(taskId);
    }

    localStorage.setItem(`setup_progress_${classId}`, JSON.stringify(progress));

    // Update local state to reflect the change
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === taskId ? { ...t, status: "completed" as const } : t
      )
    );
  };

  const getStatusIcon = (status: SetupTask["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case "in_progress":
        return <Clock className="h-6 w-6 text-orange-500 animate-pulse" />;
      case "pending":
        return <Circle className="h-6 w-6 text-gray-300" />;
    }
  };

  const getMotivationalMessage = () => {
    if (progressPercentage === 100) {
      return "🎉 כל הכבוד! סיימתם את ההגדרות!";
    } else if (progressPercentage >= 80) {
      return "🏆 נותרו רק משימה אחת! אתם כמעט שם!";
    } else if (progressPercentage >= 50) {
      return "💪 חצי דרך! אתם עושים עבודה מצוינת!";
    } else if (progressPercentage >= 20) {
      return "🚀 התקדמות יפה! בואו נמשיך!";
    } else {
      return "📋 בואו נשלים את הגדרת הכיתה";
    }
  };

  if (progressPercentage === 100) {
    return (
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold text-green-700">כל הכבוד!</h2>
            <p className="text-gray-600">
              הכיתה שלכם מוכנה לחלוטין!
            </p>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="font-semibold mb-2">עכשיו תוכלו:</p>
              <ul className="text-sm text-right space-y-1">
                <li>✓ לנהל את כל האירועים במקום אחד</li>
                <li>✓ לעקוב אחרי התקציב בזמן אמת</li>
                <li>✓ לתקשר עם ההורים בקלות</li>
              </ul>
            </div>
            <Button
              onClick={onSkip}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              לדשבורד המלא ←
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            🎯 {getMotivationalMessage()}
          </CardTitle>
          <Badge variant="secondary" className="text-sm">
            {completedTasksCount} מתוך {totalTasks} הושלמו
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{progressPercentage}% הושלם</span>
            {progressPercentage < 100 && (
              <span className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                נותרו {totalTasks - completedTasksCount} משימות
              </span>
            )}
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {tasks.map((task) => {
          const isExpanded = expandedTask === task.id;
          const isCompleted = task.status === "completed";

          // If we're collapsing completed tasks and this is completed, show condensed version
          if (collapsedCompletedTasks && isCompleted) {
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-green-50 border border-green-200 opacity-60"
              >
                {getStatusIcon(task.status)}
                <div className="flex-1">
                  <p className="font-medium text-sm">{task.title}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  הושלם
                </Badge>
              </div>
            );
          }

          return (
            <div
              key={task.id}
              className={`border rounded-lg transition-all ${
                isCompleted
                  ? "bg-green-50 border-green-200"
                  : isExpanded
                  ? "bg-white border-blue-300 shadow-md"
                  : "bg-white border-gray-200 hover:border-blue-200"
              }`}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => !isCompleted && toggleTaskExpansion(task.id)}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(task.status)}

                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {task.iconType === "image" ? (
                        <Image src={task.icon} alt="" width={24} height={24} className="w-6 h-6" />
                      ) : (
                        <span>{task.icon}</span>
                      )}
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-600">{task.description}</p>
                  </div>

                  {!isCompleted && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskExpansion(task.id);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && !isCompleted && task.whyImportant && (
                <div className="px-4 pb-4 space-y-4 border-t pt-4" dir="rtl">
                  {task.id === "upload_children" ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-center text-gray-700">
                        איך תרצו להוסיף את רשימת הילדים?
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          onClick={() => handleTaskAction(task, "excel")}
                          className="bg-white border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-green-500 hover:shadow-md transition-all"
                        >
                          <div className="text-center space-y-3">
                            <FileSpreadsheet className="h-12 w-12 mx-auto text-green-600" />
                            <h4 className="font-semibold text-sm">העלאה מאקסל</h4>
                            <div className="bg-black text-white text-xs py-2 px-3 rounded">
                              בחר באפשרות זו
                            </div>
                          </div>
                        </div>
                        <div
                          onClick={() => handleTaskAction(task, "manual")}
                          className="bg-white border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                        >
                          <div className="text-center space-y-3">
                            <Edit3 className="h-12 w-12 mx-auto text-blue-600" />
                            <h4 className="font-semibold text-sm">הזנה ידנית</h4>
                            <div className="bg-black text-white text-xs py-2 px-3 rounded">
                              בחר באפשרות זו
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : task.actionButton ? (
                    <Button
                      onClick={() => handleTaskAction(task)}
                      className="w-full"
                      size="lg"
                    >
                      {task.actionButton}
                    </Button>
                  ) : null}

                  {/* Skip button - single instance for all tasks */}
                  {task.id !== "basic_info" && (
                    <div className="border-t pt-3 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSkipTask(task.id);
                        }}
                        className="w-full bg-orange-100 text-orange-700 border-orange-400 hover:bg-orange-200 hover:text-orange-800 font-medium"
                      >
                        ⏮️ דלג על משימה זו (אפשר להשלים אחר כך)
                      </Button>
                    </div>
                  )}

                  {/* Why Important tooltip - at bottom */}
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-blue-900">
                      <Info className="h-4 w-4" />
                      <span>💡 למה זה חשוב?</span>
                    </div>
                    <ul className="space-y-1 text-sm text-blue-800">
                      {task.whyImportant.map((reason, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span>•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Collapse/Expand completed tasks toggle */}
        {completedTasksCount > 0 && (
          <button
            onClick={() => setCollapsedCompletedTasks(!collapsedCompletedTasks)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto"
          >
            {collapsedCompletedTasks ? (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>הצג משימות שהושלמו</span>
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4" />
                <span>הסתר משימות שהושלמו</span>
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
