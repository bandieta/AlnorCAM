import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './Viewer3D.css';

// Helper function to create BufferGeometry from points and faces
const createBufferGeometry = (points, faces) => {
  const geometry = new THREE.BufferGeometry();
  
  // Flatten points array
  const vertices = new Float32Array(points.length * 3);
  points.forEach((p, i) => {
    vertices[i * 3] = p[0];
    vertices[i * 3 + 1] = p[1];
    vertices[i * 3 + 2] = p[2];
  });
  
  // Flatten faces array (convert quads to triangles)
  const indices = [];
  faces.forEach(face => {
    if (face.length === 4) {
      // Quad: split into 2 triangles
      indices.push(face[0], face[1], face[2]);
      indices.push(face[0], face[2], face[3]);
    } else if (face.length === 3) {
      // Triangle
      indices.push(face[0], face[1], face[2]);
    }
  });
  
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
  geometry.computeVertexNormals();
  
  return geometry;
};

// Shape geometry builders based on glDraw() calculations
const ShapeGeometries = {
  QDa: (dims) => {
    const { a = 10, b = 10, L = 10 } = dims;
    
    // Normalize
    let max = Math.max(a, b, L);
    const na = a / max, nb = b / max, nl = L / max;
    
    // Calculate points like in glDraw
    const points = [
      [-na / 2, -nb / 2, -nl / 2], // 0
      [na / 2, -nb / 2, -nl / 2],  // 1
      [na / 2, nb / 2, -nl / 2],   // 2
      [-na / 2, nb / 2, -nl / 2],  // 3
      [-na / 2, -nb / 2, nl / 2],  // 4
      [na / 2, -nb / 2, nl / 2],   // 5
      [na / 2, nb / 2, nl / 2],    // 6
      [-na / 2, nb / 2, nl / 2]    // 7
    ];
    
    // Add faces (quads)
    const faces = [
      [0, 4, 5, 1], // front
      [2, 6, 5, 1], // right
      [3, 7, 6, 2], // back
      [0, 4, 7, 3], // left
      [4, 5, 6, 7], // top
      [0, 1, 2, 3]  // bottom
    ];
    
    return createBufferGeometry(points, faces);
  },

  QBa: (dims) => {
    const { a = 10, b = 10, e = 5, f = 3, r = 2 } = dims;
    
    // Calculate max for normalization - exactly as in Form1.cs
    let max = Math.max(a, b);
    max = Math.max(max, e);
    max = Math.max(max, f);
    max = Math.max(max, r);
    max = Math.max(max, b + r);
    
    let na = a / max;
    let nb = b / max;
    let ne = e / max;
    let nf = f / max;
    let nr = r / max;
    
    // Basic rectangular points (0-15)
    const xy = (nb + nr) / 2.0;
    
    const points = [
      [nr - xy, xy, -na / 2.0],                 // 0
      [nr - xy + nb, xy, -na / 2.0],            // 1
      [nr - xy + nb, xy, na / 2.0],             // 2
      [nr - xy, xy, na / 2.0],                  // 3
      [nr - xy, xy + ne, -na / 2.0],            // 4
      [nr - xy + nb, xy + ne, -na / 2.0],       // 5
      [nr - xy + nb, xy + ne, na / 2.0],        // 6
      [nr - xy, xy + ne, na / 2.0],             // 7
      [-xy, -nr + xy, -na / 2.0],               // 8
      [-xy, -nr + xy, na / 2.0],                // 9
      [-xy, -nb - nr + xy, na / 2.0],           // 10
      [-xy, -nb - nr + xy, -na / 2.0],          // 11
      [-xy - nf, -nr + xy, -na / 2.0],          // 12
      [-xy - nf, -nr + xy, na / 2.0],           // 13
      [-xy - nf, -nb - nr + xy, na / 2.0],      // 14
      [-xy - nf, -nb - nr + xy, -na / 2.0]      // 15
    ];
    
    // Quad faces from glDraw rendering
    const faces = [
      [0, 4, 5, 1],   // face 1
      [2, 6, 5, 1],   // face 2
      [3, 7, 6, 2],   // face 3
      [3, 7, 4, 0],   // face 4
      [8, 9, 13, 12], // face 5
      [9, 10, 14, 13],// face 6
      [11, 10, 14, 15],// face 7
      [8, 11, 15, 12] // face 8
    ];
    
    // Circular arc sections - 6 segments with 7 points each
    const arcPoints = [];
    for (let i = 0; i < 7; i++) {
      const angle = i * 15 * Math.PI / 180.0;
      arcPoints.push({
        pktLuku1: [Math.cos(angle) * nr - xy, -Math.sin(angle) * nr + xy, -na / 2.0],
        pktLuku2: [Math.cos(angle) * (nr + nb) - xy, -Math.sin(angle) * (nr + nb) + xy, -na / 2.0],
        pktLuku3: [Math.cos(angle) * (nr + nb) - xy, -Math.sin(angle) * (nr + nb) + xy, na / 2.0],
        pktLuku4: [Math.cos(angle) * nr - xy, -Math.sin(angle) * nr + xy, na / 2.0]
      });
    }
    
    // Add arc quad faces (6 segments)
    const arcFaceStartIndex = points.length;
    for (let i = 0; i < 6; i++) {
      const p1 = arcPoints[i];
      const p2 = arcPoints[i + 1];
      
      // Add the 4 arc points for this segment to points array
      const idx = points.length;
      points.push(p1.pktLuku1, p1.pktLuku2, p1.pktLuku3, p1.pktLuku4);
      points.push(p2.pktLuku1, p2.pktLuku2, p2.pktLuku3, p2.pktLuku4);
      
      // 4 quads per segment as in glDraw
      faces.push([idx, idx+4, idx+5, idx+1]);     // pktLuku1 to pktLuku2
      faces.push([idx+1, idx+5, idx+6, idx+2]);   // pktLuku2 to pktLuku3
      faces.push([idx+3, idx+2, idx+6, idx+7]);   // pktLuku4 to pktLuku3
      faces.push([idx, idx+4, idx+7, idx+3]);     // pktLuku1 to pktLuku4
    }
    
    return createBufferGeometry(points, faces);
  },

  TR1a: (dims) => {
    const { a = 10, b = 10, d = 5, w = 2, L = 12, e = 3, f = 2, l3 = 2 } = dims;
    const max = Math.max(a, b, d, w, L, e, f, l3);
    
    const na = a / max, nb = b / max, nd = d / max, nw = w / max, nL = L / max;
    
    // Base vertices for simple triangular prism approximation
    const points = [
      [-na / 2, -nb / 2, -nL / 2],
      [na / 2, -nb / 2, -nL / 2],
      [0, nb / 2, -nL / 2],
      [-na / 2, -nb / 2, nL / 2],
      [na / 2, -nb / 2, nL / 2],
      [0, nb / 2, nL / 2]
    ];
    
    const faces = [
      [0, 1, 2],         // front
      [3, 5, 4],         // back
      [0, 3, 4, 1],      // bottom
      [1, 4, 5, 2],      // right
      [2, 5, 3, 0]       // left
    ];
    
    return createBufferGeometry(points, faces);
  }
};

