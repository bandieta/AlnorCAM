
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
  const { a, b, e, f, r, alfa, L } = dimensions;

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

  if (L !== undefined) {
      if (!isPositive(L)) {
          errors.push("Dimension 'L' must be > 0");
      }
  }

  // --- Specific Shape Checks ---

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
