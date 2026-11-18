import assert from "node:assert/strict";
import { doorPhase, describeDoors } from "./dates.js";

const year = 2026;
const at = (iso) => new Date(iso);

assert.equal(doorPhase(1, year, at("2026-11-18T12:00:00+01:00")), "future");
assert.equal(doorPhase(24, year, at("2026-11-18T23:30:00+01:00")), "future");
assert.equal(describeDoors(year, at("2026-11-18T12:00:00+01:00")).today, null);

assert.equal(doorPhase(4, year, at("2026-12-05T00:30:00+01:00")), "past");
assert.equal(doorPhase(5, year, at("2026-12-05T08:00:00+01:00")), "today");
assert.equal(doorPhase(6, year, at("2026-12-05T23:00:00+01:00")), "future");

assert.equal(doorPhase(1, year, at("2026-12-01T00:05:00+01:00")), "today");
assert.equal(doorPhase(24, year, at("2026-12-24T21:00:00+01:00")), "today");
assert.equal(doorPhase(23, year, at("2026-12-24T21:00:00+01:00")), "past");

assert.equal(doorPhase(24, year, at("2026-12-25T10:00:00+01:00")), "past");
assert.equal(describeDoors(year, at("2026-12-25T10:00:00+01:00")).today, null);
assert.equal(doorPhase(3, year, at("2027-01-02T10:00:00+01:00")), "past");

// Just before midnight in Berlin is still 30 November even if UTC is 1 December.
assert.equal(doorPhase(1, year, at("2026-11-30T23:30:00+01:00")), "future");
assert.equal(doorPhase(1, year, at("2026-12-01T00:30:00+01:00")), "today");

console.log("date rules ok");
