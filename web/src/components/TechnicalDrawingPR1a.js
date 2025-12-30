import React from 'react';

const LABEL_FONT_SIZE = 12;
const MARGIN = 12;
const PRIMARY_STROKE = '#0d47a1';
const DASH_STROKE = '#1565c0';

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

const clonePoint = (pt) => ({ x: pt.x, y: pt.y });

const computeGeometry = ({ a, b, d, L, m, h }) => {
  const lines = [];
  const dashedLines = [];
  const polygons = [];
  const circles = [];
  const labels = [];
  const rawPoints = [];

  const addLine = (start, end, dashed = false) => {
    const line = {
      start: clonePoint(start),
      end: clonePoint(end)
    };
    (dashed ? dashedLines : lines).push(line);
    rawPoints.push(line.start, line.end);
  };

  const addPolygon = (points) => {
    const polygon = points.map(clonePoint);
    polygons.push(polygon);
    polygon.forEach((pt) => rawPoints.push(clonePoint(pt)));
  };

  const addCircle = (center, radius) => {
    const circle = { center: clonePoint(center), radius };
    circles.push(circle);
    rawPoints.push(
      { x: center.x + radius, y: center.y },
      { x: center.x - radius, y: center.y },
      { x: center.x, y: center.y + radius },
      { x: center.x, y: center.y - radius }
    );
  };

  const addLabel = (text, point, options = {}) => {
    labels.push({ text, position: clonePoint(point), ...options });
    rawPoints.push(clonePoint(point));
  };

  const flange = L > 2501 ? 40 : (L > 1000 ? 30 : 25);

  let maxVal = Math.max(a, b);
  maxVal = Math.max(maxVal, L + m + h);
  maxVal = Math.max(maxVal, flange);
  if (maxVal <= 0) {
    maxVal = 1;
  }

  const scale = 80 / maxVal;

  let aScaled = a * scale;
  let bScaled = b * scale;
  let dScaled = d * scale;
  let lScaled = L * scale;
  let mScaled = m * scale;
  let hScaled = h * scale;
  let pScaled = flange * scale;

  let guard = 0;
  while (
    (lScaled + mScaled + hScaled + 20) < 160 &&
    (aScaled + 20) < 100 &&
    (bScaled + 20) < 100 &&
    guard < 12
  ) {
    aScaled *= 1.25;
    bScaled *= 1.25;
    dScaled *= 1.25;
    lScaled *= 1.25;
    mScaled *= 1.25;
    hScaled *= 1.25;
    pScaled *= 1.25;
    guard += 1;
  }

  let pushX = mod(110 - (aScaled + lScaled + hScaled), 110) / 2;
  if (pushX < 0) {
    pushX = -pushX;
  }
  const pushY = ((90 - bScaled) / 2) + 5;

  const frontOriginX = 190 + pushX;
  const frontOriginY = 20 + pushY;

  const frontRect = [
    { x: frontOriginX, y: frontOriginY },
    { x: frontOriginX + aScaled, y: frontOriginY },
    { x: frontOriginX + aScaled, y: frontOriginY + bScaled },
    { x: frontOriginX, y: frontOriginY + bScaled }
  ];

  const frontOuterRect = [
    { x: frontOriginX - pScaled, y: frontOriginY - pScaled },
    { x: frontOriginX + aScaled + pScaled, y: frontOriginY - pScaled },
    { x: frontOriginX + aScaled + pScaled, y: frontOriginY + bScaled + pScaled },
    { x: frontOriginX - pScaled, y: frontOriginY + bScaled + pScaled }
  ];

  addPolygon(frontRect);
  addPolygon(frontOuterRect);

  const circleCenter = {
    x: frontOriginX + aScaled / 2,
    y: frontOriginY + bScaled / 2
  };

  const innerRadius = Math.max(dScaled / 2, 0);
  if (innerRadius > 0) {
    addCircle(circleCenter, innerRadius);
  }

  const outerRadius = innerRadius + pScaled;
  if (outerRadius > innerRadius) {
    addCircle(circleCenter, outerRadius);
  }

  let aaa = clonePoint(frontRect[0]);
  let bbb = clonePoint(frontRect[1]);
  aaa.y -= 15;
  bbb.y -= 15;
  addLine(aaa, bbb);
  bbb = clonePoint(aaa);
  aaa.y -= 3;
  bbb.y += 3;
  addLine(aaa, bbb);
  aaa = clonePoint(frontRect[1]);
  bbb = clonePoint(frontRect[1]);
  aaa.y -= 15;
  bbb.y -= 15;
  aaa.y -= 3;
  bbb.y += 3;
  addLine(aaa, bbb);
  aaa = clonePoint(frontRect[0]);
  aaa.x = ((aaa.x + bbb.x) / 2) - 4;
  aaa.y -= 35;
  addLabel('a', aaa);

  const sideOriginX = 20 + pushX;
  const sideOriginY = 20 + pushY;

  const sideTopLeft = {
    x: sideOriginX,
    y: sideOriginY + (bScaled - dScaled) / 2
  };
  const sideTopRight = {
    x: sideOriginX + lScaled,
    y: sideOriginY
  };
  const sideBottomRight = {
    x: sideOriginX + lScaled,
    y: sideOriginY + bScaled
  };
  const sideBottomLeft = {
    x: sideOriginX,
    y: sideOriginY + (bScaled - dScaled) / 2 + dScaled
  };

  addPolygon([sideTopLeft, sideTopRight, sideBottomRight, sideBottomLeft]);

  const centerPoint = {
    x: sideTopLeft.x,
    y: (sideTopLeft.y + sideBottomLeft.y) / 2
  };

  addLine(centerPoint, sideTopRight);
  addLine(centerPoint, sideBottomRight);

  const leftOffsetTop = { x: sideTopLeft.x - mScaled, y: sideTopLeft.y };
  const leftOffsetBottom = { x: sideBottomLeft.x - mScaled, y: sideBottomLeft.y };

  addLine(leftOffsetTop, sideTopLeft);
  addLine(leftOffsetBottom, sideBottomLeft);
  addLine(leftOffsetTop, leftOffsetBottom);

  const dOffsetX = 19;
  const dTick = 3;
  const dTop = { x: leftOffsetTop.x - dOffsetX, y: leftOffsetTop.y + pScaled };
  const dBottom = { x: leftOffsetBottom.x - dOffsetX, y: leftOffsetBottom.y - pScaled };
  addLine(dTop, dBottom);
  addLine({ x: dTop.x - dTick, y: dTop.y }, { x: dTop.x + dTick, y: dTop.y });
  addLine({ x: dBottom.x - dTick, y: dBottom.y }, { x: dBottom.x + dTick, y: dBottom.y });
  addLabel('d', {
    x: dTop.x - 6,
    y: (dTop.y + dBottom.y) / 2
  }, { anchor: 'end', baseline: 'middle' });

  const rightHiddenTop = clonePoint(sideTopRight);
  const rightHiddenBottom = clonePoint(sideBottomRight);
  addLine(rightHiddenTop, rightHiddenBottom, true);

  const rightOuterTop = { x: sideTopRight.x + hScaled, y: sideTopRight.y };
  const rightOuterBottom = { x: sideBottomRight.x + hScaled, y: sideBottomRight.y };
  const rightInnerTop = { x: rightOuterTop.x - pScaled, y: rightOuterTop.y };
  const rightInnerBottom = { x: rightOuterBottom.x - pScaled, y: rightOuterBottom.y };

  addLine(rightInnerTop, rightInnerBottom);
  addLine(rightOuterTop, sideTopRight);
  addLine(rightOuterBottom, sideBottomRight);
  addLine({ x: rightOuterBottom.x, y: rightOuterBottom.y + pScaled }, { x: rightOuterTop.x, y: rightOuterTop.y - pScaled });

  aaa = clonePoint(leftOffsetTop);
  bbb = clonePoint(leftOffsetTop);
  aaa.y -= 13;
  bbb.y -= 7;
  addLine(aaa, bbb);
  aaa.x += mScaled;
  bbb.x += mScaled;
  addLine(aaa, bbb);
  aaa = clonePoint(leftOffsetTop);
  bbb = clonePoint(leftOffsetTop);
  bbb.x += mScaled;
  aaa.y -= 10;
  bbb.y -= 10;
  addLine(aaa, bbb);
  aaa.y -= 20;
  addLabel('m', aaa);

  aaa = clonePoint(sideTopRight);
  bbb = clonePoint(sideTopRight);
  aaa.y -= 13;
  bbb.y -= 7;
  addLine(aaa, bbb);
  aaa.x += hScaled;
  bbb.x += hScaled;
  addLine(aaa, bbb);
  aaa = clonePoint(sideTopRight);
  bbb = clonePoint(sideTopRight);
  bbb.x += hScaled;
  aaa.y -= 10;
  bbb.y -= 10;
  addLine(aaa, bbb);
  aaa.y -= 20;
  addLabel('h', aaa);

  const lengthBaseY = sideBottomRight.y + 15;
  const lengthLeft = { x: sideBottomLeft.x, y: lengthBaseY };
  const lengthRight = { x: sideBottomRight.x + hScaled, y: lengthBaseY };
  addLine(lengthLeft, lengthRight);
  addLine({ x: lengthLeft.x, y: lengthBaseY - 3 }, { x: lengthLeft.x, y: lengthBaseY + 3 });
  addLine({ x: lengthRight.x, y: lengthBaseY - 3 }, { x: lengthRight.x, y: lengthBaseY + 3 });
  addLabel('L', {
    x: (lengthLeft.x + lengthRight.x - 2) / 2,
    y: lengthBaseY + 4
  });

  const bDimTop = { x: sideTopRight.x + hScaled + 15, y: sideTopRight.y };
  const bDimBottom = { x: sideBottomRight.x + hScaled + 15, y: sideBottomRight.y - 15 };
  addLine(bDimTop, bDimBottom);
  addLine({ x: bDimTop.x - 3, y: bDimTop.y }, { x: bDimTop.x + 3, y: bDimTop.y });
  addLine({ x: bDimBottom.x - 3, y: bDimBottom.y }, { x: bDimBottom.x + 3, y: bDimBottom.y });
  addLabel('b', {
    x: bDimTop.x + 6,
    y: (sideTopLeft.y + sideBottomLeft.y) / 2 - 10.5
  }, { anchor: 'start', baseline: 'middle' });

  if (!rawPoints.length) {
    return null;
  }

  const minX = Math.min(...rawPoints.map((pt) => pt.x));
  const minY = Math.min(...rawPoints.map((pt) => pt.y));
  const maxX = Math.max(...rawPoints.map((pt) => pt.x));
  const maxY = Math.max(...rawPoints.map((pt) => pt.y));

  const offsetX = minX - MARGIN;
  const offsetY = minY - MARGIN;

  const translatePoint = (pt) => ({
    x: pt.x - offsetX,
    y: pt.y - offsetY
  });

  return {
    viewBox: {
      width: (maxX - minX) + MARGIN * 2,
      height: (maxY - minY) + MARGIN * 2
    },
    polygons: polygons.map((poly) => poly.map(translatePoint)),
    lines: lines.map((line) => ({
      start: translatePoint(line.start),
      end: translatePoint(line.end)
    })),
    dashedLines: dashedLines.map((line) => ({
      start: translatePoint(line.start),
      end: translatePoint(line.end)
    })),
    circles: circles.map((circle) => ({
      center: translatePoint(circle.center),
      radius: circle.radius
    })),
    labels: labels.map(({ text, position, anchor, baseline }) => ({
      text,
      position: translatePoint(position),
      anchor,
      baseline
    }))
  };
};

