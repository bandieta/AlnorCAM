import React from 'react';

const LABEL_FONT_SIZE = 12;
const PRIMARY_STROKE = '#0d47a1';
const SECONDARY_STROKE = '#1e88e5';
const MARGIN = 12;
const TICK = 6;

const formatNumber = (value) => {
  if (Number.isFinite(value)) {
    return value;
  }
  return 0;
};

const clonePoint = (pt) => ({ x: pt.x, y: pt.y });

const computeGeometry = ({ a, b, d, L, e, f, l3 }) => {
  const polygons = [];
  const lines = [];
  const highlightLines = [];
  const labels = [];
  const rawPoints = [];

  const addPoint = (pt) => {
    rawPoints.push({ x: pt.x, y: pt.y });
  };

  const addPolygon = (points) => {
    const polygon = points.map(clonePoint);
    polygons.push(polygon);
    polygon.forEach(addPoint);
  };

  const addLine = (start, end, style = 'primary') => {
    const segment = { start: clonePoint(start), end: clonePoint(end) };
    if (style === 'secondary') {
      highlightLines.push(segment);
    } else {
      lines.push(segment);
    }
    addPoint(segment.start);
    addPoint(segment.end);
  };

  const addLabel = (text, position, options = {}) => {
    labels.push({ text, position: clonePoint(position), ...options });
    addPoint(position);
  };

  const drawHorizontalDimension = (startX, endX, lineY, label, config = {}) => {
    if (!Number.isFinite(startX) || !Number.isFinite(endX)) {
      return;
    }
    const tick = config.tick ?? TICK;
    addLine({ x: startX, y: lineY }, { x: endX, y: lineY });
    addLine({ x: startX, y: lineY - tick / 2 }, { x: startX, y: lineY + tick / 2 });
    addLine({ x: endX, y: lineY - tick / 2 }, { x: endX, y: lineY + tick / 2 });
    const labelPos = {
      x: (startX + endX) / 2 + (config.labelOffsetX || 0),
      y: lineY + (config.labelOffsetY || 0)
    };
    addLabel(label, labelPos, {
      anchor: config.anchor || 'middle',
      baseline: config.baseline || 'alphabetic'
    });
  };

  const drawVerticalDimension = (x, startY, endY, label, config = {}) => {
    if (!Number.isFinite(startY) || !Number.isFinite(endY)) {
      return;
    }
    const tick = config.tick ?? TICK;
    addLine({ x, y: startY }, { x, y: endY });
    addLine({ x: x - tick / 2, y: startY }, { x: x + tick / 2, y: startY });
    addLine({ x: x - tick / 2, y: endY }, { x: x + tick / 2, y: endY });
    const labelPos = {
      x: x + (config.labelOffsetX || 0),
      y: (startY + endY) / 2 + (config.labelOffsetY || 0)
    };
    addLabel(label, labelPos, {
      anchor: config.anchor || 'middle',
      baseline: config.baseline || 'middle'
    });
  };

  let flange = 25;
  if (L > 1000) {
    flange = 30;
  }
  if (L > 2501) {
    flange = 40;
  }

  let maxCandidate = Math.max(a, b + l3);
  maxCandidate = Math.max(maxCandidate, L);
  maxCandidate = Math.max(maxCandidate, flange);

  const scale = maxCandidate > 0 ? 80 / maxCandidate : 1;

  const aScaled = a * scale;
  const bScaled = b * scale;
  const dScaled = d * scale;
  const LScaled = L * scale;
  const eScaled = e * scale;
  const fScaled = f * scale;
  const l3Scaled = l3 * scale;
  const flangeScaled = flange * scale;

  let pushX = 110 - aScaled;
  if (pushX < 0) {
    pushX = 20;
  }
  let pushY = 80 - bScaled;
  if (pushY < 0) {
    pushY = 20;
  }

  const frontTopLeft = { x: 190 + pushX, y: 20 + pushY };
  const frontTopRight = { x: frontTopLeft.x + aScaled, y: frontTopLeft.y };
  const frontBottomRight = { x: frontTopRight.x, y: frontTopLeft.y + bScaled };
  const frontBottomLeft = { x: frontTopLeft.x, y: frontTopLeft.y + bScaled };
  const frontRect = [frontTopLeft, frontTopRight, frontBottomRight, frontBottomLeft];
  addPolygon(frontRect);

  const frontOuterRect = [
    { x: frontTopLeft.x - flangeScaled, y: frontTopLeft.y - flangeScaled },
    { x: frontTopRight.x + flangeScaled, y: frontTopRight.y - flangeScaled },
    { x: frontBottomRight.x + flangeScaled, y: frontBottomRight.y + flangeScaled },
    { x: frontBottomLeft.x - flangeScaled, y: frontBottomLeft.y + flangeScaled }
  ];
  addPolygon(frontOuterRect);

  const planInnerLeft = 20 + pushX;
  const planInnerTop = 20 + pushY;
  const planInnerRight = planInnerLeft + LScaled;
  const planBottom = planInnerTop + bScaled;
  const planOuterLeft = planInnerLeft - flangeScaled;
  const planRect = [
    { x: planOuterLeft, y: planInnerTop },
    { x: planInnerRight, y: planInnerTop },
    { x: planInnerRight, y: planBottom },
    { x: planOuterLeft, y: planBottom }
  ];
  addPolygon(planRect);

  addLine(
    { x: planOuterLeft, y: planInnerTop - flangeScaled },
    { x: planOuterLeft, y: planBottom + flangeScaled }
  );
  addLine(
    { x: planInnerRight, y: planInnerTop - flangeScaled },
    { x: planInnerRight, y: planBottom + flangeScaled }
  );
  addLine(
    { x: planOuterLeft + flangeScaled, y: planInnerTop },
    { x: planOuterLeft + flangeScaled, y: planBottom }
  );
  addLine(
    { x: planInnerRight - flangeScaled, y: planInnerTop },
    { x: planInnerRight - flangeScaled, y: planBottom }
  );

  const branchPlanLeft = planOuterLeft + eScaled - dScaled / 2;
  const branchPlanRight = branchPlanLeft + dScaled;
  const branchPlanTop = planInnerTop - l3Scaled;
  const branchPlanBottom = planInnerTop;
  const branchPlanRect = [
    { x: branchPlanLeft, y: branchPlanTop },
    { x: branchPlanRight, y: branchPlanTop },
    { x: branchPlanRight, y: branchPlanBottom },
    { x: branchPlanLeft, y: branchPlanBottom }
  ];
  addPolygon(branchPlanRect);

  const branchFrontCenterX = frontTopRight.x - fScaled;
  const branchFrontLeft = branchFrontCenterX - dScaled / 2;
  const branchFrontRight = branchFrontCenterX + dScaled / 2;
  const branchFrontTop = frontTopLeft.y - l3Scaled;
  const branchFrontBottom = frontTopLeft.y - flangeScaled;
  const branchFrontRect = [
    { x: branchFrontLeft, y: branchFrontTop },
    { x: branchFrontRight, y: branchFrontTop },
    { x: branchFrontRight, y: branchFrontBottom },
    { x: branchFrontLeft, y: branchFrontBottom }
  ];
  addPolygon(branchFrontRect);

  const branchFrontFlangeTopLeft = { x: branchFrontLeft - flangeScaled, y: branchFrontTop };
  const branchFrontFlangeTopRight = { x: branchFrontRight + flangeScaled, y: branchFrontTop };
  addLine(branchFrontFlangeTopLeft, branchFrontFlangeTopRight, 'secondary');

  const branchFrontFlangeBottomLeft = { x: branchFrontLeft - flangeScaled, y: branchFrontBottom };
  const branchFrontFlangeBottomRight = { x: branchFrontRight + flangeScaled, y: branchFrontBottom };
  addLine(branchFrontFlangeBottomLeft, branchFrontFlangeBottomRight, 'secondary');

  drawHorizontalDimension(
    frontBottomLeft.x,
    frontBottomRight.x,
    frontBottomLeft.y + 18,
    'b',
    { labelOffsetY: 18 }
  );

  drawHorizontalDimension(
    planOuterLeft,
    planInnerRight,
    planBottom + 18,
    'L',
    { labelOffsetY: 18 }
  );

  drawVerticalDimension(
    planInnerRight + 18,
    planInnerTop,
    planBottom,
    'a',
    { labelOffsetX: 10 }
  );

  const eDimensionY = planInnerTop - 18;
  drawHorizontalDimension(
    planOuterLeft,
    planOuterLeft + eScaled,
    eDimensionY,
    'e',
    { baseline: 'alphabetic', labelOffsetY: -6, labelOffsetX: -6 }
  );

  const branchPlanDimensionY = branchPlanTop - 18;
  drawHorizontalDimension(
    branchPlanLeft,
    branchPlanRight,
    branchPlanDimensionY,
    'd',
    { baseline: 'alphabetic', labelOffsetY: -6 }
  );

  drawVerticalDimension(
    branchPlanLeft - 24,
    branchPlanTop,
    branchPlanBottom,
    'l3',
    { labelOffsetX: -6 }
  );

  const fDimensionStart = { x: frontTopRight.x, y: frontTopRight.y - 18 };
  const fDimensionEnd = { x: frontTopRight.x - fScaled, y: frontTopRight.y - 18 };
  addLine(fDimensionStart, fDimensionEnd);
  addLine(
    { x: fDimensionStart.x, y: fDimensionStart.y - TICK / 2 },
    { x: fDimensionStart.x, y: fDimensionStart.y + TICK / 2 }
  );
  addLine(
    { x: fDimensionEnd.x, y: fDimensionEnd.y - TICK / 2 },
    { x: fDimensionEnd.x, y: fDimensionEnd.y + TICK / 2 }
  );
  addLabel(
    'f',
    {
      x: (fDimensionStart.x + fDimensionEnd.x) / 2,
      y: fDimensionStart.y - 6
    },
    { baseline: 'alphabetic' }
  );

  const branchFrontDimensionY = branchFrontTop - 10;
  drawHorizontalDimension(
    branchFrontLeft,
    branchFrontRight,
    branchFrontDimensionY,
    'd',
    { baseline: 'alphabetic', labelOffsetY: -6 }
  );

  const minX = rawPoints.length ? Math.min(...rawPoints.map((pt) => pt.x)) : 0;
  const minY = rawPoints.length ? Math.min(...rawPoints.map((pt) => pt.y)) : 0;
  const maxX = rawPoints.length ? Math.max(...rawPoints.map((pt) => pt.x)) : 220;
  const maxY = rawPoints.length ? Math.max(...rawPoints.map((pt) => pt.y)) : 160;

  const offsetX = minX - MARGIN;
  const offsetY = minY - MARGIN;
  const width = (maxX - minX) + MARGIN * 2;
  const height = (maxY - minY) + MARGIN * 2;

  const translatePoint = (pt) => ({ x: pt.x - offsetX, y: pt.y - offsetY });

  const translatePolygon = (polygon) => polygon.map(translatePoint);
  const translateSegments = (segments) => segments.map((segment) => ({
    start: translatePoint(segment.start),
    end: translatePoint(segment.end)
  }));

  return {
    viewBox: { width, height },
    polygons: polygons.map(translatePolygon),
    lines: translateSegments(lines),
    highlightLines: translateSegments(highlightLines),
    labels: labels.map((label) => ({
      ...label,
      position: translatePoint(label.position)
    }))
  };
};

