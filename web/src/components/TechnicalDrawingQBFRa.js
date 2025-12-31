import React from 'react';

const LABEL_FONT_SIZE = 12;
const PRIMARY_STROKE = '#0d47a1';
const SECONDARY_STROKE = '#1e88e5';
const DASH_STROKE = '#1565c0';
const MARGIN = 12;
const TICK = 6;
const DEG2RAD = Math.PI / 180;

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

const computeGeometry = ({ a, b, d, ee, f, r }) => {
  const lines = [];
  const highlightLines = [];
  const dashedLines = [];
  const polygons = [];
  const arcs = [];
  const labels = [];
  const rawPoints = [];

  const addPoint = (pt) => {
    rawPoints.push({ x: pt.x, y: pt.y });
  };

  const addLine = (start, end, style = 'primary') => {
    const segment = { start: clonePoint(start), end: clonePoint(end) };
    if (style === 'secondary') {
      highlightLines.push(segment);
    } else if (style === 'dashed') {
      dashedLines.push(segment);
    } else {
      lines.push(segment);
    }
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

  const addArcSegment = (center, radius, startAngleDeg, sweepAngleDeg) => {
    if (!Number.isFinite(radius) || radius <= 0 || sweepAngleDeg === 0) {
      return null;
    }
    const startRad = startAngleDeg * DEG2RAD;
    const endRad = (startAngleDeg + sweepAngleDeg) * DEG2RAD;
    const arc = {
      center: clonePoint(center),
      radius,
      startAngle: startAngleDeg,
      sweepAngle: sweepAngleDeg,
      start: {
        x: center.x + radius * Math.cos(startRad),
        y: center.y + radius * Math.sin(startRad)
      },
      end: {
        x: center.x + radius * Math.cos(endRad),
        y: center.y + radius * Math.sin(endRad)
      }
    };
    arcs.push(arc);
    addPoint(arc.start);
    addPoint(arc.end);
    addPoint({ x: center.x + radius, y: center.y });
    addPoint({ x: center.x - radius, y: center.y });
    addPoint({ x: center.x, y: center.y + radius });
    addPoint({ x: center.x, y: center.y - radius });
    return arc;
  };

  const addArcRect = (left, top, diameter, startAngleDeg, sweepAngleDeg) => {
    if (!Number.isFinite(diameter) || diameter <= 0) {
      return null;
    }
    const radius = diameter / 2;
    return addArcSegment({ x: left + radius, y: top + radius }, radius, startAngleDeg, sweepAngleDeg);
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

  const lOffset = 3;

  let flange = 25;
  let maxCandidate = Math.max(a, b + ee, d + f);
  if (!Number.isFinite(maxCandidate) || maxCandidate <= 0) {
    maxCandidate = Math.max(a, b, d, ee, f, r, 1);
  }
  if (maxCandidate > 1000) {
    flange = 30;
  }
  if (maxCandidate > 2501) {
    flange = 40;
  }

  let scaleReference = maxCandidate + ee + r;
  scaleReference = Math.max(scaleReference, flange, f, ee);

  const scale = scaleReference > 0 ? 80 / scaleReference : 1;

  const aScaled = a * scale;
  const bScaled = b * scale;
  const dScaled = d * scale;
  const eeScaled = ee * scale;
  const fScaled = f * scale;
  const rScaled = Math.max(0, r * scale);
  const flangeScaled = flange * scale;
  const lScaled = lOffset;

  let pushX = mod(110 - (aScaled + lScaled), 110) / 2;
  if (pushX < 0) {
    pushX = -pushX;
  }
  const pushY = ((90 - bScaled) / 2) + 5;

  const frontTopLeft = { x: 190 + pushX, y: 20 + pushY };
  const frontTopRight = { x: frontTopLeft.x + aScaled, y: frontTopLeft.y };
  const frontBottomRight = { x: frontTopRight.x, y: frontTopLeft.y + dScaled };
  const frontBottomLeft = { x: frontTopLeft.x, y: frontTopLeft.y + dScaled };
  const frontRect = [frontTopLeft, frontTopRight, frontBottomRight, frontBottomLeft];
  addPolygon(frontRect);

  const frontOuterRect = [
    { x: frontTopLeft.x - flangeScaled, y: frontTopLeft.y - flangeScaled },
    { x: frontTopRight.x + flangeScaled, y: frontTopRight.y - flangeScaled },
    { x: frontBottomRight.x + flangeScaled, y: frontBottomRight.y + flangeScaled },
    { x: frontBottomLeft.x - flangeScaled, y: frontBottomLeft.y + flangeScaled }
  ];
  addPolygon(frontOuterRect);

  const baseBottomY = frontBottomLeft.y + fScaled;
  const frontBaseRect = [
    { x: frontBottomLeft.x, y: frontBottomLeft.y },
    { x: frontBottomRight.x, y: frontBottomRight.y },
    { x: frontBottomRight.x, y: baseBottomY },
    { x: frontBottomLeft.x, y: baseBottomY }
  ];
  addPolygon(frontBaseRect);

  const baseExtendedLeft = { x: frontBottomLeft.x - flangeScaled, y: baseBottomY };
  const baseExtendedRight = { x: frontBottomRight.x + flangeScaled, y: baseBottomY };
  addLine(baseExtendedLeft, baseExtendedRight);

  if (flangeScaled > 0) {
    const baseInnerY = baseBottomY - flangeScaled;
    addLine(
      { x: frontBottomLeft.x, y: baseInnerY },
      { x: frontBottomRight.x, y: baseInnerY }
    );
  }

  if (frontBottomRight.x - frontBottomLeft.x > 2) {
    addLine(
      { x: frontBottomLeft.x + 1, y: baseBottomY },
      { x: frontBottomRight.x - 1, y: baseBottomY },
      'secondary'
    );
  }

  const sideTopLeft = { x: 20 + pushX, y: 20 + pushY };
  const sideTopRight = { x: sideTopLeft.x + eeScaled + bScaled, y: sideTopLeft.y };
  const sideBottomRight = { x: sideTopRight.x, y: sideTopLeft.y + dScaled + fScaled };
  const sideBottomLeft = { x: sideTopLeft.x, y: sideBottomRight.y };
  const sideRect = [sideTopLeft, sideTopRight, sideBottomRight, sideBottomLeft];
  addPolygon(sideRect);

  const radiusRect = [
    { x: sideTopLeft.x, y: sideTopLeft.y + dScaled },
    { x: sideTopLeft.x + eeScaled, y: sideTopLeft.y + dScaled },
    { x: sideTopLeft.x + eeScaled, y: sideTopLeft.y + dScaled + fScaled },
    { x: sideTopLeft.x, y: sideTopLeft.y + dScaled + fScaled }
  ];
  radiusRect.forEach(addPoint);

  if (flangeScaled > 0) {
    const leftFlangeOuterBottom = { x: radiusRect[0].x, y: radiusRect[0].y + flangeScaled };
    const leftFlangeOuterTop = { x: sideTopLeft.x, y: sideTopLeft.y - flangeScaled };
    addLine(leftFlangeOuterBottom, leftFlangeOuterTop);

    const leftFlangeInnerBottom = { x: radiusRect[0].x + flangeScaled, y: radiusRect[0].y };
    const leftFlangeInnerTop = { x: sideTopLeft.x + flangeScaled, y: sideTopLeft.y };
    addLine(leftFlangeInnerBottom, leftFlangeInnerTop);

    const bottomFlangeOuterLeft = { x: radiusRect[2].x - flangeScaled, y: radiusRect[2].y };
    const bottomFlangeOuterRight = { x: radiusRect[2].x + flangeScaled + bScaled, y: radiusRect[2].y };
    addLine(bottomFlangeOuterLeft, bottomFlangeOuterRight);

    const bottomFlangeInnerLeft = { x: radiusRect[2].x, y: radiusRect[2].y - flangeScaled };
    const bottomFlangeInnerRight = { x: radiusRect[2].x + bScaled, y: radiusRect[2].y - flangeScaled };
    addLine(bottomFlangeInnerLeft, bottomFlangeInnerRight);
  }

  if (rScaled > 0) {
    const radiusTopLeft = radiusRect[0];
    const radiusTopRight = radiusRect[1];
    const radiusBottomRight = radiusRect[2];
    const arcLeftX = radiusTopRight.x - 2 * rScaled;
    const arcTopY = radiusTopLeft.y;
    const radiusCenter = { x: radiusTopRight.x - rScaled, y: arcTopY + rScaled };

    addLine(radiusCenter, radiusTopRight);
    addLine({ x: radiusTopLeft.x, y: arcTopY }, { x: radiusTopRight.x - rScaled, y: arcTopY });
    addLine(radiusBottomRight, { x: radiusTopRight.x, y: radiusCenter.y });

    addArcRect(arcLeftX, arcTopY, 2 * rScaled, 270, 90);

    addLabel('r', { x: radiusTopRight.x, y: radiusTopRight.y - 10 }, { anchor: 'start', baseline: 'middle' });
  }

  drawHorizontalDimension(
    frontTopLeft.x,
    frontTopRight.x,
    frontTopLeft.y - 15,
    'a',
    { labelOffsetY: -20, labelOffsetX: -4 }
  );

  drawVerticalDimension(
    sideTopLeft.x - 15,
    sideTopLeft.y,
    sideTopLeft.y + dScaled,
    'd',
    { labelOffsetX: -15, labelOffsetY: -8, anchor: 'end' }
  );

  drawVerticalDimension(
    sideTopLeft.x - 15,
    sideTopLeft.y + dScaled,
    sideTopLeft.y + dScaled + fScaled,
    'f',
    { labelOffsetX: -15, labelOffsetY: 8, anchor: 'end' }
  );

  const dimensionBaseline = sideBottomLeft.y + 15;

  drawHorizontalDimension(
    sideBottomLeft.x,
    sideBottomLeft.x + eeScaled,
    dimensionBaseline,
    'e',
    { baseline: 'hanging', labelOffsetY: 12 }
  );

  drawHorizontalDimension(
    sideBottomLeft.x + eeScaled,
    sideBottomLeft.x + eeScaled + bScaled,
    dimensionBaseline,
    'b',
    { baseline: 'hanging', labelOffsetY: 12 }
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

  const translateArc = (arcSegment) => ({
    center: translatePoint(arcSegment.center),
    radius: arcSegment.radius,
    startAngle: arcSegment.startAngle,
    sweepAngle: arcSegment.sweepAngle,
    start: translatePoint(arcSegment.start),
    end: translatePoint(arcSegment.end)
  });

  return {
    viewBox: { width, height },
    polygons: polygons.map(translatePolygon),
    lines: translateSegments(lines),
    highlightLines: translateSegments(highlightLines),
    dashedLines: translateSegments(dashedLines),
    arcs: arcs.map(translateArc),
    labels: labels.map((label) => ({
      ...label,
      position: translatePoint(label.position)
    }))
  };
};

const pathPoints = (polygon) => polygon.map((pt) => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(' ');

const arcPath = (arc) => `M ${arc.start.x.toFixed(2)} ${arc.start.y.toFixed(2)} A ${arc.radius.toFixed(2)} ${arc.radius.toFixed(2)} 0 0 1 ${arc.end.x.toFixed(2)} ${arc.end.y.toFixed(2)}`;

function TechnicalDrawingQBFRa({ a, b, d, ee, f, r }) {
  const aVal = formatNumber(Number(a));
  const bVal = formatNumber(Number(b));
  const dVal = formatNumber(Number(d));
  const eeVal = Math.max(0, formatNumber(Number(ee)));
  const fVal = Math.max(0, formatNumber(Number(f)));
  const rVal = Math.max(0, formatNumber(Number(r)));

  if (aVal <= 0 || bVal <= 0 || dVal <= 0) {
    return (
      <div className="technical-drawing-empty" role="note">
        Brak danych do wygenerowania rysunku dla łuku QBFRa.
      </div>
    );
  }

  const geometry = computeGeometry({ a: aVal, b: bVal, d: dVal, ee: eeVal, f: fVal, r: rVal });

  return (
    <svg
      className="technical-drawing-svg"
      width="100%"
      height="100%"
      viewBox={`0 0 ${geometry.viewBox.width.toFixed(2)} ${geometry.viewBox.height.toFixed(2)}`}
      role="img"
      aria-label="Rysunek techniczny łuku redukcyjnego QBFRa"
    >
      <title>Łuk redukcyjny QBFRa – widoki</title>

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

      {geometry.highlightLines.map((segment, index) => (
        <line
          key={`highlight-${index}`}
          x1={segment.start.x}
          y1={segment.start.y}
          x2={segment.end.x}
          y2={segment.end.y}
          stroke={SECONDARY_STROKE}
          strokeWidth={1}
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
          strokeWidth={1.2}
        />
      ))}

      {geometry.dashedLines.map((segment, index) => (
        <line
          key={`dashed-${index}`}
          x1={segment.start.x}
          y1={segment.start.y}
          x2={segment.end.x}
          y2={segment.end.y}
          stroke={DASH_STROKE}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ))}

      {geometry.arcs.map((arc, index) => (
        <path
          key={`arc-${index}`}
          d={arcPath(arc)}
          fill="none"
          stroke={PRIMARY_STROKE}
          strokeWidth={1.2}
        />
      ))}

      {geometry.labels.map((label, index) => (
        <text
          key={`label-${label.text}-${index}`}
          x={label.position.x}
          y={label.position.y}
          fontSize={LABEL_FONT_SIZE}
          fontWeight="600"
          fill={PRIMARY_STROKE}
          textAnchor={label.anchor || 'middle'}
          dominantBaseline={label.baseline || 'alphabetic'}
        >
          {label.text}
        </text>
      ))}
    </svg>
  );
}

export default TechnicalDrawingQBFRa;
