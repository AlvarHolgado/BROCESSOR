/**
 * Responsive line chart: remaining principal vs. cumulative interest over
 * the loan term. Hand-rolled inline SVG (viewBox + width:100%) rather than a
 * charting library — the dataset is small (a few hundred points at most) and
 * this avoids pulling in a heavy dependency for a single chart.
 */

import { useMemo } from 'react';
import type { AmortizationRow } from '../types/simulator';
import { COLORS } from '../styles/theme';
import { useLanguage } from '../i18n/LanguageContext';

export interface AmortizationChartProps {
  schedule: AmortizationRow[];
}

const VIEWBOX_WIDTH = 640;
const VIEWBOX_HEIGHT = 320;
const PADDING_LEFT = 76;
const PADDING_RIGHT = 16;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 36;
const INNER_WIDTH = VIEWBOX_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const INNER_HEIGHT = VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
const Y_AXIS_TICK_COUNT = 4;

interface ChartPoint {
  month: number;
  remainingBalance: number;
  cumulativeInterest: number;
}

function buildChartPoints(schedule: AmortizationRow[]): ChartPoint[] {
  if (schedule.length === 0) {
    return [];
  }

  const initialPrincipal = schedule[0].remainingBalance + schedule[0].principalPaid;
  const points: ChartPoint[] = [{ month: 0, remainingBalance: initialPrincipal, cumulativeInterest: 0 }];

  let cumulativeInterest = 0;
  for (const row of schedule) {
    cumulativeInterest += row.interestPaid;
    points.push({ month: row.monthNumber, remainingBalance: row.remainingBalance, cumulativeInterest });
  }

  return points;
}

function yearTickStep(totalYears: number): number {
  if (totalYears <= 10) return 1;
  if (totalYears <= 20) return 2;
  return 5;
}

export function AmortizationChart({ schedule }: AmortizationChartProps) {
  const { t, formatters } = useLanguage();
  const points = useMemo(() => buildChartPoints(schedule), [schedule]);

  if (points.length === 0) {
    return null;
  }

  const totalMonths = points[points.length - 1].month;
  const totalYears = Math.round(totalMonths / 12);
  const maxValue = Math.max(...points.map((point) => Math.max(point.remainingBalance, point.cumulativeInterest)));

  const xScale = (month: number) => PADDING_LEFT + (month / totalMonths) * INNER_WIDTH;
  const yScale = (value: number) => PADDING_TOP + INNER_HEIGHT - (value / maxValue) * INNER_HEIGHT;

  const balancePath = points.map((point) => `${xScale(point.month)},${yScale(point.remainingBalance)}`).join(' ');
  const interestPath = points.map((point) => `${xScale(point.month)},${yScale(point.cumulativeInterest)}`).join(' ');

  const yTicks = Array.from({ length: Y_AXIS_TICK_COUNT + 1 }, (_, index) => (maxValue / Y_AXIS_TICK_COUNT) * index);

  const tickStep = yearTickStep(totalYears);
  const xTickYears = Array.from(
    { length: Math.floor(totalYears / tickStep) + 1 },
    (_, index) => index * tickStep
  ).filter((year) => year > 0);

  const finalInterest = points[points.length - 1].cumulativeInterest;

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        style={{ width: '100%', height: 'auto' }}
        role="img"
        aria-label={t.amortizationChart.chartAriaLabel(
          formatters.currency0.format(points[0].remainingBalance),
          formatters.currency0.format(finalInterest),
          totalYears
        )}
      >
        {yTicks.map((tickValue) => (
          <g key={tickValue}>
            <line
              x1={PADDING_LEFT}
              x2={VIEWBOX_WIDTH - PADDING_RIGHT}
              y1={yScale(tickValue)}
              y2={yScale(tickValue)}
              stroke={COLORS.border}
              strokeOpacity={0.35}
              strokeWidth={1}
            />
            <text
              x={PADDING_LEFT - 8}
              y={yScale(tickValue)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fill={COLORS.textSecondary}
            >
              {formatters.currencyCompact1.format(tickValue)}
            </text>
          </g>
        ))}

        {xTickYears.map((year) => (
          <text
            key={year}
            x={xScale(year * 12)}
            y={VIEWBOX_HEIGHT - PADDING_BOTTOM + 18}
            textAnchor="middle"
            fontSize={11}
            fill={COLORS.textSecondary}
          >
            {t.amortizationChart.yearLabel(year)}
          </text>
        ))}

        <line
          x1={PADDING_LEFT}
          x2={PADDING_LEFT}
          y1={PADDING_TOP}
          y2={VIEWBOX_HEIGHT - PADDING_BOTTOM}
          stroke={COLORS.border}
          strokeWidth={1}
        />
        <line
          x1={PADDING_LEFT}
          x2={VIEWBOX_WIDTH - PADDING_RIGHT}
          y1={VIEWBOX_HEIGHT - PADDING_BOTTOM}
          y2={VIEWBOX_HEIGHT - PADDING_BOTTOM}
          stroke={COLORS.border}
          strokeWidth={1}
        />

        <polyline points={balancePath} fill="none" stroke={COLORS.chart.principal} strokeWidth={2.5} />
        <polyline points={interestPath} fill="none" stroke={COLORS.chart.interest} strokeWidth={2.5} />
      </svg>

      <figcaption style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: COLORS.textSecondary }}>
        <LegendItem color={COLORS.chart.principal} label={t.amortizationChart.principalLegend} />
        <LegendItem color={COLORS.chart.interest} label={t.amortizationChart.interestLegend} />
      </figcaption>
    </figure>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      <span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', backgroundColor: color }} />
      {label}
    </span>
  );
}
