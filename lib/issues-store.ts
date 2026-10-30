import "server-only";
import type { Category, EventType, Issue, IssueAction, IssueEvent } from "./issues";
import { CATEGORIES, EVENT_LABELS } from "./issues.ts";
import { readDurableState, withDurableState } from "./durable-state.ts";

type StoredIssue = Omit<Issue, "confirmations" | "confirmedByMe" | "isMine"> & {
  ownerId: string;
  confirmers: string[];
};

type IssueState = { issues: StoredIssue[] };
const initialState = (): IssueState => ({ issues: [] });
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === "string";
const dated = (value: unknown): value is string =>
  string(value) && Number.isFinite(Date.parse(value));
const optionalString = (value: unknown): boolean => value === undefined || string(value);

export function isIssueState(value: unknown): value is IssueState {
  if (!object(value) || !Array.isArray(value.issues)) return false;
  const ids = new Set<string>();
  const refs = new Set<string>();
  return value.issues.every((issue: unknown) => {
    if (
      !object(issue) ||
      ![
        "id",
        "ref",
        "ownerId",
        "municipalityCode",
        "municipalityName",
        "title",
        "description",
        "location",
      ].every((key) => string(issue[key])) ||
      !string(issue.id) ||
      !issue.id ||
      !string(issue.ref) ||
      !issue.ref ||
      !string(issue.ownerId) ||
      !issue.ownerId ||
      ids.has(issue.id) ||
      refs.has(issue.ref) ||
      !string(issue.category) ||
      !Object.hasOwn(CATEGORIES, issue.category) ||
      !dated(issue.createdAt) ||
      !["open", "resident_reports_fixed"].includes(String(issue.status)) ||
      !Array.isArray(issue.confirmers) ||
      !issue.confirmers.every(string) ||
      new Set(issue.confirmers).size !== issue.confirmers.length ||
      issue.confirmers.includes(issue.ownerId) ||
      !["ward", "photoUrl", "municipalReference"].every((key) => optionalString(issue[key])) ||
      (issue.reminderAt !== undefined && !dated(issue.reminderAt)) ||
      (issue.sample !== undefined && typeof issue.sample !== "boolean") ||
      !Array.isArray(issue.events) ||
      !issue.events.every(
        (event: unknown) =>
          object(event) &&
          string(event.id) &&
          dated(event.at) &&
          string(event.type) &&
          Object.hasOwn(EVENT_LABELS, event.type) &&
          ["you", "resident"].includes(String(event.actor)) &&
          optionalString(event.note),
      )
    )
      return false;
    ids.add(issue.id);
    refs.add(issue.ref);
    return true;
  });
}

const options = {
  validate: isIssueState,
  initialSequence: 120,
  sample: (): IssueState => ({ issues: seed() }),
};

const SEED_OWNER = "seed-community";

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

function seedEvent(type: EventType, h: number, note?: string): IssueEvent {
  return {
    id: crypto.randomUUID(),
    type,
    at: hoursAgo(h),
    actor: "resident",
    ...(note === undefined ? {} : { note }),
  };
}

function seed(): StoredIssue[] {
  const base = [
    {
      ref: "MAT-CPT-0107",
      municipalityCode: "CPT",
      municipalityName: "Cape Town",
      category: "pothole" as Category,
      title: "Deep pothole in left lane",
      description: "About 40cm wide, cars swerving into oncoming traffic after dark.",
      location: "Voortrekker Rd near Elsies River Station",
      ward: "25",
      events: [
        seedEvent("logged", 24 * 19),
        seedEvent("reported_to_municipality", 24 * 19 - 1, "Logged via the City app"),
        seedEvent("municipal_reference_added", 24 * 19 - 1, "Ref 9112458730"),
        seedEvent("community_confirmed", 24 * 12),
        seedEvent("community_confirmed", 24 * 6),
        seedEvent("still_unresolved", 24 * 2, "Getting bigger after the rain"),
      ],
      confirmers: ["a", "b", "c", "d", "e"],
      municipalReference: "9112458730",
    },
    {
      ref: "MAT-CPT-0112",
      municipalityCode: "CPT",
      municipalityName: "Cape Town",
      category: "streetlight" as Category,
      title: "Three streetlights out on one block",
      description: "Whole stretch is dark between the school and the taxi rank.",
      location: "Lansdowne Rd, Philippi",
      ward: "80",
      events: [seedEvent("logged", 24 * 8), seedEvent("community_confirmed", 24 * 5)],
      confirmers: ["a", "b"],
    },
    {
      ref: "MAT-CPT-0119",
      municipalityCode: "CPT",
      municipalityName: "Cape Town",
      category: "water" as Category,
      title: "Burst pipe running for days",
      description: "Clean water flowing into the stormwater drain since the weekend.",
      location: "Corner of Main Rd & Belmont Rd, Rondebosch",
      ward: "59",
      events: [
        seedEvent("logged", 70),
        seedEvent("reported_to_municipality", 69),
        seedEvent("community_confirmed", 40),
        seedEvent("resident_reports_fixed", 6, "Crew on site this morning, water off"),
      ],
      confirmers: ["a"],
      status: "resident_reports_fixed" as const,
    },
    {
      ref: "MAT-JHB-0044",
      municipalityCode: "JHB",
      municipalityName: "City of Johannesburg",
      category: "water" as Category,
      title: "No water supply for 4 days",
      description: "Entire street without water, no notice given.",
      location: "Melville, 7th Street",
      ward: "87",
      events: [seedEvent("logged", 24 * 4), seedEvent("community_confirmed", 24 * 3)],
      confirmers: ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
    },
  ];

  return base.map((b) => ({
    id: crypto.randomUUID(),
    ownerId: SEED_OWNER,
    sample: true,
    status: "open",
    createdAt: b.events[0].at,
    ...b,
  }));
}

