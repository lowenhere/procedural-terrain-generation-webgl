import { vec2 } from "gl-matrix";
import random from "random";
import seedrandom from "seedrandom";
import { perlin2 } from "./perlin";
class Perlin2D {
    /**
     * Perlin2D constructor
     * @param {Number}  params.octaves number of octaves.
     * @param {Number}  params.lacunarity controls increase in frequency of octaves.
     * @param {Number}  params.persistence controls decrease in frequency of octaves. should be in (0, 1].
     * @param {Number}  params.n perlin noise grid size. should be a small number for efficiency
     * @param {String}  params.seed seed for the random number generator.
     * @param {Boolean} params.normalizeGrad if gradient magnitudes should be normalized, else magnitudes will follow a standard normal distribution.
     */
    constructor({
        octaves = 5,
        lacunarity = 2,
        persistence = 0.6,
        perlinScale = 1.3,
        seed = '',
        normalizeGrad = true
    }) {
        this.octaves = octaves;
        this.lacunarity = lacunarity;
        this.persistence = persistence;
        this.perlinScale = perlinScale;

        // create random number generator
        this.rng = random.clone(seedrandom(seed));
        this.rngUniform = this.rng.uniform(-100000, 100000);
        this.rngNormal = this.rng.normal();
        this.octaveOffsets = [];

        for(let i=0; i<this.octaves; i++) { 
            this.octaveOffsets.push({x: this.rngUniform(), y: this.rngUniform()})
        }
    }

    /**
     * @param {Number} x 
     * @param {Number} y 
     * @returns 
     */
    perlin(x, y) {
        let frequency = 1;
        let amplitude = 1;
        let out = 0;

        for(let i=0; i<this.octaves; i++) {
            let sampleX = x / this.perlinScale * frequency + this.octaveOffsets[i].x;
            let sampleY = y / this.perlinScale * frequency + this.octaveOffsets[i].y;
            let perlinVal = perlin2(sampleX, sampleY);
            out += perlinVal * amplitude;
            
            amplitude *= this.persistence;
            frequency *= this.lacunarity;
        }

        return out;
    }
}

export { Perlin2D };