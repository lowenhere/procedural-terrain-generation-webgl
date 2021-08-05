import { mat4 } from "gl-matrix";

import glUtils from "../src/utils/gl-utils";
import OBJMesh from "../src/obj-mesh";

import { basicVertexShaderText, basicFragmentShaderText } from "../src/shaders/obj-mesh-shaders";
import objString from "../assets/tree00.obj";
import mtlString from "../assets/tree00.mtl";

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

    // set up world, view, proj matrices
    const aspectRatio = 16 / 9;
    const [mWorld, mView, mProj] = glUtils.initWorldViewProjMatrices(aspectRatio);
    mat4.lookAt(mView, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
    const rotationMatrix = new Float32Array(16);
    mat4.identity(rotationMatrix);

    // load mesh
    const mesh = new OBJMesh(program, gl, objString, mtlString);

    const loop = () => {
        // clear screen
        gl.clearColor(0.75, 0.85, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //rotate
        const angle = performance.now() / 2000 / 6 * 2 * Math.PI;
        mat4.rotate(mWorld, rotationMatrix, angle, [0, 1, 0]); //rotate around y axis

        // render
        mesh.render(mWorld, mView, mProj);
        requestAnimationFrame(loop);
    }

    return loop;
}

export default meshLoading;
