
/**
 * Calculates the sheet metal area (suma blachy) for various shapes.
 * Formulas derived from AlnorCAM Form1.cs.
 * Returns area in square meters (m^2).
 */

export const calculateArea = (symbol, dimensions) => {
  const { a, b, e, f, r, alfa, L, c, d, w, l3 } = dimensions;
  
  // Helper to ensure numbers
  const val = (v) => (typeof v === 'number' && !isNaN(v)) ? v : 0;

  const A = val(a);
  const B = val(b);
  const C = val(c);
  const D = val(d);
  const W = val(w);
  const L3 = val(l3);
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


    case 'QBFa':
      // Formula: 2 * (a + b) * (2*b + e + f) / 1,000,000 (d == b in C#)
      area = (2 * (A + B) * (2 * B + E + F)) / 1000000;
      break;
    
    case 'QBFRa':
      // Formula: 2 * (a + b) * (b + d + e + f) / 1,000,000
      // Reducing elbow: perimeter times total length around the bend
      area = (2 * (A + B) * (B + D + E + F)) / 1000000;
      break;
    case 'QESa':
      // Formula: a * b / 1,000,000
      area = (A * B) / 1000000;
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

    case 'PR1a':
      // Formula: p0 * sqrt(L^2 + p^2) / 1,000,000
      // p = max((B - D)/2, (A - D)/2)
      // p0 = max(2*(A + B), PI * D)
      const p_pr1a = Math.max(Math.abs(B - D) / 2, Math.abs(A - D) / 2);
      const p0_pr1a = Math.max(2 * (A + B), Math.PI * D);
      area = (p0_pr1a * Math.sqrt(Math.pow(Len, 2) + Math.pow(p_pr1a, 2))) / 1000000;
      break;

    case 'PR7a':
      // Formula: p0 * sqrt(L^2 + p^2) / 1,000,000
      // p = max(|b-d+e|, |e|, |a-d+f|, |f|)
      // p0 = max(2(a+b), PI*d)
      const p_pr7a = Math.max(
        Math.abs(B - D + E),
        Math.abs(E),
        Math.abs(A - D + F),
        Math.abs(F)
      );
      const p0_pr7a = Math.max(2 * (A + B), Math.PI * D);
      area = (p0_pr7a * Math.sqrt(Math.pow(Len, 2) + Math.pow(p_pr7a, 2))) / 1000000;
      break;

    case 'QPR2a':
      // Formula: 2 * (a + b) * sqrt(L^2 + p^2) / 1,000,000
      // p = max(|b-d+e|, |e|, |a-c+f|, |f|)
      const p_qpr2a = Math.max(
        Math.abs(B - D + E),
        Math.abs(E),
        Math.abs(A - C + F),
        Math.abs(F)
      );
      area = (2 * (A + B) * Math.sqrt(Math.pow(Len, 2) + Math.pow(p_qpr2a, 2))) / 1000000;
      break;

    case 'QBRa':
      // Formula: 2 * (a + b) * (alfa/180 * PI * (r + b) + e + f) / 1,000,000
      // Corrected to match C# (uses b, not d)
      const angleRad_qbra = Alfa * (Math.PI / 180);
      area = (2 * (A + B) * (angleRad_qbra * (R + B) + E + F)) / 1000000;
      break;

    case 'QBR1a':
      // Formula: Same as QBRa (uses a and b, ignores c and d)
      const angleRad_qbr1a = Alfa * (Math.PI / 180);
      area = (2 * (A + B) * (angleRad_qbr1a * (R + B) + E + F)) / 1000000;
      break;

    case 'TR1a':
      // Formula: (2*(a+b)*L + 2*(w+d)*l3) / 1,000,000
      area = (2 * (A + B) * Len + 2 * (W + D) * L3) / 1000000;
      break;

    case 'TR2a':
      // Formula: (2*(a+b)*L + PI*d*l3) / 1,000,000
      area = (2 * (A + B) * Len + Math.PI * D * L3) / 1000000;
      break;

    default:
      return null; // Not implemented for other shapes yet
  }

  return parseFloat(area.toFixed(3)); // Return with 3 decimal places
};
