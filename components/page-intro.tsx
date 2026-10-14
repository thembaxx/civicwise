export function PageIntro({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string
  description?: string
  eyebrow?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div className="flex max-w-2xl flex-col gap-3">
        {eyebrow && <p className="eyebrow text-positive">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && (
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
