import { vec3 } from "gl-matrix"

const DirLight = {
    /** @type {WebGL2RenderingContext} */
    gl: undefined,
    direction: vec3.fromValues(0.4, -0.8, 0.4),
    color: vec3.fromValues(1.0,1.0,1.0),
    locations: {
        uniform: {
            directionalLightVector: undefined,
            directionalLightColor: undefined,
        }
    },
    programData: [],
    /**
     * 
     * @param {WebGLProgram} program 
     * @param {WebGL2RenderingContext} gl 
     */
    initForProgram(program, gl) {
        this.gl = gl;
        let programData = {
            program,
            directionalLightColor: gl.getUniformLocation(program, 'directionalLightColor'),
            directionalLightVector: gl.getUniformLocation(program, 'directionalLightVector'),
        }
        this.programData.push(programData);
        this.update();
    },
    update() {
        for(let programData of this.programData) {
            this.gl.useProgram(programData.program);
            this.gl.uniform3fv(programData.directionalLightColor, this.color);
            this.gl.uniform3fv(programData.directionalLightVector, this.direction);
        }
    }
}

export default DirLight;