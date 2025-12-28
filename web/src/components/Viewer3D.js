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
    const max = Math.max(a, b, e, f, r, b + r);
    const na = a / max, nb = b / max, ne = e / max, nf = f / max, nr = r / max;
    
    const xy = (nb + nr) / 2;
    
    const points = [
      [nr - xy, xy, -na / 2], // 0
      [nr - xy + nb, xy, -na / 2], // 1
      [nr - xy + nb, xy, na / 2], // 2
      [nr - xy, xy, na / 2], // 3
      [nr - xy, xy + ne, -na / 2], // 4
      [nr - xy + nb, xy + ne, -na / 2], // 5
      [nr - xy + nb, xy + ne, na / 2], // 6
      [nr - xy, xy + ne, na / 2], // 7
      [-xy, -nr + xy, -na / 2], // 8
      [-xy + nb, -nr + xy, -na / 2], // 9
      [-xy + nb, -nr + xy, na / 2], // 10
      [-xy, -nr + xy, na / 2]  // 11
    ];
    
    const faces = [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 9, 10, 11],
      [0, 4, 5, 1],
      [1, 5, 6, 2],
      [2, 6, 7, 3],
      [3, 7, 4, 0],
      [0, 1, 9, 8],
      [1, 2, 10, 9],
      [2, 3, 11, 10],
      [3, 0, 8, 11]
    ];
    
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

    // Lights - matching glDraw() lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Multiple lights like in glDraw
    const lights = [
      { pos: [100, 100, 70], color: 0xffffff, intensity: 0.8 },
      { pos: [-100, 100, 100], color: 0xffffff, intensity: 0.6 },
      { pos: [100, -100, 100], color: 0xffffff, intensity: 0.6 },
      { pos: [-100, -100, 100], color: 0xffffff, intensity: 0.5 }
    ];

    lights.forEach(light => {
      const directionalLight = new THREE.DirectionalLight(light.color, light.intensity);
      directionalLight.position.set(...light.pos);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);
    });

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
      const newDistance = Math.max(10, distance + e.deltaY * 0.1);
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
      
      const material = new THREE.MeshPhongMaterial({
        color: selectedElement.color,
        shininess: 100,
        wireframe: false,
        flatShading: false
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
