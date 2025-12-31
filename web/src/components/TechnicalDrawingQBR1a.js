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

const computeGeometry = ({ a, b, c, d, g, ee, f, r, alfa }) => {
  const lines = [];
  const dashedLines = [];
  const highlightLines = [];
  const polygons = [];
  const arcs = [];
  const labels = [];
  const rawPoints = [];

  const clonePoint = (pt) => ({ x: pt.x, y: pt.y });

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

  const addPolyline = (points, style = 'secondary', close = true) => {
    if (points.length < 2) {
      return;
    }
    for (let i = 0; i < points.length - 1; i += 1) {
      addLine(points[i], points[i + 1], style);
    }
    if (close) {
      addLine(points[points.length - 1], points[0], style);
    }
  };

  const addLabel = (text, position, options = {}) => {
    labels.push({ text, position: clonePoint(position), ...options });
    addPoint(position);
  };

  const addArcSegment = (center, radius, startAngleDeg, sweepAngleDeg) => {
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

  const addArcRect = (left, top, diameter, startAngleDeg, sweepAngleDeg) => {
    if (!Number.isFinite(diameter) || diameter <= 0) {
      return;
    }
    const radius = diameter / 2;
    addArcSegment({ x: left + radius, y: top + radius }, radius, startAngleDeg, sweepAngleDeg);
  };

  const drawHorizontalDimension = (startX, endX, lineY, label, config = {}) => {
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

  const drawAlignedDimension = (start, end, label, config = {}) => {
    const offset = config.offset || 0;
    const tick = config.tick ?? TICK;
    const dir = {
      x: end.x - start.x,
      y: end.y - start.y
    };
    const length = Math.hypot(dir.x, dir.y) || 1;
    const unit = { x: dir.x / length, y: dir.y / length };
    const normal = { x: -unit.y, y: unit.x };

    const lineStart = {
      x: start.x + normal.x * offset,
      y: start.y + normal.y * offset
    };
    const lineEnd = {
      x: end.x + normal.x * offset,
      y: end.y + normal.y * offset
    };

    addLine(lineStart, lineEnd);

    const tickVec = { x: unit.x * (tick / 2), y: unit.y * (tick / 2) };
    addLine(
      { x: lineStart.x - tickVec.x, y: lineStart.y - tickVec.y },
      { x: lineStart.x + tickVec.x, y: lineStart.y + tickVec.y }
    );
    addLine(
      { x: lineEnd.x - tickVec.x, y: lineEnd.y - tickVec.y },
      { x: lineEnd.x + tickVec.x, y: lineEnd.y + tickVec.y }
    );

    addLabel(label, {
      x: (lineStart.x + lineEnd.x) / 2 + (config.labelOffsetX || 0),
      y: (lineStart.y + lineEnd.y) / 2 + (config.labelOffsetY || 0)
    }, {
      anchor: config.anchor || 'middle',
      baseline: config.baseline || 'middle'
    });
  };

  const point = (x, y) => ({ x, y });

  const l = 3;
  let flange = 25;
  let maxVal = Math.max(a, b + ee, d + f);
  if (!Number.isFinite(maxVal) || maxVal <= 0) {
    maxVal = Math.max(a, b, c, d, ee, f, Math.abs(g), Math.abs(r), 1);
  }
  if (maxVal > 1000) {
    flange = 30;
  }
  if (maxVal > 2501) {
    flange = 40;
  }
  maxVal += r + ee;
  maxVal = Math.max(maxVal, flange, f, ee);

  const scaleFactor = maxVal > 0 ? 70 / maxVal : 1;
  const scaleValue = (value) => value * scaleFactor;

  const aScaled = scaleValue(a);
  const bScaled = scaleValue(b);
  const cScaled = scaleValue(c);
  const dScaled = scaleValue(d);
  const eeScaled = scaleValue(ee);
  const fScaled = scaleValue(f);
  const gScaled = scaleValue(g);
  const pScaled = scaleValue(flange);
  const rScaledDisplay = scaleValue(r);

  const alphaRad = alfa * DEG2RAD;
  const sinAlpha = Math.sin(alphaRad);
  const cosAlpha = Math.cos(alphaRad);
  const tanAlpha = Math.tan(alphaRad);
  const tanHalfAlpha = Math.tan(alphaRad / 2);

  const ddScaled = scaleValue(d * sinAlpha);
  const eeSinScaled = eeScaled * sinAlpha;

  let ggRaw = (a - c) - 2 * g;
  if (c > a) {
    ggRaw = -((c - a) + 2 * g);
  }
  const ggScaled = scaleValue(ggRaw);

  let r1 = 0;
  if (Math.abs(cosAlpha) > 1e-6 && Math.abs(tanAlpha) > 1e-6 && Math.abs(tanHalfAlpha) > 1e-6) {
    const ctg1 = 1 / tanAlpha;
    const x1 = ctg1 * ((d / cosAlpha) - b + r * ((1 / cosAlpha) - 1));
    r1 = x1 / tanHalfAlpha;
  }
  const r1Scaled = scaleValue(Math.abs(r1));
  const rCalcScaled = scaleValue(r === 0 ? 1 : r);

  let pushX = mod(110 - aScaled - l, 110) / 2;
  if (pushX < 0) {
    pushX = -pushX;
  }
  const pushY = ((90 - bScaled) / 2) - 10;

  const frontOrigin = point(190 + pushX, 20 + pushY);
  const sideOrigin = point(20 + pushX, 20 + pushY);

  const isRightAngle = Math.abs(alfa - 90) < 0.0001;

  const drawRightAngleGeometry = () => {
    const frontRect = [
      point(frontOrigin.x, frontOrigin.y),
      point(frontOrigin.x + cScaled, frontOrigin.y),
      point(frontOrigin.x + cScaled, frontOrigin.y + dScaled),
      point(frontOrigin.x, frontOrigin.y + dScaled)
    ];
    addPolygon(frontRect);

    const outerRect = [
      point(frontOrigin.x - pScaled, frontOrigin.y - pScaled),
      point(frontOrigin.x + cScaled + pScaled, frontOrigin.y - pScaled),
      point(frontOrigin.x + cScaled + pScaled, frontOrigin.y + dScaled + pScaled),
      point(frontOrigin.x - pScaled, frontOrigin.y + dScaled + pScaled)
    ];
    addPolygon(outerRect);

    const baseTopY = frontRect[3].y;
    const baseDepth = rScaledDisplay;
    let baseRight;
    let baseLeft;
    if (a >= c) {
      baseRight = frontRect[1].x - ggScaled - cScaled + aScaled;
      baseLeft = frontRect[0].x - ggScaled + cScaled - aScaled;
    } else {
      baseRight = frontRect[1].x + gScaled;
      baseLeft = frontRect[1].x + gScaled - aScaled;
    }
    const baseBottomY = baseTopY + baseDepth;

    const basePoly = [
      point(frontRect[0].x, baseTopY),
      point(frontRect[1].x, baseTopY),
      point(baseRight, baseBottomY),
      point(baseLeft, baseBottomY)
    ];
    addPolygon(basePoly);
    addLine(point(baseRight, baseBottomY), point(baseLeft, baseBottomY), 'secondary');

    addLine(
      point(baseRight, baseBottomY + fScaled - pScaled),
      point(baseLeft, baseBottomY + fScaled - pScaled)
    );
    addLine(
      point(baseRight + pScaled, baseBottomY + fScaled),
      point(baseLeft - pScaled, baseBottomY + fScaled)
    );
    addLine(point(baseRight, baseBottomY), point(baseRight, baseBottomY + fScaled));
    addLine(point(baseLeft, baseBottomY), point(baseLeft, baseBottomY + fScaled));

    addLine(frontRect[1], point(baseRight - pScaled, baseBottomY));
    addLine(frontRect[0], point(baseLeft + pScaled, baseBottomY));

    drawHorizontalDimension(frontRect[0].x, frontRect[1].x, frontRect[0].y - 18, 'c', {
      labelOffsetY: -14
    });
    drawHorizontalDimension(frontRect[1].x, baseRight, baseTopY - 12, 'g', {
      labelOffsetY: -10
    });
    drawHorizontalDimension(baseLeft + pScaled, baseRight - pScaled, baseBottomY + fScaled + 18, 'a', {
      labelOffsetY: 12,
      baseline: 'hanging'
    });
    drawVerticalDimension(frontRect[1].x + 18, frontRect[0].y, frontRect[3].y, 'd', {
      labelOffsetX: 10,
      anchor: 'start',
      baseline: 'middle'
    });

    const sideRect = [
      point(sideOrigin.x, sideOrigin.y),
      point(sideOrigin.x + eeScaled + bScaled + rCalcScaled, sideOrigin.y),
      point(sideOrigin.x + eeScaled + bScaled + rCalcScaled, sideOrigin.y + dScaled + fScaled + rCalcScaled),
      point(sideOrigin.x, sideOrigin.y + dScaled + fScaled + rCalcScaled)
    ];
    addPolygon(sideRect);

    const innerRect = [
      point(sideRect[0].x, sideRect[0].y + dScaled),
      point(sideRect[1].x - bScaled, sideRect[1].y + dScaled),
      point(sideRect[2].x - bScaled, sideRect[2].y),
      point(sideRect[3].x, sideRect[3].y)
    ];
    addPolyline(innerRect, 'secondary', true);

    addArcRect(sideRect[1].x - 2 * (dScaled + rCalcScaled), sideRect[1].y, 2 * (dScaled + rCalcScaled), 0, -alfa);

    if (rCalcScaled > 0.1) {
      addArcRect(innerRect[1].x - 2 * rCalcScaled, innerRect[1].y, 2 * rCalcScaled, 270, 90);
      addLine(point(innerRect[1].x - rCalcScaled, innerRect[1].y + rCalcScaled), innerRect[1]);
      addLine(innerRect[0], point(innerRect[1].x - rCalcScaled, innerRect[1].y));
      addLine(innerRect[2], point(innerRect[1].x, innerRect[1].y + rCalcScaled));

      if (r > 0) {
        addLabel('r', point(innerRect[1].x - 6, innerRect[1].y - 10), { anchor: 'end', baseline: 'middle' });
      }
    }

    addLine(
      point(innerRect[0].x, innerRect[0].y + pScaled),
      point(sideRect[0].x, sideRect[0].y - (pScaled + dScaled))
    );
    addLine(
      point(innerRect[0].x + pScaled, innerRect[0].y),
      point(sideRect[0].x + pScaled, sideRect[0].y - dScaled)
    );
    addLine(
      point(innerRect[2].x - pScaled, innerRect[2].y),
      point(sideRect[2].x + pScaled + bScaled, sideRect[2].y)
    );
    addLine(
      point(innerRect[2].x, innerRect[2].y - pScaled),
      point(sideRect[2].x + bScaled, sideRect[2].y - pScaled)
    );

    drawVerticalDimension(sideRect[0].x - 18, sideRect[0].y, sideRect[0].y + dScaled, 'b', {
      labelOffsetX: -10,
      anchor: 'end',
      baseline: 'middle'
    });
    drawVerticalDimension(sideRect[3].x - 18, sideRect[3].y - fScaled, sideRect[3].y, 'f', {
      labelOffsetX: -10,
      labelOffsetY: 10,
      anchor: 'end',
      baseline: 'middle'
    });
    drawHorizontalDimension(sideRect[3].x - rScaledDisplay, sideRect[3].x + eeScaled, sideRect[3].y + 18, 'e', {
      labelOffsetY: 12,
      baseline: 'hanging'
    });
  };

  const drawObliqueGeometry = () => {
    const projectedHeight = ddScaled;
    const frontSmall = [
      point(frontOrigin.x, frontOrigin.y),
      point(frontOrigin.x + cScaled, frontOrigin.y),
      point(frontOrigin.x + cScaled, frontOrigin.y + projectedHeight),
      point(frontOrigin.x, frontOrigin.y + projectedHeight)
    ];
    addPolygon(frontSmall);

    const frontOuter = [
      point(frontOrigin.x - pScaled, frontOrigin.y - pScaled),
      point(frontOrigin.x + cScaled + pScaled, frontOrigin.y - pScaled),
      point(frontOrigin.x + cScaled + pScaled, frontOrigin.y + projectedHeight + pScaled),
      point(frontOrigin.x - pScaled, frontOrigin.y + projectedHeight + pScaled)
    ];
    addPolygon(frontOuter);

    const usableRadius = rScaledDisplay > 0 ? rScaledDisplay : scaleValue(1);
    const baseTopY = frontSmall[3].y;
    const baseBottomY = baseTopY + usableRadius + eeSinScaled;

    let baseRightX;
    let baseLeftX;
    if (a >= c) {
      baseRightX = frontSmall[1].x - ggScaled - cScaled + aScaled;
      baseLeftX = frontSmall[0].x - ggScaled + cScaled - aScaled;
    } else {
      baseRightX = frontSmall[1].x + gScaled;
      baseLeftX = frontSmall[1].x + gScaled - aScaled;
    }

    const basePoly = [
      point(frontSmall[0].x, baseTopY),
      point(frontSmall[1].x, baseTopY),
      point(baseRightX, baseBottomY),
      point(baseLeftX, baseBottomY)
    ];
    addPolygon(basePoly);
    addLine(point(baseRightX, baseBottomY), point(baseLeftX, baseBottomY), 'secondary');

    const baseFlangeUpper = [
      point(baseRightX, baseBottomY + fScaled - pScaled),
      point(baseLeftX, baseBottomY + fScaled - pScaled)
    ];
    addLine(baseFlangeUpper[0], baseFlangeUpper[1]);

    const baseFlangeLower = [
      point(baseRightX + pScaled, baseBottomY + fScaled),
      point(baseLeftX - pScaled, baseBottomY + fScaled)
    ];
    addLine(baseFlangeLower[0], baseFlangeLower[1]);

    addLine(point(baseRightX, baseBottomY), point(baseRightX, baseBottomY + fScaled));
    addLine(point(baseLeftX, baseBottomY), point(baseLeftX, baseBottomY + fScaled));

    addLine(frontSmall[1], point(baseRightX - pScaled, baseBottomY));
    addLine(frontSmall[0], point(baseLeftX + pScaled, baseBottomY));

    drawHorizontalDimension(frontSmall[0].x, frontSmall[1].x, frontSmall[0].y - 18, 'c', {
      labelOffsetY: -14
    });
    drawHorizontalDimension(frontSmall[1].x, baseRightX, baseTopY - 12, 'g', {
      labelOffsetY: -10
    });
    drawHorizontalDimension(baseLeftX + pScaled, baseRightX - pScaled, baseBottomY + fScaled + 18, 'a', {
      labelOffsetY: 12,
      baseline: 'hanging'
    });
    drawVerticalDimension(frontSmall[1].x + 18, frontSmall[0].y, frontSmall[3].y, 'd', {
      labelOffsetX: 10,
      anchor: 'start',
      baseline: 'middle'
    });

    const sideTopLeft = point(sideOrigin.x + eeScaled + usableRadius, baseBottomY - fScaled);
    const sideTopRight = point(sideTopLeft.x + bScaled, sideTopLeft.y);
    const sideBottomRight = point(sideTopRight.x, baseBottomY);
    const sideBottomLeft = point(sideTopLeft.x, baseBottomY);

    addLine(sideBottomLeft, sideBottomRight);
    addLine(sideTopLeft, sideBottomLeft);
    addLine(sideTopRight, sideBottomRight);
    addLine(sideTopLeft, sideTopRight);

    addLine(
      point(sideBottomLeft.x, sideBottomLeft.y - pScaled),
      point(sideBottomRight.x, sideBottomRight.y - pScaled)
    );
    addLine(
      point(sideBottomLeft.x - pScaled, sideBottomLeft.y),
      point(sideBottomRight.x + pScaled, sideBottomRight.y)
    );

    const arcBoundsLeft = sideTopLeft.x - 2 * usableRadius;
    const arcBoundsTop = sideTopLeft.y - usableRadius;
    addArcRect(arcBoundsLeft, arcBoundsTop, 2 * usableRadius, 0, -alfa);

    const radiusCenter = point(arcBoundsLeft + usableRadius, arcBoundsTop + usableRadius);
    const radiusLeaderEnd = point(radiusCenter.x + usableRadius, radiusCenter.y - usableRadius);
    addLine(radiusCenter, radiusLeaderEnd);
    if (r > 0) {
      addLabel('r', point(radiusLeaderEnd.x + 6, radiusLeaderEnd.y - 6), { anchor: 'start', baseline: 'middle' });
    }

    const slantStart = {
      x: sideTopLeft.x - (usableRadius - Math.cos(alphaRad) * usableRadius),
      y: sideTopLeft.y - Math.sin(alphaRad) * usableRadius
    };
    const slantEnd = {
      x: slantStart.x - sinAlpha * eeScaled,
      y: slantStart.y - cosAlpha * eeScaled
    };
    addLine(slantStart, slantEnd);

    const slantTop = {
      x: slantEnd.x + Math.cos(alphaRad) * dScaled,
      y: slantEnd.y - Math.sin(alphaRad) * dScaled
    };
    addLine(slantEnd, slantTop);

    const slantOpposite = {
      x: slantTop.x + sinAlpha * eeScaled,
      y: slantTop.y + cosAlpha * eeScaled
    };
    addLine(slantTop, slantOpposite);

    drawAlignedDimension(slantEnd, slantTop, 'b', {
      offset: pScaled,
      labelOffsetX: -12,
      labelOffsetY: -12,
      anchor: 'end'
    });

    drawAlignedDimension(slantTop, slantOpposite, 'e', {
      offset: pScaled,
      labelOffsetX: 8,
      labelOffsetY: -10
    });

    const adjustedRadius = (dScaled + usableRadius) * (alfa / 90);
    const compareLeft = (dScaled + adjustedRadius) / (cosAlpha || 1);
    const compareRight = bScaled + adjustedRadius;
    const joinPointTop = sideTopRight;

    if (compareLeft > compareRight + 1e-6 && r1Scaled > 0.1) {
      addArcRect(joinPointTop.x - 2 * r1Scaled, joinPointTop.y - r1Scaled, 2 * r1Scaled, 0, -alfa);
      const arcTouchPoint = point(
        joinPointTop.x - (r1Scaled - Math.cos(alphaRad) * r1Scaled),
        joinPointTop.y - Math.sin(alphaRad) * r1Scaled
      );
      addLine(arcTouchPoint, slantOpposite);
    } else {
      addLine(slantOpposite, joinPointTop);
    }

    drawVerticalDimension(sideTopLeft.x - 18, sideTopLeft.y, sideBottomLeft.y, 'f', {
      labelOffsetX: -10,
      labelOffsetY: 10,
      anchor: 'end',
      baseline: 'middle'
    });

    drawHorizontalDimension(sideBottomLeft.x, sideBottomRight.x, sideBottomLeft.y + 18, 'd', {
      labelOffsetY: 12,
      baseline: 'hanging'
    });
  };

  if (isRightAngle) {
    drawRightAngleGeometry();
  } else {
    drawObliqueGeometry();
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

function TechnicalDrawingQBR1a({ a, b, c, d, g, e, f, r, alfa }) {
  const aVal = formatNumber(Number(a));
  const bVal = formatNumber(Number(b));
  const cVal = formatNumber(Number(c));
  const dVal = formatNumber(Number(d));
  const gVal = formatNumber(Number(g));
  const eVal = Math.max(0, formatNumber(Number(e)));
  const fVal = Math.max(0, formatNumber(Number(f)));
  const rVal = Math.max(0, formatNumber(Number(r)));
  let alfaVal = formatNumber(Number(alfa));
  alfaVal = clamp(alfaVal, 15, 90);

  if (aVal <= 0 || bVal <= 0 || cVal <= 0 || dVal <= 0 || eVal <= 0 || fVal <= 0) {
    return (
      <div className="technical-drawing-empty" role="note">
        Brak danych do wygenerowania rysunku dla łuku dyfuzorowanego QBR1a.
      </div>
    );
  }

  const geometry = computeGeometry({
    a: aVal,
    b: bVal,
    c: cVal,
    d: dVal,
    g: gVal,
    ee: eVal,
    f: fVal,
    r: rVal,
    alfa: alfaVal
  });

  if (!geometry) {
    return (
      <div className="technical-drawing-empty" role="note">
        Nie udało się obliczyć rysunku QBR1a.
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
      aria-label="Rysunek techniczny łuku dyfuzorowanego QBR1a"
    >
      <title>Łuk dyfuzorowany QBR1a – widoki</title>

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

export default TechnicalDrawingQBR1a;
