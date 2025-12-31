import React from 'react';

const LABEL_FONT_SIZE = 12;
const MARGIN = 12;
const PRIMARY_STROKE = '#0d47a1';
const DASH_STROKE = '#1565c0';

const formatNumber = (value) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return value;
};

const clonePoint = (pt) => ({ x: pt.x, y: pt.y });

const computeGeometry = ({ a, b, c, d, L, m, h }) => {
  const lines = [];
  const dashedLines = [];
  const polygons = [];
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

  const addLabel = (text, point, options = {}) => {
    labels.push({ text, position: clonePoint(point), ...options });
    rawPoints.push(clonePoint(point));
  };

  const flange = L > 2501 ? 40 : (L > 1000 ? 30 : 25);

  let maxVal = Math.max(a, b, c, d, L + m + h, flange);
  if (maxVal <= 0) {
    maxVal = 1;
  }

  const scale = 80 / maxVal;

  let aScaled = a * scale;
  let bScaled = b * scale;
  let cScaled = c * scale;
  let dScaled = d * scale;
  let lScaled = L * scale;
  let mScaled = m * scale;
  let hScaled = h * scale;
  let pScaled = flange * scale;

  let guard = 0;
  while ((lScaled + mScaled + hScaled + 20) < 160 && (aScaled + 20) < 100 && (bScaled + 20) < 100 && guard < 12) {
    aScaled *= 1.1;
    bScaled *= 1.1;
    cScaled *= 1.1;
    dScaled *= 1.1;
    lScaled *= 1.1;
    mScaled *= 1.1;
    hScaled *= 1.1;
    pScaled *= 1.1;
    guard += 1;
  }

  let pushX = (110 - (aScaled + lScaled + mScaled + hScaled)) % 110;
  if (pushX < 0) {
    pushX = -pushX;
  }
  pushX /= 2;
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
  const innerRect = [
    { x: frontOriginX + (aScaled - cScaled) / 2, y: frontOriginY + (bScaled - dScaled) / 2 },
    { x: frontOriginX + (aScaled + cScaled) / 2, y: frontOriginY + (bScaled - dScaled) / 2 },
    { x: frontOriginX + (aScaled + cScaled) / 2, y: frontOriginY + (bScaled + dScaled) / 2 },
    { x: frontOriginX + (aScaled - cScaled) / 2, y: frontOriginY + (bScaled + dScaled) / 2 }
  ];
  const innerOuterRect = [
    { x: innerRect[0].x - pScaled, y: innerRect[0].y - pScaled },
    { x: innerRect[1].x + pScaled, y: innerRect[1].y - pScaled },
    { x: innerRect[2].x + pScaled, y: innerRect[2].y + pScaled },
    { x: innerRect[3].x - pScaled, y: innerRect[3].y + pScaled }
  ];

  addPolygon(frontRect);
  addPolygon(frontOuterRect);
  addPolygon(innerRect);
  addPolygon(innerOuterRect);

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

  const cOffset = 18;
  aaa = clonePoint(innerRect[3]);
  bbb = clonePoint(innerRect[2]);
  aaa.y += cOffset;
  bbb.y += cOffset;
  addLine(aaa, bbb);
  bbb = clonePoint(aaa);
  aaa.y -= 3;
  bbb.y += 3;
  addLine(aaa, bbb);
  aaa = clonePoint(innerRect[2]);
  bbb = clonePoint(innerRect[2]);
  aaa.y += cOffset;
  bbb.y += cOffset;
  aaa.y -= 3;
  bbb.y += 3;
  addLine(aaa, bbb);
  aaa = clonePoint(innerRect[3]);
  aaa.x = ((aaa.x + bbb.x) / 2) - 4;
  aaa.y += cOffset + 5;
  addLabel('c', aaa);

  const sideOriginX = 20 + pushX;
  const sideOriginY = 20 + pushY;

  const profile = [
    { x: sideOriginX, y: sideOriginY + (bScaled - dScaled) / 2 },
    { x: sideOriginX + lScaled, y: sideOriginY },
    { x: sideOriginX + lScaled, y: sideOriginY + bScaled },
    { x: sideOriginX, y: sideOriginY + (bScaled - dScaled) / 2 + dScaled }
  ];

  addPolygon(profile);
  addLine(profile[0], profile[3], true);

  const qas1 = clonePoint(profile[0]);
  const qas2 = clonePoint(profile[3]);
  profile[0].x -= mScaled;
  profile[3].x -= mScaled;
  addLine(profile[0], qas1);
  addLine(profile[3], qas2);

  aaa = clonePoint(profile[0]);
  bbb = clonePoint(profile[3]);
  aaa.x += pScaled;
  bbb.x += pScaled;
  addLine(aaa, bbb);

  aaa = clonePoint(profile[0]);
  bbb = clonePoint(profile[3]);
  aaa.y -= pScaled;
  bbb.y += pScaled;
  addLine(aaa, bbb);

  const dOffset = 19;
  const dTick = 3;
  const dTop = { x: profile[0].x - dOffset, y: profile[0].y };
  const dBottom = { x: profile[3].x - dOffset, y: profile[3].y };
  addLine(dTop, dBottom);
  addLine({ x: dTop.x - dTick, y: dTop.y }, { x: dTop.x + dTick, y: dTop.y });
  addLine({ x: dBottom.x - dTick, y: dBottom.y }, { x: dBottom.x + dTick, y: dBottom.y });
  addLabel('d', {
    x: dTop.x - 6,
    y: (dTop.y + dBottom.y) / 2
  }, { anchor: 'end', baseline: 'middle' });

  addLine(profile[1], profile[2], true);

  let rightOuterTop = clonePoint(profile[1]);
  let rightOuterBottom = clonePoint(profile[2]);
  rightOuterTop.x += hScaled;
  rightOuterBottom.x += hScaled;

  const rightInnerTop = clonePoint(rightOuterTop);
  const rightInnerBottom = clonePoint(rightOuterBottom);
  rightInnerTop.x -= pScaled;
  rightInnerBottom.x -= pScaled;
  addLine(rightInnerTop, rightInnerBottom);

  addLine(rightOuterTop, profile[1]);
  addLine(rightOuterBottom, profile[2]);

  const rightEdgeTop = clonePoint(rightOuterTop);
  const rightEdgeBottom = clonePoint(rightOuterBottom);
  rightEdgeTop.y -= pScaled;
  rightEdgeBottom.y += pScaled;
  addLine(rightEdgeBottom, rightEdgeTop);

  aaa = clonePoint(profile[0]);
  bbb = clonePoint(profile[0]);
  aaa.y -= 13;
  bbb.y -= 7;
  addLine(aaa, bbb);
  aaa.x += mScaled;
  bbb.x += mScaled;
  addLine(aaa, bbb);
  aaa = clonePoint(profile[0]);
  bbb = clonePoint(profile[0]);
  bbb.x += mScaled;
  aaa.y -= 10;
  bbb.y -= 10;
  addLine(aaa, bbb);
  aaa.y -= 20;
  addLabel('m', aaa);

  aaa = clonePoint(profile[1]);
  bbb = clonePoint(profile[1]);
  aaa.y -= 13;
  bbb.y -= 7;
  addLine(aaa, bbb);
  aaa.x += hScaled;
  bbb.x += hScaled;
  addLine(aaa, bbb);
  aaa = clonePoint(profile[1]);
  bbb = clonePoint(profile[1]);
  bbb.x += hScaled;
  aaa.y -= 10;
  bbb.y -= 10;
  addLine(aaa, bbb);
  aaa.y -= 20;
  addLabel('h', aaa);

  profile[1].x += hScaled;
  profile[2].x += hScaled;

  const dimBaseY = profile[2].y + 15;
  const dimLeft = { x: profile[2].x, y: dimBaseY };
  const dimRight = { x: profile[3].x, y: dimBaseY };
  addLine(dimLeft, dimRight);

  aaa = clonePoint(dimLeft);
  bbb = clonePoint(dimLeft);
  aaa.y -= 3;
  bbb.y += 3;
  addLine(aaa, bbb);
  aaa = clonePoint(dimRight);
  bbb = clonePoint(dimRight);
  aaa.y -= 3;
  bbb.y += 3;
  addLine(aaa, bbb);

  const labelL = {
    x: ((dimRight.x + dimLeft.x) - 2) / 2,
    y: dimRight.y + 4
  };
  addLabel('L', labelL);

  const bOffset = 15;
  const bTick = 3;
  const bTop = { x: profile[1].x + bOffset, y: profile[1].y };
  const bBottom = { x: profile[2].x + bOffset, y: profile[2].y };
  addLine(bTop, bBottom);
  addLine({ x: bTop.x - bTick, y: bTop.y }, { x: bTop.x + bTick, y: bTop.y });
  addLine({ x: bBottom.x - bTick, y: bBottom.y }, { x: bBottom.x + bTick, y: bBottom.y });
  addLabel('b', {
    x: bTop.x + 6,
    y: (bTop.y + bBottom.y) / 2
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
    labels: labels.map(({ text, position, anchor, baseline }) => ({
      text,
      position: translatePoint(position),
      anchor,
      baseline
    }))
  };
};

function TechnicalDrawingQPR6a({ a, b, c, d, L, m, h }) {
  const aVal = formatNumber(Number(a));
  const bVal = formatNumber(Number(b));
  const cVal = formatNumber(Number(c));
  const dVal = formatNumber(Number(d));
  const lVal = formatNumber(Number(L));
  const mVal = Math.max(0, formatNumber(Number(m)));
  const hVal = Math.max(0, formatNumber(Number(h)));

  if (aVal <= 0 || bVal <= 0 || cVal <= 0 || dVal <= 0 || lVal <= 0) {
    return (
      <div className="technical-drawing-empty" role="note">
        Brak danych do wygenerowania rysunku dla redukcji QPR6a.
      </div>
    );
  }

  const geometry = computeGeometry({ a: aVal, b: bVal, c: cVal, d: dVal, L: lVal, m: mVal, h: hVal });

  if (!geometry) {
    return (
      <div className="technical-drawing-empty" role="note">
        Nie udało się obliczyć rysunku QPR6a.
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
      aria-label="Rysunek techniczny redukcji symetrycznej QPR6a"
    >
      <title>Redukcja symetryczna QPR6a – widoki</title>

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

export default TechnicalDrawingQPR6a;