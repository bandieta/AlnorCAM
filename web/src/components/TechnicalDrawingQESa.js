import React from 'react';

const LABEL_FONT_SIZE = 12;
const PRIMARY_STROKE = '#0d47a1';
const MARGIN = 12;
const TICK = 6;

const mod = (value, modulus) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const result = value % modulus;
  return result >= 0 ? result : result + modulus;
};

const formatNumber = (value) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return value;
};

const clonePoint = (pt) => ({ x: pt.x, y: pt.y });

const computeGeometry = ({ a, b, ee }) => {
  const lines = [];
  const polygons = [];
  const labels = [];
  const rawPoints = [];

  const addPoint = (pt) => {
    rawPoints.push({ x: pt.x, y: pt.y });
  };

  const addLine = (start, end) => {
    const segment = { start: clonePoint(start), end: clonePoint(end) };
    lines.push(segment);
    addPoint(segment.start);
    addPoint(segment.end);
  };

  const addPolygon = (points) => {
    const polygon = points.map(clonePoint);
    polygons.push(polygon);
    polygon.forEach(addPoint);
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
      anchor: config.anchor || 'start',
      baseline: config.baseline || 'middle'
    });
  };

  let flange = 25;
  let maxCandidate = Math.max(a, b);
  if (!Number.isFinite(maxCandidate) || maxCandidate <= 0) {
    maxCandidate = Math.max(a, b, ee, 1);
  }
  if (maxCandidate > 1000) {
    flange = 30;
  }
  if (maxCandidate > 2501) {
    flange = 40;
  }

  maxCandidate = Math.max(maxCandidate, ee, flange);

  const scale = maxCandidate > 0 ? 80 / maxCandidate : 1;

  const aScaled = a * scale;
  const bScaled = b * scale;
  const eeScaled = ee * scale;
  const flangeScaled = flange * scale;

  let pushX = mod(110 - aScaled, 110) / 2;
  if (pushX < 0) {
    pushX = -pushX;
  }
  const pushY = ((90 - bScaled) / 2) + 5;

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

  const sideInnerLeft = 20 + pushX;
  const sideTop = 20 + pushY;
  const sideLeft = sideInnerLeft - flangeScaled;
  const sideRight = sideInnerLeft + eeScaled;
  const sideBottom = sideTop + bScaled;
  const sideRect = [
    { x: sideLeft, y: sideTop },
    { x: sideRight, y: sideTop },
    { x: sideRight, y: sideBottom },
    { x: sideLeft, y: sideBottom }
  ];
  addPolygon(sideRect);

  const flangeLineTop = { x: sideLeft, y: sideTop - flangeScaled };
  const flangeLineBottom = { x: sideLeft, y: sideBottom + flangeScaled };
  addLine(flangeLineTop, flangeLineBottom);

  drawHorizontalDimension(
    frontTopLeft.x,
    frontTopRight.x,
    frontTopLeft.y - 15,
    'a',
    { labelOffsetY: -20, labelOffsetX: -4 }
  );

  drawHorizontalDimension(
    sideLeft,
    sideRight,
    sideBottom + 15,
    'e',
    { labelOffsetY: 12, baseline: 'hanging' }
  );

  drawVerticalDimension(
    sideRight + 15,
    sideTop,
    sideBottom,
    'b',
    { labelOffsetX: 6 }
  );

  const minX = rawPoints.length ? Math.min(...rawPoints.map((pt) => pt.x)) : 0;
  const minY = rawPoints.length ? Math.min(...rawPoints.map((pt) => pt.y)) : 0;
  const maxX = rawPoints.length ? Math.max(...rawPoints.map((pt) => pt.x)) : 200;
  const maxY = rawPoints.length ? Math.max(...rawPoints.map((pt) => pt.y)) : 140;

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
    labels: labels.map((label) => ({
      ...label,
      position: translatePoint(label.position)
    }))
  };
};

const pathPoints = (polygon) => polygon.map((pt) => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(' ');

function TechnicalDrawingQESa({ a, b, ee }) {
  const aVal = formatNumber(Number(a));
  const bVal = formatNumber(Number(b));
  const eeVal = Math.max(0, formatNumber(Number(ee)));

  if (aVal <= 0 || bVal <= 0 || eeVal <= 0) {
    return (
      <div className="technical-drawing-empty" role="note">
        Brak danych do wygenerowania rysunku dla zaślepki prostokątnej QESa.
      </div>
    );
  }

  const geometry = computeGeometry({ a: aVal, b: bVal, ee: eeVal });

  return (
    <svg
      className="technical-drawing-svg"
      width="100%"
      height="100%"
      viewBox={`0 0 ${geometry.viewBox.width.toFixed(2)} ${geometry.viewBox.height.toFixed(2)}`}
      role="img"
      aria-label="Rysunek techniczny zaślepki prostokątnej QESa"
    >
      <title>Zaślepka prostokątna QESa – widoki</title>

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

export default TechnicalDrawingQESa;
