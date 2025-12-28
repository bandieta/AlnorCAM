# Alnor 3D Element Manager

A standalone React web application for creating, editing, and visualizing 3D elements.

## Features

- **Element List**: Create and manage a list of 3D elements with different symbols (BOX, CYL, SPH, CONE, TOR)
- **Element Editor**: Edit dimensions of each element in real-time
- **3D Viewer**: Interactive 3D visualization using Three.js

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (version 6 or higher)

### Installation

1. Navigate to the web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

### Running the Application

Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

### Building for Production

Create an optimized production build:
```bash
npm run build
```

## Usage

1. **Add Elements**: Use the dropdown in the Elements panel to add new 3D elements
2. **Select Element**: Click on an element in the list to select and view it
3. **Edit Dimensions**: Modify the dimensions of the selected element in the Editor panel
4. **View in 3D**: See real-time changes in the 3D viewport
5. **Delete Elements**: Click the ✕ button to remove elements

## 3D Controls

- **Rotate**: Click and drag with mouse
- **Zoom**: Mouse wheel scroll
- **Pan**: Use arrow keys (can be extended)

## Available Shapes

- **BOX**: Rectangular prism (width, height, depth)
- **CYL**: Cylinder (radius, height)
- **SPH**: Sphere (radius)
- **CONE**: Cone (radius, height)
- **TOR**: Torus (radius, tubeRadius)

## Technologies

- React 18
- Three.js
- CSS3
