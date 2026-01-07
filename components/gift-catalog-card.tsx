"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles, Package, ShoppingBag, Bell } from "lucide-react";

type GiftCatalogCardProps = {
  className?: string;
};

export function GiftCatalogCard({ className }: GiftCatalogCardProps) {
  return (
    <Card className={`shadow-xl rounded-3xl border-2 border-border ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl font-extrabold text-foreground">קטלוג מתנות</CardTitle>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  בקרוב
                </Badge>
              </div>
              <CardDescription className="text-base">שותפויות עם ספקים ובחירת מתנות</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Coming Soon Illustration */}
        <div className="relative bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-2xl p-8 text-center">
          <div className="absolute top-4 right-4">
            <Sparkles className="h-8 w-8 text-pink-400 animate-pulse" />
          </div>
          <div className="absolute bottom-4 left-4">
            <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <div className="bg-card p-4 rounded-xl shadow-sm">
              <Package className="h-10 w-10 text-pink-500" />
            </div>
            <div className="bg-card p-4 rounded-xl shadow-sm">
              <Gift className="h-10 w-10 text-purple-500" />
            </div>
            <div className="bg-card p-4 rounded-xl shadow-sm">
              <ShoppingBag className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-foreground mb-2">
            ממשק חדש בדרך! 🎉
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            בקרוב תוכלו לגשת לקטלוג מתנות מלא, לבחור מתנות לאירועים ולנהל שותפויות עם ספקים מועדפים
          </p>
        </div>

        {/* Features Preview */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground mb-3">מה יכלול הקטלוג?</h4>

          <div className="flex items-start gap-3 p-3 bg-muted rounded-xl">
            <div className="bg-pink-100 p-2 rounded-lg">
              <Package className="h-4 w-4 text-pink-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">מגוון מתנות</p>
              <p className="text-sm text-muted-foreground">פרחים, שוקולד, מתנות מותאמות אישית ועוד</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted rounded-xl">
            <div className="bg-purple-100 p-2 rounded-lg">
              <ShoppingBag className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">שותפויות עם ספקים</p>
              <p className="text-sm text-muted-foreground">מחירים מיוחדים לכיתות ומשלוח מהיר</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted rounded-xl">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Gift className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">קישור לאירועים</p>
              <p className="text-sm text-muted-foreground">בחירת מתנות ישירות לאירועים עם עדכון תקציב אוטומטי</p>
            </div>
          </div>
        </div>

        {/* Notify Button */}
        <div className="pt-4 border-t border-border">
          <Button
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-2xl text-white shadow-lg"
            size="lg"
          >
            <Bell className="ml-2 h-5 w-5" />
            עדכנו אותי כשהקטלוג יהיה מוכן
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            נשלח לך הודעה ברגע שהתכונה תהיה זמינה
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
