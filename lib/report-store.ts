import "server-only";
import type { Category, Report, TimelineEvent } from "./reports";
import { CATEGORIES } from "./reports.ts";
import {
  demoDataEnabled,
  readDurableState,
  withDurableState,
  type StateTransaction,
} from "./durable-state.ts";

type StoredReport = Omit<Report, "confirmedByMe" | "isMine" | "confirmations"> & {
  reporterId: string;
  confirmers: string[];
};

type ReportState = { reports: StoredReport[]; seeded: string[] };
const initialState = (): ReportState => ({ reports: [], seeded: [] });
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === "string";
const dated = (value: unknown): value is string =>
  string(value) && Number.isFinite(Date.parse(value));

export function isReportState(value: unknown): value is ReportState {
  if (
    !object(value) ||
    !Array.isArray(value.reports) ||
    !Array.isArray(value.seeded) ||
    !value.seeded.every(string) ||
    new Set(value.seeded).size !== value.seeded.length
  )
    return false;
  const ids = new Set<string>();
  const refs = new Set<string>();
  return value.reports.every((report: unknown) => {
    if (
      !object(report) ||
      !["id", "ref", "reporterId", "municipality", "title", "description", "location"].every(
        (key) => string(report[key]),
      ) ||
      !string(report.id) ||
      !report.id ||
      !string(report.ref) ||
      !report.ref ||
      !string(report.reporterId) ||
      !report.reporterId ||
      ids.has(report.id) ||
      refs.has(report.ref) ||
      !CATEGORIES.includes(report.category as Category) ||
      !dated(report.createdAt) ||
      !Array.isArray(report.confirmers) ||
      !report.confirmers.every(string) ||
      new Set(report.confirmers).size !== report.confirmers.length ||
      report.confirmers.includes(report.reporterId) ||
      (report.ward !== undefined && !string(report.ward)) ||
      (report.municipalRef !== undefined && !string(report.municipalRef)) ||
      (report.lat !== undefined &&
        (typeof report.lat !== "number" ||
          !Number.isFinite(report.lat) ||
          Math.abs(report.lat) > 90)) ||
      (report.lng !== undefined &&
        (typeof report.lng !== "number" ||
          !Number.isFinite(report.lng) ||
          Math.abs(report.lng) > 180)) ||
      (report.residentResolvedAt !== undefined && !dated(report.residentResolvedAt)) ||
      (report.reminderAt !== undefined && !dated(report.reminderAt)) ||
      (report.sample !== undefined && typeof report.sample !== "boolean") ||
      !Array.isArray(report.timeline) ||
      !report.timeline.every(
        (event: unknown) =>
          object(event) &&
          dated(event.at) &&
          ["logged", "confirmed", "municipal_ref", "reminder_set", "resident_resolved"].includes(
            String(event.type),
          ) &&
          string(event.note),
      )
    )
      return false;
    ids.add(report.id);
    refs.add(report.ref);
    return true;
  });
}

const options = { validate: isReportState, initialSequence: 1040 };

function nextRef(code: string, transaction: StateTransaction) {
  return `MAT-${code}-${String(transaction.nextSequence()).padStart(6, "0")}`;
}

function ago(days: number, hours = 0) {
  return new Date(Date.now() - (days * 24 + hours) * 3_600_000).toISOString();
}

function seed(state: ReportState, code: string, transaction: StateTransaction) {
  if (!demoDataEnabled() || state.seeded.includes(code)) return;
  state.seeded.push(code);
  const samples: {
    category: Category;
    title: string;
    location: string;
    ward: string;
    days: number;
    confirmers: number;
    ref?: string;
    description: string;
  }[] = [
    {
      category: "pothole",
      title: "Deep pothole in left lane",
      location: "Main Rd near the taxi rank",
      ward: "57",
      days: 41,
      confirmers: 23,
      ref: "9123345671",
      description: "Roughly 60cm wide. Cars swerve into oncoming lane after dark.",
    },
    {
      category: "streetlight",
      title: "Four streetlights out in a row",
      location: "Church St, between 3rd & 5th Ave",
      ward: "57",
      days: 12,
      confirmers: 9,
      description: "Whole block dark since the storm. Pedestrian route to the station.",
    },
    {
      category: "water",
      title: "Burst pipe running for days",
      location: "Corner of Oak & Vlei Rd",
      ward: "58",
      days: 5,
      confirmers: 14,
      ref: "9123390012",
      description: "Clean water flowing into the stormwater drain continuously.",
    },
  ];

  for (const s of samples) {
    const id = crypto.randomUUID();
    const createdAt = ago(s.days, 3);
    const timeline: TimelineEvent[] = [
      { at: createdAt, type: "logged", note: "Logged by resident" },
    ];
    if (s.ref) {
      timeline.push({
        at: ago(s.days - 1),
        type: "municipal_ref",
        note: `Resident added municipal reference ${s.ref}`,
      });
    }
    timeline.push({
      at: ago(Math.max(0, s.days - 2)),
      type: "confirmed",
      note: `${s.confirmers} neighbours confirmed`,
    });
    state.reports.push({
      id,
      ref: nextRef(code, transaction),
      municipality: code,
      category: s.category,
      title: s.title,
      description: s.description,
      location: s.location,
      ward: s.ward,
      createdAt,
      ...(s.ref === undefined ? {} : { municipalRef: s.ref }),
      reporterId: "sample",
      confirmers: Array.from({ length: s.confirmers }, (_, i) => `sample-${i}`),
      timeline,
      sample: true,
    });
  }
}

