import { appendFile, mkdir, writeFile } from "node:fs/promises";

const url = new URL("https://municipaldata.treasury.gov.za/api/cubes/municipalities/facts");
url.searchParams.set("fields", "municipality.demarcation_code,municipality.name");
url.searchParams.set("pagesize", "1");
const output = { checkedAt: new Date().toISOString(), provider: url.origin, status: "unknown" };
try {
  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
    headers: { Accept: "application/json", "User-Agent": "CivicWise-evidence-check/1.0" },
  });
  output.http = res.status;
  if (!res.ok) throw Error("Treasury API HTTP " + res.status);
  if (!res.headers.get("content-type")?.includes("json")) throw Error("Unexpected response type");
  const body = await res.text();
  if (body.length > 250000) throw Error("Unexpected oversized response");
  const data = JSON.parse(body);
  if (!Array.isArray(data.data) || !data.data.length) throw Error("No municipality records returned");
  const first = data.data[0];
  if (!first["municipality.demarcation_code"] || !first["municipality.name"]) {
    throw Error("Treasury API returned an unexpected record schema");
  }
  output.status = "ok";
} catch (error) {
  output.status = "unavailable";
  output.error = error.message;
  process.exitCode = 1;
}
await mkdir("reports", { recursive: true });
await writeFile("reports/treasury-source-health.json", JSON.stringify(output, null, 2) + "\n");
const summary = "## CivicWise Treasury data-source health\n\nSource: " + url.origin + "\n\nStatus: **" + output.status + "**\n\n" +
  (output.error ? "Issue: " + output.error + "\n" : "Schema and sample record returned as expected.\n");
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
