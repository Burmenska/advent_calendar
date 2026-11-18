export const TIMEZONE = "Europe/Berlin";

export function berlinParts(date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((part) => [part.type, part.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day)
  };
}

/** past: can open. today: can open, and the door is highlighted. future: confirm first. */
export function doorPhase(door, adventYear, date) {
  const { year, month, day } = berlinParts(date);
  const afterAdvent =
    year > adventYear || (year === adventYear && month === 12 && day > 24);
  const inDecember = year === adventYear && month === 12 && day >= 1 && day <= 24;

  if (afterAdvent || (inDecember && day > door)) return "past";
  if (inDecember && day === door) return "today";
  return "future";
}

export function describeDoors(adventYear, date) {
  const doors = [];
  let today = null;
  for (let door = 1; door <= 24; door += 1) {
    const phase = doorPhase(door, adventYear, date);
    if (phase === "today") today = door;
    doors.push({ day: door, phase });
  }
  return { today, timezone: TIMEZONE, doors };
}
