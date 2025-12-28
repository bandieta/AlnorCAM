
/**
 * Calculates the sheet metal area (suma blachy) for various shapes.
 * Formulas derived from AlnorCAM Form1.cs.
 * Returns area in square meters (m^2).
 */

export const calculateArea = (symbol, dimensions) => {
  const { a, b, e, f, r, alfa, L, c, d } = dimensions;
  
  // Helper to ensure numbers
  const val = (v) => (typeof v === 'number' && !isNaN(v)) ? v : 0;

  const A = val(a);
  const B = val(b);
  const C = val(c);
  const D = val(d);
  const E = val(e);
  const F = val(f);
  let R = val(r);
  const Alfa = val(alfa);
  const Len = val(L);

  // Common logic from C#: if r < 100, treat as 0 for calculation purposes
  if (R < 100) R = 0;

  let area = 0;

  switch (symbol) {
    case 'QDa':
      // Formula: 2 * (a + b) * L / 1,000,000
      area = (2 * (A + B) * Len) / 1000000;
      break;

    case 'QBa':
      // Formula: 2 * (a + b) * (PI/2 * (r + b) + e + f) / 1,000,000
      area = (2 * (A + B) * ((Math.PI / 2) * (R + B) + E + F)) / 1000000;
      break;

    case 'QBNa':
      // Formula: 2 * (a + b) * (alfa * PI/180 * (r + b) + e + f) / 1,000,000
      const angleRad = Alfa * (Math.PI / 180);
      area = (2 * (A + B) * (angleRad * (R + B) + E + F)) / 1000000;
      break;

    case 'QPR6a':
      // Formula: Perimeter * sqrt(L^2 + p^2) / 1,000,000
      // Perimeter = max(2*(a+b), 2*(c+d))
      // p = 25 (fixed constant)
      const perimeter = Math.max(2 * (A + B), 2 * (C + D));
      const p = 25;
      area = (perimeter * Math.sqrt(Math.pow(Len, 2) + Math.pow(p, 2))) / 1000000;
      break;

    default:
      return null; // Not implemented for other shapes yet
  }

  return parseFloat(area.toFixed(3)); // Return with 3 decimal places
};
