const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (value: number): string => (value < 10 ? `0${value}` : String(value));

export const startOfLocalDay = (nowMs: number): number => {
  const date = new Date(nowMs);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const toLocalDayStamp = (nowMs: number): string => {
  const date = new Date(nowMs);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
};

export const toLocalDayNumber = (nowMs: number): number =>
  Math.floor(startOfLocalDay(nowMs) / DAY_MS);

export const fromLocalDayNumber = (dayNumber: number): number => dayNumber * DAY_MS;
