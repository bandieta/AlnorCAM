import React from 'react';
import './TechnicalDrawing.css';

function TechnicalDrawing({ selectedElement }) {
  if (!selectedElement) {
    return (
      <div className="technical-drawing-empty" role="note">
        Brak aktywnego elementu. Wybierz kształt, aby zobaczyć podstawowe dane techniczne.
      </div>
    );
  }

  const dimensionEntries = Object.entries(selectedElement.dimensions || {});

  return (
    <div className="technical-drawing" role="group" aria-label="Parametry techniczne">
      <div className="technical-drawing-summary">
        <span className="technical-drawing-symbol">{selectedElement.symbol}</span>
        <span className="technical-drawing-count">ID #{selectedElement.id}</span>
      </div>
      <div className="technical-drawing-grid">
        {dimensionEntries.map(([key, value]) => (
          <div className="technical-drawing-field" key={key}>
            <span className="technical-drawing-label">{key}</span>
            <span className="technical-drawing-value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TechnicalDrawing;
