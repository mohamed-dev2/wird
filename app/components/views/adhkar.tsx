"use client";

import { useEffect, useState } from "react";
import { dayId, loadDailyNumber, saveToStorage } from "../../lib/wird";

export function AdhkarView() {
  const [salawat, setSalawat] = useState(() => loadDailyNumber("wird-salawat-v2", 0, dayId()));
  useEffect(() => {
    saveToStorage("wird-salawat-v2", { day: dayId(), value: salawat });
  }, [salawat]);
  return (
    <section className="destination-view adhkar-view">
      <div className="view-hero">
        <p className="eyebrow">أذكار في وقتها</p>
        <h2>اذكر الله في تفاصيل يومك</h2>
        <p>اختر ذكرًا يناسب لحظتك، واحفظ ما تحب العودة إليه.</p>
      </div>
      <div className="adhkar-groups">
        {[
          ["☀", "الصباح", "ابدأ يومك بسكينة"],
          ["◐", "بعد الصلاة", "أذكار قصيرة بعد كل فريضة"],
          ["☾", "المساء والنوم", "اختم يومك بالطمأنينة"],
          ["⌂", "المواقف اليومية", "سفر، طعام، مسجد، منزل"],
        ].map(([icon, title, description]) => (
          <button type="button" key={title}>
            <span>{icon}</span>
            <div>
              <b>{title}</b>
              <small>{description}</small>
            </div>
            <i>‹</i>
          </button>
        ))}
      </div>
      <article className="counter-feature">
        <div>
          <p className="eyebrow">ورد اليوم</p>
          <h2>الصلاة على النبي ﷺ</h2>
          <p>١٠٠ مرة • اجعلها رفيقة يومك</p>
        </div>
        <b>{salawat >= 100 ? "✓" : salawat}</b>
        <button type="button" onClick={() => setSalawat((c) => (c >= 100 ? 0 : c + 1))}>
          {salawat >= 100 ? "تم الورد · ابدأ من جديد" : "ابدأ العدّاد"}
        </button>
      </article>
    </section>
  );
}
