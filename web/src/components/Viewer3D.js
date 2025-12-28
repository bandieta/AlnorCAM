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

  // Fill background
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Add noise/spangles
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 15 + 2;
    const gray = Math.floor(Math.random() * 50 + 120); // 120-170 (Lighter, more metallic)
    
    const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grd.addColorStop(0, `rgba(${gray}, ${gray}, ${gray}, 0.7)`);
    grd.addColorStop(1, `rgba(${gray}, ${gray}, ${gray}, 0)`);
    
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add some noise
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 15;
    data[i] += noise;
    data[i+1] += noise;
    data[i+2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4); // Tighter pattern for realism
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
    const faces = [
      [4, 5, 6, 7], // Front (Z+)
      [1, 5, 6, 2], // Right (X+)
      [0, 1, 2, 3], // Back (Z-)
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

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(50, 100, 50);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xbfd6e7, 0.6);
    fillLight.position.set(-50, 20, -50);
    scene.add(fillLight);

    // Environment Map (Reflection)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create a studio-like gradient environment
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#aaccff');
    gradient.addColorStop(1, '#8899aa');
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
        color: 0xffffff,            // White base to let texture show through
        metalness: 0.7,             // More metallic
        roughness: 0.4,             // Smoother/Shinier
        roughnessMap: galvanizedTextureRef.current,
        bumpMap: galvanizedTextureRef.current,
        bumpScale: 0.01,            // Subtler bump
        envMap: envMapRef.current,
        envMapIntensity: 1.2,
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
