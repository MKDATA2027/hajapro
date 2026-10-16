import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";

function fail(message) {
  console.error(`Hosted migration preflight failed: ${message}`);
  process.exit(1);
}

function projectRefFromArgs(args) {
  const index = args.indexOf("--project-ref");
  if (index < 0) return null;
  return args[index + 1] ?? null;
}

function findProject(value, projectRef) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findProject(entry, projectRef);
      if (found) return found;
    }
    return null;
  }

  if (!value || typeof value !== "object") return null;

  const record = value;
  const refs = [record.ref, record.project_ref, record.projectRef, record.project_id, record.id];
  if (refs.includes(projectRef) && typeof record.name === "string") {
    return { ref: projectRef, name: record.name };
  }

  for (const child of Object.values(record)) {
    const found = findProject(child, projectRef);
    if (found) return found;
  }
  return null;
}

function runSupabase(args, options = {}) {
  const result = spawnSync("supabase", args, {
    encoding: "utf8",
    ...options,
  });

  if (result.error) fail("Supabase CLI not found. Install it using the official CLI guide.");
  return result;
}

const projectRef = projectRefFromArgs(process.argv.slice(2));
if (!projectRef || !/^[a-z0-9]{20}$/.test(projectRef)) {
  fail("pass --project-ref with the 20-character ref copied from the intended Supabase project");
}

let linkedRef;
try {
  linkedRef = readFileSync("supabase/.temp/project-ref", "utf8").trim();
} catch {
  fail("this repository is not linked; verify the project in the dashboard, then run supabase link --project-ref <PROJECT_REF>");
}
if (linkedRef !== projectRef) {
  fail(`requested ref ${projectRef} does not match this repository's linked ref ${linkedRef}`);
}

const projectList = runSupabase(["projects", "list", "--output-format", "json"]);
if (projectList.status !== 0) {
  fail("could not verify project access; run supabase login and supabase projects list, then retry");
}

let projects;
try {
  projects = JSON.parse(projectList.stdout);
} catch {
  fail("Supabase CLI returned an unexpected project list response");
}

const target = findProject(projects, projectRef);
if (!target) fail("the requested ref was not found in the projects accessible to the logged-in Supabase account");

console.log(`Verified hosted target: ${target.name} (${target.ref})`);
const readline = createInterface({ input: process.stdin, output: process.stdout });
const confirmation = await readline.question("Type the full project ref to authorize applying migrations: ");
readline.close();
if (confirmation.trim() !== projectRef) fail("confirmation did not match; no migration was applied");

try {
  linkedRef = readFileSync("supabase/.temp/project-ref", "utf8").trim();
} catch {
  fail("the linked project ref is no longer available; no migration was applied");
}
if (linkedRef !== projectRef) fail("the linked project changed during confirmation; no migration was applied");

const push = runSupabase(["db", "push", "--linked"], { stdio: "inherit" });
if (push.status !== 0) process.exit(push.status ?? 1);