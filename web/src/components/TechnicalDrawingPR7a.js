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

const computeGeometry = ({ a, b, d, L, m, h, e, f }) => {
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
    if (radius <= 0) {
      return;
    }
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
  const composite = L + m + a + h + f + e;
  if (composite > maxVal) {
    maxVal = composite;
  }
  if (flange > maxVal) {
    maxVal = flange;
  }
  if (maxVal <= 0) {
    maxVal = 1;
  }

  const scale = 90 / maxVal;

  let aScaled = a * scale;
  let bScaled = b * scale;
  let dScaled = d * scale;
  let lScaled = L * scale;
  let mScaled = m * scale;
  let hScaled = h * scale;
  let eScaled = e * scale;
  let fScaled = f * scale;
  let pScaled = flange * scale;

  let guard = 0;
  while (
    (lScaled + mScaled + hScaled + aScaled + eScaled + fScaled + 1) < 131 &&
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
    eScaled *= 1.25;
    fScaled *= 1.25;
    pScaled *= 1.25;
    guard += 1;
  }

  let pushX = 150 - aScaled - lScaled - mScaled - hScaled;
  if (pushX < 30) {
    pushX = 30;
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
    x: frontOriginX - fScaled + dScaled / 2,
    y: frontOriginY - eScaled + dScaled / 2
  };
  const innerRadius = dScaled / 2;
  const outerRadius = innerRadius + pScaled;
  addCircle(circleCenter, innerRadius);
  addCircle(circleCenter, outerRadius);

  let aaa = clonePoint(frontRect[2]);
  let bbb = clonePoint(frontRect[3]);
  aaa.y += 15;
  bbb.y += 15;
  addLine(aaa, bbb);
  bbb = clonePoint(aaa);
  aaa.y -= 3;
  bbb.y += 3;
  addLine(aaa, bbb);
  aaa = clonePoint(frontRect[3]);
  bbb = clonePoint(frontRect[3]);
  aaa.y += 15;
  bbb.y += 15;
  aaa.y -= 3;
  bbb.y += 3;
  addLine(aaa, bbb);
  aaa = clonePoint(frontRect[2]);
  aaa.x = ((aaa.x + bbb.x) / 2) - 4;
  aaa.y += 15;
  addLabel('a', aaa);

  const circleTopY = circleCenter.y - innerRadius;
  const eDimX = frontRect[1].x + 15;
  const eTop = { x: eDimX, y: frontRect[1].y };
  const eBottom = { x: eDimX, y: circleTopY };
  addLine(eTop, eBottom);
  addLine({ x: eTop.x - 3, y: eTop.y }, { x: eTop.x + 3, y: eTop.y });
  addLine({ x: eBottom.x - 3, y: eBottom.y }, { x: eBottom.x + 3, y: eBottom.y });
  addLabel('e', {
    x: frontRect[1].x + 20,
    y: (eTop.y + eBottom.y) / 2 - 8
  }, { anchor: 'start', baseline: 'middle' });

  const fDimY = frontRect[0].y - 15;
  const fRight = { x: frontRect[0].x, y: fDimY };
  const fLeft = { x: frontOuterRect[0].x - fScaled, y: fDimY };
  addLine(fLeft, fRight);
  addLine({ x: fRight.x, y: fDimY - 3 }, { x: fRight.x, y: fDimY + 3 });
  addLine({ x: fLeft.x, y: fDimY - 3 }, { x: fLeft.x, y: fDimY + 3 });
  addLabel('f', {
    x: (frontOuterRect[0].x + fLeft.x) / 2 - 4,
    y: frontOuterRect[0].y - 35
  });

  const sideOriginX = 20 + pushX;
  const sideOriginY = 20 + pushY;

  const profile = [
    { x: sideOriginX, y: sideOriginY - eScaled },
    { x: sideOriginX + lScaled, y: sideOriginY },
    { x: sideOriginX + lScaled, y: sideOriginY + bScaled },
    { x: sideOriginX, y: sideOriginY - eScaled + dScaled }
  ];

  addPolygon(profile);

  const circleCenterProfile = {
    x: profile[0].x,
    y: (profile[0].y + profile[3].y) / 2
  };
  addLine(circleCenterProfile, profile[1]);
  addLine(circleCenterProfile, profile[2]);

  const leftOuterTop = { x: profile[0].x - mScaled, y: profile[0].y };
  const leftOuterBottom = { x: profile[3].x - mScaled, y: profile[3].y };
  addLine(leftOuterTop, profile[0]);
  addLine(leftOuterBottom, profile[3]);

  const leftInnerTop = { x: leftOuterTop.x + pScaled, y: leftOuterTop.y };
  const leftInnerBottom = { x: leftOuterBottom.x + pScaled, y: leftOuterBottom.y };
  addLine(leftInnerTop, leftInnerBottom);

  const leftDiagTop = { x: leftOuterTop.x, y: leftOuterTop.y - pScaled };
  const leftDiagBottom = { x: leftOuterBottom.x, y: leftOuterBottom.y + pScaled };
  addLine(leftDiagTop, leftDiagBottom);

  const dDimX = leftOuterTop.x - 19;
  const dTop = { x: dDimX, y: leftInnerTop.y + pScaled };
  const dBottom = { x: dDimX, y: leftInnerBottom.y - pScaled };
  addLine(dTop, dBottom);
  addLine({ x: dTop.x - 3, y: dTop.y }, { x: dTop.x + 3, y: dTop.y });
  addLine({ x: dBottom.x - 3, y: dBottom.y }, { x: dBottom.x + 3, y: dBottom.y });
  addLabel('d', {
    x: dDimX - 6,
    y: (dTop.y + dBottom.y) / 2
  }, { anchor: 'end', baseline: 'middle' });

  addLine(profile[1], profile[2], true);

  const rightOuterTop = { x: profile[1].x + hScaled, y: profile[1].y };
  const rightOuterBottom = { x: profile[2].x + hScaled, y: profile[2].y };
  addLine(rightOuterTop, profile[1]);
  addLine(rightOuterBottom, profile[2]);

  const rightInnerTop = { x: rightOuterTop.x - pScaled, y: rightOuterTop.y };
  const rightInnerBottom = { x: rightOuterBottom.x - pScaled, y: rightOuterBottom.y };
  addLine(rightInnerTop, rightInnerBottom);

  const rightDiagTop = { x: rightOuterTop.x, y: rightOuterTop.y - pScaled };
  const rightDiagBottom = { x: rightOuterBottom.x, y: rightOuterBottom.y + pScaled };
  addLine(rightDiagBottom, rightDiagTop);

  const mTickLeft = { x: leftOuterTop.x, y: leftOuterTop.y - 13 };
  const mTickLeftBottom = { x: leftOuterTop.x, y: leftOuterTop.y - 7 };
  addLine(mTickLeft, mTickLeftBottom);
  const mTickRight = { x: leftOuterTop.x + mScaled, y: leftOuterTop.y - 13 };
  const mTickRightBottom = { x: leftOuterTop.x + mScaled, y: leftOuterTop.y - 7 };
  addLine(mTickRight, mTickRightBottom);
  addLine(
    { x: leftOuterTop.x, y: leftOuterTop.y - 10 },
    { x: leftOuterTop.x + mScaled, y: leftOuterTop.y - 10 }
  );
  addLabel('m', {
    x: leftOuterTop.x,
    y: leftOuterTop.y - 20
  });

  const hTickLeft = { x: profile[1].x, y: profile[1].y - 13 };
  const hTickLeftBottom = { x: profile[1].x, y: profile[1].y - 7 };
  addLine(hTickLeft, hTickLeftBottom);
  const hTickRight = { x: rightOuterTop.x, y: rightOuterTop.y - 13 };
  const hTickRightBottom = { x: rightOuterTop.x, y: rightOuterTop.y - 7 };
  addLine(hTickRight, hTickRightBottom);
  addLine(
    { x: profile[1].x, y: profile[1].y - 10 },
    { x: rightOuterTop.x, y: rightOuterTop.y - 10 }
  );
  addLabel('h', {
    x: profile[1].x,
    y: profile[1].y - 20
  });

  const lengthBaseY = profile[2].y + 15;
  const lengthLeft = { x: profile[3].x, y: lengthBaseY };
  const lengthRight = { x: rightOuterBottom.x, y: lengthBaseY };
  addLine(lengthLeft, lengthRight);
  addLine({ x: lengthLeft.x, y: lengthBaseY - 3 }, { x: lengthLeft.x, y: lengthBaseY + 3 });
  addLine({ x: lengthRight.x, y: lengthBaseY - 3 }, { x: lengthRight.x, y: lengthBaseY + 3 });
  addLabel('L', {
    x: (lengthLeft.x + lengthRight.x - 2) / 2,
    y: lengthBaseY + 4
  });

  const bDimX = rightOuterTop.x + 15;
  const bTop = { x: bDimX, y: profile[1].y };
  const bBottom = { x: bDimX, y: rightOuterBottom.y };
  addLine(bTop, bBottom);
  addLine({ x: bTop.x - 3, y: bTop.y }, { x: bTop.x + 3, y: bTop.y });
  const bTickBottomY = rightOuterBottom.y;
  addLine({ x: rightOuterBottom.x + 12, y: bTickBottomY }, { x: rightOuterBottom.x + 18, y: bTickBottomY });
  addLabel('b', {
    x: rightOuterBottom.x + 17,
    y: (profile[0].y + profile[3].y) / 2 - 10.5
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

function TechnicalDrawingPR7a({ a, b, d, L, m, h, e, f }) {
  const aVal = formatNumber(Number(a));
  const bVal = formatNumber(Number(b));
  const dVal = formatNumber(Number(d));
  const lVal = formatNumber(Number(L));
  const mVal = Math.max(0, formatNumber(Number(m)));
  const hVal = Math.max(0, formatNumber(Number(h)));
  const eVal = Math.max(0, formatNumber(Number(e)));
  const fVal = Math.max(0, formatNumber(Number(f)));

  if (aVal <= 0 || bVal <= 0 || dVal <= 0 || lVal <= 0) {
    return (
      <div className="technical-drawing-empty" role="note">
        Brak danych do wygenerowania rysunku dla redukcji PR7a.
      </div>
    );
  }

  const geometry = computeGeometry({
    a: aVal,
    b: bVal,
    d: dVal,
    L: lVal,
    m: mVal,
    h: hVal,
    e: eVal,
    f: fVal
  });

  if (!geometry) {
    return (
      <div className="technical-drawing-empty" role="note">
        Nie udało się obliczyć rysunku PR7a.
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
      aria-label="Rysunek techniczny redukcji PR7a"
    >
      <title>Redukcja PR7a – widoki</title>

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

export default TechnicalDrawingPR7a;
