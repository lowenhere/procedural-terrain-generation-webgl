import glUtils from "../src/gl-utils";
import OBJMesh from "../src/obj-mesh";

import { basicVertexShaderText, basicFragmentShaderText } from "../src/shaders/obj-mesh-shaders";
import bunnyObjString from "../assets/bunny.obj";

/**
 * Mesh Loading Scene
 * @param {WebGL2RenderingContext} gl 
 */
const meshLoading = (gl) => {
    // clear screen
    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    // create the shaders and compile the webgl program
    const vs = glUtils.createShader(basicVertexShaderText, gl.VERTEX_SHADER, gl);
    const fs = glUtils.createShader(basicFragmentShaderText, gl.FRAGMENT_SHADER, gl);
    const program = glUtils.createProgramWithShaders([vs, fs], gl);

    const mesh = new OBJMesh(program, gl, bunnyObjString);

    const loop = () => {
        mesh.render();
        requestAnimationFrame(loop);
    }

    return loop;
}

export default meshLoading;
