import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  data: { positive: number; neutral: number; negative: number };
}

export const SentimentChart = ({ data }: Props) => {
  const chartData = [
    { name: "Positive", value: data.positive, color: "hsl(var(--positive))" },
    { name: "Neutral", value: data.neutral, color: "hsl(var(--neutral))" },
    { name: "Negative", value: data.negative, color: "hsl(var(--negative))" },
  ].filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={130}
          paddingAngle={2}
          dataKey="value"
          stroke="hsl(var(--foreground))"
          strokeWidth={2}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "2px solid hsl(var(--foreground))",
            borderRadius: 0,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