// Fallback simple box geometry
const createDefaultGeometry = (dims) => {
  const { a = 10, b = 10, L = 10 } = dims;
  return new THREE.BoxGeometry(a, b, L);
};

function Viewer3D({ elements, selectedId }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const meshesRef = useRef({});
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(50, 50, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights - matching glDraw() lighting setup but enhanced for steel
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Multiple lights like in glDraw - enhanced for metallic surfaces
    const lights = [
      { pos: [100, 100, 70], color: 0xffffff, intensity: 1.0 },
      { pos: [-100, 100, 100], color: 0xffffff, intensity: 0.8 },
      { pos: [100, -100, 100], color: 0xffffff, intensity: 0.8 },
      { pos: [-100, -100, 100], color: 0xffffff, intensity: 0.6 }
    ];

    lights.forEach(light => {
      const directionalLight = new THREE.DirectionalLight(light.color, light.intensity);
      directionalLight.position.set(...light.pos);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);
    });

    // Add additional rim lighting for better metal appearance
    const rimLight = new THREE.DirectionalLight(0x88ccff, 0.5);
    rimLight.position.set(0, 50, -100);
    scene.add(rimLight);

    // Create a simple environment texture for reflections (procedural)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Create a gradient environment
    const gradient = ctx.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, '#1a1a2e');    // Dark blue-gray
    gradient.addColorStop(0.5, '#aaaacc');  // Light blue-gray
    gradient.addColorStop(1, '#ffffff');    // White
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    const envMapIntensity = 0.5;

    // Grid and axes helpers
    const gridHelper = new THREE.GridHelper(200, 20, 0xcccccc, 0xeeeeee);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);

    // Mouse controls for rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    renderer.domElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        const currentPos = camera.position.clone();
        const distance = currentPos.length();
        
        camera.position.applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          deltaX * 0.01
        );
        
        const rightVector = new THREE.Vector3()
          .crossVectors(camera.up, camera.position.clone().normalize())
          .normalize();
        camera.position.applyAxisAngle(rightVector, deltaY * 0.01);
        
        camera.lookAt(0, 0, 0);
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    renderer.domElement.addEventListener('mouseup', () => {
      isDragging = false;
    });

    renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const direction = camera.position.clone().normalize();
      const distance = camera.position.length();
      // Allow zoom from 5 units close to 500 units far
      const newDistance = Math.max(5, Math.min(500, distance + e.deltaY * 0.1));
      camera.position.copy(direction.multiplyScalar(newDistance));
      camera.lookAt(0, 0, 0);
    }, { passive: false });

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update meshes - create proper geometry based on symbol
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove old meshes
    Object.values(meshesRef.current).forEach(mesh => {
      sceneRef.current.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    meshesRef.current = {};

    // Only render the selected element
    const selectedElement = elements.find(el => el.id === selectedId);
    
    if (selectedElement) {
      let geometry;
      const symbol = selectedElement.symbol;
      
      // Use shape-specific geometry if available, otherwise use default
      if (ShapeGeometries[symbol]) {
        try {
          geometry = ShapeGeometries[symbol](selectedElement.dimensions);
        } catch (e) {
          console.warn(`Error creating geometry for ${symbol}:`, e);
          geometry = createDefaultGeometry(selectedElement.dimensions);
        }
      } else {
        geometry = createDefaultGeometry(selectedElement.dimensions);
      }
      
      const material = new THREE.MeshStandardMaterial({
        color: 0xb0b0b0,           // Steel gray color
        metalness: 0.8,             // High metallic value for steel look
        roughness: 0.3,             // Low roughness for polished steel
        envMap: texture,
        envMapIntensity: envMapIntensity
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(0, 0, 0);

      // Add edges/outline
      const edges = new THREE.EdgesGeometry(geometry);
      const lineSegments = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 })
      );
      mesh.add(lineSegments);

      sceneRef.current.add(mesh);
      meshesRef.current[selectedElement.id] = mesh;

      // Auto-fit camera
      const boundingBox = new THREE.Box3().setFromObject(mesh);
      const size = boundingBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5;

      const direction = cameraRef.current.position.clone().normalize();
      cameraRef.current.position.copy(direction.multiplyScalar(cameraZ));
      cameraRef.current.lookAt(0, 0, 0);
    }
  }, [elements, selectedId]);

  return <div ref={containerRef} className="viewer-3d"></div>;
}

export default Viewer3D;
