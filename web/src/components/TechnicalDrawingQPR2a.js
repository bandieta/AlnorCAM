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

const computeGeometry = ({ a, b, c, d, L, m, h, ee, f }) => {
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

  let maxVal = Math.max(a, b);
  if ((L + m + h) > maxVal) {
    maxVal = L;
  }
  if (flange > maxVal) {
    maxVal = flange;
  }
  if (maxVal <= 0) {
    maxVal = 1;
  }

  const scale = 70 / maxVal;

  let aScaled = a * scale;
  let bScaled = b * scale;
  let cScaled = c * scale;
  let dScaled = d * scale;
  let lScaled = L * scale;
  let mScaled = m * scale;
  let hScaled = h * scale;
  let eeScaled = ee * scale;
  let fScaled = f * scale;
  let pScaled = flange * scale;

  let guard = 0;
  while (
    (lScaled + mScaled + hScaled + 20 + eeScaled + fScaled) < 100 &&
    (aScaled + 20) < 80 &&
    (bScaled + 20) < 80 &&
    guard < 12
  ) {
    aScaled *= 1.25;
    bScaled *= 1.25;
    cScaled *= 1.25;
    dScaled *= 1.25;
    lScaled *= 1.25;
    mScaled *= 1.25;
    hScaled *= 1.25;
    eeScaled *= 1.25;
    fScaled *= 1.25;
    pScaled *= 1.25;
    guard += 1;
  }

  let pushX = mod(110 - (aScaled + lScaled), 110) / 2;
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
  const innerRect = [
    { x: frontOriginX - fScaled, y: frontOriginY - eeScaled },
    { x: frontOriginX - fScaled + cScaled, y: frontOriginY - eeScaled },
    { x: frontOriginX - fScaled + cScaled, y: frontOriginY - eeScaled + dScaled },
    { x: frontOriginX - fScaled, y: frontOriginY - eeScaled + dScaled }
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

  // e dimension (vertical)
  const eLineX = frontRect[1].x + 15;
  const eTop = { x: eLineX, y: frontRect[1].y };
  const eBottom = { x: eLineX, y: innerRect[1].y };
  addLine(eTop, eBottom);
  addLine({ x: eTop.x - 6, y: eTop.y }, { x: eTop.x + 6, y: eTop.y });
  addLine({ x: eBottom.x - 6, y: eBottom.y }, { x: eBottom.x + 6, y: eBottom.y });
  addLabel('e', {
    x: frontRect[1].x + 20,
    y: ((frontRect[1].y + innerRect[1].y) / 2) - 8
  }, { anchor: 'start', baseline: 'middle' });

  // a dimension (bottom of outer rect)
  const aBaseY = frontRect[2].y + 15;
  const aLeft = { x: frontRect[3].x, y: aBaseY };
  const aRight = { x: frontRect[2].x, y: aBaseY };
  addLine(aLeft, aRight);
  addLine({ x: aLeft.x, y: aBaseY - 3 }, { x: aLeft.x, y: aBaseY + 3 });
  addLine({ x: aRight.x, y: aBaseY - 3 }, { x: aRight.x, y: aBaseY + 3 });
  addLabel('a', {
    x: ((aLeft.x + aRight.x) / 2) - 4,
    y: aBaseY + 4
  });

  // c dimension (bottom of inner rect)
  const cBaseY = innerRect[2].y + 15;
  const cLeft = { x: innerRect[3].x, y: cBaseY };
  const cRight = { x: innerRect[2].x, y: cBaseY };
  addLine(cLeft, cRight);
  addLine({ x: cLeft.x, y: cBaseY - 3 }, { x: cLeft.x, y: cBaseY + 3 });
  addLine({ x: cRight.x, y: cBaseY - 3 }, { x: cRight.x, y: cBaseY + 3 });
  addLabel('c', {
    x: ((cLeft.x + cRight.x) / 2) - 4,
    y: cBaseY + 4
  });

  // f dimension (left offset)
  const fLineY = frontRect[0].y - 15;
  const fStart = { x: frontRect[0].x, y: fLineY };
  const fEnd = { x: frontRect[0].x - (fScaled + pScaled), y: fLineY };
  addLine(fStart, fEnd);
  addLine({ x: fStart.x, y: fLineY - 3 }, { x: fStart.x, y: fLineY + 3 });
  addLine({ x: fEnd.x, y: fLineY - 3 }, { x: fEnd.x, y: fLineY + 3 });
  addLabel('f', {
    x: (fStart.x + fEnd.x) / 2,
    y: fLineY - 20
  }, { anchor: 'middle', baseline: 'middle' });

  const sideOriginX = 20 + pushX;
  const sideOriginY = 20 + pushY;

  const profileOriginal = [
    { x: sideOriginX + mScaled, y: sideOriginY - eeScaled },
    { x: sideOriginX + lScaled, y: sideOriginY },
    { x: sideOriginX + lScaled, y: sideOriginY + bScaled },
    { x: sideOriginX + mScaled, y: sideOriginY - eeScaled + dScaled }
  ];

  addPolygon(profileOriginal);
  addLine(profileOriginal[0], profileOriginal[3], true);

  const profile = profileOriginal.map(clonePoint);

  const leftOuterTop = clonePoint(profile[0]);
  const leftOuterBottom = clonePoint(profile[3]);
  profile[0].x -= mScaled;
  profile[3].x -= mScaled;

  addLine(leftOuterTop, profile[0]);
  addLine(leftOuterBottom, profile[3]);
  addLine(
    { x: profile[0].x + pScaled, y: profile[0].y },
    { x: profile[3].x + pScaled, y: profile[3].y }
  );
  addLine(
    { x: profile[0].x, y: profile[0].y - pScaled },
    { x: profile[3].x, y: profile[3].y + pScaled }
  );

  const dTop = { x: profile[0].x - 19, y: profile[0].y + pScaled };
  const dBottom = { x: profile[3].x - 19, y: profile[3].y - pScaled };
  addLine(dTop, dBottom);
  addLine({ x: dTop.x - 3, y: dTop.y }, { x: dTop.x + 3, y: dTop.y });
  addLine({ x: dBottom.x - 3, y: dBottom.y }, { x: dBottom.x + 3, y: dBottom.y });
  addLabel('d', {
    x: dTop.x - 6,
    y: (dTop.y + dBottom.y) / 2
  }, { anchor: 'end', baseline: 'middle' });

  addLine(profileOriginal[1], profileOriginal[2], true);

  const rightOuterTop = { x: profileOriginal[1].x + hScaled, y: profileOriginal[1].y };
  const rightOuterBottom = { x: profileOriginal[2].x + hScaled, y: profileOriginal[2].y };
  addLine(rightOuterTop, profileOriginal[1]);
  addLine(rightOuterBottom, profileOriginal[2]);
  addLine(
    { x: rightOuterTop.x - pScaled, y: rightOuterTop.y },
    { x: rightOuterBottom.x - pScaled, y: rightOuterBottom.y }
  );
  addLine(
    { x: rightOuterBottom.x, y: rightOuterBottom.y + pScaled },
    { x: rightOuterTop.x, y: rightOuterTop.y - pScaled }
  );

  // m dimension
  addLine(
    { x: profile[0].x, y: profile[0].y - 13 },
    { x: profile[0].x, y: profile[0].y - 7 }
  );
  addLine(
    { x: profile[0].x + mScaled, y: profile[0].y - 13 },
    { x: profile[0].x + mScaled, y: profile[0].y - 7 }
  );
  addLine(
    { x: profile[0].x, y: profile[0].y - 10 },
    { x: profile[0].x + mScaled, y: profile[0].y - 10 }
  );
  addLabel('m', {
    x: profile[0].x,
    y: profile[0].y - 26
  }, { anchor: 'start', baseline: 'alphabetic' });

  // h dimension
  addLine(
    { x: profileOriginal[1].x, y: profileOriginal[1].y - 13 },
    { x: profileOriginal[1].x, y: profileOriginal[1].y - 7 }
  );
  addLine(
    { x: profileOriginal[1].x + hScaled, y: profileOriginal[1].y - 13 },
    { x: profileOriginal[1].x + hScaled, y: profileOriginal[1].y - 7 }
  );
  addLine(
    { x: profileOriginal[1].x, y: profileOriginal[1].y - 10 },
    { x: profileOriginal[1].x + hScaled, y: profileOriginal[1].y - 10 }
  );
  addLabel('h', {
    x: profileOriginal[1].x,
    y: profileOriginal[1].y - 26
  }, { anchor: 'start', baseline: 'alphabetic' });

  profile[1].x += hScaled;
  profile[2].x += hScaled;

  profile[2].y += 15;
  profile[3].y = profile[2].y;

  const lengthLeft = { x: profile[3].x, y: profile[2].y };
  const lengthRight = { x: profile[2].x, y: profile[2].y };
  addLine(lengthLeft, lengthRight);
  addLine({ x: lengthLeft.x, y: lengthLeft.y - 3 }, { x: lengthLeft.x, y: lengthLeft.y + 3 });
  addLine({ x: lengthRight.x, y: lengthRight.y - 3 }, { x: lengthRight.x, y: lengthRight.y + 3 });
  addLabel('L', {
    x: (lengthLeft.x + lengthRight.x - 2) / 2,
    y: lengthLeft.y + 4
  });

  const bDimTop = { x: profile[1].x + 15, y: profile[1].y };
  const bDimBottom = { x: profile[2].x + 15, y: profile[2].y - 15 };
  addLine(bDimTop, bDimBottom);
  addLine({ x: bDimTop.x - 3, y: bDimTop.y }, { x: bDimTop.x + 3, y: bDimTop.y });
  addLine({ x: bDimBottom.x - 3, y: bDimBottom.y }, { x: bDimBottom.x + 3, y: bDimBottom.y });
  addLine(
    { x: profile[2].x + 12, y: profile[2].y - 15 },
    { x: profile[2].x + 18, y: profile[2].y - 15 }
  );
  addLabel('b', {
    x: profile[2].x + 5,
    y: ((profile[0].y + profile[3].y) - 5) / 2 - 8
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

function TechnicalDrawingQPR2a({ a, b, c, d, L, m, h, ee, f }) {
  const aVal = formatNumber(Number(a));
  const bVal = formatNumber(Number(b));
  const cVal = formatNumber(Number(c));
  const dVal = formatNumber(Number(d));
  const lVal = formatNumber(Number(L));
  const mVal = Math.max(0, formatNumber(Number(m)));
  const hVal = Math.max(0, formatNumber(Number(h)));
  const eeVal = Math.max(0, formatNumber(Number(ee)));
  const fVal = Math.max(0, formatNumber(Number(f)));

  if (aVal <= 0 || bVal <= 0 || cVal <= 0 || dVal <= 0 || lVal <= 0) {
    return (
      <div className="technical-drawing-empty" role="note">
        Brak danych do wygenerowania rysunku dla redukcji QPR2a.
      </div>
    );
  }

  const geometry = computeGeometry({
    a: aVal,
    b: bVal,
    c: cVal,
    d: dVal,
    L: lVal,
    m: mVal,
    h: hVal,
    ee: eeVal,
    f: fVal
  });

  if (!geometry) {
    return (
      <div className="technical-drawing-empty" role="note">
        Nie udało się obliczyć rysunku QPR2a.
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
      aria-label="Rysunek techniczny redukcji QPR2a"
    >
      <title>Redukcja QPR2a – widoki</title>

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

export default TechnicalDrawingQPR2a;
