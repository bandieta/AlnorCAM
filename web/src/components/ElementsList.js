import React from 'react';
import './ElementsList.css';

function ElementsList({ elements, selectedId, onSelect, onAdd, onDelete, availableSymbols, shapeDefinitions }) {

  return (
    <div className="elements-list">
      <div className="list-header">
        <h2>Shapes</h2>
        <span className="count">{elements.length}</span>
      </div>
      
      <div className="add-element">
        <select 
          onChange={(e) => {
            if (e.target.value) {
              onAdd(e.target.value);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="add-select"
        >
          <option value="">+ Add Shape...</option>
          {availableSymbols.map(symbol => (
            <option key={symbol} value={symbol}>
              {symbol} ({shapeDefinitions[symbol].polish})
            </option>
          ))}
        </select>
      </div>

      <div className="list-items">
        {elements.length === 0 ? (
          <div className="empty-state">
            <p>No shapes added yet</p>
            <p className="empty-hint">Select a shape above to begin</p>
          </div>
        ) : (
          elements.map(element => {
            const shapeInfo = shapeDefinitions[element.symbol];
            return (
              <div
                key={element.id}
                className={`list-item ${selectedId === element.id ? 'active' : ''}`}
                onClick={() => onSelect(element.id)}
              >
                <div className="item-content">
                  <div className="color-indicator" style={{ backgroundColor: element.color }}></div>
                  <div className="item-info">
                    <div className="symbol">{element.symbol}</div>
                    <div className="polish-name">{shapeInfo?.polish}</div>
                    <div className="id">ID: {element.id}</div>
                  </div>
                </div>
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(element.id);
                  }}
                  title="Delete shape"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ElementsList;
