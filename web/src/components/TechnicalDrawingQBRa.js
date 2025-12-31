import React from 'react';

const LABEL_FONT_SIZE = 12;
const PRIMARY_STROKE = '#0d47a1';
const SECONDARY_STROKE = '#1e88e5';
const DASH_STROKE = '#1565c0';
const MARGIN = 12;
const DEG2RAD = Math.PI / 180;
const TICK = 6;

const mod = (value, modulus) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const result = value % modulus;
  return result >= 0 ? result : result + modulus;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formatNumber = (value) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return value;
};

const clonePoint = (pt) => ({ x: pt.x, y: pt.y });

const normalizeAngle = (deg) => {
  const normalized = deg % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

const isAngleWithinSweep = (startDeg, sweepDeg, testDeg) => {
  const start = normalizeAngle(startDeg);
  const end = normalizeAngle(startDeg + sweepDeg);
  const test = normalizeAngle(testDeg);

  if (sweepDeg === 0) {
    return false;
  }
  if (sweepDeg > 0) { // clockwise in GDI+
    if (start <= end) {
      return test >= start && test <= end;
    }
    return test >= start || test <= end;
  }
  // counter-clockwise sweep
  if (start >= end) {
    return test <= start && test >= end;
  }
  return test <= start || test >= end;
};

const addBoundingCardinals = (rawPoints, center, radius, startAngle, sweepAngle) => {
  const cardinals = [0, 90, 180, 270];
  cardinals.forEach((deg) => {
    if (isAngleWithinSweep(startAngle, sweepAngle, deg)) {
      const rad = deg * DEG2RAD;
      rawPoints.push({
        x: center.x + radius * Math.cos(rad),
        y: center.y + radius * Math.sin(rad)
      });
    }
  });
};

const computeGeometry = ({ a, b, d, ee, f, r, alfa }) => {
  const lines = [];
  const dashedLines = [];
  const highlightLines = [];
  const polygons = [];
  const arcs = [];
  const labels = [];
  const rawPoints = [];

  const addPoint = (pt) => {
    rawPoints.push({ x: pt.x, y: pt.y });
  };

  const addLine = (start, end, style = 'primary') => {
    const segment = { start: clonePoint(start), end: clonePoint(end) };
    if (style === 'dashed') {
      dashedLines.push(segment);
    } else if (style === 'secondary') {
      highlightLines.push(segment);
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

  const addArc = (center, radius, startAngleDeg, sweepAngleDeg) => {
    if (!Number.isFinite(radius) || radius <= 0 || sweepAngleDeg === 0) {
      return;
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
    addBoundingCardinals(rawPoints, center, radius, startAngleDeg, sweepAngleDeg);
  };

  const l = 3;
  let flange = 25;
  let maxVal = Math.max(a, b + ee, d + f);
  if (!Number.isFinite(maxVal) || maxVal <= 0) {
    maxVal = Math.max(a, b, d, ee, f, r, 1);
  }
  if (maxVal > 1000) {
    flange = 30;
  }
  if (maxVal > 2501) {
    flange = 40;
  }

  maxVal += r + ee;
  maxVal = Math.max(maxVal, flange, f, ee);
  const scale = maxVal > 0 ? 80 / maxVal : 1;

  const aScaled = a * scale;
  const bScaled = b * scale;
  const dScaled = d * scale;
  const eeScaled = ee * scale;
  const fScaled = f * scale;
  const baseRadius = alfa === 90 ? r : (r === 0 ? 1 : r);
  const rScaled = baseRadius * scale;
  const pScaled = flange * scale;

  const alphaRad = alfa * DEG2RAD;
  const sinAlpha = Math.sin(alphaRad);
  const cosAlpha = Math.cos(alphaRad);
  const ddScaled = d * sinAlpha * scale;

  let pushX = mod(110 - aScaled - l, 110) / 2;
  if (pushX < 0) {
    pushX = -pushX;
  }
  const pushY = ((90 - bScaled) / 2) + 5;

  const frontOrigin = { x: 190 + pushX, y: 20 + pushY };
  const sideOrigin = { x: 20 + pushX, y: 20 + pushY };

  const isRightAngle = Math.abs(alfa - 90) < 0.0001;

  if (isRightAngle) {
    const smallRect = [
      { x: frontOrigin.x, y: frontOrigin.y },
      { x: frontOrigin.x + aScaled, y: frontOrigin.y },
      { x: frontOrigin.x + aScaled, y: frontOrigin.y + dScaled },
      { x: frontOrigin.x, y: frontOrigin.y + dScaled }
    ];
    const outerRect = [
      { x: frontOrigin.x - pScaled, y: frontOrigin.y - pScaled },
      { x: frontOrigin.x + aScaled + pScaled, y: frontOrigin.y - pScaled },
      { x: frontOrigin.x + aScaled + pScaled, y: frontOrigin.y + dScaled + pScaled },
      { x: frontOrigin.x - pScaled, y: frontOrigin.y + dScaled + pScaled }
    ];
    addPolygon(outerRect);
    addPolygon(smallRect);

    const baseRect = [
      { x: smallRect[3].x, y: smallRect[3].y },
      { x: smallRect[2].x, y: smallRect[2].y },
      { x: smallRect[2].x, y: smallRect[2].y + fScaled + rScaled },
      { x: smallRect[3].x, y: smallRect[3].y + fScaled + rScaled }
    ];
    addPolygon(baseRect);

    addLine(
      { x: baseRect[0].x + 1, y: baseRect[0].y + fScaled + rScaled },
      { x: baseRect[1].x - 1, y: baseRect[1].y + fScaled + rScaled },
      'secondary'
    );

    addLine(
      { x: baseRect[0].x, y: baseRect[0].y + fScaled + rScaled - pScaled },
      { x: baseRect[1].x, y: baseRect[1].y + fScaled + rScaled - pScaled }
    );
    addLine(
      { x: baseRect[0].x + pScaled, y: baseRect[0].y + fScaled + rScaled },
      { x: baseRect[1].x - pScaled, y: baseRect[1].y + fScaled + rScaled }
    );

    const sideRect = [
      { x: sideOrigin.x, y: sideOrigin.y },
      { x: sideOrigin.x + eeScaled + bScaled + rScaled, y: sideOrigin.y },
      { x: sideOrigin.x + eeScaled + bScaled + rScaled, y: sideOrigin.y + dScaled + fScaled + rScaled },
      { x: sideOrigin.x, y: sideOrigin.y + dScaled + fScaled + rScaled }
    ];
    addPolygon(sideRect);

    const baseBottomY = baseRect[3].y;
    const radiusCorner = {
      x: sideOrigin.x + eeScaled + rScaled,
      y: sideOrigin.y + dScaled
    };
    const dDimY = baseBottomY + 32;

    const outerArcCenter = {
      x: sideRect[1].x - (dScaled + rScaled),
      y: sideRect[1].y + (dScaled + rScaled)
    };
    addArc(outerArcCenter, dScaled + rScaled, 0, -alfa);

    if (rScaled > 0.1) {
      const innerArcCenter = {
        x: sideRect[1].x - bScaled - rScaled,
        y: sideRect[1].y + dScaled + rScaled
      };
      addArc(innerArcCenter, rScaled, 270, 90);
      addLine(
        { x: innerArcCenter.x, y: innerArcCenter.y },
        { x: sideRect[1].x - bScaled, y: sideRect[1].y + dScaled }
      );
      addLine(
        { x: sideRect[0].x, y: sideRect[0].y + dScaled },
        { x: innerArcCenter.x, y: innerArcCenter.y }
      );
      addLine(
        { x: sideRect[2].x - bScaled, y: sideRect[2].y },
        { x: innerArcCenter.x + rScaled, y: innerArcCenter.y }
      );
    }

    if (rScaled > 0.1) {
      const radiusLeaderStart = {
        x: radiusCorner.x - rScaled,
        y: radiusCorner.y + rScaled
      };
      addLine(radiusLeaderStart, radiusCorner);
      addLabel('r', {
        x: radiusCorner.x - 4,
        y: radiusCorner.y - 12
      }, { anchor: 'end', baseline: 'middle' });
    }

    const dLineX = sideRect[0].x - 15;
    addLine(
      { x: dLineX, y: sideRect[0].y },
      { x: dLineX, y: sideRect[0].y + dScaled }
    );
    addLine(
      { x: dLineX - 3, y: sideRect[0].y },
      { x: dLineX + 3, y: sideRect[0].y }
    );
    addLine(
      { x: dLineX - 3, y: sideRect[0].y + dScaled },
      { x: dLineX + 3, y: sideRect[0].y + dScaled }
    );
    addLabel('b', {
      x: dLineX - 8,
      y: sideRect[0].y + dScaled / 2 - 8
    }, { anchor: 'end', baseline: 'middle' });

    const fLineX = sideRect[3].x - 15;
    addLine(
      { x: fLineX, y: sideRect[3].y },
      { x: fLineX, y: sideRect[3].y - fScaled }
    );
    addLine(
      { x: fLineX - 3, y: sideRect[3].y },
      { x: fLineX + 3, y: sideRect[3].y }
    );
    addLine(
      { x: fLineX - 3, y: sideRect[3].y - fScaled },
      { x: fLineX + 3, y: sideRect[3].y - fScaled }
    );
    addLabel('f', {
      x: fLineX - 10,
      y: sideRect[3].y - (fScaled / 2) + 10
    }, { anchor: 'end', baseline: 'middle' });

    const eLineY = sideRect[2].y + 15;
    const eStart = { x: sideRect[2].x - rScaled, y: eLineY };
    const eEnd = { x: sideRect[3].x, y: eLineY };
    addLine(eStart, eEnd);
    addLine({ x: eStart.x, y: eLineY - 3 }, { x: eStart.x, y: eLineY + 3 });
    addLine({ x: eEnd.x, y: eLineY - 3 }, { x: eEnd.x, y: eLineY + 3 });
    addLabel('e', {
      x: (eStart.x + eEnd.x) / 2,
      y: eLineY + 12
    }, { anchor: 'middle', baseline: 'hanging' });

    const extraLineStart = { x: sideRect[2].x + bScaled, y: eLineY };
    const extraLineEnd = { x: sideRect[3].x + eeScaled, y: eLineY };
    addLine(extraLineStart, extraLineEnd);

    if (bScaled > 0) {
      const dLeft = { x: radiusCorner.x, y: dDimY };
      const dRight = { x: radiusCorner.x + bScaled, y: dDimY };
      addLine(dLeft, dRight);
      addLine({ x: dLeft.x, y: dDimY - 3 }, { x: dLeft.x, y: dDimY + 3 });
      addLine({ x: dRight.x, y: dDimY - 3 }, { x: dRight.x, y: dDimY + 3 });
      addLabel('d', {
        x: (dLeft.x + dRight.x) / 2,
        y: dDimY + 6
      }, { anchor: 'middle', baseline: 'hanging' });
    }

    const flangeLeftTop = { x: sideRect[0].x, y: sideRect[0].y + dScaled + pScaled };
    const flangeLeftBottom = { x: sideRect[0].x, y: sideRect[0].y - pScaled };
    addLine(flangeLeftTop, flangeLeftBottom);

    const flangeInnerLeft = { x: sideRect[0].x + pScaled, y: sideRect[0].y + dScaled };
    const flangeInnerTop = { x: sideRect[0].x + pScaled, y: sideRect[0].y };
    addLine(flangeInnerLeft, flangeInnerTop);

    const aDimY = smallRect[0].y - 15;
    addLine(
      { x: smallRect[0].x, y: aDimY },
      { x: smallRect[1].x, y: aDimY }
    );
    addLine({ x: smallRect[0].x, y: aDimY - 3 }, { x: smallRect[0].x, y: aDimY + 3 });
    addLine({ x: smallRect[1].x, y: aDimY - 3 }, { x: smallRect[1].x, y: aDimY + 3 });
    addLabel('a', {
      x: (smallRect[0].x + smallRect[1].x) / 2 - 4,
      y: aDimY - 20
    });
  } else {
    const smallRect = [
      { x: frontOrigin.x, y: frontOrigin.y },
      { x: frontOrigin.x + aScaled, y: frontOrigin.y },
      { x: frontOrigin.x + aScaled, y: frontOrigin.y + ddScaled },
      { x: frontOrigin.x, y: frontOrigin.y + ddScaled }
    ];
    const outerRect = [
      { x: frontOrigin.x - pScaled, y: frontOrigin.y - pScaled },
      { x: frontOrigin.x + aScaled + pScaled, y: frontOrigin.y - pScaled },
      { x: frontOrigin.x + aScaled + pScaled, y: frontOrigin.y + ddScaled + pScaled },
      { x: frontOrigin.x - pScaled, y: frontOrigin.y + ddScaled + pScaled }
    ];
    addPolygon(outerRect);
    addPolygon(smallRect);

    const baseHeight = fScaled + rScaled + eeScaled * sinAlpha;
    const baseRect = [
      { x: smallRect[3].x, y: smallRect[3].y },
      { x: smallRect[2].x, y: smallRect[2].y },
      { x: smallRect[2].x, y: smallRect[2].y + baseHeight },
      { x: smallRect[3].x, y: smallRect[3].y + baseHeight }
    ];
    addPolygon(baseRect);
    addLine(
      { x: baseRect[0].x + 1, y: baseRect[0].y + baseHeight },
      { x: baseRect[1].x - 1, y: baseRect[1].y + baseHeight },
      'secondary'
    );
    addLine(
      { x: baseRect[0].x, y: baseRect[0].y + baseHeight - pScaled },
      { x: baseRect[1].x, y: baseRect[1].y + baseHeight - pScaled }
    );
    addLine(
      { x: baseRect[0].x + pScaled, y: baseRect[0].y + baseHeight },
      { x: baseRect[1].x - pScaled, y: baseRect[1].y + baseHeight }
    );

    const sideRect = [
      {
        x: sideOrigin.x + eeScaled + rScaled,
        y: smallRect[3].y + baseHeight - fScaled
      },
      {
        x: sideOrigin.x + eeScaled + bScaled + rScaled,
        y: smallRect[3].y + baseHeight - fScaled
      },
      {
        x: sideOrigin.x + eeScaled + bScaled + rScaled,
        y: smallRect[3].y + baseHeight
      },
      {
        x: sideOrigin.x + eeScaled + rScaled,
        y: smallRect[3].y + baseHeight
      }
    ];
    addLine(sideRect[0], sideRect[3]);
    addLine(sideRect[1], sideRect[2]);
    addLine({ x: sideRect[0].x - pScaled, y: sideRect[0].y }, { x: sideRect[1].x + pScaled, y: sideRect[1].y });
    addLine({ x: sideRect[3].x - pScaled, y: sideRect[3].y - pScaled }, { x: sideRect[2].x + pScaled, y: sideRect[2].y - pScaled });

    addLine(
      { x: sideRect[3].x, y: sideRect[3].y },
      { x: sideRect[2].x, y: sideRect[2].y }
    );

    addLine(
      { x: sideRect[3].x - pScaled, y: sideRect[3].y },
      { x: sideRect[2].x + pScaled, y: sideRect[2].y }
    );

    const baseBottomY = baseRect[3].y;
    const radiusCorner = {
      x: sideOrigin.x + eeScaled + rScaled,
      y: frontOrigin.y + ddScaled + rScaled + eeScaled * sinAlpha
    };
    const dDimY = baseBottomY + 32;

    const innerArcCenter = {
      x: sideRect[0].x - rScaled,
      y: sideRect[0].y
    };
    addArc(innerArcCenter, rScaled, 0, -alfa);

    addLine(
      { x: innerArcCenter.x + rScaled, y: innerArcCenter.y + rScaled },
      { x: innerArcCenter.x + 2 * rScaled, y: innerArcCenter.y }
    );

    if (rScaled > 0.1) {
      const radiusLeaderStart = {
        x: radiusCorner.x - rScaled,
        y: radiusCorner.y + rScaled
      };
      addLine(radiusLeaderStart, radiusCorner);
      addLabel('r', {
        x: radiusCorner.x - 4,
        y: radiusCorner.y - 12
      }, { anchor: 'end', baseline: 'middle' });
    }

    const elbowStart = {
      x: sideRect[3].x - (rScaled - cosAlpha * rScaled),
      y: sideRect[3].y - fScaled - sinAlpha * rScaled
    };
    const elbowEnd = {
      x: elbowStart.x - sinAlpha * eeScaled,
      y: elbowStart.y - cosAlpha * eeScaled
    };
    addLine(elbowStart, elbowEnd);

    const elbowUpper = {
      x: elbowEnd.x + cosAlpha * dScaled,
      y: elbowEnd.y - sinAlpha * dScaled
    };
    addLine(elbowEnd, elbowUpper);

    const normVec = { x: -(elbowUpper.y - elbowEnd.y), y: elbowUpper.x - elbowEnd.x };
    const segLen = Math.hypot(normVec.x, normVec.y) || 1;
    const unitNorm = { x: normVec.x / segLen, y: normVec.y / segLen };

    const bLineStart = {
      x: elbowEnd.x + unitNorm.x * 15,
      y: elbowEnd.y + unitNorm.y * 15
    };
    const bLineEnd = {
      x: elbowUpper.x + unitNorm.x * 15,
      y: elbowUpper.y + unitNorm.y * 15
    };
    addLine(bLineStart, bLineEnd);
    addLine(
      { x: bLineStart.x - unitNorm.x * 3, y: bLineStart.y - unitNorm.y * 3 },
      { x: bLineStart.x + unitNorm.x * 3, y: bLineStart.y + unitNorm.y * 3 }
    );
    addLine(
      { x: bLineEnd.x - unitNorm.x * 3, y: bLineEnd.y - unitNorm.y * 3 },
      { x: bLineEnd.x + unitNorm.x * 3, y: bLineEnd.y + unitNorm.y * 3 }
    );
    addLabel('b', {
      x: (bLineStart.x + bLineEnd.x) / 2 - 20,
      y: (bLineStart.y + bLineEnd.y) / 2 - 20
    }, { anchor: 'end', baseline: 'middle' });

    const elbowFar = {
      x: elbowUpper.x + sinAlpha * eeScaled,
      y: elbowUpper.y + cosAlpha * eeScaled
    };
    addLine(elbowUpper, elbowFar);

    const eNormVec = { x: -(elbowFar.y - elbowUpper.y), y: elbowFar.x - elbowUpper.x };
    const eLen = Math.hypot(eNormVec.x, eNormVec.y) || 1;
    const eUnit = { x: eNormVec.x / eLen, y: eNormVec.y / eLen };

    const eLineStart = {
      x: elbowUpper.x + eUnit.x * 15,
      y: elbowUpper.y + eUnit.y * 15
    };
    const eLineEnd = {
      x: elbowFar.x + eUnit.x * 15,
      y: elbowFar.y + eUnit.y * 15
    };
    addLine(eLineStart, eLineEnd);
    addLine(
      { x: eLineStart.x - eUnit.x * 3, y: eLineStart.y - eUnit.y * 3 },
      { x: eLineStart.x + eUnit.x * 3, y: eLineStart.y + eUnit.y * 3 }
    );
    addLine(
      { x: eLineEnd.x - eUnit.x * 3, y: eLineEnd.y - eUnit.y * 3 },
      { x: eLineEnd.x + eUnit.x * 3, y: eLineEnd.y + eUnit.y * 3 }
    );
    addLabel('e', {
      x: (eLineStart.x + eLineEnd.x) / 2 + 6,
      y: (eLineStart.y + eLineEnd.y) / 2 - 10
    });

    const topCheck = {
      x: sideRect[1].x,
      y: sideRect[1].y
    };
    const denominator = Math.cos(alphaRad) || 1;
    const lhs = (dScaled + rScaled) / denominator;
    const rhs = bScaled + rScaled;

    if (lhs > rhs) {
      const ctg = 1 / Math.tan(alphaRad || 0.0001);
      const xVal = ctg * ((dScaled / denominator) - bScaled + rScaled * ((1 / denominator) - 1));
      const r1Scaled = (Math.tan(alphaRad / 2) || 0.0001) !== 0 ? xVal / Math.tan(alphaRad / 2) : xVal;
      const arcRadius = r1Scaled;
      const arcCenter = { x: topCheck.x - arcRadius, y: topCheck.y };
      addArc(arcCenter, arcRadius, 0, -alfa);
      const tipPoint = {
        x: topCheck.x - (arcRadius - Math.cos(alphaRad) * arcRadius),
        y: topCheck.y - Math.sin(alphaRad) * arcRadius
      };
      addLine(tipPoint, elbowFar);
    } else if (Math.abs(lhs - rhs) < 0.001) {
      addLine(elbowFar, topCheck);
    }

    const fLineX = sideRect[3].x - 15;
    addLine({ x: fLineX, y: sideRect[3].y }, { x: fLineX, y: sideRect[3].y - fScaled });
    addLine({ x: fLineX - 3, y: sideRect[3].y }, { x: fLineX + 3, y: sideRect[3].y });
    addLine({ x: fLineX - 3, y: sideRect[3].y - fScaled }, { x: fLineX + 3, y: sideRect[3].y - fScaled });
    addLabel('f', {
      x: fLineX - 10,
      y: sideRect[3].y - (fScaled / 2) + 10
    }, { anchor: 'end', baseline: 'middle' });

    const aDimY = smallRect[0].y - 15;
    addLine(
      { x: smallRect[0].x, y: aDimY },
      { x: smallRect[1].x, y: aDimY }
    );
    addLine({ x: smallRect[0].x, y: aDimY - 3 }, { x: smallRect[0].x, y: aDimY + 3 });
    addLine({ x: smallRect[1].x, y: aDimY - 3 }, { x: smallRect[1].x, y: aDimY + 3 });
    addLabel('a', {
      x: (smallRect[0].x + smallRect[1].x) / 2 - 4,
      y: aDimY - 20
    });
  }

  if (!rawPoints.length) {
    return null;
  }

  const minX = Math.min(...rawPoints.map((pt) => pt.x));
  const maxX = Math.max(...rawPoints.map((pt) => pt.x));
  const minY = Math.min(...rawPoints.map((pt) => pt.y));
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
    polygons: polygons.map((polygon) => polygon.map(translatePoint)),
    lines: lines.map((segment) => ({
      start: translatePoint(segment.start),
      end: translatePoint(segment.end)
    })),
    dashedLines: dashedLines.map((segment) => ({
      start: translatePoint(segment.start),
      end: translatePoint(segment.end)
    })),
    highlightLines: highlightLines.map((segment) => ({
      start: translatePoint(segment.start),
      end: translatePoint(segment.end)
    })),
    arcs: arcs.map((arc) => ({
      start: translatePoint(arc.start),
      end: translatePoint(arc.end),
      radius: arc.radius,
      sweepAngle: arc.sweepAngle,
      largeArc: Math.abs(arc.sweepAngle) > 180 ? 1 : 0,
      sweepFlag: arc.sweepAngle >= 0 ? 1 : 0
    })),
    labels: labels.map(({ text, position, anchor, baseline }) => ({
      text,
      position: translatePoint(position),
      anchor,
      baseline
    }))
  };
};

function TechnicalDrawingQBRa({ a, b, d, ee, f, r, alfa }) {
  const aVal = formatNumber(Number(a));
  const bVal = formatNumber(Number(b));
  const dVal = formatNumber(Number(d));
  const eeVal = Math.max(0, formatNumber(Number(ee)));
  const fVal = Math.max(0, formatNumber(Number(f)));
  const rVal = Math.max(0, formatNumber(Number(r)));
  let alfaVal = formatNumber(Number(alfa));
  alfaVal = clamp(alfaVal, 15, 90);

  if (aVal <= 0 || bVal <= 0 || dVal <= 0 || eeVal <= 0 || fVal <= 0) {
    return (
      <div className="technical-drawing-empty" role="note">
        Brak danych do wygenerowania rysunku dla kolana redukcyjnego QBRa.
      </div>
    );
  }

  const geometry = computeGeometry({
    a: aVal,
    b: bVal,
    d: dVal,
    ee: eeVal,
    f: fVal,
    r: rVal,
    alfa: alfaVal
  });

  if (!geometry) {
    return (
      <div className="technical-drawing-empty" role="note">
        Nie udało się obliczyć rysunku QBRa.
      </div>
    );
  }

  const pathPoints = (points) => points
    .map((pt) => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`)
    .join(' ');

  const arcPath = (arc) => `M ${arc.start.x.toFixed(2)} ${arc.start.y.toFixed(2)} A ${arc.radius.toFixed(2)} ${arc.radius.toFixed(2)} 0 ${arc.largeArc} ${arc.sweepFlag} ${arc.end.x.toFixed(2)} ${arc.end.y.toFixed(2)}`;

  return (
    <svg
      className="technical-drawing-svg"
      width="100%"
      height="100%"
      viewBox={`0 0 ${geometry.viewBox.width.toFixed(2)} ${geometry.viewBox.height.toFixed(2)}`}
      role="img"
      aria-label="Rysunek techniczny kolana redukcyjnego QBRa"
    >
      <title>Kolano redukcyjne QBRa – widoki</title>

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

export default TechnicalDrawingQBRa;
