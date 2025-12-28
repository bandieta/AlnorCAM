import React, { useState } from 'react';
import ElementsList from './components/ElementsList';
import ElementEditor from './components/ElementEditor';
import Viewer3D from './components/Viewer3D';
import './App.css';

// Define all available shapes from Alnor CAM with Polish names
const SHAPE_DEFINITIONS = {
  'QDa': { polish: 'Kanał prostokątny', dimensions: ['a', 'b', 'L'] },
  'QBa': { polish: 'Łuk symetryczny', dimensions: ['a', 'b', 'e', 'f', 'r'] },
  'QBNa': { polish: 'Łuk symetryczny', dimensions: ['a', 'b', 'e', 'f', 'r', 'alfa'] },
  'QPR6a': { polish: 'Redukcja sym.', dimensions: ['a', 'b', 'c', 'd', 'L', 'h', 'm'] },
  'PR1a': { polish: 'Redukcja kwadrat-koło sym.', dimensions: ['a', 'b', 'd', 'L', 'h', 'm'] },
  'PR7a': { polish: 'Redukcja kwadrat-koło asym.', dimensions: ['a', 'b', 'd', 'L', 'h', 'm', 'e', 'f'] },
  'QPR2a': { polish: 'Redukcja asym.', dimensions: ['a', 'b', 'c', 'd', 'L', 'h', 'm', 'e', 'f'] },
  'QBRa': { polish: 'Łuk redukcyjny', dimensions: ['a', 'b', 'd', 'e', 'f', 'r', 'alfa'] },
  'QBR1a': { polish: 'Łuk dyfuzorowany', dimensions: ['a', 'b', 'c', 'd', 'g', 'e', 'f', 'r', 'alfa'] },
  'QBFRa': { polish: 'Kolano redukcyjne', dimensions: ['a', 'b', 'd', 'e', 'f', 'r'] },
  'QBFa': { polish: 'Kolano symetryczne', dimensions: ['a', 'b', 'e', 'f', 'r'] },
  'QESa': { polish: 'Zaślepka prostokątna', dimensions: ['a', 'b', 'e'] },
  'TR1a': { polish: 'Trójnik z odej. prostokątnym', dimensions: ['a', 'b', 'd', 'w', 'L', 'e', 'f', 'l3'] },
  'TR2a': { polish: 'Trójnik z odej. okrągłymi', dimensions: ['a', 'b', 'd', 'L', 'e', 'f', 'l3'] },
  'TRa': { polish: 'Trójnik symetryczny', dimensions: ['a', 'b', 'd', 'h', 'L', 'q', 'r', 'i', 'p'] },
  'QPR3a': { polish: 'Odsadzka sym.', dimensions: ['a', 'b', 'e', 'm', 'h', 'L'] },
  'QPR4a': { polish: 'Odsadzka asym.', dimensions: ['a', 'b', 'd', 'e', 'm', 'h', 'L'] },
  'TR6a': { polish: 'Nakładka na rurę', dimensions: ['a', 'e', 'f', 'g', 'L'] },
  'CZ1a': { polish: 'Czwórnik z odej. prostokątnym', dimensions: ['a', 'b', 'd', 'w', 'L', 'd1', 'w1', 'e', 'f', 'e1', 'f1', 'l3', 'l4'] },
  'CZ2a': { polish: 'Czwórnik z odej. okrągłymi', dimensions: ['a', 'b', 'd', 'L', 'd1', 'e', 'f', 'e1', 'f1', 'l3', 'l4'] },
  'TR3a': { polish: 'Trójnik orłowy', dimensions: ['a', 'b', 'c', 'd', 'm', 'k', 'i', 'j', 'e', 'g', 'f'] },
  'TR4a': { polish: 'Trójnik z od. łukowym', dimensions: ['a', 'b', 'c', 'd', 'i', 'j', 'g', 'L'] },
  'TR5a': { polish: 'Trójnik portkowy', dimensions: ['a', 'b', 'c', 'd', 'e', 'j', 'k', 'L', 'h', 'i', 'g'] },
  'QD1a': { polish: 'Kanał prost. skośny', dimensions: ['a', 'b', 'e', 'f', 'L', 'alfa'] },
  'QD2a': { polish: 'Kanał prostopadły', dimensions: ['a', 'b', 'e', 'f', 'L'] },
  'TR7a': { polish: 'Trójnik skośny', dimensions: ['a', 'b', 'd', 'h', 'i', 'j', 'p', 'e', 'r', 'q'] },
  'TR8a': { polish: 'Trójnik sk.współosiowy', dimensions: ['a', 'b', 'c', 'd', 'w', 'g', 'L', 'l3', 'm', 'n', 'e', 'f', 'i'] },
  'TR9a': { polish: 'Trójnik sk.współosiowy', dimensions: ['a', 'b', 'c', 'd', 'd1', 'L', 'l3', 'm', 'n', 'e', 'f', 'i', 'j'] }
};

function App() {
  const [elements, setElements] = useState([
    { id: 1, symbol: 'QDa', dimensions: { a: 10, b: 10, l: 10 }, color: '#ff6b6b' },
    { id: 2, symbol: 'QBa', dimensions: { a: 12, b: 8, e: 5, f: 3, r: 2 }, color: '#4ecdc4' },
    { id: 3, symbol: 'TR1a', dimensions: { a: 8, b: 6, d: 4, w: 2, e: 3, f: 2, l: 12, l3: 2 }, color: '#45b7d1' }
  ]);
  const [selectedId, setSelectedId] = useState(1);

  const selectedElement = elements.find(el => el.id === selectedId);

  const addElement = (symbol) => {
    const newId = Math.max(...elements.map(el => el.id), 0) + 1;
    const defaultDimensions = getDimensionsForSymbol(symbol);
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe', '#fd79a8'];
    const newElement = {
      id: newId,
      symbol,
      dimensions: defaultDimensions,
      color: colors[newId % colors.length]
    };
    setElements([...elements, newElement]);
    setSelectedId(newId);
  };

  const updateElement = (id, dimensions) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, dimensions } : el
    ));
  };

  const deleteElement = (id) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    if (selectedId === id && newElements.length > 0) {
      setSelectedId(newElements[0].id);
    }
  };

  const getDimensionsForSymbol = (symbol) => {
    const shapeConfig = SHAPE_DEFINITIONS[symbol];
    if (!shapeConfig) return {};
    
    const dimensions = {};
    shapeConfig.dimensions.forEach(dim => {
      dimensions[dim] = 10; // Default value
    });
    return dimensions;
  };

  const getAvailableSymbols = () => {
    return Object.keys(SHAPE_DEFINITIONS);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Alnor 3D Shape Viewer</h1>
        <p>Shape Library from AlnorCAM</p>
      </header>
      <div className="app-container">
        <aside className="sidebar">
          <ElementsList 
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={addElement}
            onDelete={deleteElement}
            availableSymbols={getAvailableSymbols()}
            shapeDefinitions={SHAPE_DEFINITIONS}
          />
        </aside>
        <main className="main-content">
          {selectedElement && (
            <ElementEditor 
              element={selectedElement}
              onUpdate={updateElement}
              shapeDefinition={SHAPE_DEFINITIONS[selectedElement.symbol]}
            />
          )}
        </main>
        <section className="viewer">
          <Viewer3D elements={elements} selectedId={selectedId} />
        </section>
      </div>
    </div>
  );
}

export default App;
