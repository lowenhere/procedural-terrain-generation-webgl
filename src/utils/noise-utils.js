import { vec2 } from "gl-matrix";
import random from "random";
import seedrandom from "seedrandom";

class Perlin2D {
    /**
     * Perlin2D constructor
     * @param {Number} octaves number of octaves.
     * @param {Number} lacunarity controls increase in frequency of octaves.
     * @param {Number} persistence controls decrease in frequency of octaves. should be in (0, 1].
     * @param {Number} n perlin noise grid size. should be a small number for efficiency
     * @param {String} seed seed for the random number generator.
     * @param {Boolean} normalizeGrad if gradient magnitudes should be normalized, else magnitudes will follow a standard normal distribution.
     */
    constructor(octaves = 2, lacunarity = 2, persistence = 0.1, n = 3, seed = '', normalizeGrad = true) {
        this.octaves = octaves;
        this.lacunarity = lacunarity;
        this.persistence = persistence;
        this.n = n;

        // create random number generator
        const rng = random.clone(seedrandom(seed));
        const rngUniform = rng.uniform();
        const rngNormal = rng.normal();

        // default fade function
        this.fade = (t) => 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3;
        this.jointFade = (x, y) => this.fade(x) * this.fade(y);

        // create a n * n array and populate it with random gradients
        this.g = Array.from(Array(n), () => new Array(n));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                // generate a random vec2
                const g = [rngUniform(), rngUniform()];

                // set its magnitude based on normalizeGrad
                const magnitude = normalizeGrad ? 1 : Math.abs(rngNormal());

                // normalize and scale
                const ng = [null, null]; // normalized g
                vec2.normalize(ng, g);
                const sg = [null, null]; // scaled g
                vec2.scale(sg, ng, magnitude);

                this.g[i][j] = sg;
            }
        }

        // have the gradients wrap-around
        for (let i = 0; i < n; i++) {
            this.g[i][n - 1] = this.g[i][0];
            this.g[n - 1][i] = this.g[0][i];
        }

    }

    /**
     * @param {Number} x 
     * @param {Number} y 
     * @returns 
     */
    perlin(x, y) {
        const { g, n } = this;
        // x and y could be outside of range(0, n)
        x = x % n;
        y = y % n;

        const x0 = Math.floor(x), x1 = (x0 + 1) % n;
        const y0 = Math.floor(y), y1 = (y0 + 1) % n;

        // xr and yr are the relative pos
        const xr = x - x0, yr = y - y0;

        const g00 = g[x0][y0], g01 = g[x0][y1];
        const g10 = g[x1][y0], g11 = g[x1][y1];

        const v00 = [x - x0, y - y0], v01 = [x - x0, y - y1];
        const v10 = [x - x1, y - y0], v11 = [x - x1, y - y1];

        const s00 = vec2.dot(v00, g00), s01 = vec2.dot(v01, g01);
        const s10 = vec2.dot(v10, g10), s11 = vec2.dot(v11, g11);

        const noise = (x, y) => {
            const psi = this.jointFade;

            return (
                psi(1 - x, 1 - y) * s00 +
                psi(x, 1 - y) * s10 +
                psi(1 - x, y) * s01 +
                psi(x, y) * s11
            )
        }

        const k = this.octaves - 1;
        const l = this.lacunarity;
        const p = this.persistence;

        let out = 0;
        for (let i = 0; i < k; i++) {
            out += (p ** i) * noise((l ** i) * xr, (l ** i) * yr);
        }

        return out;
    }
}

export { Perlin2D };