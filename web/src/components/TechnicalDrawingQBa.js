import React from 'react';

const LABEL_FONT_SIZE = 12;
const DIM_OFFSET_PRIMARY = 15;
const TICK_HALF = 3;
const MARGIN = 12;
const BASELINE_OFFSET = 8;

const mod = (value, modulus) => {
  const result = value % modulus;
  return result >= 0 ? result : result + modulus;
};

const formatNumber = (value) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return value;
};

const buildRectangle = (topLeft, width, height) => ({
  x: topLeft.x,
  y: topLeft.y,
  width,
  height
});

const rectPoints = ({ x, y, width, height }) => ([
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height }
]);

const computeGeometry = ({ a, b, e, f, r }) => {
  const rawPoints = [];

  const l = 3;
  let reference = Math.max(a, b);
  let p = 25;
  if (reference > 1000) {
    p = 30;
  }
  if (reference > 2501) {
    p = 40;
  }

  let maxValue = reference + r + e;
  maxValue = Math.max(maxValue, p, f, e);

  const scale = maxValue === 0 ? 1 : 80 / maxValue;

  const aScaled = a * scale;
  const bScaled = b * scale;
  const eScaled = e * scale;
  const fScaled = f * scale;
  const rScaled = r * scale;
  const pScaled = p * scale;

  let pushX = mod(110 - aScaled - l, 110) / 2;
  if (pushX < 0) {
    pushX = -pushX;
  }
  const pushY = ((90 - bScaled) / 2) + 5;

      const entryRect = buildRectangle(
        { x: 20 + pushX, y: 20 + pushY },
        fScaled,
        bScaled
      );
      const entryPoints = rectPoints(entryRect);
      rawPoints.push(...entryPoints);

      const entryInnerLine = {
        start: { x: entryRect.x + pScaled, y: entryRect.y },
        end: { x: entryRect.x + pScaled, y: entryRect.y + entryRect.height }
      };
      rawPoints.push(entryInnerLine.start, entryInnerLine.end);

      const entryRightLine = {
        start: entryPoints[1],
        end: entryPoints[2]
      };
      rawPoints.push(entryRightLine.start, entryRightLine.end);

      const arcCenter = {
        x: entryPoints[2].x,
        y: entryPoints[2].y + rScaled
      };

      const exitRect = buildRectangle(
        { x: entryPoints[2].x + rScaled, y: entryPoints[2].y + rScaled },
        bScaled,
        eScaled
      );
      const exitPoints = rectPoints(exitRect);
      rawPoints.push(...exitPoints);

      const exitTopLine = {
        start: exitPoints[0],
        end: exitPoints[1]
      };
      rawPoints.push(exitTopLine.start, exitTopLine.end);

      const exitInnerLine = {
        start: { x: exitPoints[3].x, y: exitPoints[3].y - pScaled },
        end: { x: exitPoints[2].x, y: exitPoints[2].y - pScaled }
      };
      rawPoints.push(exitInnerLine.start, exitInnerLine.end);

      const exitTrimLine = {
        start: { x: exitPoints[3].x + pScaled, y: exitPoints[3].y },
        end: { x: exitPoints[2].x - pScaled, y: exitPoints[2].y }
      };
      rawPoints.push(exitTrimLine.start, exitTrimLine.end);

      const innerArc = {
        start: { x: arcCenter.x, y: arcCenter.y - rScaled },
        end: { x: arcCenter.x + rScaled, y: arcCenter.y },
        radius: rScaled
      };
      rawPoints.push(innerArc.start, innerArc.end);

      const outerRadius = rScaled + bScaled;
      const outerArc = {
        start: { x: arcCenter.x, y: arcCenter.y - outerRadius },
        end: { x: arcCenter.x + outerRadius, y: arcCenter.y },
        radius: outerRadius
      };
      rawPoints.push(outerArc.start, outerArc.end);
      rawPoints.push({ x: arcCenter.x - outerRadius, y: arcCenter.y });
      rawPoints.push({ x: arcCenter.x, y: arcCenter.y + outerRadius });

      const radiusLine = {
        start: { x: entryPoints[2].x, y: exitPoints[0].y },
        end: { x: entryPoints[2].x + rScaled, y: exitPoints[0].y - rScaled }
      };
      rawPoints.push(radiusLine.start, radiusLine.end);

      const radiusLabel = {
        x: radiusLine.end.x + 6,
        y: radiusLine.end.y - BASELINE_OFFSET
      };
      rawPoints.push(radiusLabel);

      const crossBaseX = 190 + pushX;
      const crossBaseY = 20 + pushY;

      const crossInnerRect = buildRectangle(
        { x: crossBaseX, y: crossBaseY },
        aScaled,
        bScaled
      );
      rawPoints.push(...rectPoints(crossInnerRect));

      const crossOuterRect = buildRectangle(
        { x: crossBaseX - pScaled, y: crossBaseY - pScaled },
        aScaled + pScaled * 2,
        bScaled + pScaled * 2
      );
      rawPoints.push(...rectPoints(crossOuterRect));

      const crossFootRect = buildRectangle(
        { x: crossInnerRect.x, y: crossInnerRect.y + crossInnerRect.height },
        crossInnerRect.width,
        rScaled
      );
      rawPoints.push(...rectPoints(crossFootRect));

      const crossBaseRect = buildRectangle(
        { x: crossFootRect.x, y: crossFootRect.y + crossFootRect.height },
        crossFootRect.width,
        eScaled
      );
      rawPoints.push(...rectPoints(crossBaseRect));

      const crossBaseLine = {
        start: { x: crossBaseRect.x + pScaled, y: crossBaseRect.y },
        end: { x: crossBaseRect.x + crossBaseRect.width - pScaled, y: crossBaseRect.y }
      };
      rawPoints.push(crossBaseLine.start, crossBaseLine.end);

      const aDimLineY = crossInnerRect.y - DIM_OFFSET_PRIMARY;
      const aDimension = {
        line: {
          start: { x: crossInnerRect.x, y: aDimLineY },
          end: { x: crossInnerRect.x + crossInnerRect.width, y: aDimLineY }
        },
        ticks: [
          {
            start: { x: crossInnerRect.x, y: aDimLineY - TICK_HALF },
            end: { x: crossInnerRect.x, y: aDimLineY + TICK_HALF }
          },
          {
            start: { x: crossInnerRect.x + crossInnerRect.width, y: aDimLineY - TICK_HALF },
            end: { x: crossInnerRect.x + crossInnerRect.width, y: aDimLineY + TICK_HALF }
          }
        ],
        label: {
          x: (crossInnerRect.x * 2 + crossInnerRect.width) / 2 - 4,
          y: aDimLineY - (LABEL_FONT_SIZE + TICK_HALF)
        }
      };
      rawPoints.push(
        aDimension.line.start,
        aDimension.line.end,
        ...aDimension.ticks.map((tick) => tick.start),
        ...aDimension.ticks.map((tick) => tick.end),
        aDimension.label
      );

      const bDimLineX = entryRect.x - DIM_OFFSET_PRIMARY;
      const bDimension = {
        line: {
          start: { x: bDimLineX, y: entryRect.y },
          end: { x: bDimLineX, y: entryRect.y + entryRect.height }
        },
        ticks: [
          {
            start: { x: bDimLineX - TICK_HALF, y: entryRect.y },
            end: { x: bDimLineX + TICK_HALF, y: entryRect.y }
          },
          {
            start: { x: bDimLineX - TICK_HALF, y: entryRect.y + entryRect.height },
            end: { x: bDimLineX + TICK_HALF, y: entryRect.y + entryRect.height }
          }
        ],
        label: {
          x: bDimLineX - (LABEL_FONT_SIZE / 2),
          y: ((entryRect.y + entryRect.height + entryRect.y) / 2) - BASELINE_OFFSET
        }
      };
      rawPoints.push(
        bDimension.line.start,
        bDimension.line.end,
        ...bDimension.ticks.map((tick) => tick.start),
        ...bDimension.ticks.map((tick) => tick.end),
        bDimension.label
      );

      const fDimLineY = entryRect.y - DIM_OFFSET_PRIMARY;
      const fDimension = {
        line: {
          start: { x: entryRect.x, y: fDimLineY },
          end: { x: entryRect.x + entryRect.width, y: fDimLineY }
        },
        ticks: [
          {
            start: { x: entryRect.x, y: fDimLineY - TICK_HALF },
            end: { x: entryRect.x, y: fDimLineY + TICK_HALF }
          },
          {
            start: { x: entryRect.x + entryRect.width, y: fDimLineY - TICK_HALF },
            end: { x: entryRect.x + entryRect.width, y: fDimLineY + TICK_HALF }
          }
        ],
        label: {
          x: (entryRect.x * 2 + entryRect.width) / 2 - 4,
          y: fDimLineY - (LABEL_FONT_SIZE + TICK_HALF)
        }
      };
      rawPoints.push(
        fDimension.line.start,
        fDimension.line.end,
        ...fDimension.ticks.map((tick) => tick.start),
        ...fDimension.ticks.map((tick) => tick.end),
        fDimension.label
      );

      const eShift = aScaled + rScaled + 25;
      const eDimLineX = exitRect.x + eShift - DIM_OFFSET_PRIMARY;
      const eDimension = {
        line: {
          start: { x: eDimLineX, y: exitRect.y },
          end: { x: eDimLineX, y: exitRect.y + exitRect.height }
        },
        ticks: [
          {
            start: { x: eDimLineX - TICK_HALF, y: exitRect.y },
            end: { x: eDimLineX + TICK_HALF, y: exitRect.y }
          },
          {
            start: { x: eDimLineX - TICK_HALF, y: exitRect.y + exitRect.height },
            end: { x: eDimLineX + TICK_HALF, y: exitRect.y + exitRect.height }
          }
        ],
        label: {
          x: eDimLineX + BASELINE_OFFSET,
          y: ((exitRect.y + exitRect.height + exitRect.y) / 2) - BASELINE_OFFSET
        }
      };
      rawPoints.push(
        eDimension.line.start,
        eDimension.line.end,
        ...eDimension.ticks.map((tick) => tick.start),
        ...eDimension.ticks.map((tick) => tick.end),
        eDimension.label
      );

      const minX = Math.min(...rawPoints.map((pt) => pt.x));
      const minY = Math.min(...rawPoints.map((pt) => pt.y));
      const maxX = Math.max(...rawPoints.map((pt) => pt.x));
      const maxY = Math.max(...rawPoints.map((pt) => pt.y));

      const offsetX = minX - MARGIN;
      const offsetY = minY - MARGIN;
      const width = (maxX - minX) + MARGIN * 2;
      const height = (maxY - minY) + MARGIN * 2;

      const translatePoint = (pt) => ({
        x: pt.x - offsetX,
        y: pt.y - offsetY
      });

      const translateRect = (rect) => ({
        x: rect.x - offsetX,
        y: rect.y - offsetY,
        width: rect.width,
        height: rect.height
      });

      const translateLine = ({ start, end }) => ({
        start: translatePoint(start),
        end: translatePoint(end)
      });

      const translateTicks = (ticks) => ticks.map((tick) => translateLine(tick));

      return {
        viewBox: {
          width,
          height
        },
        entryRect: translateRect(entryRect),
        entryInnerLine: translateLine(entryInnerLine),
        entryRightLine: translateLine(entryRightLine),
        exitRect: translateRect(exitRect),
        exitTopLine: translateLine(exitTopLine),
        exitInnerLine: translateLine(exitInnerLine),
        exitTrimLine: translateLine(exitTrimLine),
        innerArc: {
          start: translatePoint(innerArc.start),
          end: translatePoint(innerArc.end),
          radius: innerArc.radius
        },
        outerArc: {
          start: translatePoint(outerArc.start),
          end: translatePoint(outerArc.end),
          radius: outerArc.radius
        },
        arcCenter: translatePoint(arcCenter),
        radiusLine: translateLine(radiusLine),
        radiusLabel: translatePoint(radiusLabel),
        crossInnerRect: translateRect(crossInnerRect),
        crossOuterRect: translateRect(crossOuterRect),
        crossFootRect: translateRect(crossFootRect),
        crossBaseRect: translateRect(crossBaseRect),
        crossBaseLine: translateLine(crossBaseLine),
        dimensions: {
          a: {
            line: translateLine(aDimension.line),
            ticks: translateTicks(aDimension.ticks),
            label: translatePoint(aDimension.label)
          },
          b: {
            line: translateLine(bDimension.line),
            ticks: translateTicks(bDimension.ticks),
            label: translatePoint(bDimension.label)
          },
          e: {
            line: translateLine(eDimension.line),
            ticks: translateTicks(eDimension.ticks),
            label: translatePoint(eDimension.label)
          },
          f: {
            line: translateLine(fDimension.line),
            ticks: translateTicks(fDimension.ticks),
            label: translatePoint(fDimension.label)
          }
        }
      };
    };