function toPublic(issue: StoredIssue, viewerId: string): Issue {
  const { ownerId, confirmers, ...rest } = issue;
  return {
    ...rest,
    events: [...rest.events].sort((a, b) => a.at.localeCompare(b.at)),
    confirmations: confirmers.length,
    confirmedByMe: confirmers.includes(viewerId),
    isMine: ownerId === viewerId,
  };
}

export async function listIssues(
  viewerId: string,
  opts: { municipality?: string; scope?: "mine" | "all" },
) {
  return (await readDurableState("issues", initialState, options)).issues
    .filter((i) => (opts.municipality ? i.municipalityCode === opts.municipality : true))
    .filter((i) => (opts.scope === "mine" ? i.ownerId === viewerId : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((i) => toPublic(i, viewerId));
}

export async function getIssue(viewerId: string, id: string) {
  const issue = (await readDurableState("issues", initialState, options)).issues.find(
    (i) => i.id === id,
  );
  return issue ? toPublic(issue, viewerId) : null;
}

export async function createIssue(
  viewerId: string,
  input: {
    municipalityCode: string;
    municipalityName: string;
    category: Category;
    title: string;
    description: string;
    location: string;
    ward?: string;
    photoUrl?: string;
  },
) {
  return withDurableState(
    "issues",
    initialState,
    (state, transaction) => {
      const now = new Date().toISOString();
      const issue: StoredIssue = {
        id: crypto.randomUUID(),
        ref: `MAT-${input.municipalityCode}-${String(transaction.nextSequence()).padStart(4, "0")}`,
        ownerId: viewerId,
        confirmers: [],
        status: "open",
        createdAt: now,
        events: [{ id: crypto.randomUUID(), type: "logged", at: now, actor: "you" }],
        municipalityCode: input.municipalityCode,
        municipalityName: input.municipalityName,
        category: input.category,
        title: input.title,
        description: input.description,
        location: input.location,
        ...(input.ward === undefined ? {} : { ward: input.ward }),
        ...(input.photoUrl === undefined ? {} : { photoUrl: input.photoUrl }),
      };
      state.issues.push(issue);
      return toPublic(issue, viewerId);
    },
    options,
  );
}

export async function applyAction(viewerId: string, id: string, action: IssueAction) {
  return withDurableState(
    "issues",
    initialState,
    (state) => {
      const issue = state.issues.find((i) => i.id === id);
      if (!issue) return null;
      const owner = issue.ownerId === viewerId;
      if ((action.type === "confirm" && owner) || (action.type !== "confirm" && !owner))
        return null;
      const actor = owner ? "you" : "resident";
      const push = (type: EventType, note?: string) =>
        issue.events.push({
          id: crypto.randomUUID(),
          type,
          at: new Date().toISOString(),
          actor,
          ...(note === undefined ? {} : { note }),
        });

      switch (action.type) {
        case "confirm":
          if (!issue.confirmers.includes(viewerId)) {
            issue.confirmers.push(viewerId);
            push("community_confirmed");
          }
          break;
        case "still_unresolved":
          push("still_unresolved", action.note);
          if (issue.status === "resident_reports_fixed") issue.status = "open";
          break;
        case "reported_to_municipality":
          push("reported_to_municipality", action.note);
          break;
        case "municipal_reference":
          if (!/^[\w\-/ ]{3,40}$/.test(action.reference)) return null;
          issue.municipalReference = action.reference;
          push("municipal_reference_added", `Ref ${action.reference}`);
          break;
        case "resident_reports_fixed":
          issue.status = "resident_reports_fixed";
          push("resident_reports_fixed", action.note);
          break;
        case "reminder":
          if (![3, 7, 14, 30].includes(action.days)) return null;
          issue.reminderAt = new Date(Date.now() + action.days * 86_400_000).toISOString();
          push("reminder_set", `Check again in ${action.days} days`);
          break;
        default:
          return null;
      }
      return toPublic(issue, viewerId);
    },
    options,
  );
}
