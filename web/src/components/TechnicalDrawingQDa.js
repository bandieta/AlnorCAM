import React from 'react';

const SVG_WIDTH = 420;
const SVG_HEIGHT = 220;
const SVG_MARGIN = 16;
const VIEW_PADDING = 18;
const DIM_GAP = 14;
const TICK = 6;

const formatNumber = (value) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return value;
};

function TechnicalDrawingQDa({ a, b, l, p }) {
  const aVal = formatNumber(Number(a));
  const bVal = formatNumber(Number(b));
  const lVal = formatNumber(Number(l));
  const pVal = formatNumber(Number(p));

  const hasData = aVal > 0 && bVal > 0 && lVal > 0;

  if (!hasData) {
    return (
      <div className="technical-drawing-empty" role="note">
        Brak danych do wygenerowania rysunku dla kanału QDa.
      </div>
    );
  }

  const workableP = Math.max(pVal, 1);

  const areaWidth = (SVG_WIDTH - SVG_MARGIN * 3) / 2;
  const areaHeight = SVG_HEIGHT - SVG_MARGIN * 2;

  const topScaleCandidate = Math.min(
    (areaWidth - VIEW_PADDING * 2) / (lVal + 2 * workableP),
    (areaHeight - VIEW_PADDING * 2) / (bVal + 2 * workableP)
  ) || 1;

  const frontScaleCandidate = Math.min(
    (areaWidth - VIEW_PADDING * 2) / (aVal + 2 * workableP),
    (areaHeight - VIEW_PADDING * 2) / (bVal + 2 * workableP)
  ) || 1;

  const sharedScale = Math.min(topScaleCandidate, frontScaleCandidate);
  const topScale = sharedScale;
  const frontScale = sharedScale;

  const leftAreaStart = SVG_MARGIN;
  const rightAreaStart = SVG_MARGIN * 2 + areaWidth;

  const topOuterWidth = (lVal + 2 * workableP) * topScale;
  const topOuterHeight = (bVal + 2 * workableP) * topScale;
  const topInnerWidth = lVal * topScale;
  const topInnerHeight = bVal * topScale;
  const topOriginX = leftAreaStart + (areaWidth - topOuterWidth) / 2;
  const topOriginY = SVG_MARGIN + (areaHeight - topOuterHeight) / 2;

  const frontOuterWidth = (aVal + 2 * workableP) * frontScale;
  const frontOuterHeight = (bVal + 2 * workableP) * frontScale;
  const frontInnerWidth = aVal * frontScale;
  const frontInnerHeight = bVal * frontScale;
  const frontOriginX = rightAreaStart + (areaWidth - frontOuterWidth) / 2;
  const frontOriginY = SVG_MARGIN + (areaHeight - frontOuterHeight) / 2;

  const lLineY = topOriginY + topOuterHeight + DIM_GAP;
  const lTextY = lLineY - 8;
  const lStartX = topOriginX + workableP * topScale;
  const lEndX = lStartX + topInnerWidth;

  const topBLineX = topOriginX + topOuterWidth + DIM_GAP;
  const topBStartY = topOriginY + workableP * topScale;
  const topBEndY = topBStartY + topInnerHeight;
  const topBTextX = topBLineX + 6;
  const topBTextY = topBStartY + topInnerHeight / 2 + 4;

  const aLineY = frontOriginY - DIM_GAP;
  const aTextY = aLineY - 8;
  const aStartX = frontOriginX + workableP * frontScale;
  const aEndX = aStartX + frontInnerWidth;

  const frontBLineX = frontOriginX + frontOuterWidth + DIM_GAP;
  const frontBStartY = frontOriginY + workableP * frontScale;
  const frontBEndY = frontBStartY + frontInnerHeight;
  const frontBTextX = frontBLineX + 6;
  const frontBTextY = frontBStartY + frontInnerHeight / 2 + 4;

  return (
    <svg
      className="technical-drawing-svg"
      width="100%"
      height="100%"
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      role="img"
      aria-label="Rysunek techniczny kanału prostokątnego QDa"
    >
      <title>Kanał prostokątny QDa – widoki</title>


      <rect
        x={topOriginX}
        y={topOriginY}
        width={topOuterWidth}
        height={topOuterHeight}
        className="technical-drawing-outer"
      />
      <rect
        x={topOriginX + workableP * topScale}
        y={topOriginY + workableP * topScale}
        width={topInnerWidth}
        height={topInnerHeight}
        className="technical-drawing-inner"
      />

      <line x1={lStartX} y1={lLineY} x2={lEndX} y2={lLineY} className="technical-dimension" />
      <line x1={lStartX} y1={lLineY - TICK} x2={lStartX} y2={lLineY + TICK} className="technical-dimension" />
      <line x1={lEndX} y1={lLineY - TICK} x2={lEndX} y2={lLineY + TICK} className="technical-dimension" />
      <text x={(lStartX + lEndX) / 2} y={lTextY} className="technical-dimension-label">L</text>

      <line x1={topBLineX} y1={topBStartY} x2={topBLineX} y2={topBEndY} className="technical-dimension" />
      <line x1={topBLineX - TICK} y1={topBStartY} x2={topBLineX + TICK} y2={topBStartY} className="technical-dimension" />
      <line x1={topBLineX - TICK} y1={topBEndY} x2={topBLineX + TICK} y2={topBEndY} className="technical-dimension" />
      <text x={topBTextX} y={topBTextY} className="technical-dimension-label">b</text>


      <rect
        x={frontOriginX}
        y={frontOriginY}
        width={frontOuterWidth}
        height={frontOuterHeight}
        className="technical-drawing-outer"
      />
      <rect
        x={frontOriginX + workableP * frontScale}
        y={frontOriginY + workableP * frontScale}
        width={frontInnerWidth}
        height={frontInnerHeight}
        className="technical-drawing-inner"
      />

      <line x1={aStartX} y1={aLineY} x2={aEndX} y2={aLineY} className="technical-dimension" />
      <line x1={aStartX} y1={aLineY - TICK} x2={aStartX} y2={aLineY + TICK} className="technical-dimension" />
      <line x1={aEndX} y1={aLineY - TICK} x2={aEndX} y2={aLineY + TICK} className="technical-dimension" />
      <text x={(aStartX + aEndX) / 2} y={aTextY} className="technical-dimension-label">a</text>

      <line x1={frontBLineX} y1={frontBStartY} x2={frontBLineX} y2={frontBEndY} className="technical-dimension" />
      <line x1={frontBLineX - TICK} y1={frontBStartY} x2={frontBLineX + TICK} y2={frontBStartY} className="technical-dimension" />
      <line x1={frontBLineX - TICK} y1={frontBEndY} x2={frontBLineX + TICK} y2={frontBEndY} className="technical-dimension" />
      <text x={frontBTextX} y={frontBTextY} className="technical-dimension-label">b</text>
    </svg>
  );
}

export default TechnicalDrawingQDa;
