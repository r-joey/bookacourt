export const TZ = "Asia/Manila";

export function peso(amount: number | null | undefined): string {
  return "₱" + (amount ?? 0).toLocaleString("en-PH");
}

// Format an hour (0-23) as a 12-hour label, e.g. 18 -> "6:00 PM".
export function hourLabel(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 || hour === 24 ? "AM" : "PM";
  return `${h12}:00 ${ampm}`;
}

export function hourRange(hour: number): string {
  return `${hourLabel(hour)} – ${hourLabel((hour + 1) % 24)}`;
}

// A YYYY-MM-DD string for a Date, in Manila time.
export function toDateKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function longDate(dateKey: string): string {
  // Accept a YYYY-MM-DD or a full timestamp; render the date part without TZ shifting.
  const [y, m, d] = dateKey.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(dt);
}

export function shortDate(dateKey: string): string {
  const [y, m, d] = dateKey.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dt);
}

export function timeFromISO(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function hourFromISO(iso: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hour: "2-digit",
      hour12: false,
    })
      .format(new Date(iso))
      .replace("24", "0"),
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// List of start-hours between an open and close time string ("06:00[:00]").
export function hoursList(open: string, close: string): number[] {
  const o = parseInt(open, 10);
  const c = parseInt(close, 10);
  const out: number[] = [];
  for (let h = o; h < c; h++) out.push(h);
  return out;
}

export function weekdayOfKey(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDaysKey(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

// Current hour in Manila (0-23) — used to grey out past slots for "today".
export function currentHourManila(): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", hour12: false })
      .format(new Date())
      .replace("24", "0"),
  );
}

export const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  expired: "Expired",
  completed: "Completed",
};
