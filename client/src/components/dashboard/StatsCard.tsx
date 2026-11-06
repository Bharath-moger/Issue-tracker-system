import type { LucideIcon } from 'lucide-react';
export default function StatsCard({
  title,
  value,
  icon: Icon,
  tone,
  description,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  tone: string;
  description: string;
}) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <span className={`stat-icon stat-${tone}`}>
          <Icon size={18} />
        </span>
      </div>
      <strong className="stat-value">{value}</strong>
      <p>{description}</p>
    </article>
  );
}
