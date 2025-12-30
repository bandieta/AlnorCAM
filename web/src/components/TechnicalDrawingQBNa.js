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

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const translatePoint = (pt, dx, dy) => ({
  x: pt.x - dx,
  y: pt.y - dy
});

const translatePolygon = (points, dx, dy) => points.map((pt) => translatePoint(pt, dx, dy));

const translateLine = (line, dx, dy) => ({
  start: translatePoint(line.start, dx, dy),
  end: translatePoint(line.end, dx, dy)
});

const translateTicks = (ticks, dx, dy) => ticks.map((tick) => translateLine(tick, dx, dy));

const computeGeometry = ({ a, b, e, f, r, alfa }) => {
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
  const pScaled = p * scale;
  const rScaled = Math.max(r * scale, 1);

  const alphaRad = toRadians(alfa);
  const sinA = Math.sin(alphaRad);
  const cosA = Math.cos(alphaRad);

  let pushX = mod(110 - aScaled - l, 110) / 2;
  if (pushX < 0) {
    pushX = -pushX;
  }
  const pushY = ((90 - bScaled) / 2) + 5;

  const frontBaseX = 190 + pushX;
  const frontBaseY = 20 + pushY;

  const frontInner = [
    { x: frontBaseX, y: frontBaseY - sinA * fScaled },
    { x: frontBaseX + aScaled, y: frontBaseY - sinA * fScaled },
    { x: frontBaseX + aScaled, y: frontBaseY + sinA * bScaled },
    { x: frontBaseX, y: frontBaseY + sinA * bScaled }
  ];
  frontInner.forEach((pt) => rawPoints.push(pt));

  const frontOuter = [
    { x: frontBaseX - pScaled, y: frontBaseY - pScaled - sinA * fScaled },
    { x: frontBaseX + aScaled + pScaled, y: frontBaseY - pScaled - sinA * fScaled },
    { x: frontBaseX + aScaled + pScaled, y: frontBaseY + pScaled + sinA * bScaled },
    { x: frontBaseX - pScaled, y: frontBaseY + pScaled + sinA * bScaled }
  ];
  frontOuter.forEach((pt) => rawPoints.push(pt));

  const underInnerTop = frontInner[3].y;
  const underInner = [
    { x: frontInner[0].x, y: underInnerTop },
    { x: frontInner[1].x, y: underInnerTop },
    { x: frontInner[1].x, y: underInnerTop + sinA * rScaled },
    { x: frontInner[0].x, y: underInnerTop + sinA * rScaled }
  ];
  underInner.forEach((pt) => rawPoints.push(pt));

  const underExtension = [
    { x: underInner[0].x, y: underInner[2].y },
    { x: underInner[1].x, y: underInner[2].y },
    { x: underInner[1].x, y: underInner[2].y + eScaled },
    { x: underInner[0].x, y: underInner[3].y + eScaled }
  ];
  underExtension.forEach((pt) => rawPoints.push(pt));

  const underExtensionTopLine = {
    start: { x: underExtension[0].x, y: underExtension[0].y },
    end: { x: underExtension[1].x, y: underExtension[1].y }
  };
  rawPoints.push(underExtensionTopLine.start, underExtensionTopLine.end);

  const underExtensionInnerLine = {
    start: { x: underExtension[2].x, y: underExtension[2].y - pScaled },
    end: { x: underExtension[3].x, y: underExtension[3].y - pScaled }
  };
  rawPoints.push(underExtensionInnerLine.start, underExtensionInnerLine.end);

  const underExtensionTrimLine = {
    start: { x: underExtension[2].x + pScaled, y: underExtension[2].y },
    end: { x: underExtension[3].x - pScaled, y: underExtension[3].y }
  };
  rawPoints.push(underExtensionTrimLine.start, underExtensionTrimLine.end);

  const entryBaseX = 20 + pushX;
  const entryBaseY = 20 + pushY;

  const entryTopRightPre = { x: entryBaseX + fScaled, y: entryBaseY };
  const entryBottomRightPre = { x: entryBaseX + fScaled, y: entryBaseY + sinA * bScaled };

  const entryCorner3 = {
    x: entryTopRightPre.x + cosA * (rScaled + bScaled),
    y: entryBaseY
  };
  const entryCorner4 = {
    x: entryBottomRightPre.x + cosA * rScaled,
    y: entryBaseY + sinA * bScaled
  };
  const entryCorner1 = {
    x: entryCorner4.x - sinA * fScaled,
    y: entryCorner4.y - cosA * fScaled
  };
  const entryCorner2 = {
    x: entryCorner3.x - sinA * fScaled,
    y: entryCorner3.y - cosA * fScaled
  };

  const entryPolygon = [entryCorner1, entryCorner2, entryCorner3, entryCorner4];
  entryPolygon.forEach((pt) => rawPoints.push(pt));

  const entrySeam = {
    start: entryCorner4,
    end: entryCorner3
  };
  rawPoints.push(entrySeam.start, entrySeam.end);

  const entryTopHighlight = {
    start: entryCorner2,
    end: entryCorner3
  };
  rawPoints.push(entryTopHighlight.start, entryTopHighlight.end);

  const entryFlangeInset = {
    start: {
      x: entryCorner1.x - cosA * pScaled,
      y: entryCorner1.y + sinA * pScaled
    },
    end: {
      x: entryCorner2.x + cosA * pScaled,
      y: entryCorner2.y - sinA * pScaled
    }
  };
  rawPoints.push(entryFlangeInset.start, entryFlangeInset.end);

  const entryFlangeFace = {
    start: {
      x: entryCorner1.x + sinA * pScaled,
      y: entryCorner1.y + cosA * pScaled
    },
    end: {
      x: entryCorner2.x + sinA * pScaled,
      y: entryCorner2.y + cosA * pScaled
    }
  };
  rawPoints.push(entryFlangeFace.start, entryFlangeFace.end);

  const exitTopLeft = {
    x: entryBottomRightPre.x + rScaled,
    y: entryBottomRightPre.y + sinA * rScaled
  };
  const exitTopRight = { x: exitTopLeft.x + bScaled, y: exitTopLeft.y };
  const exitBottomRight = { x: exitTopRight.x, y: exitTopRight.y + eScaled };
  const exitBottomLeft = { x: exitTopLeft.x, y: exitTopLeft.y + eScaled };

  const exitRect = [exitTopLeft, exitTopRight, exitBottomRight, exitBottomLeft];
  exitRect.forEach((pt) => rawPoints.push(pt));

  const exitTopLine = { start: exitTopLeft, end: exitTopRight };
  rawPoints.push(exitTopLine.start, exitTopLine.end);

  const exitInnerBottomLine = {
    start: { x: exitBottomRight.x, y: exitBottomRight.y - pScaled },
    end: { x: exitBottomLeft.x, y: exitBottomLeft.y - pScaled }
  };
  rawPoints.push(exitInnerBottomLine.start, exitInnerBottomLine.end);

  const arcCenter = {
    x: exitTopLeft.x - rScaled,
    y: exitTopLeft.y
  };

  const innerArc = {
    radius: rScaled,
    start: {
      x: arcCenter.x + Math.cos(-alphaRad) * rScaled,
      y: arcCenter.y + Math.sin(-alphaRad) * rScaled
    },
    end: {
      x: arcCenter.x + rScaled,
      y: arcCenter.y
    }
  };
  rawPoints.push(innerArc.start, innerArc.end);

  const outerArcRadius = rScaled + bScaled;
  const outerArc = {
    radius: outerArcRadius,
    start: {
      x: arcCenter.x + Math.cos(-alphaRad) * outerArcRadius,
      y: arcCenter.y + Math.sin(-alphaRad) * outerArcRadius
    },
    end: {
      x: arcCenter.x + outerArcRadius,
      y: arcCenter.y
    }
  };
  rawPoints.push(outerArc.start, outerArc.end);

  const radiusLine = {
    start: { x: arcCenter.x, y: arcCenter.y },
    end: { x: arcCenter.x + rScaled, y: arcCenter.y - sinA * rScaled }
  };
  rawPoints.push(radiusLine.start, radiusLine.end);

  const radiusLabel = {
    x: arcCenter.x + rScaled + 6,
    y: arcCenter.y - rScaled - 12
  };
  rawPoints.push(radiusLabel);

  const aLineY = frontInner[0].y - DIM_OFFSET_PRIMARY;
  const aDimension = {
    line: {
      start: { x: frontInner[0].x, y: aLineY },
      end: { x: frontInner[1].x, y: aLineY }
    },
    ticks: [
      {
        start: { x: frontInner[0].x, y: aLineY - TICK_HALF },
        end: { x: frontInner[0].x, y: aLineY + TICK_HALF }
      },
      {
        start: { x: frontInner[1].x, y: aLineY - TICK_HALF },
        end: { x: frontInner[1].x, y: aLineY + TICK_HALF }
      }
    ],
    label: {
      x: (frontInner[0].x + frontInner[1].x) / 2 - 4,
      y: aLineY - (LABEL_FONT_SIZE + TICK_HALF)
    }
  };
  rawPoints.push(
    aDimension.line.start,
    aDimension.line.end,
    ...aDimension.ticks.map((tick) => tick.start),
    ...aDimension.ticks.map((tick) => tick.end),
    aDimension.label
  );

  const bLineStart = {
    x: entryCorner1.x - sinA * DIM_OFFSET_PRIMARY,
    y: entryCorner1.y - cosA * DIM_OFFSET_PRIMARY
  };
  const bLineEnd = {
    x: entryCorner2.x - sinA * DIM_OFFSET_PRIMARY,
    y: entryCorner2.y - cosA * DIM_OFFSET_PRIMARY
  };
  const bDimension = {
    line: {
      start: bLineStart,
      end: bLineEnd
    },
    ticks: [
      {
        start: {
          x: bLineStart.x - sinA * TICK_HALF,
          y: bLineStart.y - cosA * TICK_HALF
        },
        end: {
          x: bLineStart.x + sinA * TICK_HALF,
          y: bLineStart.y + cosA * TICK_HALF
        }
      },
      {
        start: {
          x: bLineEnd.x - sinA * TICK_HALF,
          y: bLineEnd.y - cosA * TICK_HALF
        },
        end: {
          x: bLineEnd.x + sinA * TICK_HALF,
          y: bLineEnd.y + cosA * TICK_HALF
        }
      }
    ],
    label: {
      x: (bLineStart.x + bLineEnd.x) / 2 - 8,
      y: bLineEnd.y
    }
  };
  rawPoints.push(
    bDimension.line.start,
    bDimension.line.end,
    ...bDimension.ticks.map((tick) => tick.start),
    ...bDimension.ticks.map((tick) => tick.end),
    bDimension.label
  );

  const fLineStart = {
    x: entryCorner2.x + cosA * DIM_OFFSET_PRIMARY,
    y: entryCorner2.y - sinA * DIM_OFFSET_PRIMARY
  };
  const fLineEnd = {
    x: entryCorner3.x + cosA * DIM_OFFSET_PRIMARY,
    y: entryCorner3.y - sinA * DIM_OFFSET_PRIMARY
  };
  const fDimension = {
    line: {
      start: fLineStart,
      end: fLineEnd
    },
    ticks: [
      {
        start: {
          x: fLineStart.x - cosA * TICK_HALF,
          y: fLineStart.y + sinA * TICK_HALF
        },
        end: {
          x: fLineStart.x + cosA * TICK_HALF,
          y: fLineStart.y - sinA * TICK_HALF
        }
      },
      {
        start: {
          x: fLineEnd.x - cosA * TICK_HALF,
          y: fLineEnd.y + sinA * TICK_HALF
        },
        end: {
          x: fLineEnd.x + cosA * TICK_HALF,
          y: fLineEnd.y - sinA * TICK_HALF
        }
      }
    ],
    label: {
      x: (fLineStart.x + fLineEnd.x) / 2 - 8,
      y: fLineEnd.y
    }
  };
  rawPoints.push(
    fDimension.line.start,
    fDimension.line.end,
    ...fDimension.ticks.map((tick) => tick.start),
    ...fDimension.ticks.map((tick) => tick.end),
    fDimension.label
  );

  const eOffset = aScaled + rScaled + 25 * scale;
  const eLineX = exitTopLeft.x + eOffset;
  const eDimension = {
    line: {
      start: { x: eLineX, y: exitTopLeft.y },
      end: { x: eLineX, y: exitBottomLeft.y }
    },
    ticks: [
      {
        start: { x: eLineX - TICK_HALF, y: exitTopLeft.y },
        end: { x: eLineX + TICK_HALF, y: exitTopLeft.y }
      },
      {
        start: { x: eLineX - TICK_HALF, y: exitBottomLeft.y },
        end: { x: eLineX + TICK_HALF, y: exitBottomLeft.y }
      }
    ],
    label: {
      x: eLineX + BASELINE_OFFSET,
      y: (exitTopLeft.y + exitBottomLeft.y) / 2 - BASELINE_OFFSET
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

  return {
    viewBox: { width, height },
    frontInner: translatePolygon(frontInner, offsetX, offsetY),
    frontOuter: translatePolygon(frontOuter, offsetX, offsetY),
    underInner: translatePolygon(underInner, offsetX, offsetY),
    underExtension: translatePolygon(underExtension, offsetX, offsetY),
    underExtensionTopLine: translateLine(underExtensionTopLine, offsetX, offsetY),
    underExtensionInnerLine: translateLine(underExtensionInnerLine, offsetX, offsetY),
    underExtensionTrimLine: translateLine(underExtensionTrimLine, offsetX, offsetY),
    entryPolygon: translatePolygon(entryPolygon, offsetX, offsetY),
    entrySeam: translateLine(entrySeam, offsetX, offsetY),
    entryTopHighlight: translateLine(entryTopHighlight, offsetX, offsetY),
    entryFlangeInset: translateLine(entryFlangeInset, offsetX, offsetY),
    entryFlangeFace: translateLine(entryFlangeFace, offsetX, offsetY),
    exitRect: translatePolygon(exitRect, offsetX, offsetY),
    exitTopLine: translateLine(exitTopLine, offsetX, offsetY),
    exitInnerBottomLine: translateLine(exitInnerBottomLine, offsetX, offsetY),
    innerArc: {
      radius: innerArc.radius,
      start: translatePoint(innerArc.start, offsetX, offsetY),
      end: translatePoint(innerArc.end, offsetX, offsetY)
    },
    outerArc: {
      radius: outerArc.radius,
      start: translatePoint(outerArc.start, offsetX, offsetY),
      end: translatePoint(outerArc.end, offsetX, offsetY)
    },
    radiusLine: translateLine(radiusLine, offsetX, offsetY),
    radiusLabel: translatePoint(radiusLabel, offsetX, offsetY),
    dimensions: {
      a: {
        line: translateLine(aDimension.line, offsetX, offsetY),
        ticks: translateTicks(aDimension.ticks, offsetX, offsetY),
        label: translatePoint(aDimension.label, offsetX, offsetY)
      },
      b: {
        line: translateLine(bDimension.line, offsetX, offsetY),
        ticks: translateTicks(bDimension.ticks, offsetX, offsetY),
        label: translatePoint(bDimension.label, offsetX, offsetY)
      },
      e: {
        line: translateLine(eDimension.line, offsetX, offsetY),
        ticks: translateTicks(eDimension.ticks, offsetX, offsetY),
        label: translatePoint(eDimension.label, offsetX, offsetY)
      },
      f: {
        line: translateLine(fDimension.line, offsetX, offsetY),
        ticks: translateTicks(fDimension.ticks, offsetX, offsetY),
        label: translatePoint(fDimension.label, offsetX, offsetY)
      }
    }
  };
};

function TechnicalDrawingQBNa({ a, b, e, f, r, alfa }) {
  const aVal = formatNumber(Number(a));
  const bVal = formatNumber(Number(b));
  const eVal = Math.max(0, formatNumber(Number(e)));
  const fVal = Math.max(0, formatNumber(Number(f)));
  const rVal = Math.max(0, formatNumber(Number(r)));
  const alfaVal = formatNumber(Number(alfa));

  if (aVal <= 0 || bVal <= 0 || rVal <= 0 || alfaVal <= 0) {
    return (
      <div className="technical-drawing-empty" role="note">
        Brak danych do wygenerowania rysunku dla łuku QBNa.
      </div>
    );
  }

  const geometry = computeGeometry({ a: aVal, b: bVal, e: eVal, f: fVal, r: rVal, alfa: alfaVal });
  const strokeColor = '#0d47a1';
  const highlightStroke = '#1565c0';

  const polygonPoints = (points) => points.map((pt) => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(' ');

  const arcPath = (arc) =>
    `M ${arc.start.x.toFixed(2)} ${arc.start.y.toFixed(2)} A ${arc.radius.toFixed(2)} ${arc.radius.toFixed(2)} 0 0 1 ${arc.end.x.toFixed(2)} ${arc.end.y.toFixed(2)}`;

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
      aria-label="Rysunek techniczny łuku QBNa"
    >
      <title>Łuk QBNa – widoki</title>

      <polygon
        points={polygonPoints(geometry.frontOuter)}
        fill="rgba(13, 71, 161, 0.08)"
        stroke={strokeColor}
        strokeWidth={1.3}
      />
      <polygon
        points={polygonPoints(geometry.frontInner)}
        fill="#f2f6ff"
        stroke={strokeColor}
        strokeWidth={1}
      />
      <polygon
        points={polygonPoints(geometry.underInner)}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1}
      />
      <polygon
        points={polygonPoints(geometry.underExtension)}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1}
      />
      <line
        x1={geometry.underExtensionTopLine.start.x}
        y1={geometry.underExtensionTopLine.start.y}
        x2={geometry.underExtensionTopLine.end.x}
        y2={geometry.underExtensionTopLine.end.y}
        stroke={highlightStroke}
        strokeWidth={1}
      />
      <line
        x1={geometry.underExtensionInnerLine.start.x}
        y1={geometry.underExtensionInnerLine.start.y}
        x2={geometry.underExtensionInnerLine.end.x}
        y2={geometry.underExtensionInnerLine.end.y}
        stroke={strokeColor}
        strokeWidth={1}
      />
      <line
        x1={geometry.underExtensionTrimLine.start.x}
        y1={geometry.underExtensionTrimLine.start.y}
        x2={geometry.underExtensionTrimLine.end.x}
        y2={geometry.underExtensionTrimLine.end.y}
        stroke={strokeColor}
        strokeWidth={1}
      />

      <polygon
        points={polygonPoints(geometry.entryPolygon)}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.3}
      />
      <line
        x1={geometry.entrySeam.start.x}
        y1={geometry.entrySeam.start.y}
        x2={geometry.entrySeam.end.x}
        y2={geometry.entrySeam.end.y}
        stroke={strokeColor}
        strokeWidth={1}
      />
      <line
        x1={geometry.entryTopHighlight.start.x}
        y1={geometry.entryTopHighlight.start.y}
        x2={geometry.entryTopHighlight.end.x}
        y2={geometry.entryTopHighlight.end.y}
        stroke={highlightStroke}
        strokeWidth={1}
      />
      <line
        x1={geometry.entryFlangeInset.start.x}
        y1={geometry.entryFlangeInset.start.y}
        x2={geometry.entryFlangeInset.end.x}
        y2={geometry.entryFlangeInset.end.y}
        stroke={strokeColor}
        strokeWidth={1}
      />
      <line
        x1={geometry.entryFlangeFace.start.x}
        y1={geometry.entryFlangeFace.start.y}
        x2={geometry.entryFlangeFace.end.x}
        y2={geometry.entryFlangeFace.end.y}
        stroke={strokeColor}
        strokeWidth={1}
      />

      <polygon
        points={polygonPoints(geometry.exitRect)}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.3}
      />
      <line
        x1={geometry.exitTopLine.start.x}
        y1={geometry.exitTopLine.start.y}
        x2={geometry.exitTopLine.end.x}
        y2={geometry.exitTopLine.end.y}
        stroke={highlightStroke}
        strokeWidth={1}
      />
      <line
        x1={geometry.exitInnerBottomLine.start.x}
        y1={geometry.exitInnerBottomLine.start.y}
        x2={geometry.exitInnerBottomLine.end.x}
        y2={geometry.exitInnerBottomLine.end.y}
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

      {renderDimension('a', geometry.dimensions.a)}
      {renderDimension('b', geometry.dimensions.b)}
      {renderDimension('e', geometry.dimensions.e, 'start')}
      {renderDimension('f', geometry.dimensions.f)}
    </svg>
  );
}

export default TechnicalDrawingQBNa;
