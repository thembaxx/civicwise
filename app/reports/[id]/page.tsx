import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CaretLeft as ChevronLeft } from '@phosphor-icons/react/dist/ssr'
import { IssueDetail } from '@/components/issues/issue-detail'
import { HonestyNote } from '@/components/issues/honesty-note'
import { getIssue } from '@/lib/issues-store'
import { getViewerId } from '@/lib/viewer'

export default async function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const issue = getIssue(await getViewerId(), id)
  if (!issue) notFound()

  return (
    <div className="flex flex-col gap-4 pt-1">
      <Link href="/reports" className="inline-flex items-center gap-1 self-start text-sm font-semibold text-muted-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        History
      </Link>
      <IssueDetail initial={issue} />
      <HonestyNote />
    </div>
  )
}
