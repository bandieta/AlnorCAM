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
  'TR2a': { polish: 'Trójnik z odej. okrągłymi', dimensions: ['a', 'b', 'd', 'L', 'l3', 'e', 'f'] },
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
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
    
    // Set specific defaults based on Form1.cs
    if (symbol === 'QDa') {
      dimensions.a = 200;
      dimensions.b = 200;
      dimensions.L = 500;
    } else if (symbol === 'QBa') {
      dimensions.a = 300;
      dimensions.b = 300;
      dimensions.e = 40;
      dimensions.f = 40;
      dimensions.r = 150;
    } else if (symbol === 'QBNa') {
      dimensions.a = 300;
      dimensions.b = 300;
      dimensions.e = 40;
      dimensions.f = 40;
      dimensions.r = 150;
      dimensions.alfa = 60;
    } else if (symbol === 'QPR6a') {
      dimensions.a = 400;
      dimensions.b = 350;
      dimensions.c = 100;
      dimensions.d = 100;
      dimensions.L = 500;
      dimensions.h = 60;
      dimensions.m = 60;
    } else if (symbol === 'PR1a') {
      dimensions.a = 400;
      dimensions.b = 350;
      dimensions.d = 200;
      dimensions.L = 500;
      dimensions.h = 30;
      dimensions.m = 50;
    } else if (symbol === 'PR7a') {
      dimensions.a = 400;
      dimensions.b = 350;
      dimensions.d = 200;
      dimensions.L = 500;
      dimensions.h = 60;
      dimensions.m = 30;
      dimensions.e = -75;
      dimensions.f = -100;
    } else if (symbol === 'QPR2a') {
      dimensions.a = 400;
      dimensions.b = 350;
      dimensions.c = 200;
      dimensions.d = 200;
      dimensions.L = 500;
      dimensions.h = 30;
      dimensions.m = 30;
      dimensions.e = -75;
      dimensions.f = -100;
    } else if (symbol === 'QBRa') {
      dimensions.a = 300;
      dimensions.b = 300;
      dimensions.d = 400;
      dimensions.e = 30;
      dimensions.f = 30;
      dimensions.r = 120;
      dimensions.alfa = 70;
    } else if (symbol === 'QBR1a') {
      dimensions.a = 300;
      dimensions.b = 200;
      dimensions.c = 200;
      dimensions.d = 150;
      dimensions.e = 100;
      dimensions.f = 100;
      dimensions.r = 120;
      dimensions.alfa = 70;
      dimensions.g = 50;
    } else if (symbol === 'QBFRa') {
      dimensions.a = 300;
      dimensions.b = 300;
      dimensions.d = 400;
      dimensions.e = 30;
      dimensions.f = 30;
      dimensions.r = 120;
    } else if (symbol === 'QBFa') {
      dimensions.a = 300;
      dimensions.b = 300;
      dimensions.e = 150;
      dimensions.f = 150;
      dimensions.r = 120;
    } else if (symbol === 'QESa') {
      dimensions.a = 400;
      dimensions.b = 300;
      dimensions.e = 30;
    } else if (symbol === 'TR1a') {
      dimensions.a = 250;
      dimensions.b = 200;
      dimensions.d = 140;
      dimensions.w = 180;
      dimensions.L = 500;
      dimensions.e = 250;
      dimensions.f = 110;
      dimensions.l3 = 80;
      } else if (symbol === 'TR2a') {
        dimensions.a = 250;
        dimensions.b = 200;
        dimensions.d = 140;
        dimensions.L = 500;
        dimensions.e = 250;
        dimensions.f = 100;
        dimensions.l3 = 80;
    } else {
      // Generic default for others
      shapeConfig.dimensions.forEach(dim => {
        dimensions[dim] = 10; 
      });
    }
    
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
        <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
          <div className="sidebar-header-controls">
            <button 
              className="sidebar-toggle" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isSidebarOpen ? '◀' : '▶'}
            </button>
          </div>
          {isSidebarOpen && (
            <ElementsList 
              elements={elements}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAdd={addElement}
              onDelete={deleteElement}
              availableSymbols={getAvailableSymbols()}
              shapeDefinitions={SHAPE_DEFINITIONS}
            />
          )}
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