const pathPoints = (polygon) => polygon.map((pt) => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(' ');

function TechnicalDrawingTR2a({ a, b, d, L, e, f, l3 }) {
  const aVal = formatNumber(Number(a));
  const bVal = formatNumber(Number(b));
  const dVal = Math.max(0, formatNumber(Number(d)));
  const LVal = formatNumber(Number(L));
  const eVal = Math.max(0, formatNumber(Number(e)));
  const fVal = Math.max(0, formatNumber(Number(f)));
  const l3Val = Math.max(0, formatNumber(Number(l3)));

  if (aVal <= 0 || bVal <= 0 || LVal <= 0) {
    return (
      <div className="technical-drawing-empty" role="note">
        Brak danych do wygenerowania rysunku dla trójnika z odejściem okrągłym TR2a.
      </div>
    );
  }

  const geometry = computeGeometry({ a: aVal, b: bVal, d: dVal, L: LVal, e: eVal, f: fVal, l3: l3Val });

  return (
    <svg
      className="technical-drawing-svg"
      width="100%"
      height="100%"
      viewBox={`0 0 ${geometry.viewBox.width.toFixed(2)} ${geometry.viewBox.height.toFixed(2)}`}
      role="img"
      aria-label="Rysunek techniczny trójnika z odejściem okrągłym TR2a"
    >
      <title>Trójnik z odejściem okrągłym TR2a – widoki</title>

      {geometry.polygons.map((polygon, index) => (
        <polygon
          key={`poly-${index}`}
          points={pathPoints(polygon)}
          fill="none"
          stroke={PRIMARY_STROKE}
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      ))}

      {geometry.lines.map((segment, index) => (
        <line
          key={`line-${index}`}
          x1={segment.start.x}
          y1={segment.start.y}
          x2={segment.end.x}
          y2={segment.end.y}
          stroke={PRIMARY_STROKE}
          strokeWidth={1.1}
        />
      ))}

      {geometry.highlightLines.map((segment, index) => (
        <line
          key={`highlight-${index}`}
          x1={segment.start.x}
          y1={segment.start.y}
          x2={segment.end.x}
          y2={segment.end.y}
          stroke={SECONDARY_STROKE}
          strokeWidth={1.1}
        />
      ))}

      {geometry.labels.map((label, index) => (
        <text
          key={`label-${index}`}
          x={label.position.x}
          y={label.position.y}
          fontSize={LABEL_FONT_SIZE}
          fill={PRIMARY_STROKE}
          textAnchor={label.anchor || 'middle'}
          alignmentBaseline={label.baseline || 'alphabetic'}
        >
          {label.text}
        </text>
      ))}
    </svg>
  );
}

export default TechnicalDrawingTR2a;