function TechnicalDrawingQBa({ a, b, e, f, r }) {
  const aVal = formatNumber(Number(a));
  const bVal = formatNumber(Number(b));
  const eVal = Math.max(0, formatNumber(Number(e)));
  const fVal = Math.max(0, formatNumber(Number(f)));
  const rVal = Math.max(0, formatNumber(Number(r)));

  if (aVal <= 0 || bVal <= 0) {
    return (
      <div className="technical-drawing-empty" role="note">
        Brak danych do wygenerowania rysunku dla łuku QBa.
      </div>
    );
  }

  const geometry = computeGeometry({ a: aVal, b: bVal, e: eVal, f: fVal, r: rVal });
  const strokeColor = '#0d47a1';

  const arcPath = (arc) => `M ${arc.start.x.toFixed(2)} ${arc.start.y.toFixed(2)} A ${arc.radius.toFixed(2)} ${arc.radius.toFixed(2)} 0 0 1 ${arc.end.x.toFixed(2)} ${arc.end.y.toFixed(2)}`;

  const renderDimension = (symbol, data, anchor = 'middle') => (
    <g>
      <line
        x1={data.line.start.x}
        y1={data.line.start.y}
        x2={data.line.end.x}
        y2={data.line.end.y}
        stroke={strokeColor}
        strokeWidth={1.1}
      />
      {data.ticks.map((tick, index) => (
        <line
          key={`${symbol}-tick-${index}`}
          x1={tick.start.x}
          y1={tick.start.y}
          x2={tick.end.x}
          y2={tick.end.y}
          stroke={strokeColor}
          strokeWidth={1.1}
        />
      ))}
      <text
        x={data.label.x}
        y={data.label.y}
        fontSize={LABEL_FONT_SIZE}
        fontWeight="600"
        fill={strokeColor}
        textAnchor={anchor}
      >
        {symbol}
      </text>
    </g>
  );

  return (
    <svg
      className="technical-drawing-svg"
      width="100%"
      height="100%"
      viewBox={`0 0 ${geometry.viewBox.width.toFixed(2)} ${geometry.viewBox.height.toFixed(2)}`}
      role="img"
      aria-label="Rysunek techniczny łuku symetrycznego QBa"
    >
      <title>Łuk symetryczny QBa – widoki</title>

      <rect
        x={geometry.entryRect.x}
        y={geometry.entryRect.y}
        width={geometry.entryRect.width}
        height={geometry.entryRect.height}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.3}
      />
      <line
        x1={geometry.entryInnerLine.start.x}
        y1={geometry.entryInnerLine.start.y}
        x2={geometry.entryInnerLine.end.x}
        y2={geometry.entryInnerLine.end.y}
        stroke={strokeColor}
        strokeWidth={1}
      />
      <line
        x1={geometry.entryRightLine.start.x}
        y1={geometry.entryRightLine.start.y}
        x2={geometry.entryRightLine.end.x}
        y2={geometry.entryRightLine.end.y}
        stroke={strokeColor}
        strokeWidth={1}
      />

      <rect
        x={geometry.exitRect.x}
        y={geometry.exitRect.y}
        width={geometry.exitRect.width}
        height={geometry.exitRect.height}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.3}
      />
      <line
        x1={geometry.exitTopLine.start.x}
        y1={geometry.exitTopLine.start.y}
        x2={geometry.exitTopLine.end.x}
        y2={geometry.exitTopLine.end.y}
        stroke={strokeColor}
        strokeWidth={1}
      />
      <line
        x1={geometry.exitInnerLine.start.x}
        y1={geometry.exitInnerLine.start.y}
        x2={geometry.exitInnerLine.end.x}
        y2={geometry.exitInnerLine.end.y}
        stroke={strokeColor}
        strokeWidth={1}
      />
      <line
        x1={geometry.exitTrimLine.start.x}
        y1={geometry.exitTrimLine.start.y}
        x2={geometry.exitTrimLine.end.x}
        y2={geometry.exitTrimLine.end.y}
        stroke={strokeColor}
        strokeWidth={1}
      />

      <path d={arcPath(geometry.outerArc)} fill="none" stroke={strokeColor} strokeWidth={1.3} />
      <path d={arcPath(geometry.innerArc)} fill="none" stroke={strokeColor} strokeWidth={1.3} />

      <line
        x1={geometry.radiusLine.start.x}
        y1={geometry.radiusLine.start.y}
        x2={geometry.radiusLine.end.x}
        y2={geometry.radiusLine.end.y}
        stroke={strokeColor}
        strokeWidth={1}
      />
      <text
        x={geometry.radiusLabel.x}
        y={geometry.radiusLabel.y}
        fontSize={LABEL_FONT_SIZE}
        fontWeight="600"
        fill={strokeColor}
      >
        r
      </text>

      <rect
        x={geometry.crossOuterRect.x}
        y={geometry.crossOuterRect.y}
        width={geometry.crossOuterRect.width}
        height={geometry.crossOuterRect.height}
        fill="rgba(13, 71, 161, 0.08)"
        stroke={strokeColor}
        strokeWidth={1.3}
      />
      <rect
        x={geometry.crossInnerRect.x}
        y={geometry.crossInnerRect.y}
        width={geometry.crossInnerRect.width}
        height={geometry.crossInnerRect.height}
        fill="#f2f6ff"
        stroke={strokeColor}
        strokeWidth={1}
      />
      <rect
        x={geometry.crossFootRect.x}
        y={geometry.crossFootRect.y}
        width={geometry.crossFootRect.width}
        height={geometry.crossFootRect.height}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1}
      />
      <rect
        x={geometry.crossBaseRect.x}
        y={geometry.crossBaseRect.y}
        width={geometry.crossBaseRect.width}
        height={geometry.crossBaseRect.height}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1}
      />
      <line
        x1={geometry.crossBaseLine.start.x}
        y1={geometry.crossBaseLine.start.y}
        x2={geometry.crossBaseLine.end.x}
        y2={geometry.crossBaseLine.end.y}
        stroke={strokeColor}
        strokeWidth={1}
      />

      {renderDimension('a', geometry.dimensions.a)}
      {renderDimension('b', geometry.dimensions.b, 'end')}
      {renderDimension('e', geometry.dimensions.e, 'start')}
      {renderDimension('f', geometry.dimensions.f)}
    </svg>
  );
}

export default TechnicalDrawingQBa;
