import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomeV2() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasClasses = false;
  if (user) {
    const { data: classes } = await supabase
      .from("classes")
      .select("id")
      .eq("created_by", user.id)
      .limit(1);
    hasClasses = classes ? classes.length > 0 : false;
  }

  const ctaLink = hasClasses ? "/dashboard" : "/create-class";
  const ctaText = hasClasses ? "לדשבורד שלי" : "התחילו עכשיו";

  return (
    <main dir="rtl" className="text-right bg-card text-foreground">
      <Header />

      {/* Hero Section - Full width gradient with centered content */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand via-[#60A5FA] to-[#34D399] opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

        {/* Floating decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-card/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-48 h-48 bg-accent-yellow/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-card/5 rounded-full blur-xl"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 py-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-card/20 backdrop-blur-sm rounded-full px-6 py-2 mb-8">
            <span className="text-2xl">🎉</span>
            <span className="text-white font-semibold">חינם לגמרי • בלי כרטיס אשראי</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 drop-shadow-lg">
            ניהול ועד הורים,
            <br />
            <span className="text-accent-yellow">סוף־סוף כמו שצריך.</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/90 leading-relaxed mb-4 max-w-2xl mx-auto">
            מערכת צבעונית, קלה וידידותית שמרכזת את כל מה שהועד צריך — במקום אחד.
          </p>

          <p className="text-lg text-white/80 font-medium mb-10">
            פחות בלגן. יותר פשוט. יותר כיף.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href={ctaLink}>
              <Button className="bg-card text-brand-muted-foreground hover:bg-muted text-lg px-10 py-7 rounded-full shadow-2xl hover:shadow-3xl transition-all font-bold text-xl">
                {ctaText}
              </Button>
            </Link>
            <Button variant="outline" className="text-lg px-10 py-7 rounded-full border-2 border-white text-white hover:bg-card/10 font-bold bg-transparent">
              סרטון הסבר
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex justify-center gap-8 md:gap-16 mt-16 flex-wrap">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-white">500+</div>
              <div className="text-white/80 font-medium">ועדים פעילים</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-white">10K+</div>
              <div className="text-white/80 font-medium">הורים מרוצים</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-white">4.9</div>
              <div className="text-white/80 font-medium">דירוג ממוצע</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 rounded-full border-2 border-white/50 flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-card/70 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section - Split layout */}
      <section className="py-24 px-4 bg-muted">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-brand uppercase tracking-wider">למה ClassEase?</span>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mt-4 leading-tight">
              החיים גם ככה עמוסים.
              <br />
              <span className="text-muted-foreground">למה שועד ההורים יהיה מסובך?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group relative bg-card rounded-[2rem] p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-border overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#E9D5FF] to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-brand-muted rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">✓</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">עושים סדר בבלגן</h3>
                <p className="text-muted-foreground leading-relaxed">
                  לא עוד אלף הודעות בוואטסאפ, קבצי אקסל ושיחות שלא נגמרות.
                  הכול מרוכז במקום אחד — ברור, נקי ונוח.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative bg-card rounded-[2rem] p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-border overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#BFDBFE] to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-info-muted rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">⭐</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">מתאים לכל ועד</h3>
                <p className="text-muted-foreground leading-relaxed">
                  גן, כיתה, צהרון או חוג — פותחים ועד ומנהלים הכל בקליק.
                  הממשק פשוט, גמיש ומתאים למי שאין זמן.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative bg-card rounded-[2rem] p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-border overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FEF08A] to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-warning-muted rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📢</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">מעלה את רמת המעורבות</h3>
                <p className="text-muted-foreground leading-relaxed">
                  פחות שאלות חוזרות, יותר הורים בעניינים.
                  הכול שקוף וקל להבנה — גם למי שלא טכנולוגי.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="py-24 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-info uppercase tracking-wider">יכולות</span>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mt-4 leading-tight">
              כל מה שועד צריך —
              <br />
              <span className="text-muted-foreground">בצורה פשוטה וקלה</span>
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large feature card */}
            <div className="md:col-span-2 bg-gradient-to-br from-brand to-brand-hover rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-card/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              <div className="relative">
                <span className="text-6xl mb-4 block">🎉</span>
                <h3 className="text-3xl font-bold mb-3">ניהול אירועים ומתנות</h3>
                <p className="text-white/90 text-lg leading-relaxed max-w-md">
                  יומולדות, חגים, מסיבות ויוזמות — יוצרים הכל תוך שניות.
                  כולל מעקב אחרי כמויות, משימות ועלויות.
                </p>
              </div>
            </div>

            {/* Small feature card */}
            <div className="bg-gradient-to-br from-accent-yellow to-warning rounded-3xl p-6 text-foreground">
              <span className="text-5xl mb-4 block">💸</span>
              <h3 className="text-2xl font-bold mb-2">תקציב ומעקב בקליק</h3>
              <p className="text-foreground/80 leading-relaxed">
                גבייה מסודרת, תקציב שקוף ודוחיות אוטומטיות.
              </p>
            </div>

            {/* Small feature card */}
            <div className="bg-foreground rounded-3xl p-6 text-white">
              <span className="text-5xl mb-4 block">👨‍👩‍👦</span>
              <h3 className="text-2xl font-bold mb-2">ניהול רשימות</h3>
              <p className="text-white/80 leading-relaxed">
                כל הפרטים החשובים במקום אחד. רשימות מסודרות וסטטוסים מעודכנים.
              </p>
            </div>

            {/* Small feature card */}
            <div className="bg-gradient-to-br from-success to-success rounded-3xl p-6 text-white">
              <span className="text-5xl mb-4 block">🎁</span>
              <h3 className="text-2xl font-bold mb-2">קטלוג ספקים</h3>
              <p className="text-white/90 leading-relaxed">
                מתנות, ציוד ואקססוריז — הכול במחירי ועד.
              </p>
            </div>

            {/* Small feature card */}
            <div className="bg-gradient-to-br from-info to-info rounded-3xl p-6 text-white">
              <span className="text-5xl mb-4 block">🔔</span>
              <h3 className="text-2xl font-bold mb-2">התראות חכמות</h3>
              <p className="text-white/90 leading-relaxed">
                תזכורות אוטומטיות והתראות על אירועים קרובים.
              </p>
            </div>

            {/* Wide feature card */}
            <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-r from-gray-100 to-gray-50 rounded-3xl p-8 border border-border">
              <div className="flex items-center gap-6">
                <span className="text-6xl">🌙</span>
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-foreground">שיק ונוח — גם בלילה</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    מצב לילה צבעוני במיוחד, לשימוש אחרי שהילדים נרדמים 😌
                    (כי זה בדיוק הזמן שיש סוף־סוף שקט.)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us Section - Horizontal scroll on mobile */}
      <section className="py-24 px-4 bg-foreground text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16 leading-tight">
            כי ועד הורים לא חייב להיות כאב ראש
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 bg-card/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10 hover:bg-card/10 transition-colors">
              <div className="w-14 h-14 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">✨</span>
              </div>
              <span className="text-lg text-white/90">ממשק שמרגיש כמו משחק, לא כמו בירוקרטיה.</span>
            </div>
            <div className="flex items-center gap-4 bg-card/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10 hover:bg-card/10 transition-colors">
              <div className="w-14 h-14 bg-info rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🧭</span>
              </div>
              <span className="text-lg text-white/90">הכל מאורגן בצורה אינטואיטיבית.</span>
            </div>
            <div className="flex items-center gap-4 bg-card/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10 hover:bg-card/10 transition-colors">
              <div className="w-14 h-14 bg-accent-yellow rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">⚡</span>
              </div>
              <span className="text-lg text-white/90">בנוי במיוחד להורים עסוקים שרוצים יעילות בלי ללמוד מערכת.</span>
            </div>
            <div className="flex items-center gap-4 bg-card/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10 hover:bg-card/10 transition-colors">
              <div className="w-14 h-14 bg-success rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💫</span>
              </div>
              <span className="text-lg text-white/90">פשוט כיף לגלות שסוף־סוף זה נעשה נכון.</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Timeline style */}
      <section className="py-24 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-success uppercase tracking-wider">איך זה עובד?</span>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mt-4">
              מתחילים תוך פחות מדקה
            </h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute right-8 top-0 bottom-0 w-1 bg-gradient-to-b from-brand via-[#60A5FA] to-[#34D399] rounded-full hidden md:block"></div>

            <div className="space-y-8">
              {[
                { num: "1", color: "bg-brand", title: "נרשמים", desc: "פשוט ומהיר — אימייל וסיסמה" },
                { num: "2", color: "bg-info", title: "פותחים ועד / כיתה", desc: "שם הכיתה, פרטים בסיסיים — וזהו" },
                { num: "3", color: "bg-accent-yellow", title: "מוסיפים ילדים והורים", desc: "רשימה פשוטה — אפשר גם להעלות מקובץ" },
                { num: "4", color: "bg-pink-500", title: "יוצרים אירוע או תקציב ראשון", desc: "מתנה ליום הולדת? חגיגה? כל מה שצריך" },
                { num: "5", color: "bg-success", title: "שולחים לינק — וכולם בפנים 🎉", desc: "ההורים נכנסים, רואים הכל ומתעדכנים בזמן אמת" },
              ].map((step, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg z-10`}>
                    {step.num}
                  </div>
                  <div className="bg-muted rounded-2xl p-6 flex-1 hover:shadow-lg transition-shadow">
                    <h3 className="text-2xl font-bold mb-2 text-foreground">{step.title}</h3>
                    <p className="text-muted-foreground text-lg">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-[#F3E8FF] to-[#DBEAFE]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm font-bold text-brand-muted-foreground uppercase tracking-wider">מה אומרים עלינו</span>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mt-4">
              הורים מרוצים
            </h2>
          </div>
          <div className="bg-card rounded-[2rem] shadow-2xl p-10 md:p-14 border border-border">
            <TestimonialsCarousel />
          </div>
        </div>
      </section>

      {/* CTA Section - Clean and bold */}
      <section className="py-32 px-4 bg-foreground text-center relative overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand rounded-full opacity-20 blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-info rounded-full opacity-20 blur-[100px]"></div>

        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
            מוכנים להפסיק את הבלגן?
          </h2>
          <p className="text-xl md:text-2xl text-white/80 leading-relaxed mb-10">
            התחילו לנהל את ועד ההורים שלכם בצורה חכמה, צבעונית ופשוטה.
          </p>
          <Link href={ctaLink}>
            <Button className="bg-gradient-to-r from-brand to-info hover:opacity-90 text-white text-xl md:text-2xl px-14 py-8 rounded-full shadow-2xl transition-all font-bold">
              {hasClasses ? "לדשבורד שלי" : "להתחיל עכשיו — בחינם"}
            </Button>
          </Link>
          <p className="text-white/60 mt-6 font-medium">
            לוקח פחות מדקה.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-card">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm font-bold text-warning uppercase tracking-wider">יש שאלות?</span>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mt-4">שאלות נפוצות</h2>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="item-1" className="bg-muted rounded-2xl px-6 border-none">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">האם צריך להוריד אפליקציה?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">לא. הכל עובד בדפדפן – במחשב או בטלפון.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="bg-muted rounded-2xl px-6 border-none">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">כמה זה עולה?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">הגרסה הראשונה היא בחינם לגמרי.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="bg-muted rounded-2xl px-6 border-none">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">האם זה מחליף את PayBox?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">לא – אבל כן עובד איתו. תוכל לעקוב אחרי תשלומים, גם אם נאספו דרך PayBox.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="bg-muted rounded-2xl px-6 border-none">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">מה אם רק אני משתמש בזה?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">תוכל להתחיל לבד – אבל ככל שיותר הורים יצטרפו, זה נהיה חזק יותר.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />
    </main>
  );
}