function present(r: StoredReport, visitorId: string): Report {
  const { reporterId, confirmers, ...rest } = r;
  return {
    ...rest,
    confirmations: confirmers.length,
    confirmedByMe: confirmers.includes(visitorId),
    isMine: reporterId === visitorId,
  };
}

export async function listReports(code: string, visitorId: string) {
  return withDurableState(
    "reports",
    initialState,
    (state, transaction) => {
      seed(state, code, transaction);
      return state.reports
        .filter((r) => r.municipality === code)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((r) => present(r, visitorId));
    },
    options,
  );
}

export async function getReport(id: string, visitorId: string) {
  const r = (await readDurableState("reports", initialState, options)).reports.find(
    (report) => report.id === id,
  );
  return r ? present(r, visitorId) : null;
}

export type NewReport = {
  municipality: string;
  category: Category;
  title: string;
  description: string;
  location: string;
  ward?: string;
  lat?: number;
  lng?: number;
};

export async function createReport(input: NewReport, visitorId: string) {
  return withDurableState(
    "reports",
    initialState,
    (state, transaction) => {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const stored: StoredReport = {
        municipality: input.municipality,
        category: input.category,
        title: input.title,
        description: input.description,
        location: input.location,
        ...(input.ward === undefined ? {} : { ward: input.ward }),
        ...(input.lat === undefined ? {} : { lat: input.lat }),
        ...(input.lng === undefined ? {} : { lng: input.lng }),
        id,
        ref: nextRef(input.municipality, transaction),
        createdAt,
        reporterId: visitorId,
        confirmers: [],
        timeline: [{ at: createdAt, type: "logged", note: "Logged by you" }],
      };
      state.reports.push(stored);
      return present(stored, visitorId);
    },
    options,
  );
}

export type ReportAction =
  | { action: "confirm" }
  | { action: "municipal_ref"; value: string }
  | { action: "remind"; days: number }
  | { action: "resolved" };

export async function applyAction(id: string, visitorId: string, payload: ReportAction) {
  return withDurableState(
    "reports",
    initialState,
    (state) => {
      const r = state.reports.find((report) => report.id === id);
      if (!r) return null;
      const owner = r.reporterId === visitorId;
      if ((payload.action === "confirm" && owner) || (payload.action !== "confirm" && !owner))
        return null;
      const now = new Date().toISOString();

      switch (payload.action) {
        case "confirm":
          if (!r.confirmers.includes(visitorId)) {
            r.confirmers.push(visitorId);
            r.timeline.push({
              at: now,
              type: "confirmed",
              note: "A neighbour confirmed this issue",
            });
          }
          break;
        case "municipal_ref":
          if (!/^[A-Za-z0-9\-/ ]{3,40}$/.test(payload.value)) return null;
          r.municipalRef = payload.value;
          r.timeline.push({
            at: now,
            type: "municipal_ref",
            note: `Resident added municipal reference ${payload.value}`,
          });
          break;
        case "remind":
          if (![3, 7, 14, 30].includes(payload.days)) return null;
          r.reminderAt = new Date(Date.now() + payload.days * 86_400_000).toISOString();
          r.timeline.push({
            at: now,
            type: "reminder_set",
            note: `Follow-up reminder set for ${payload.days} days`,
          });
          break;
        case "resolved":
          if (!r.residentResolvedAt) {
            r.residentResolvedAt = now;
            r.timeline.push({
              at: now,
              type: "resident_resolved",
              note: "Resident reports this is fixed",
            });
          }
          break;
        default:
          return null;
      }
      return present(r, visitorId);
    },
    options,
  );
}
