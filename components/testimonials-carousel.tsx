"use client";

import { useState, useEffect } from "react";

const testimonials = [
  {
    quote: "סוף סוף מערכת שבאמת עובדת. הכל מסודר, צבעוני וקליל. חובה לכל ועד!",
    author: "אמא לגן טרום חובה"
  },
  {
    quote: "חסכתי שעות של בלגן עם אקסלים. עכשיו הכל זורם וכולם מעודכנים בזמן אמת.",
    author: "אבא לתאומים בגן חובה"
  },
  {
    quote: "הממשק כל כך פשוט שגם ההורים הכי פחות טכנולוגיים מצליחים להשתמש בלי בעיות.",
    author: "רכזת כיתה ב׳ בבית הספר"
  },
  {
    quote: "לא עוד וואטסאפ עם מאה הודעות ביום. כולם רואים הכל במקום אחד ואף אחד לא שואל ׳מי שילם?׳",
    author: "אמא לכיתה ה׳"
  },
  {
    quote: "סוף סוף דוחות תקציב שקופים שכל הורה יכול להבין. פשוט גאוני!",
    author: "אבא לגן פרטי"
  }
];

export function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-[280px] flex items-center justify-center">
      <div
        className={`transition-all duration-300 ${
          isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <div className="flex justify-center mb-6">
          <div className="flex gap-2 text-4xl">
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
          </div>
        </div>
        <blockquote className="text-2xl md:text-3xl text-center leading-relaxed mb-8 font-bold text-[#222222] px-4">
          "{testimonials[currentIndex].quote}"
        </blockquote>
        <p className="text-center text-gray-600 font-semibold text-lg">
          — {testimonials[currentIndex].author}
        </p>
      </div>

      {/* Carousel indicators */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsAnimating(true);
              setTimeout(() => {
                setCurrentIndex(index);
                setIsAnimating(false);
              }, 300);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? "bg-[#A78BFA] w-6"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
