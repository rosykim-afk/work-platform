import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: string | number;
  sub?: string;
  color?: "default" | "blue" | "red" | "green";
}

const COLOR_MAP = {
  default: "bg-card",
  blue: "bg-blue-50 border-blue-200",
  red: "bg-red-50 border-red-200",
  green: "bg-green-50 border-green-200",
};

const VALUE_COLOR = {
  default: "text-foreground",
  blue: "text-blue-700",
  red: "text-red-600",
  green: "text-green-700",
};

export function StatCard({ title, value, sub, color = "default" }: Props) {
  return (
    <div className={cn("rounded-lg border p-4 shadow-sm", COLOR_MAP[color])}>
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className={cn("text-3xl font-bold mt-1", VALUE_COLOR[color])}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
