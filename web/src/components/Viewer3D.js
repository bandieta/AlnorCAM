import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import './Viewer3D.css';

// Helper to generate a procedural galvanized steel texture
const createGalvanizedTexture = () => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Fill background with a base metallic gray
  ctx.fillStyle = '#b0b0b0';
  ctx.fillRect(0, 0, size, size);

  // Create spangle pattern (crystallized zinc look)
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 40 + 10;
    
    // Random polygon for crystal shape
    const sides = Math.floor(Math.random() * 3) + 4; // 4-6 sides
    const angleOffset = Math.random() * Math.PI * 2;
    
    ctx.beginPath();
    for (let j = 0; j < sides; j++) {
      const angle = angleOffset + (j / sides) * Math.PI * 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (j === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    
    // Varying shades of gray/blue-ish for zinc look
    const shade = Math.floor(Math.random() * 40 + 160); // 160-200
    const alpha = Math.random() * 0.3 + 0.1;
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade + 10}, ${alpha})`;
    ctx.fill();
    
    // Add a slight stroke for definition
    ctx.strokeStyle = `rgba(${shade-20}, ${shade-20}, ${shade-10}, ${alpha/2})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Add fine noise for roughness
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
    data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2); // Larger pattern
  return texture;
};

// Helper function to create BufferGeometry from points and faces (Non-indexed for flat shading)
const createBufferGeometry = (points, faces) => {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  
  faces.forEach(face => {
    if (face.length === 4) {
      // Quad: split into 2 triangles (0-1-2 and 0-2-3)
      const p0 = points[face[0]];
      const p1 = points[face[1]];
      const p2 = points[face[2]];
      const p3 = points[face[3]];
      
      vertices.push(...p0, ...p1, ...p2);
      vertices.push(...p0, ...p2, ...p3);
    } else if (face.length === 3) {
      // Triangle
      const p0 = points[face[0]];
      const p1 = points[face[1]];
      const p2 = points[face[2]];
      
      vertices.push(...p0, ...p1, ...p2);
    }
  });
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
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
    
    // Add faces (quads) - Corrected winding for proper lighting
    // Removed Front and Back faces to make it a hollow duct
    const faces = [
      // [4, 5, 6, 7], // Front (Z+) - Removed
      [1, 5, 6, 2], // Right (X+)
      // [0, 1, 2, 3], // Back (Z-) - Removed
      [0, 4, 7, 3], // Left (X-)
      [3, 7, 6, 2], // Top (Y+)
      [4, 5, 1, 0]  // Bottom (Y-)
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
    for (let i = 0; i < 6; i++) {
      const p1 = arcPoints[i];
      const p2 = arcPoints[i + 1];
      
      // Add the 4 arc points for this segment to points array
      const idx = points.length;
      points.push(p1.pktLuku1, p1.pktLuku2, p1.pktLuku3, p1.pktLuku4);
      points.push(p2.pktLuku1, p2.pktLuku2, p2.pktLuku3, p2.pktLuku4);
      
      // 4 quads per segment as in glDraw
      // Corrected winding order to match Form1.cs
      faces.push([idx, idx+1, idx+5, idx+4]);     // pktLuku1 to pktLuku2 (Bottom)
      faces.push([idx+1, idx+5, idx+6, idx+2]);   // pktLuku2 to pktLuku3 (Outer)
      faces.push([idx+3, idx+2, idx+6, idx+7]);   // pktLuku4 to pktLuku3 (Top)
      faces.push([idx, idx+4, idx+7, idx+3]);     // pktLuku1 to pktLuku4 (Inner)
    }
    
    return createBufferGeometry(points, faces);
  },

  QBNa: (dims) => {
    const { a = 10, b = 10, e = 5, f = 3, r = 2, alfa = 90 } = dims;
    
    // Calculate max for normalization
    let max = Math.max(a, b, e, f, r, b + r);
    max = Math.max(max, b / Math.sin(alfa * Math.PI / 180.0) + r);
    
    const na = a / max;
    const nb = b / max;
    const ne = e / max;
    const nf = f / max;
    const nr = r / max;
    
    const xy = (nb + nr) / 2.0;
    const points = [];
    
    // Start extension (e) - Points 0-7
    points.push([nr - xy, xy, -na / 2.0]);              // 0
    points.push([nr - xy + nb, xy, -na / 2.0]);         // 1
    points.push([nr - xy + nb, xy, na / 2.0]);          // 2
    points.push([nr - xy, xy, na / 2.0]);               // 3
    
    points.push([nr - xy, xy + ne, -na / 2.0]);         // 4
    points.push([nr - xy + nb, xy + ne, -na / 2.0]);    // 5
    points.push([nr - xy + nb, xy + ne, na / 2.0]);     // 6
    points.push([nr - xy, xy + ne, na / 2.0]);          // 7
    
    // End extension (f) - Points 8-15
    const rad = alfa * Math.PI / 180.0;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // Points 8-11 (Start of end extension / End of arc)
    points.push([cos * nr - xy, -sin * nr + xy, -na / 2.0]);              // 8
    points.push([cos * (nr + nb) - xy, -sin * (nr + nb) + xy, -na / 2.0]); // 9
    points.push([cos * (nr + nb) - xy, -sin * (nr + nb) + xy, na / 2.0]);  // 10
    points.push([cos * nr - xy, -sin * nr + xy, na / 2.0]);               // 11
    
    // Points 12-15 (End of end extension)
    const dx = -sin * nf;
    const dy = -cos * nf;
    
    points.push([points[8][0] + dx, points[8][1] + dy, -na / 2.0]);       // 12
    points.push([points[9][0] + dx, points[9][1] + dy, -na / 2.0]);       // 13
    points.push([points[10][0] + dx, points[10][1] + dy, na / 2.0]);      // 14
    points.push([points[11][0] + dx, points[11][1] + dy, na / 2.0]);      // 15
    
    const faces = [];
    
    // Start extension faces
    faces.push([0, 4, 5, 1]);   // Front (Z-)
    faces.push([1, 5, 6, 2]);   // Right (X+)
    faces.push([2, 6, 7, 3]);   // Back (Z+)
    faces.push([3, 7, 4, 0]);   // Left (X-)
    
    // End extension faces
    faces.push([8, 9, 13, 12]);   // Front (Z-)
    faces.push([9, 10, 14, 13]);  // Outer
    faces.push([11, 10, 14, 15]); // Back (Z+)
    faces.push([11, 8, 12, 15]);  // Inner
    
    // Arc segments
    const segments = Math.max(3, Math.floor(alfa / 15));
    const arcPoints = [];
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * rad;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      
      arcPoints.push({
        p1: [c * nr - xy, -s * nr + xy, -na / 2.0],
        p2: [c * (nr + nb) - xy, -s * (nr + nb) + xy, -na / 2.0],
        p3: [c * (nr + nb) - xy, -s * (nr + nb) + xy, na / 2.0],
        p4: [c * nr - xy, -s * nr + xy, na / 2.0]
      });
    }
    
    // Add arc faces
    for (let i = 0; i < segments; i++) {
      const ap1 = arcPoints[i];
      const ap2 = arcPoints[i + 1];
      
      const idx = points.length;
      // Push arrays of coordinates
      points.push(ap1.p1, ap1.p2, ap1.p3, ap1.p4);
      points.push(ap2.p1, ap2.p2, ap2.p3, ap2.p4);
      
      // Winding order: Bottom, Outer, Top, Inner
      faces.push([idx, idx+1, idx+5, idx+4]);     // Front (Z-)
      faces.push([idx+1, idx+2, idx+6, idx+5]);   // Outer
      faces.push([idx+2, idx+3, idx+7, idx+6]);   // Back (Z+)
      faces.push([idx+3, idx, idx+4, idx+7]);     // Inner
    }
    
    const geometry = createBufferGeometry(points, faces);
    geometry.center(); // Center the geometry at (0,0,0)
    return geometry;
  },

  TR1a: (dims) => {
    const { a = 10, b = 10, d = 5, w = 2, L = 12, e = 3, f = 2, l3 = 2 } = dims;
    const max = Math.max(a, b, d, w, L, e, f, l3);
    
    const na = a / max, nb = b / max, nd = d / max, nw = w / max, nL = L / max;
    const ne = e / max, nf = f / max, nl3 = l3 / max;
    
    const points = [];
    
    // Main duct points (0-7)
    points.push([-nL / 2, nb / 2, -na / 2]);  // 0
    points.push([nL / 2, nb / 2, -na / 2]);   // 1
    points.push([nL / 2, -nb / 2, -na / 2]);  // 2
    points.push([-nL / 2, -nb / 2, -na / 2]); // 3
    points.push([-nL / 2, nb / 2, na / 2]);   // 4
    points.push([nL / 2, nb / 2, na / 2]);    // 5
    points.push([nL / 2, -nb / 2, na / 2]);   // 6
    points.push([-nL / 2, -nb / 2, na / 2]);  // 7
    
    // Branch parameters
    const dx = -nL / 2 + ne;
    const dy = -nb / 2 - nl3 / 2;
    const dz = -na / 2 + nf;
    
    // Branch points (8-15)
    // Note: dy calculation in C# was -b/2 - l3/2.
    // Points 8,9,12,13 use l3/2 + dy = -b/2 (Bottom face level)
    // Points 10,11,14,15 use -l3/2 + dy = -b/2 - l3 (Branch end level)
    
    const yBottom = -nb / 2;
    const yEnd = -nb / 2 - nl3;
    
    points.push([-nw / 2 + dx, yBottom, -nd / 2 + dz]); // 8
    points.push([nw / 2 + dx, yBottom, -nd / 2 + dz]);  // 9
    points.push([nw / 2 + dx, yEnd, -nd / 2 + dz]);     // 10
    points.push([-nw / 2 + dx, yEnd, -nd / 2 + dz]);    // 11
    
    points.push([-nw / 2 + dx, yBottom, nd / 2 + dz]);  // 12
    points.push([nw / 2 + dx, yBottom, nd / 2 + dz]);   // 13
    points.push([nw / 2 + dx, yEnd, nd / 2 + dz]);      // 14
    points.push([-nw / 2 + dx, yEnd, nd / 2 + dz]);     // 15
    
    const faces = [
      [0, 1, 2, 3],      // Back
      [0, 1, 5, 4],      // Top
      [4, 5, 6, 7],      // Front
      
      // Bottom face split around branch (Reversed winding for outward facing)
      [9, 8, 3, 2],      // Bottom 1
      [6, 13, 9, 2],     // Bottom 2
      [7, 6, 13, 12],    // Bottom 3
      [7, 12, 8, 3],     // Bottom 4
      
      // Branch faces (Corrected winding)
      [11, 10, 9, 8],    // Branch Back (Z-)
      [10, 14, 13, 9],   // Branch Right (X+)
      [15, 14, 13, 12],  // Branch Front (Z+)
      [11, 15, 12, 8]    // Branch Left (X-)
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
  const envMapRef = useRef(null);
  const galvanizedTextureRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f2f5); // Slightly lighter/cooler background
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45, // Lower FOV for less distortion
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(50, 50, 50);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls - Trackball for free rotation
    const controls = new TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 4.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.1;
    controls.minDistance = 0.1; // Allow very close zoom
    controls.maxDistance = 1000;
    controlsRef.current = controls;

    // Lights - Softer, more realistic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Reduced from 0.6
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8); // Reduced from 1.0
    mainLight.position.set(50, 100, 50);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xbfd6e7, 0.4); // Reduced from 0.6
    fillLight.position.set(-50, 20, -50);
    scene.add(fillLight);

    // Environment Map (Reflection)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create a studio-like gradient environment - Darker for better contrast
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#8899aa'); // Darker middle
    gradient.addColorStop(1, '#556677');   // Darker bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    const envTexture = new THREE.CanvasTexture(canvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    envMapRef.current = envTexture;
    scene.environment = envTexture; // Apply as global environment

    // Galvanized Texture
    galvanizedTextureRef.current = createGalvanizedTexture();

    // Grid and axes helpers
    const gridHelper = new THREE.GridHelper(200, 20, 0xcccccc, 0xeeeeee);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      controls.handleResize();
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
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
        color: 0xdddddd,            // Slightly darker base
        metalness: 0.6,             // Slightly less metallic to avoid over-reflection
        roughness: 0.5,             // Rougher for galvanized look
        roughnessMap: galvanizedTextureRef.current,
        bumpMap: galvanizedTextureRef.current,
        bumpScale: 0.005,           // Very subtle bump
        envMap: envMapRef.current,
        envMapIntensity: 0.8,       // Reduced reflection intensity
        side: THREE.DoubleSide
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
