import type { Metadata } from "next";
import { ReportForm } from "@/components/issues/report-form";
import { HonestyNote } from "@/components/issues/honesty-note";
import { getMunicipalities } from "@/lib/municipal-money";
import { getFollowedCode } from "@/lib/viewer";
import { PageIntro } from "@/components/page-intro";
import { AccountSignIn } from "@/components/account-sign-in";
import { headers } from "next/headers";
import { getAuth, getVerifiedAccount } from "@/lib/auth";
import { demoDataEnabled } from "@/lib/durable-state";
import { NotePencil, ClockCounterClockwise, FileArrowDown } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = { title: "Log a problem" };

export default async function ReportPage() {
  const [municipalities, followed] = await Promise.all([getMunicipalities(), getFollowedCode()]);
  const account = await getVerifiedAccount(await headers());
  const localDemo = demoDataEnabled() && !process.env.DATABASE_URL && process.env.VERCEL !== "1";
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="A RECORD THAT BELONGS TO YOU"
        title="Report a problem"
        description="Tell us what you see. Your report is timestamped and kept in your own history, whatever happens on the municipal side."
      />
      <div className="grid items-start gap-7 lg:grid-cols-[1fr_2fr] lg:gap-10">
        <aside className="panel order-2 flex flex-col gap-6 bg-muted/60 p-6 lg:order-none lg:p-8">
          <h2 className="editorial-title text-2xl">A clearer path forward.</h2>
          <ol className="flex flex-col gap-6 text-sm">
            <li className="flex gap-3">
              <NotePencil className="mt-0.5 size-5 shrink-0 text-positive" aria-hidden />
              <div>
                <p className="font-semibold">Start with what you know</p>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Describe the problem and where it is. A precise location helps neighbours
                  recognise it.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <ClockCounterClockwise className="mt-0.5 size-5 shrink-0 text-positive" aria-hidden />
              <div>
                <p className="font-semibold">Keep the record up to date</p>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Add a municipal reference, record changes, or set a reminder to check again.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <FileArrowDown className="mt-0.5 size-5 shrink-0 text-positive" aria-hidden />
              <div>
                <p className="font-semibold">Take your history with you</p>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Export your timestamps and updates for a councillor meeting or follow-up.
                </p>
              </div>
            </li>
          </ol>
          <HonestyNote />
        </aside>
        {account || localDemo ? (
          <ReportForm municipalities={municipalities} defaultCode={followed} />
        ) : (
          <AccountSignIn configured={Boolean(getAuth())} account={null} />
        )}
      </div>
    </div>
  );
}
