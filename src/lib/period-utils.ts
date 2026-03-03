export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setUTCDate(diff));
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}


export function getMonthStart(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}


export function getPeriodStart(periodType: 'week' | 'month', date: Date = new Date()): Date {
  switch (periodType) {
    case 'week':
      return getWeekStart(date);
    case 'month':
      return getMonthStart(date);
    default:
      throw new Error(`Unknown period type: ${periodType}`);
  }
}

export function getPeriodInfo(periodType: 'week' | 'month', date: Date = new Date()) {
  return {
    periodType,
    periodStart: getPeriodStart(periodType, date),
  };
}
