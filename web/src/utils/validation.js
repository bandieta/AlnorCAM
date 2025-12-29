
// Constants derived from C# Form1.cs validation logic
const LIMITS = {
  MIN_DIM: 100,
  MAX_DIM_GALVANIZED: 4000,
  MAX_DIM_OTHER: 2501,
  MIN_EXTENSION: 30,
  MIN_EXTENSION_ZERO_R: 50,
  MIN_RADIUS: 100
};

export const validateDimensions = (symbol, dimensions, material = 'Ocynk') => {
  const errors = [];
  const { a, b, e, f, r, alfa, L, c, d, m, w, l3 } = dimensions;

  // Helper to check if value is valid number
  const isNum = (val) => typeof val === 'number' && !isNaN(val);
  
  // Helper to check if value is strictly positive
  const isPositive = (val) => isNum(val) && val > 0;

  // Determine Max Dimension based on material
  // Default to 'Ocynk' (Galvanized) limits if material not specified
  const maxDim = (material === 'Ocynk') ? LIMITS.MAX_DIM_GALVANIZED : LIMITS.MAX_DIM_OTHER;

  // --- General Checks ---
  // These apply if the dimension exists on the shape
  
  if (a !== undefined) {
    if (!isNum(a) || a < LIMITS.MIN_DIM || a > maxDim) {
      errors.push(`Dimension 'a' must be between ${LIMITS.MIN_DIM} and ${maxDim}mm`);
    }
  }

  if (b !== undefined) {
    if (!isNum(b) || b < LIMITS.MIN_DIM || b > maxDim) {
      errors.push(`Dimension 'b' must be between ${LIMITS.MIN_DIM} and ${maxDim}mm`);
    }
  }

  if (c !== undefined) {
    if (!isNum(c) || c < LIMITS.MIN_DIM || c > maxDim) {
      errors.push(`Dimension 'c' must be between ${LIMITS.MIN_DIM} and ${maxDim}mm`);
    }
  }

  if (d !== undefined) {
    if (!isNum(d) || d < LIMITS.MIN_DIM || d > maxDim) {
      errors.push(`Dimension 'd' must be between ${LIMITS.MIN_DIM} and ${maxDim}mm`);
    }
  }

  if (L !== undefined) {
      if (!isPositive(L)) {
          errors.push("Dimension 'L' must be > 0");
      }
      // PR1a specific L check (100-20000)
      if (symbol === 'PR1a') {
        if (L < 100 || L > 20000) {
          errors.push("Dimension 'L' must be between 100 and 20000mm");
        }
      }
      // PR7a specific L check (250-5000)
      if (symbol === 'PR7a') {
        if (L < 250 || L > 5000) {
          errors.push("Dimension 'L' must be between 250 and 5000mm");
        }
      }
  }

  if (symbol === 'QPR2a') {
    if (dimensions.h !== undefined && dimensions.h < 30) {
      errors.push("Dimension 'h' must be >= 30mm");
    }
    if (dimensions.m !== undefined && dimensions.m < 30) {
      errors.push("Dimension 'm' must be >= 30mm");
    }
  }

  if (symbol === 'QBRa') {
    // b <= d
    if (b !== undefined && d !== undefined && b > d) {
      errors.push("Dimension 'b' must be <= 'd'");
    }
    // alfa 15-90
    if (alfa !== undefined && (alfa < 15 || alfa > 90)) {
      errors.push("Angle 'alfa' must be between 15 and 90 degrees");
    }
  }

  if (symbol === 'QBR1a') {
    // b <= d (Width reduction)
    if (b !== undefined && d !== undefined && b > d) {
      errors.push("Dimension 'b' must be <= 'd'");
    }
    // alfa 15-90
    if (alfa !== undefined && (alfa < 15 || alfa > 90)) {
      errors.push("Angle 'alfa' must be between 15 and 90 degrees");
    }
  }

  if (symbol === 'QBFa') {
    if (!isNum(r) || (r !== 0 && r < LIMITS.MIN_RADIUS)) {
      errors.push("Radius 'r' must be 0 or at least 100mm");
    }

    if (isNum(r)) {
      const minExtension = r === 0 ? LIMITS.MIN_EXTENSION_ZERO_R : r + 30;
      if (e !== undefined && (!isNum(e) || e < minExtension)) {
        errors.push(`Dimension 'e' must be >= ${minExtension}mm when r = ${r}`);
      }
      if (f !== undefined && (!isNum(f) || f < minExtension)) {
        errors.push(`Dimension 'f' must be >= ${minExtension}mm when r = ${r}`);
      }
    }
  }

  if (symbol === 'QESa') {
    if (!isNum(e) || e < 30) {
      errors.push("Dimension 'e' must be >= 30mm");
    }
  }

  if (symbol === 'TR1a') {
    if (isNum(L) && (L < 100 || L > 20000)) {
      errors.push("Dimension 'L' must be between 100 and 20000mm");
    }
    if (isNum(d) && isNum(a) && d > a) {
      errors.push("Dimension 'd' must be <= 'a'");
    }
    if (isNum(w) && isNum(L) && w > L - 60) {
      errors.push("Dimension 'w' must be at least 60mm shorter than 'L'");
    }
    if (isNum(l3) && l3 <= 0) {
      errors.push("Dimension 'l3' must be > 0");
    }
  }

  if (symbol === 'TR2a') {
    if (isNum(L) && (L < 100 || L > 20000)) {
      errors.push("Dimension 'L' must be between 100 and 20000mm");
    }
    if (isNum(d) && isNum(a) && d > a) {
      errors.push("Dimension 'd' must be <= 'a'");
    }
    if (isNum(d) && isNum(L) && d > L - 60) {
      errors.push("Dimension 'd' must be at least 60mm shorter than 'L'");
    }
    if (isNum(l3) && l3 <= 0) {
      errors.push("Dimension 'l3' must be > 0");
    }
  }

  // --- Specific Shape Checks ---

  if (symbol === 'PR1a') {
    // Extension m check
    if (m !== undefined) {
      if (!isNum(m) || m < 50) {
        errors.push("Dimension 'm' must be >= 50mm");
      }
    }
  }

  if (symbol === 'QBa' || symbol === 'QBNa') {
    // Radius (r) Validation
    // C#: if (promien > 0 && promien < 100) -> Error
    if (r !== undefined && isNum(r)) {
      if (r !== 0 && r < LIMITS.MIN_RADIUS) {
        errors.push(`Radius 'r' must be 0 or >= ${LIMITS.MIN_RADIUS}mm`);
      }
    }

    // Extensions (e, f) Validation
    // C#: if (promien == 0 && (ee < 50 || ff < 50)) -> Error
    // C#: else if (ee < 30 || ff < 30) -> Error
    const currentR = isNum(r) ? r : 0;
    const minExt = (currentR === 0) ? LIMITS.MIN_EXTENSION_ZERO_R : LIMITS.MIN_EXTENSION;

    if (e !== undefined) {
      if (!isNum(e) || e < minExt) {
        errors.push(`Dimension 'e' must be >= ${minExt}mm${currentR === 0 ? " (since r=0)" : ""}`);
      }
    }

    if (f !== undefined) {
      if (!isNum(f) || f < minExt) {
        errors.push(`Dimension 'f' must be >= ${minExt}mm${currentR === 0 ? " (since r=0)" : ""}`);
      }
    }

    // QBNa Specific: Angle (alfa)
    if (symbol === 'QBNa') {
      // C# defaults to 60 if empty. If provided, we assume it should be reasonable.
      // We'll enforce 0-90 range for sanity.
      if (alfa !== undefined && isNum(alfa)) {
        if (alfa < 0 || alfa > 90) {
          errors.push("Angle 'alfa' must be between 0 and 90 degrees");
        }
      }
    }
  }

  return errors;
};
