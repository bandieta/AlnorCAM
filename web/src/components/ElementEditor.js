import React from 'react';
import './ElementEditor.css';

function ElementEditor({ element, onUpdate, shapeDefinition }) {
  const handleDimensionChange = (key, value) => {
    const newDimensions = {
      ...element.dimensions,
      [key]: parseFloat(value) || 0
    };
    onUpdate(element.id, newDimensions);
  };

  const dimensionLabels = shapeDefinition?.dimensions || [];

  return (
    <div className="element-editor">
      <div className="editor-header">
        <div>
          <h3>Edit Element</h3>
          <p className="description">{shapeDefinition?.polish}</p>
        </div>
        <div className="symbol-badge">{element.symbol}</div>
      </div>

      <div className="editor-body">
        <div className="property">
          <label>ID</label>
          <div className="property-value">{element.id}</div>
        </div>

        <div className="property">
          <label>Symbol</label>
          <div className="property-value">{element.symbol}</div>
        </div>

        <div className="property">
          <label>Type</label>
          <div className="property-value">{shapeDefinition?.polish}</div>
        </div>

        <div className="divider"></div>

        <div className="dimensions-section">
          <h4>Dimensions ({dimensionLabels.length})</h4>
          {dimensionLabels.length === 0 ? (
            <p className="no-dimensions">No dimensions defined</p>
          ) : (
            dimensionLabels.map(key => (
              <div key={key} className="property">
                <label>{key.toUpperCase()}</label>
                <div className="input-group">
                  <input
                    type="number"
                    value={element.dimensions[key] || 0}
                    onChange={(e) => handleDimensionChange(key, e.target.value)}
                    min="0.1"
                    step="0.1"
                  />
                  <span className="unit">mm</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ElementEditor;
