const PERIOD_TIMEZONE = 'America/Sao_Paulo';

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const zonedDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PERIOD_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
});

const zonedOffsetFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PERIOD_TIMEZONE,
  timeZoneName: 'shortOffset',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function getZonedParts(date: Date): { year: number; month: number; day: number; weekday: number } {
  const parts = zonedDateFormatter.formatToParts(date);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  const weekdayText = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const weekday = WEEKDAY_INDEX[weekdayText] ?? 1;

  return { year, month, day, weekday };
}

function getOffsetMinutes(date: Date): number {
  const parts = zonedOffsetFormatter.formatToParts(date);
  const timeZoneName = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0';
  const match = timeZoneName.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return 0;

  const sign = match[1] === '+' ? 1 : -1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? '0');
  return sign * (hours * 60 + minutes);
}

function zonedMidnightUtc(year: number, month: number, day: number): Date {
  const localMidnightUtcReference = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  let utcMillis = localMidnightUtcReference;

  // One refinement pass handles offset transitions safely.
  for (let i = 0; i < 2; i++) {
    const offsetMinutes = getOffsetMinutes(new Date(utcMillis));
    utcMillis = localMidnightUtcReference - offsetMinutes * 60 * 1000;
  }

  return new Date(utcMillis);
}

export function getWeekStart(date: Date = new Date()): Date {
  const { year, month, day, weekday } = getZonedParts(date);
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;

  const localDate = new Date(Date.UTC(year, month - 1, day));
  localDate.setUTCDate(localDate.getUTCDate() - daysFromMonday);

  return zonedMidnightUtc(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth() + 1,
    localDate.getUTCDate(),
  );
}


export function getMonthStart(date: Date = new Date()): Date {
  const { year, month } = getZonedParts(date);
  return zonedMidnightUtc(year, month, 1);
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