function TechnicalDrawingPR1a({ a, b, d, L, m, h }) {
  const aVal = formatNumber(Number(a));
  const bVal = formatNumber(Number(b));
  const dVal = formatNumber(Number(d));
  const lVal = formatNumber(Number(L));
  const mVal = Math.max(0, formatNumber(Number(m)));
  const hVal = Math.max(0, formatNumber(Number(h)));

  if (aVal <= 0 || bVal <= 0 || dVal <= 0 || lVal <= 0) {
    return (
      <div className="technical-drawing-empty" role="note">
        Brak danych do wygenerowania rysunku dla redukcji PR1a.
      </div>
    );
  }

  const geometry = computeGeometry({ a: aVal, b: bVal, d: dVal, L: lVal, m: mVal, h: hVal });

  if (!geometry) {
    return (
      <div className="technical-drawing-empty" role="note">
        Nie udało się obliczyć rysunku PR1a.
      </div>
    );
  }

  const pathPoints = (points) => points
    .map((pt) => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`)
    .join(' ');

  return (
    <svg
      className="technical-drawing-svg"
      width="100%"
      height="100%"
      viewBox={`0 0 ${geometry.viewBox.width.toFixed(2)} ${geometry.viewBox.height.toFixed(2)}`}
      role="img"
      aria-label="Rysunek techniczny redukcji PR1a"
    >
      <title>Redukcja PR1a – widoki</title>

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

      {geometry.circles.map((circle, index) => (
        <circle
          key={`circle-${index}`}
          cx={circle.center.x}
          cy={circle.center.y}
          r={circle.radius}
          fill="none"
          stroke={PRIMARY_STROKE}
          strokeWidth={1.2}
        />
      ))}

      {geometry.lines.map((line, index) => (
        <line
          key={`line-${index}`}
          x1={line.start.x}
          y1={line.start.y}
          x2={line.end.x}
          y2={line.end.y}
          stroke={PRIMARY_STROKE}
          strokeWidth={1.1}
          strokeLinecap="round"
        />
      ))}

      {geometry.dashedLines.map((line, index) => (
        <line
          key={`dash-${index}`}
          x1={line.start.x}
          y1={line.start.y}
          x2={line.end.x}
          y2={line.end.y}
          stroke={DASH_STROKE}
          strokeWidth={1}
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
      ))}

      {geometry.labels.map((label, index) => (
        <text
          key={`label-${index}`}
          x={label.position.x}
          y={label.position.y}
          fontSize={LABEL_FONT_SIZE}
          fontWeight="600"
          fill={PRIMARY_STROKE}
          textAnchor={label.anchor || 'start'}
          dominantBaseline={label.baseline || 'hanging'}
        >
          {label.text}
        </text>
      ))}
    </svg>
  );
}

export default TechnicalDrawingPR1a;
