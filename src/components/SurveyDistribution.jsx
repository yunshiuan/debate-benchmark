import {displayAnswer} from "@/lib/explorerOptions";

export default function SurveyDistribution({record, field, label}) {
  if (!record?.categories?.length) return null;

  return (
    <figure className="mt-4" aria-label={`${label} survey response distribution`}>
      <figcaption className="mb-3 text-xs font-medium text-gray-600">Survey responses</figcaption>
      <ul className="m-0 max-h-60 list-none space-y-3 overflow-y-auto overscroll-contain p-0 pr-2" tabIndex={record.categories.length > 6 ? 0 : undefined} aria-label={`${label} categories and percentages`}>
        {record.categories.map((category) => (
          <li key={`${field}-${category.label}`} title={`${category.count.toLocaleString()} responses (${category.percent}% of respondents)`}>
            <div className="mb-1 flex items-start justify-between gap-3 text-xs leading-relaxed">
              <span className="min-w-0 break-words text-gray-700">{displayAnswer(category.label)}</span>
              <span className="shrink-0 font-medium tabular-nums text-gray-900" aria-label={`${category.percent}% of respondents`}>{category.percent.toLocaleString("en-US", {maximumFractionDigits: 2})}%</span>
            </div>
            <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-[#9B0000]" style={{width: `${Math.min(100, Math.max(0, category.percent))}%`}} />
            </div>
          </li>
        ))}
      </ul>
      {record.multi_select && <p className="mb-0 mt-3 text-xs leading-relaxed text-gray-600">Multiple selections allowed; percentages may sum to more than 100%.</p>}
    </figure>
  );
}
