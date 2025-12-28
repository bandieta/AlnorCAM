
/**
 * Calculates the sheet metal area for shape QBa (Symmetric Arch).
 * 
 * @param {number} a - Width in mm
 * @param {number} b - Height in mm
 * @param {number} e - Extension 1 in mm
 * @param {number} f - Extension 2 in mm
 * @param {number} r - Radius in mm
 * @returns {number} Area in square meters
 */
export function calculateQBaArea(a, b, e, f, r) {
    // Logic from Form1.cs: if (r < 100) { r = 0; }
    if (r < 100) {
        r = 0;
    }

    // Formula from Blacha.Rozwiniecie_QBa
    // wartosc = (2 * (a + b) * (Math.PI / 2 * (r + b) + ee + f)) / 1000000;
    const area = (2 * (a + b) * (Math.PI / 2 * (r + b) + e + f)) / 1000000;
    return area;
}

/**
 * Calculates the sheet metal area for shape QBNa (Symmetric Arch with Angle).
 * 
 * @param {number} a - Width in mm
 * @param {number} b - Height in mm
 * @param {number} e - Extension 1 in mm
 * @param {number} f - Extension 2 in mm
 * @param {number} r - Radius in mm
 * @param {number} alfa - Angle in degrees
 * @returns {number} Area in square meters
 */
export function calculateQBNaArea(a, b, e, f, r, alfa) {
    // Logic from Form1.cs: if (r < 100) { r = 0; }
    if (r < 100) {
        r = 0;
    }

    // Formula from Blacha.Rozwiniecie_QBNa
    // wartosc = (2 * (a + b) * (alfa * Math.PI / 180 * (r + b) + ee + f)) / 1000000;
    const area = (2 * (a + b) * (alfa * (Math.PI / 180) * (r + b) + e + f)) / 1000000;
    return area;
}
