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

  QBRa: (dims) => {
    const {
      a = 300,
      b = 300,
      d = 400,
      e = 30,
      f = 30,
      r = 120,
      alfa = 90
    } = dims;

    const alfaClamped = Math.max(15, Math.min(90, alfa || 90));
    const alfaRad = THREE.MathUtils.degToRad(alfaClamped);

    const sinA = Math.sin(alfaRad);
    const cosA = Math.cos(alfaRad);
    const tanA = Math.tan(alfaRad);
    const tanHalf = Math.tan(alfaRad / 2);

    const safeTan = Math.abs(tanA) < 1e-9 ? (tanA >= 0 ? 1e-9 : -1e-9) : tanA;
    const safeTanHalf = Math.abs(tanHalf) < 1e-9 ? (tanHalf >= 0 ? 1e-9 : -1e-9) : tanHalf;
    const safeCos = Math.abs(cosA) < 1e-9 ? (cosA >= 0 ? 1e-9 : -1e-9) : cosA;

    const ctg1 = 1 / safeTan;
    const x1 = ctg1 * (d / safeCos - b + r * (1 / safeCos - 1));
    let r1 = x1 / safeTanHalf;

    if (!Number.isFinite(r1)) {
      r1 = Math.max(d, b);
    }

    let maxDim = Math.max(a, b, d, e + b + r, f, Math.abs(r1));
    if (!Number.isFinite(maxDim) || maxDim <= 0) {
      return createDefaultGeometry(dims);
    }

    const na = a / maxDim;
    const nb = b / maxDim;
    const nd = d / maxDim;
    const ne = e / maxDim;
    const nf = f / maxDim;
    const nr = r / maxDim;
    const nr1 = r1 / maxDim;

    const dx = (sinA * ne + nr + nb) / 2;
    const dy = (sinA * nd + cosA * ne + sinA * nr + nf) / 2;

    const points = Array(60).fill(null);
    const setPoint = (idx, x, y, z) => {
      points[idx] = [x, y, z];
    };

    const baseX = sinA * ne + cosA * nr - dx;
    const baseYFront = sinA * nd + cosA * ne + sinA * nr + nf - dy;
    const baseYBack = sinA * nd + cosA * ne + sinA * nr - dy;
    const baseXRight = baseX + nb;

    setPoint(0, baseX, baseYFront, -na / 2);
    setPoint(1, baseXRight, baseYFront, -na / 2);
    setPoint(2, baseXRight, baseYFront, na / 2);
    setPoint(3, baseX, baseYFront, na / 2);

    setPoint(4, baseX, baseYBack, -na / 2);
    setPoint(5, baseXRight, baseYBack, -na / 2);
    setPoint(6, baseXRight, baseYBack, na / 2);
    setPoint(7, baseX, baseYBack, na / 2);

    const innerBaseX = points[4][0] - nr + cosA * nr;
    const innerBaseY = points[4][1] - sinA * nr;
    setPoint(8, innerBaseX, innerBaseY, -na / 2);
    setPoint(9, innerBaseX, innerBaseY, na / 2);

    const outerEndX = innerBaseX + cosA * nd;
    const outerEndY = innerBaseY - sinA * nd;
    setPoint(10, outerEndX, outerEndY, na / 2);
    setPoint(11, outerEndX, outerEndY, -na / 2);

    const innerEndX = innerBaseX - sinA * ne;
    const innerEndY = innerBaseY - cosA * ne;
    setPoint(12, innerEndX, innerEndY, -na / 2);
    setPoint(13, innerEndX, innerEndY, na / 2);

    const outerExtX = outerEndX - sinA * ne;
    const outerExtY = outerEndY - cosA * ne;
    setPoint(14, outerExtX, outerExtY, na / 2);
    setPoint(15, outerExtX, outerExtY, -na / 2);

    const outerBaseX = points[5][0] - nr1 + cosA * nr1;
    const outerBaseY = points[5][1] - sinA * nr1;
    setPoint(16, outerBaseX, outerBaseY, -na / 2);
    setPoint(17, outerBaseX, outerBaseY, na / 2);

    for (let ii = 0; ii < 6; ii++) {
      const angle = THREE.MathUtils.degToRad(15 + 15 * ii);
      const cosSeg = Math.cos(angle);
      const sinSeg = Math.sin(angle);

      const innerX = points[4][0] - nr + cosSeg * nr;
      const innerY = points[4][1] - sinSeg * nr;
      const outerX = points[5][0] - nr1 + cosSeg * nr1;
      const outerY = points[5][1] - sinSeg * nr1;

      setPoint(20 + ii, innerX, innerY, -na / 2);
      setPoint(30 + ii, outerX, outerY, -na / 2);
      setPoint(40 + ii, innerX, innerY, na / 2);
      setPoint(50 + ii, outerX, outerY, na / 2);
    }

    let alfa1 = Math.floor(alfaClamped);
    if (alfa1 === 90) {
      alfa1 -= 15;
    }
    let segmentCount = Math.floor(alfa1 / 15);
    segmentCount = Math.max(segmentCount, alfaClamped >= 15 ? 1 : 0);
    segmentCount = Math.min(segmentCount, 5);

    const faces = [
      // Extension f faces (Corrected winding)
      [0, 1, 5, 4], // Back (Z-)
      [1, 5, 6, 2], // Right (X+)
      [3, 7, 6, 2], // Front (Z+)
      [0, 3, 7, 4], // Left (X-)

      // Extension e faces (Corrected winding)
      [12, 8, 11, 15], // Bottom (Z-)
      [11, 10, 14, 15], // Outer Side
      [9, 10, 14, 13], // Top (Z+)
      [12, 13, 9, 8], // Inner Side

      // Connection faces
      [11, 16, 17, 10], // Outer Connection
      [8, 16, 11], // Triangle 1 (Bottom Z-)
      [9, 10, 17]  // Triangle 2 (Top Z+)
    ];

    for (let i = 0; i < segmentCount; i++) {
      faces.push([20 + i, 30 + i, 30 + i + 1, 20 + i + 1]); // Bottom Loop (Z-)
      faces.push([40 + i, 40 + i + 1, 50 + i + 1, 50 + i]); // Top Loop (Z+)
      faces.push([20 + i, 40 + i, 40 + i + 1, 20 + i + 1]); // Inner Loop (Inward)
      faces.push([30 + i, 30 + i + 1, 50 + i + 1, 50 + i]); // Outer Loop (Outward)
    }

    // Manual Start Connections
    faces.push([4, 5, 30, 20]); // Bottom Start (Z-)
    faces.push([7, 40, 50, 6]); // Top Start (Z+)
    faces.push([4, 7, 40, 20]); // Inner Start (Inward)
    faces.push([5, 30, 50, 6]); // Outer Start (Outward)
    faces.push([7, 6, 50, 40]); // Top Start -> Normal +Z (Flipped from C#)
    faces.push([4, 7, 40, 20]); // Inner Start -> Normal Inward (Flipped from C#)
    faces.push([5, 30, 50, 6]); // Outer Start -> Normal Outward

    const filteredFaces = faces.filter(face => face.every(idx => points[idx]));

    const geometry = createBufferGeometry(points, filteredFaces);
    geometry.center();
    return geometry;
  },

  QBR1a: (dims) => {
    const {
      a = 300,
      b = 200,
      c = 200,
      d = 150,
      e = 100,
      f = 100,
      r = 120,
      g = 50,
      alfa = 70
    } = dims;

    const alfaClamped = Math.max(15, Math.min(90, alfa || 90));
    const alfaRad = THREE.MathUtils.degToRad(alfaClamped);

    const sinA = Math.sin(alfaRad);
    const cosA = Math.cos(alfaRad);
    const tanA = Math.tan(alfaRad);
    const tanHalf = Math.tan(alfaRad / 2);

    const safeTan = Math.abs(tanA) < 1e-9 ? (tanA >= 0 ? 1e-9 : -1e-9) : tanA;
    const safeTanHalf = Math.abs(tanHalf) < 1e-9 ? (tanHalf >= 0 ? 1e-9 : -1e-9) : tanHalf;
    const safeCos = Math.abs(cosA) < 1e-9 ? (cosA >= 0 ? 1e-9 : -1e-9) : cosA;

    const ctg1 = 1 / safeTan;
    const x1 = ctg1 * (d / safeCos - b + r * (1 / safeCos - 1));
    let r1 = x1 / safeTanHalf;

    if (!Number.isFinite(r1)) {
      r1 = Math.max(d, b);
    }

    let maxDim = Math.max(a, b, c, d, e + b + r, f, Math.abs(r1));
    if (!Number.isFinite(maxDim) || maxDim <= 0) {
      return createDefaultGeometry(dims);
    }

    let gg = (a - c) / 2.0 - g;
    if (c > a) {
      gg = (c - a) / 2.0 + g;
    }

    const na = a / maxDim;
    const nb = b / maxDim;
    const nc = c / maxDim;
    const nd = d / maxDim;
    const ne = e / maxDim;
    const nf = f / maxDim;
    const nr = r / maxDim;
    const nr1 = r1 / maxDim;
    const ngg = gg / maxDim;

    const dx = (sinA * ne + nr + nb) / 2;
    const dy = (sinA * nd + cosA * ne + sinA * nr + nf) / 2;

    const diffl = (Math.abs(na / 2.0 - nc / 2.0) - ngg) / 6.0;
    const diffp = (Math.abs(na / 2.0 - nc / 2.0) + ngg) / 6.0;

    const points = Array(60).fill(null);
    const setPoint = (idx, x, y, z) => {
      points[idx] = [x, y, z];
    };

    const baseX = sinA * ne + cosA * nr - dx;
    const baseYFront = sinA * nd + cosA * ne + sinA * nr + nf - dy;
    const baseYBack = sinA * nd + cosA * ne + sinA * nr - dy;
    const baseXRight = baseX + nb;

    setPoint(0, baseX, baseYFront, -na / 2);
    setPoint(1, baseXRight, baseYFront, -na / 2);
    setPoint(2, baseXRight, baseYFront, na / 2);
    setPoint(3, baseX, baseYFront, na / 2);

    setPoint(4, baseX, baseYBack, -na / 2);
    setPoint(5, baseXRight, baseYBack, -na / 2);
    setPoint(6, baseXRight, baseYBack, na / 2);
    setPoint(7, baseX, baseYBack, na / 2);

    const innerBaseX = points[4][0] - nr + cosA * nr;
    const innerBaseY = points[4][1] - sinA * nr;
    setPoint(8, innerBaseX, innerBaseY, -nc / 2 - ngg);
    setPoint(9, innerBaseX, innerBaseY, nc / 2 - ngg);

    const outerEndX = innerBaseX + cosA * nd;
    const outerEndY = innerBaseY - sinA * nd;
    setPoint(10, outerEndX, outerEndY, nc / 2 - ngg);
    setPoint(11, outerEndX, outerEndY, -nc / 2 - ngg);

    const innerEndX = innerBaseX - sinA * ne;
    const innerEndY = innerBaseY - cosA * ne;
    setPoint(12, innerEndX, innerEndY, -nc / 2 - ngg);
    setPoint(13, innerEndX, innerEndY, nc / 2 - ngg);

    const outerExtX = outerEndX - sinA * ne;
    const outerExtY = outerEndY - cosA * ne;
    setPoint(14, outerExtX, outerExtY, nc / 2 - ngg);
    setPoint(15, outerExtX, outerExtY, -nc / 2 - ngg);

    const outerBaseX = points[5][0] - nr1 + cosA * nr1;
    const outerBaseY = points[5][1] - sinA * nr1;
    
    let z16 = -na / 2.0 + diffl * 5;
    let z17 = na / 2.0 - diffp * 5;
    
    if (c > a) {
        z16 = -na / 2.0 - diffl * 5;
        z17 = na / 2.0 + diffp * 5;
    }

    setPoint(16, outerBaseX, outerBaseY, z16);
    setPoint(17, outerBaseX, outerBaseY, z17);

    let finalDiffl = diffl;
    let finalDiffp = diffp;
    if (c > a) {
        finalDiffl = -diffl;
        finalDiffp = -diffp;
    }

    for (let ii = 0; ii < 6; ii++) {
      const angle = THREE.MathUtils.degToRad(15 + 15 * ii);
      const cosSeg = Math.cos(angle);
      const sinSeg = Math.sin(angle);

      const innerX = points[4][0] - nr + cosSeg * nr;
      const innerY = points[4][1] - sinSeg * nr;
      const outerX = points[5][0] - nr1 + cosSeg * nr1;
      const outerY = points[5][1] - sinSeg * nr1;

      const zBottom = -na / 2.0 + finalDiffl * (ii + 1);
      const zTop = na / 2.0 - finalDiffp * (ii + 1);

      setPoint(20 + ii, innerX, innerY, zBottom);
      setPoint(30 + ii, outerX, outerY, zBottom);
      setPoint(40 + ii, innerX, innerY, zTop);
      setPoint(50 + ii, outerX, outerY, zTop);
    }

    let alfa1 = Math.floor(alfaClamped);
    if (alfa1 === 90) {
      alfa1 -= 15;
    }
    let segmentCount = Math.floor(alfa1 / 15);
    segmentCount = Math.max(segmentCount, alfaClamped >= 15 ? 1 : 0);
    segmentCount = Math.min(segmentCount, 5);

    const faces = [
      // Extension f faces (Exact C# logic)
      [0, 1, 5, 4], 
      [1, 2, 6, 5], 
      [3, 2, 6, 7], 
      [0, 3, 7, 4], 

      // Extension e faces (Exact C# logic)
      [12, 8, 11, 15], 
      [11, 10, 14, 15], 
      [9, 10, 14, 13], 
      [12, 8, 9, 13], 

      // Connection faces (Exact C# logic)
      [11, 16, 17, 10], 
      [8, 11, 16], 
      [9, 10, 17]  
    ];

    for (let i = 0; i < segmentCount; i++) {
      faces.push([20 + i, 20 + i + 1, 30 + i + 1, 30 + i]); 
      faces.push([40 + i, 40 + i + 1, 50 + i + 1, 50 + i]); 
      faces.push([20 + i, 20 + i + 1, 40 + i + 1, 40 + i]); 
      faces.push([30 + i, 30 + i + 1, 50 + i + 1, 50 + i]); 
    }

    // Manual Start Connections (Exact C# logic)
    faces.push([4, 20, 30, 5]); 
    faces.push([7, 40, 50, 6]); 
    faces.push([4, 20, 40, 7]); 
    faces.push([5, 30, 50, 6]);

    const filteredFaces = faces.filter(face => face.every(idx => points[idx]));

    const geometry = createBufferGeometry(points, filteredFaces);
    geometry.center();
    return geometry;
  },

  QPR6a: (dims) => {
    const { a = 400, b = 350, c = 100, d = 100, L = 500, h = 60, m = 60 } = dims;
    
    // Normalize
    let max = Math.max(a, b, c, d, L, h, m);
    const na = a / max, nb = b / max, nc = c / max, nd = d / max;
    const nL = L / max, nh = h / max, nm = m / max;
    
    const points = [];
    
    // Z coordinates
    const z0 = -nL / 2;
    const z1 = -nL / 2 + nh;
    const z2 = nL / 2 - nm;
    const z3 = nL / 2;
    
    // Section 1: Start (a x b) at z0
    points.push([-na / 2, nb / 2, z0]);   // 0: TL
    points.push([-na / 2, -nb / 2, z0]);  // 1: BL
    points.push([na / 2, -nb / 2, z0]);   // 2: BR
    points.push([na / 2, nb / 2, z0]);    // 3: TR
    
    // Section 2: End of Ext 1 (a x b) at z1
    points.push([-na / 2, nb / 2, z1]);   // 4: TL
    points.push([-na / 2, -nb / 2, z1]);  // 5: BL
    points.push([na / 2, -nb / 2, z1]);   // 6: BR
    points.push([na / 2, nb / 2, z1]);    // 7: TR
    
    // Section 3: Start of Ext 2 (c x d) at z2
    points.push([-nc / 2, nd / 2, z2]);   // 8: TL
    points.push([-nc / 2, -nd / 2, z2]);  // 9: BL
    points.push([nc / 2, -nd / 2, z2]);   // 10: BR
    points.push([nc / 2, nd / 2, z2]);    // 11: TR
    
    // Section 4: End (c x d) at z3
    points.push([-nc / 2, nd / 2, z3]);   // 12: TL
    points.push([-nc / 2, -nd / 2, z3]);  // 13: BL
    points.push([nc / 2, -nd / 2, z3]);   // 14: BR
    points.push([nc / 2, nd / 2, z3]);    // 15: TR
    
    const faces = [
      // Extension 1 Walls
      [0, 1, 5, 4], // Left
      [1, 2, 6, 5], // Bottom
      [2, 3, 7, 6], // Right
      [3, 0, 4, 7], // Top
      
      // Reduction Walls
      [4, 5, 9, 8],   // Left
      [5, 6, 10, 9],  // Bottom
      [6, 7, 11, 10], // Right
      [7, 4, 8, 11],  // Top
      
      // Extension 2 Walls
      [8, 9, 13, 12],   // Left
      [9, 10, 14, 13],  // Bottom
      [10, 11, 15, 14], // Right
      [11, 8, 12, 15]   // Top
    ];
    
    return createBufferGeometry(points, faces);
  },

      QPR2a: (dims) => {
        const {
          a = 400,
          b = 350,
          c = 200,
          d = 200,
          e = 0,
          f = 0,
          L = 500,
          h = 60,
          m = 60
        } = dims;

        let max = Math.max(a, b, c, d, L, h, m);
        max = Math.max(max, Math.abs(e));
        max = Math.max(max, Math.abs(f));

        if (max === 0) {
          return createDefaultGeometry(dims);
        }

        const na = a / max;
        const nb = b / max;
        const nc = c / max;
        const nd = d / max;
        let ne = e / max;
        let nf = f / max;
        const nL = L / max;
        const nh = h / max;
        const nm = m / max;

        // Legacy OpenGL mirrored offsets
        ne = -ne;
        nf = -nf;

        const zUpper = -nL / 2 + nh;
        const zLower = -nL / 2;
        const zInner = nL / 2 - nm;
        const zEnd = nL / 2;

        const points = [
          [-na / 2, nb / 2, zUpper],
          [na / 2, nb / 2, zUpper],
          [na / 2, -nb / 2, zUpper],
          [-na / 2, -nb / 2, zUpper],
          [-na / 2, nb / 2, zLower],
          [na / 2, nb / 2, zLower],
          [na / 2, -nb / 2, zLower],
          [-na / 2, -nb / 2, zLower],
          [-na / 2 + nf, nb / 2 - ne, zInner],
          [-na / 2 + nf + nc, nb / 2 - ne, zInner],
          [-na / 2 + nf + nc, nb / 2 - nd - ne, zInner],
          [-na / 2 + nf, nb / 2 - nd - ne, zInner],
          [-na / 2 + nf, nb / 2 - ne, zEnd],
          [-na / 2 + nf + nc, nb / 2 - ne, zEnd],
          [-na / 2 + nf + nc, nb / 2 - nd - ne, zEnd],
          [-na / 2 + nf, nb / 2 - nd - ne, zEnd]
        ];

        const faces = [
          [0, 4, 7, 3],
          [0, 4, 5, 1],
          [1, 5, 6, 2],
          [6, 2, 3, 7],
          [8, 0, 3, 11],
          [0, 1, 9, 8],
          [9, 1, 2, 10],
          [11, 3, 2, 10],
          [12, 8, 11, 15],
          [12, 8, 9, 13],
          [13, 9, 10, 14],
          [15, 11, 10, 14]
        ];

        return createBufferGeometry(points, faces);
      },

  PR1a: (dims) => {
    const { a = 10, b = 10, d = 5, L = 12, h = 3, m = 4 } = dims;
    const max = Math.max(a, b, d, L, h, m);
    if (max === 0) {
      return createDefaultGeometry(dims);
    }

    const na = a / max;
    const nb = b / max;
    const nd = d / max;
    const nL = L / max;
    const nh = h / max;
    const nm = m / max;

    const halfA = na / 2;
    const halfB = nb / 2;
    const quarterA = na / 4;
    const quarterB = nb / 4;
    const radius = nd / 2;

    const zRect = -nL / 2 + nh;
    const zBottom = -nL / 2;
    const zCircle = nL / 2;
    const zBranchEnd = zCircle + nm;

    const p0 = [-halfA, halfB, zRect];
    const p1 = [halfA, halfB, zRect];
    const p2 = [halfA, -halfB, zRect];
    const p3 = [-halfA, -halfB, zRect];
    const p4 = [-halfA, halfB, zBottom];
    const p5 = [halfA, halfB, zBottom];
    const p6 = [halfA, -halfB, zBottom];
    const p7 = [-halfA, -halfB, zBottom];

    const vertices = [];
    const addTriangle = (aPoint, bPoint, cPoint) => {
      vertices.push(...aPoint, ...bPoint, ...cPoint);
    };
    const addQuad = (aPoint, bPoint, cPoint, dPoint) => {
      addTriangle(aPoint, bPoint, cPoint);
      addTriangle(aPoint, cPoint, dPoint);
    };

    // Rectangular shell
    addQuad(p0, p1, p5, p4); // Front
    addQuad(p1, p2, p6, p5); // Right
    addQuad(p2, p3, p7, p6); // Back
    addQuad(p3, p0, p4, p7); // Left

    // Anchor path along the rectangular top edge
    const anchorPath = [
      [0, halfB],
      [quarterA, halfB],
      [halfA, halfB],
      [halfA, quarterB],
      [halfA, 0],
      [halfA, -quarterB],
      [halfA, -halfB],
      [quarterA, -halfB],
      [0, -halfB],
      [-quarterA, -halfB],
      [-halfA, -halfB],
      [-halfA, -quarterB],
      [-halfA, 0],
      [-halfA, quarterB],
      [-halfA, halfB],
      [-quarterA, halfB]
    ].map(([x, y]) => [x, y, zRect]);

    const segments = anchorPath.length;
    const angleStep = (Math.PI * 2) / segments;
    const angleOffset = -angleStep / 2;

    const circlePoints = [];
    for (let i = 0; i <= segments; i++) {
      const angle = angleOffset + i * angleStep;
      const x = Math.sin(angle) * radius;
      const y = Math.cos(angle) * radius;
      circlePoints.push([x, y, zCircle]);
    }

    // Loft triangles tying rectangle to circle
    for (let i = 0; i < segments; i++) {
      const anchorA = anchorPath[i];
      const anchorB = anchorPath[(i + 1) % segments];
      const circleA = circlePoints[i];
      const circleB = circlePoints[i + 1];
      addQuad(anchorA, anchorB, circleB, circleA);
    }

    // Cylindrical branch
    for (let i = 0; i < segments; i++) {
      const circleLowerA = circlePoints[i];
      const circleLowerB = circlePoints[i + 1];
      const circleUpperA = [circleLowerA[0], circleLowerA[1], zBranchEnd];
      const circleUpperB = [circleLowerB[0], circleLowerB[1], zBranchEnd];
      addQuad(circleLowerA, circleLowerB, circleUpperB, circleUpperA);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    return geometry;
  },

  PR7a: (dims) => {
    const { a = 10, b = 10, d = 5, L = 12, e = 0, f = 0, h = 3, m = 4 } = dims;
    const max = Math.max(a, b, d, L, h, m, Math.abs(e), Math.abs(f));
    if (max === 0) {
      return createDefaultGeometry(dims);
    }

    const na = a / max;
    const nb = b / max;
    const nd = d / max;
    const nL = L / max;
    const nh = h / max;
    const nm = m / max;
    const ne = -(e / max);
    const nf = -(f / max);

    const halfA = na / 2;
    const halfB = nb / 2;
    const radius = nd / 2;

    const zRect = -nL / 2 + nh;
    const zBottom = -nL / 2;
    const zCircle = nL / 2;
    const zBranchEnd = zCircle + nm;

    const circleCenterX = -halfA + nf + radius;
    const circleCenterY = halfB - ne - radius;

    const points = [];
    points.push([-halfA, halfB, zRect]); // 0
    points.push([halfA, halfB, zRect]);  // 1
    points.push([halfA, -halfB, zRect]); // 2
    points.push([-halfA, -halfB, zRect]); // 3
    points.push([-halfA, halfB, zBottom]); // 4
    points.push([halfA, halfB, zBottom]);  // 5
    points.push([halfA, -halfB, zBottom]); // 6
    points.push([-halfA, -halfB, zBottom]); // 7

    const vertices = [];
    const addTriangle = (aPoint, bPoint, cPoint) => {
      vertices.push(...aPoint, ...bPoint, ...cPoint);
    };
    const addQuad = (aPoint, bPoint, cPoint, dPoint) => {
      addTriangle(aPoint, bPoint, cPoint);
      addTriangle(aPoint, cPoint, dPoint);
    };

    addQuad(points[0], points[1], points[5], points[4]);
    addQuad(points[1], points[2], points[6], points[5]);
    addQuad(points[2], points[3], points[7], points[6]);
    addQuad(points[3], points[0], points[4], points[7]);

        const segmentCount = 16;
        const circleLower = [];
        const circleUpper = [];
        const anchors = [];
        const step = (Math.PI * 2) / segmentCount;
        const anchorPattern = [
          // Mirrors Form1.cs triangle fan order (top edge clockwise)
          [0, halfB],
          [na / 4, halfB],
          [halfA, halfB],
          [halfA, nb / 4],
          [halfA, 0],
          [halfA, -nb / 4],
          [halfA, -halfB],
          [na / 4, -halfB],
          [0, -halfB],
          [-na / 4, -halfB],
          [-halfA, -halfB],
          [-halfA, -nb / 4],
          [-halfA, 0],
          [-halfA, nb / 4],
          [-halfA, halfB],
          [-na / 4, halfB]
        ];

        for (let i = 0; i < segmentCount; i++) {
          const angle = i * step - step / 2;
          const dirX = Math.sin(angle);
          const dirY = Math.cos(angle);

          const cx = circleCenterX + dirX * radius;
          const cy = circleCenterY + dirY * radius;
          circleLower.push([cx, cy, zCircle]);
          circleUpper.push([cx, cy, zBranchEnd]);

          const [anchorX, anchorY] = anchorPattern[i];
          anchors.push([anchorX, anchorY, zRect]);
        }

    for (let i = 0; i < segmentCount; i++) {
      const next = (i + 1) % segmentCount;
      addQuad(anchors[i], anchors[next], circleLower[next], circleLower[i]);
    }

    for (let i = 0; i < segmentCount; i++) {
      const next = (i + 1) % segmentCount;
      addQuad(circleLower[i], circleLower[next], circleUpper[next], circleUpper[i]);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
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
    controls.noPan = true;
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
