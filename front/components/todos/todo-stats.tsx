import { CheckCircle2, Clock3, ListTodo, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

type TodoStatsProps = {
  total: number;
  done: number;
  remaining: number;
};

export function TodoStats({ total, done, remaining }: TodoStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="Total" value={total} icon={ListTodo} iconClassName="text-muted-foreground" />
      <StatCard label="Terminées" value={done} icon={CheckCircle2} iconClassName="text-success" />
      <StatCard label="Restantes" value={remaining} icon={Clock3} iconClassName="text-primary" />
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClassName: string;
};

function StatCard({ label, value, icon: Icon, iconClassName }: StatCardProps) {
  return (
    <Card className="gap-1 px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
        <Icon className={`size-4 shrink-0 ${iconClassName}`} aria-hidden="true" />
        {label}
      </div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}
