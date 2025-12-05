
export function multiply(A: number[][], B: number[][]): number[][] {
    const m = A.length;
    const n = A[0].length;
    const p = B[0].length;
    const C = Array(m).fill(0).map(() => Array(p).fill(0));

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < p; j++) {
            for (let k = 0; k < n; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }
    return C;
}

export function transpose(A: number[][]): number[][] {
    return A[0].map((_, colIndex) => A.map(row => row[colIndex]));
}

// Gaussian elimination to solve Ax = b
// Returns x
export function solve(A: number[][], b: number[]): number[] {
    const n = A.length;
    // Augment A with b
    const M = A.map((row, i) => [...row, b[i]]);

    for (let i = 0; i < n; i++) {
        // Pivot
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
                maxRow = k;
            }
        }
        [M[i], M[maxRow]] = [M[maxRow], M[i]];

        // Make M[i][i] = 1
        const div = M[i][i];
        if (Math.abs(div) < 1e-10) return Array(n).fill(0); // Singular
        for (let j = i; j <= n; j++) {
            M[i][j] /= div;
        }

        // Eliminate other rows
        for (let k = 0; k < n; k++) {
            if (k !== i) {
                const factor = M[k][i];
                for (let j = i; j <= n; j++) {
                    M[k][j] -= factor * M[i][j];
                }
            }
        }
    }

    return M.map(row => row[n]);
}

export function polynomialRegression(points: { x: number, y: number }[], degree: number): number[] {
    const X = points.map(p => {
        const row = [];
        for (let d = 0; d <= degree; d++) {
            row.push(Math.pow(p.x, d));
        }
        return row;
    });
    const y = points.map(p => [p.y]); // Column vector

    const XT = transpose(X);
    const XTX = multiply(XT, X);
    const XTy = multiply(XT, y).map(row => row[0]); // Flatten to vector

    return solve(XTX, XTy);
}
