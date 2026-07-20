export const APP_TIME_ZONE = "Asia/Kolkata";
export const APP_UTC_OFFSET = "UTC+05:30";

const locale = "en-IN";

function validDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function localCalendarDate(value: string | Date) {
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return validDate(`${value}T00:00:00+05:30`);
  }
  return validDate(value);
}

function localClockTime(value: string | Date) {
  if (value instanceof Date) return value;
  if (/^\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value)) {
    return validDate(`1970-01-01T${value}+05:30`);
  }
  return validDate(value);
}

export function formatLocalDate(value: string | Date) {
  const date = localCalendarDate(value);
  if (!date) return String(value);
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatLocalTime(value: string | Date) {
  const date = localClockTime(value);
  if (!date) return String(value);
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatLocalDateTime(value: string | Date) {
  const date = validDate(value);
  if (!date) return String(value);
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatDashboardDate(
  value: Date,
) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("weekday")} · ${part("day")} ${part("month")}`.toUpperCase();
}

export function formatDashboardTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
    .format(value)
    .toUpperCase();
}

export function getLocalGreeting(value: Date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: APP_TIME_ZONE,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(value),
  );

  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function formatTimestampField(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const text = String(value);

  if (key.endsWith("_at") || key.includes("timestamp")) {
    return formatLocalDateTime(text);
  }
  if (key.endsWith("_date") || key === "date" || key === "deadline") {
    return formatLocalDate(text);
  }
  if (key.endsWith("_time") || key === "time") {
    return formatLocalTime(text);
  }

  return text.replaceAll("_", " ");
}
