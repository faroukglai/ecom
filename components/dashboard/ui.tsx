import Link from "next/link";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { orderStatusLabel, type DashCopy } from "@/lib/dashboard-i18n";

export function PageHeader({ title, subtitle, crumbs, children }: {
  title: string;
  subtitle?: string;
  crumbs?: { label: string; href?: string }[];
  children?: React.ReactNode;
}) {
  return (
    <div className="dash-topbar">
      <div>
        {crumbs?.length ? (
          <div className="dash-crumb">
            {crumbs.map((crumb, index) => (
              <span key={crumb.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {index > 0 ? <Icon name="arrowRight" size={12} className="dash-flip"/> : null}
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
              </span>
            ))}
          </div>
        ) : null}
        <h1>{title}</h1>
        {subtitle ? <p className="dash-sub">{subtitle}</p> : null}
      </div>
      {children ? <div className="dash-actions">{children}</div> : null}
    </div>
  );
}

export function StatusPill({ t, status }: { t: DashCopy; status: string }) {
  return <span className={`dash-status ${status}`}>{orderStatusLabel(t, status)}</span>;
}

export function Delta({ value, t }: { value: number; t: DashCopy }) {
  const rounded = Math.round(value * 10) / 10;
  const dir = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  return (
    <span className={`dash-delta ${dir}`} title={t.vsPrevious}>
      {dir === "flat" ? null : <Icon name={dir === "up" ? "arrowUpRight" : "arrowDownRight"} size={14}/>}
      {Math.abs(rounded)}%
    </span>
  );
}

export function EmptyState({ icon, title, hint, children }: { icon: IconName; title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="dash-empty">
      <span className="dash-chip"><Icon name={icon} size={22}/></span>
      <strong>{title}</strong>
      {hint ? <span>{hint}</span> : null}
      {children}
    </div>
  );
}

export function KpiCard({ icon, label, value, children, alert }: { icon: IconName; label: string; value: string; children?: React.ReactNode; alert?: boolean }) {
  return (
    <article className={`dash-card dash-kpi${alert ? " is-alert" : ""}`}>
      <div className="dash-kpi-head"><span className="dash-chip"><Icon name={icon} size={18}/></span>{label}</div>
      <strong>{value}</strong>
      {children ? <div className="dash-kpi-foot">{children}</div> : null}
    </article>
  );
}

/** Smooth area chart rendered as plain SVG on the server. */
export function AreaChart({ points, format }: { points: { label: string; value: number }[]; format: (value: number) => string }) {
  const width = 640;
  const height = 220;
  const padX = 8;
  const padTop = 14;
  const padBottom = 28;
  const max = Math.max(1, ...points.map((point) => point.value));
  const niceMax = Math.ceil(max / 10) * 10 || 10;
  const step = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0;
  const xy = points.map((point, index) => ({
    x: padX + index * step,
    y: padTop + (1 - point.value / niceMax) * (height - padTop - padBottom),
  }));
  const path = xy.reduce((d, point, index, all) => {
    if (index === 0) return `M${point.x},${point.y}`;
    const prev = all[index - 1]!;
    const mid = (prev.x + point.x) / 2;
    return `${d} C${mid},${prev.y} ${mid},${point.y} ${point.x},${point.y}`;
  }, "");
  const area = xy.length ? `${path} L${xy[xy.length - 1]!.x},${height - padBottom} L${xy[0]!.x},${height - padBottom} Z` : "";
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));
  const ticks = [0, 0.5, 1];

  return (
    <div className="dash-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={points.map((point) => `${point.label}: ${format(point.value)}`).join(", ")}>
        <defs>
          <linearGradient id="dash-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-a)" stopOpacity="0.22"/>
            <stop offset="100%" stopColor="var(--chart-a)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {ticks.map((tick) => {
          const y = padTop + (1 - tick) * (height - padTop - padBottom);
          return <line key={tick} className="grid" x1={padX} x2={width - padX} y1={y} y2={y}/>;
        })}
        {area ? <path d={area} fill="url(#dash-area)"/> : null}
        {path ? <path className="line" d={path}/> : null}
        {xy.map((point, index) => (
          <g key={index}>
            <title>{`${points[index]!.label}: ${format(points[index]!.value)}`}</title>
            <rect className="hit" x={point.x - Math.max(step / 2, 8)} y={0} width={Math.max(step, 16)} height={height - padBottom}/>
            {points[index]!.value > 0 || points.length <= 14 ? <circle className="dot" cx={point.x} cy={point.y} r={points.length > 14 ? 0 : 3.5}/> : null}
          </g>
        ))}
        {points.map((point, index) => index % labelEvery === 0 ? (
          <text key={index} className="tick" x={xy[index]!.x} y={height - 6} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}>{point.label}</text>
        ) : null)}
      </svg>
    </div>
  );
}
