import React from 'react';
import TechnicalDrawingQDa from './TechnicalDrawingQDa';
import TechnicalDrawingQBa from './TechnicalDrawingQBa';
import TechnicalDrawingQBNa from './TechnicalDrawingQBNa';
import TechnicalDrawingQPR6a from './TechnicalDrawingQPR6a';
import TechnicalDrawingPR1a from './TechnicalDrawingPR1a';
import TechnicalDrawingPR7a from './TechnicalDrawingPR7a';
import './TechnicalDrawing.css';

function TechnicalDrawing({ selectedElement }) {
  if (!selectedElement) {
    return (
      <div className="technical-drawing-empty" role="note">
        Brak aktywnego elementu. Wybierz kształt, aby zobaczyć podstawowe dane techniczne.
      </div>
    );
  }

  const dimensions = selectedElement.dimensions || {};

  const drawingConfig = (() => {
    switch (selectedElement.symbol) {
      case 'QDa': {
        const a = Number(dimensions.a) || 0;
        const b = Number(dimensions.b) || 0;
        const l = Number(dimensions.L || dimensions.l) || 0;
        const flange = l > 0 ? (l > 2501 ? 40 : l > 1000 ? 30 : 25) : 0;
        return {
          Component: TechnicalDrawingQDa,
          props: { a, b, l, p: flange },
          ariaLabel: 'Schemat kanału QDa'
        };
      }
      case 'QBa': {
        return {
          Component: TechnicalDrawingQBa,
          props: {
            a: Number(dimensions.a) || 0,
            b: Number(dimensions.b) || 0,
            e: Number(dimensions.e) || 0,
            f: Number(dimensions.f) || 0,
            r: Number(dimensions.r) || 0
          },
          ariaLabel: 'Schemat łuku symetrycznego QBa'
        };
      }
      case 'QBNa': {
        return {
          Component: TechnicalDrawingQBNa,
          props: {
            a: Number(dimensions.a) || 0,
            b: Number(dimensions.b) || 0,
            e: Number(dimensions.e) || 0,
            f: Number(dimensions.f) || 0,
            r: Number(dimensions.r) || 0,
            alfa: Number(dimensions.alfa) || 0
          },
          ariaLabel: 'Schemat łuku z kątem QBNa'
        };
      }
      case 'QPR6a': {
        return {
          Component: TechnicalDrawingQPR6a,
          props: {
            a: Number(dimensions.a) || 0,
            b: Number(dimensions.b) || 0,
            c: Number(dimensions.c) || 0,
            d: Number(dimensions.d) || 0,
            L: Number(dimensions.L || dimensions.l) || 0,
            m: Number(dimensions.m) || 0,
            h: Number(dimensions.h) || 0
          },
          ariaLabel: 'Schemat redukcji symetrycznej QPR6a'
        };
      }
      case 'PR1a': {
        return {
          Component: TechnicalDrawingPR1a,
          props: {
            a: Number(dimensions.a) || 0,
            b: Number(dimensions.b) || 0,
            d: Number(dimensions.d) || 0,
            L: Number(dimensions.L || dimensions.l) || 0,
            m: Number(dimensions.m) || 0,
            h: Number(dimensions.h) || 0
          },
          ariaLabel: 'Schemat redukcji prostokąt-okrąg PR1a'
        };
      }
      case 'PR7a': {
        return {
          Component: TechnicalDrawingPR7a,
          props: {
            a: Number(dimensions.a) || 0,
            b: Number(dimensions.b) || 0,
            d: Number(dimensions.d) || 0,
            L: Number(dimensions.L || dimensions.l) || 0,
            m: Number(dimensions.m) || 0,
            h: Number(dimensions.h) || 0,
            e: Number(dimensions.e ?? dimensions.ee) || 0,
            f: Number(dimensions.f) || 0
          },
          ariaLabel: 'Schemat redukcji prostokąt-okrąg z odejściem PR7a'
        };
      }
      default:
        return null;
    }
  })();

  const DrawingComponent = drawingConfig?.Component;

  return (
    <div className="technical-drawing" role="group" aria-label="Parametry techniczne">
      <div className="technical-drawing-summary">
        <span className="technical-drawing-symbol">{selectedElement.symbol}</span>
        <span className="technical-drawing-count">ID #{selectedElement.id}</span>
      </div>
      {DrawingComponent ? (
        <div className="technical-drawing-layout">
          <div className="technical-drawing-visual" role="figure" aria-label={drawingConfig.ariaLabel}>
            <DrawingComponent {...drawingConfig.props} />
          </div>
        </div>
      ) : (
        <div className="technical-drawing-empty" role="note">
          Rysunek techniczny dostępny tylko dla wybranych elementów.
        </div>
      )}
    </div>
  );
}

export default TechnicalDrawing;
