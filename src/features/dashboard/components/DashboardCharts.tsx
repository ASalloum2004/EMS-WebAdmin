import type { DashboardChartSeries } from "../types";
import "./DashboardCharts.scss";

type ChartPoint = {
  x: number;
  y: number;
};

interface DashboardChartProps {
  ariaLabel: string;
  formatLabel: (date: string) => string;
  formatPointLabel: (date: string, value: number) => string;
  series: DashboardChartSeries;
  yAxisValues?: readonly number[];
}

const CHART_WIDTH = 680;
const CHART_HEIGHT = 240;
const CHART_PADDING = {
  bottom: 38,
  left: 54,
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

function getMaximumValue(
  series: DashboardChartSeries,
  yAxisValues: readonly number[] | undefined,
) {
  const requestedMaximum = Math.max(...(yAxisValues ?? []), 0);

  return Math.max(
    ...series.points.map((point) => point.value),
    requestedMaximum,
    1,
  );
}

function getValueY(value: number, maximumValue: number) {
  const bounds = getChartBounds();

  return bounds.bottom - (value / maximumValue) * bounds.height;
}

function getChartPoints(series: DashboardChartSeries, maximumValue: number) {
  const bounds = getChartBounds();
  const lastIndex = Math.max(series.points.length - 1, 1);

  return series.points.map((point, index) => ({
    x: bounds.left + (bounds.width * index) / lastIndex,
    y: getValueY(point.value, maximumValue),
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

function ChartGrid({
  maximumValue,
  yAxisValues,
}: Pick<DashboardChartProps, "yAxisValues"> & { maximumValue: number }) {
  const bounds = getChartBounds();
  const gridValues = yAxisValues ?? Array.from(
    { length: GRID_LINE_COUNT + 1 },
    (_, index) => (maximumValue * index) / GRID_LINE_COUNT,
  );

  return (
    <g className="dashboard-chart__grid" aria-hidden="true">
      {gridValues.map((value) => (
        <line
          key={value}
          x1={bounds.left}
          x2={bounds.right}
          y1={getValueY(value, maximumValue)}
          y2={getValueY(value, maximumValue)}
        />
      ))}
    </g>
  );
}

function ChartYAxis({
  maximumValue,
  yAxisValues,
}: Pick<DashboardChartProps, "yAxisValues"> & { maximumValue: number }) {
  if (!yAxisValues?.length) {
    return null;
  }

  const bounds = getChartBounds();

  return (
    <g className="dashboard-chart__y-axis" aria-hidden="true">
      {yAxisValues.map((value) => (
        <text
          alignmentBaseline="middle"
          key={value}
          x={bounds.left - 12}
          y={getValueY(value, maximumValue)}
        >
          {value}
        </text>
      ))}
    </g>
  );
}

function ChartLabels({
  formatLabel,
  maximumValue,
  series,
}: Pick<DashboardChartProps, "formatLabel" | "series"> & {
  maximumValue: number;
}) {
  const points = getChartPoints(series, maximumValue);
  const bounds = getChartBounds();

  return (
    <g className="dashboard-chart__labels" aria-hidden="true">
      {series.points.map((point, index) => (
        <text key={point.date} x={points[index].x} y={bounds.bottom + 26}>
          {formatLabel(point.date)}
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
  yAxisValues,
}: DashboardChartProps) {
  const bounds = getChartBounds();
  const maximumValue = getMaximumValue(series, yAxisValues);
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
      <ChartGrid maximumValue={maximumValue} yAxisValues={yAxisValues} />
      <ChartYAxis maximumValue={maximumValue} yAxisValues={yAxisValues} />
      <path className="dashboard-chart__area" d={areaPath} />
      <path className="dashboard-chart__line" d={linePath} />
      <g className="dashboard-chart__points">
        {series.points.map((point, index) => (
          <circle
            cx={points[index].x}
            cy={points[index].y}
            key={point.date}
            r="4"
          >
            <title>{formatPointLabel(point.date, point.value)}</title>
          </circle>
        ))}
      </g>
      <ChartLabels
        formatLabel={formatLabel}
        maximumValue={maximumValue}
        series={series}
      />
    </svg>
  );
}
