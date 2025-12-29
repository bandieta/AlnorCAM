import React from 'react';
import TechnicalDrawingQDa from './TechnicalDrawingQDa';
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
  const isQda = selectedElement.symbol === 'QDa';
  const entries = Object.entries(dimensions);

  const qdaNumbers = isQda
    ? {
        a: Number(dimensions.a) || 0,
        b: Number(dimensions.b) || 0,
        l: Number(dimensions.L || dimensions.l) || 0
      }
    : null;

  const flange = isQda && qdaNumbers.l > 0
    ? (qdaNumbers.l > 2501 ? 40 : qdaNumbers.l > 1000 ? 30 : 25)
    : null;

  const gridData = isQda
    ? [
        ['a [mm]', qdaNumbers.a || '—'],
        ['b [mm]', qdaNumbers.b || '—'],
        ['L [mm]', qdaNumbers.l || '—'],
        ['Ramka p [mm]', flange ?? '—']
      ]
    : entries;

  return (
    <div className="technical-drawing" role="group" aria-label="Parametry techniczne">
      <div className="technical-drawing-summary">
        <span className="technical-drawing-symbol">{selectedElement.symbol}</span>
        <span className="technical-drawing-count">ID #{selectedElement.id}</span>
      </div>
      {isQda ? (
        <div className="technical-drawing-layout">
          <div className="technical-drawing-visual" role="figure" aria-label="Schemat kanału QDa">
            <TechnicalDrawingQDa
              a={qdaNumbers.a}
              b={qdaNumbers.b}
              l={qdaNumbers.l}
              p={flange}
            />
          </div>
          <div className="technical-drawing-grid">
            {gridData.map(([key, value]) => (
              <div className="technical-drawing-field" key={key}>
                <span className="technical-drawing-label">{key}</span>
                <span className="technical-drawing-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="technical-drawing-grid">
          {gridData.map(([key, value]) => (
            <div className="technical-drawing-field" key={key}>
              <span className="technical-drawing-label">{key}</span>
              <span className="technical-drawing-value">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TechnicalDrawing;
