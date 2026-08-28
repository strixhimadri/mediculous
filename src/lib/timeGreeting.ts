export type TimeGreeting = {
  label: string
  message: string
  quote: string
}

export function getTimeGreeting(date = new Date()): TimeGreeting {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) {
    return {
      label: "শুভ সকাল",
      message:
        "A clear morning sets the tone for the day — stock checked, orders moving, and patients served on time.",
      quote: "প্রতিদিনের ছোট ছোট পদক্ষেপ বড় সাফল্যের পথ দেখায়।",
    }
  }

  if (hour >= 12 && hour < 17) {
    return {
      label: "শুভ অপরাহ্ন",
      message:
        "The afternoon rush is when details matter most. Batch numbers, expiry dates, and dispatch — all in one place.",
      quote: "ধৈর্য আর সঠিক তথ্য দিয়ে বড় কাজও সহজ হয়।",
    }
  }

  if (hour >= 17 && hour < 21) {
    return {
      label: "শুভ সন্ধ্যা",
      message:
        "You help patients save money without changing their treatment. Let's make today a little better than yesterday.",
      quote: "প্রতিদিনের ছোট ছোট পদক্ষেপ বড় সাফল্যের পথ দেখায়।",
    }
  }

  return {
    label: "শুভ রাত্রি",
    message:
      "Tomorrow's supply chain starts with what you organize tonight. Rest well — the desk will be here in the morning.",
    quote: "আগামীকালের জন্য আজই প্রস্তুতি নিন — ধীরে ধীরে, ঠিকভাবে।",
  }
}
