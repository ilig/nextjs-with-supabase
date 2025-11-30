import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  // Check if user is logged in and has classes
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

  // Determine which page to link to
  const ctaLink = hasClasses ? "/dashboard" : "/create-class";
  const ctaText = hasClasses ? "לדשבורד שלי" : "התחילו עכשיו";
  return (
    <main dir="rtl" className="text-right bg-[#FFF9F0] text-[#222222]">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#FFF9F0] py-24 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-[#222222]">
              ניהול ועד הורים,<br/>
              <span className="text-[#222222]">סוף־סוף כמו שצריך.</span>
            </h1>
            <p className="text-xl md:text-2xl leading-relaxed text-gray-700">
              מערכת צבעונית, קלה וידידותית שמרכזת את כל מה שהועד צריך — במקום אחד.
            </p>
            <p className="text-lg font-bold text-gray-600">
              פחות בלגן. יותר פשוט. יותר כיף.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href={ctaLink}>
                <Button className="bg-[#A78BFA] hover:bg-[#9333EA] text-white text-lg px-10 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all font-bold">
                  {ctaText}
                </Button>
              </Link>
              <Button variant="outline" className="text-lg px-10 py-6 rounded-2xl border-2 border-[#222222] text-[#222222] hover:bg-gray-100 font-bold">
                סרטון הסבר
              </Button>
            </div>
          </div>

          {/* Mockup Visual */}
          <div className="relative hidden md:block">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-gray-200">
              {/* Mock Dashboard */}
              <div className="space-y-4">
                {/* Budget Card */}
                <div className="bg-gradient-to-br from-[#FCD34D] to-[#FDE68A] rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-700 font-semibold">תקציב כולל</div>
                        <div className="text-3xl font-extrabold text-[#222222]">₪2,400</div>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-white/50 rounded-full flex items-center justify-center">
                      <span className="text-xl">✓</span>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs mt-3">
                    <span className="bg-white/60 px-3 py-1 rounded-full font-semibold">24 הורים</span>
                    <span className="bg-white/60 px-3 py-1 rounded-full font-semibold">₪100 לאחד</span>
                  </div>
                </div>

                {/* Event Card */}
                <div className="bg-gradient-to-br from-[#60A5FA] to-[#93C5FD] rounded-2xl p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                      <span className="text-3xl">🎉</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-extrabold text-lg">אירוע קרוב</div>
                      <div className="text-sm opacity-90">יום הולדת לגננת • 15.12</div>
                    </div>
                    <div className="text-2xl">→</div>
                  </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-[#E9D5FF] to-[#DDD6FE] rounded-2xl p-5 hover:scale-105 transition-transform cursor-pointer">
                    <div className="text-4xl mb-2">👥</div>
                    <div className="font-bold text-[#222222] text-sm">24 הורים</div>
                    <div className="text-xs text-gray-600">רשימת כיתה</div>
                  </div>
                  <div className="bg-gradient-to-br from-[#FEF08A] to-[#FDE68A] rounded-2xl p-5 hover:scale-105 transition-transform cursor-pointer">
                    <div className="text-4xl mb-2">📊</div>
                    <div className="font-bold text-[#222222] text-sm">דוחות</div>
                    <div className="text-xs text-gray-600">תקציב ותשלומים</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#60A5FA] rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#FF6B9D] rounded-full opacity-20 blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 px-4 bg-[#FFF9F0]">
        <div className="max-w-6xl mx-auto space-y-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center text-[#222222] leading-tight">
            החיים גם ככה עמוסים.<br/>
            <span className="text-gray-600">למה שועד ההורים יהיה מסובך?</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#E9D5FF] rounded-3xl p-10 hover:scale-105 transition-transform shadow-lg text-center">
              <div className="flex justify-center mb-6">
                <span className="text-5xl">✓</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold mb-4 text-[#222222]">עושים<br/>סדר בבלגן</h3>
              <p className="text-lg leading-relaxed text-gray-700">
                לא עוד אלף הודעות בוואטסאפ, קבצי אקסל ושיחות שלא נגמרות.<br/>
                הכול מרוכז במקום אחד — ברור, נקי ונוח.
              </p>
            </div>
            <div className="bg-[#BFDBFE] rounded-3xl p-10 hover:scale-105 transition-transform shadow-lg text-center">
              <div className="flex justify-center mb-6">
                <span className="text-5xl">⭐</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold mb-4 text-[#222222]">מתאים<br/>לכל ועד</h3>
              <p className="text-lg leading-relaxed text-gray-700">
                גן, כיתה, צהרון או חוג — פותחים ועד ומנהלים הכל בקליק.<br/>
                הממשק פשוט, גמיש ומתאים למי שאין זמן.
              </p>
            </div>
            <div className="bg-[#FEF08A] rounded-3xl p-10 hover:scale-105 transition-transform shadow-lg text-center">
              <div className="flex justify-center mb-6">
                <span className="text-5xl">📢</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold mb-4 text-[#222222]">מעלה את<br/>רמת המעורבות</h3>
              <p className="text-lg leading-relaxed text-gray-700">
                פחות שאלות חוזרות, יותר הורים בעניינים.<br/>
                הכול שקוף וקל להבנה — גם למי שלא טכנולוגי.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto space-y-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center text-[#222222] leading-tight">
            כל מה שועד צריך —<br/>
            <span className="text-gray-600">בצורה פשוטה וקלה</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#FFF9F0] rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-2xl font-extrabold mb-3 text-[#222222]">ניהול אירועים ומתנות</h3>
              <p className="text-base leading-relaxed text-gray-700">
                יומולדות, חגים, מסיבות ויוזמות — יוצרים הכל תוך שניות.
                כולל מעקב אחרי כמויות, משימות ועלויות.
              </p>
            </div>
            <div className="bg-[#FFF9F0] rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="text-5xl mb-4">💸</div>
              <h3 className="text-2xl font-extrabold mb-3 text-[#222222]">תקציב ומעקב בקליק</h3>
              <p className="text-base leading-relaxed text-gray-700">
                גבייה מסודרת, תקציב שקוף ודוחיות אוטומטיות.
                בלי חישובים ידניים ובלי "מי שילם? מי לא?".
              </p>
            </div>
            <div className="bg-[#FFF9F0] rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="text-5xl mb-4">👨‍👩‍👦</div>
              <h3 className="text-2xl font-extrabold mb-3 text-[#222222]">ניהול רשימות הורים וילדים</h3>
              <p className="text-base leading-relaxed text-gray-700">
                כל הפרטים החשובים במקום אחד.
                רשימות מסודרות, סטטוסים מעודכנים וקלות תפעול מדהימה.
              </p>
            </div>
            <div className="bg-[#FFF9F0] rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="text-5xl mb-4">🎁</div>
              <h3 className="text-2xl font-extrabold mb-3 text-[#222222]">קטלוג ספקים שווים</h3>
              <p className="text-base leading-relaxed text-gray-700">
                מתנות, ציוד ואקססוריז — הכול במחירי ועד.
                חוסך זמן, כסף וחיפושים מתישים.
              </p>
            </div>
            <div className="bg-[#FFF9F0] rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="text-5xl mb-4">🔔</div>
              <h3 className="text-2xl font-extrabold mb-3 text-[#222222]">התראות חכמות</h3>
              <p className="text-base leading-relaxed text-gray-700">
                תזכורות אוטומטיות, עדכוני השתתפות, התראות על אירועים קרובים.
                אף אחד לא מפספס כלום.
              </p>
            </div>
            <div className="bg-[#FFF9F0] rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-100">
              <div className="text-5xl mb-4">🌙</div>
              <h3 className="text-2xl font-extrabold mb-3 text-[#222222]">שיק ונוח — גם בלילה</h3>
              <p className="text-base leading-relaxed text-gray-700">
                מצב לילה צבעוני במיוחד, לשימוש אחרי שהילדים נרדמים 😌
                (כי זה בדיוק הזמן שיש סוף־סוף שקט.)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-20 px-4 bg-[#FFF9F0]">
        <div className="max-w-5xl mx-auto space-y-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center text-[#222222] leading-tight">
            כי ועד הורים לא חייב להיות כאב ראש
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 bg-white rounded-2xl p-6 shadow-md">
              <span className="text-4xl">✨</span>
              <span className="text-lg leading-relaxed text-gray-700">ממשק שמרגיש כמו משחק, לא כמו בירוקרטיה.</span>
            </div>
            <div className="flex items-start gap-4 bg-white rounded-2xl p-6 shadow-md">
              <span className="text-4xl">🧭</span>
              <span className="text-lg leading-relaxed text-gray-700">הכל מאורגן בצורה אינטואיטיבית.</span>
            </div>
            <div className="flex items-start gap-4 bg-white rounded-2xl p-6 shadow-md">
              <span className="text-4xl">⚡</span>
              <span className="text-lg leading-relaxed text-gray-700">בנוי במיוחד להורים עסוקים שרוצים יעילות בלי ללמוד מערכת.</span>
            </div>
            <div className="flex items-start gap-4 bg-white rounded-2xl p-6 shadow-md">
              <span className="text-4xl">💫</span>
              <span className="text-lg leading-relaxed text-gray-700">פשוט כיף לגלות שסוף־סוף זה נעשה נכון.</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto space-y-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center text-[#222222]">
            מתחילים תוך פחות מדקה
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-6 bg-[#FFF9F0] p-8 rounded-3xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0 w-14 h-14 bg-[#A78BFA] rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md">1</div>
              <div>
                <h3 className="text-2xl font-extrabold mb-2 text-[#222222]">נרשמים</h3>
                <p className="text-lg text-gray-700">פשוט ומהיר — אימייל וסיסמה</p>
              </div>
            </div>
            <div className="flex items-start gap-6 bg-[#FFF9F0] p-8 rounded-3xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0 w-14 h-14 bg-[#60A5FA] rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md">2</div>
              <div>
                <h3 className="text-2xl font-extrabold mb-2 text-[#222222]">פותחים ועד / כיתה</h3>
                <p className="text-lg text-gray-700">שם הכיתה, פרטים בסיסיים — וזהו</p>
              </div>
            </div>
            <div className="flex items-start gap-6 bg-[#FFF9F0] p-8 rounded-3xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0 w-14 h-14 bg-[#FCD34D] rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md">3</div>
              <div>
                <h3 className="text-2xl font-extrabold mb-2 text-[#222222]">מוסיפים ילדים והורים</h3>
                <p className="text-lg text-gray-700">רשימה פשוטה — אפשר גם להעלות מקובץ</p>
              </div>
            </div>
            <div className="flex items-start gap-6 bg-[#FFF9F0] p-8 rounded-3xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0 w-14 h-14 bg-[#FF6B9D] rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md">4</div>
              <div>
                <h3 className="text-2xl font-extrabold mb-2 text-[#222222]">יוצרים אירוע או תקציב ראשון</h3>
                <p className="text-lg text-gray-700">מתנה ליום הולדת? חגיגה? כל מה שצריך</p>
              </div>
            </div>
            <div className="flex items-start gap-6 bg-[#FFF9F0] p-8 rounded-3xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0 w-14 h-14 bg-[#34D399] rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md">5</div>
              <div>
                <h3 className="text-2xl font-extrabold mb-2 text-[#222222]">שולחים לינק — וכולם בפנים 🎉</h3>
                <p className="text-lg text-gray-700">ההורים נכנסים, רואים הכל ומתעדכנים בזמן אמת</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-4 bg-[#FFF9F0]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-10 md:p-14 border-2 border-gray-100">
            <TestimonialsCarousel />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-[#FCD34D] text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#FEF08A] rounded-full opacity-50 blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#FDE68A] rounded-full opacity-50 blur-2xl"></div>

        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#222222] leading-tight">
            מוכנים להפסיק את הבלגן?
          </h2>
          <p className="text-xl md:text-2xl leading-relaxed text-gray-800 font-medium">
            התחילו לנהל את ועד ההורים שלכם בצורה חכמה, צבעונית ופשוטה.
          </p>
          <div className="pt-4">
            <Link href={ctaLink}>
              <Button className="bg-[#A78BFA] hover:bg-[#9333EA] text-white text-xl md:text-2xl px-12 py-7 rounded-3xl shadow-2xl hover:shadow-3xl transition-all font-extrabold">
                {hasClasses ? "לדשבורד שלי" : "להתחיל עכשיו — בחינם"}
              </Button>
            </Link>
          </div>
          <p className="text-base text-gray-700 font-semibold">
            לוקח פחות מדקה.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-[#FFF9F0]">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center text-[#222222]">שאלות נפוצות</h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            <AccordionItem value="item-1">
              <AccordionTrigger>האם צריך להוריד אפליקציה?</AccordionTrigger>
              <AccordionContent>לא. הכל עובד בדפדפן – במחשב או בטלפון.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>כמה זה עולה?</AccordionTrigger>
              <AccordionContent>הגרסה הראשונה היא בחינם לגמרי.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>האם זה מחליף את PayBox?</AccordionTrigger>
              <AccordionContent>לא – אבל כן עובד איתו. תוכל לעקוב אחרי תשלומים, גם אם נאספו דרך PayBox.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>מה אם רק אני משתמש בזה?</AccordionTrigger>
              <AccordionContent>תוכל להתחיל לבד – אבל ככל שיותר הורים יצטרפו, זה נהיה חזק יותר.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />
    </main>
  );
}
