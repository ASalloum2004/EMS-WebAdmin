import type { DashboardChartSeries } from "../types";
import "./DashboardCharts.scss";

type ChartPoint = {
  x: number;
  y: number;
};

interface DashboardChartProps {
  ariaLabel: string;
  formatLabel: (day: number) => string;
  formatPointLabel: (day: number, value: number) => string;
  series: DashboardChartSeries;
}

const CHART_WIDTH = 680;
const CHART_HEIGHT = 240;
const CHART_PADDING = {
  bottom: 38,
  left: 16,
  right: 16,
  top: 16,
};
const GRID_LINE_COUNT = 4;

function getChartBounds() {
  return {
    bottom: CHART_HEIGHT - CHART_PADDING.bottom,
    height: CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom,
    left: CHART_PADDING.left,
    right: CHART_WIDTH - CHART_PADDING.right,
    top: CHART_PADDING.top,
    width: CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right,
  };
}

function getMaximumValue(series: DashboardChartSeries) {
  return Math.max(...series.points.map((point) => point.value), 1);
}

function getChartPoints(series: DashboardChartSeries, maximumValue: number) {
  const bounds = getChartBounds();
  const lastIndex = Math.max(series.points.length - 1, 1);

  return series.points.map((point, index) => ({
    x: bounds.left + (bounds.width * index) / lastIndex,
    y: bounds.bottom - (point.value / maximumValue) * bounds.height,
  }));
}

function getSmoothPath(points: readonly ChartPoint[]) {
  if (!points.length) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previousPoint = points[index - 1];
    const controlPointOffset = (point.x - previousPoint.x) / 2;

    return `${path} C ${previousPoint.x + controlPointOffset} ${previousPoint.y}, ${point.x - controlPointOffset} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

function ChartGrid() {
  const bounds = getChartBounds();

  return (
    <g className="dashboard-chart__grid" aria-hidden="true">
      {Array.from({ length: GRID_LINE_COUNT + 1 }, (_, index) => {
        const y = bounds.top + (bounds.height * index) / GRID_LINE_COUNT;

        return (
          <line
            key={index}
            x1={bounds.left}
            x2={bounds.right}
            y1={y}
            y2={y}
          />
        );
      })}
    </g>
  );
}

function ChartLabels({
  formatLabel,
  series,
}: Pick<DashboardChartProps, "formatLabel" | "series">) {
  const points = getChartPoints(series, getMaximumValue(series));
  const bounds = getChartBounds();

  return (
    <g className="dashboard-chart__labels" aria-hidden="true">
      {series.points.map((point, index) => (
        <text key={point.day} x={points[index].x} y={bounds.bottom + 26}>
          {formatLabel(point.day)}
        </text>
      ))}
    </g>
  );
}

export function DashboardLineChart({
  ariaLabel,
  formatLabel,
  formatPointLabel,
  series,
}: DashboardChartProps) {
  const bounds = getChartBounds();
  const maximumValue = getMaximumValue(series);
  const points = getChartPoints(series, maximumValue);
  const linePath = getSmoothPath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${bounds.bottom} L ${points[0].x} ${bounds.bottom} Z`
    : "";

  return (
    <svg
      aria-label={ariaLabel}
      className="dashboard-chart dashboard-chart--line"
      role="img"
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
    >
      <defs>
        <linearGradient id="dashboard-line-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--ems-color-primary)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--ems-color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ChartGrid />
      <path className="dashboard-chart__area" d={areaPath} />
      <path className="dashboard-chart__line" d={linePath} />
      <g className="dashboard-chart__points">
        {series.points.map((point, index) => (
          <circle
            cx={points[index].x}
            cy={points[index].y}
            key={point.day}
            r="4"
          >
            <title>{formatPointLabel(point.day, point.value)}</title>
          </circle>
        ))}
      </g>
      <ChartLabels formatLabel={formatLabel} series={series} />
    </svg>
  );
}

export function DashboardBarChart({
  ariaLabel,
  formatLabel,
  formatPointLabel,
  series,
}: DashboardChartProps) {
  const bounds = getChartBounds();
  const maximumValue = getMaximumValue(series);
  const points = getChartPoints(series, maximumValue);
  const barSlotWidth = bounds.width / Math.max(series.points.length, 1);
  const barWidth = Math.min(48, barSlotWidth * 0.52);

  return (
    <svg
      aria-label={ariaLabel}
      className="dashboard-chart dashboard-chart--bar"
      role="img"
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
    >
      <ChartGrid />
      <g className="dashboard-chart__bars">
        {series.points.map((point, index) => {
          const barHeight = bounds.bottom - points[index].y;

          return (
            <rect
              height={barHeight}
              key={point.day}
              rx="6"
              width={barWidth}
              x={points[index].x - barWidth / 2}
              y={points[index].y}
            >
              <title>{formatPointLabel(point.day, point.value)}</title>
            </rect>
          );
        })}
      </g>
      <ChartLabels formatLabel={formatLabel} series={series} />
    </svg>
  );
}
