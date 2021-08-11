import { mat4 } from "gl-matrix";
import { performance } from 'perf_hooks';


import glUtils from "../src/utils/gl-utils";
import OBJMesh from "../src/objects/obj-mesh";

import { basicVertexShaderText, basicFragmentShaderText } from "../src/shaders/obj-mesh-shaders";
import objString from "../assets/tree00.obj";
import mtlString from "../assets/tree00.mtl";
import Camera from "../src/scene/camera";
import FlatShader from "../src/shaders/flat-shader";
import DirLight from "../src/scene/directional-light";

/**
 * Mesh Loading Scene
 * @param {WebGL2RenderingContext} gl 
 */
const meshLoading = (gl, canvas) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
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

    FlatShader.init(gl);
    DirLight.initForProgram(FlatShader.program, gl);

    
    // set up world, view, proj matrices
    const aspectRatio = canvas.width / canvas.height;
    Camera.init(aspectRatio, canvas);

    // load mesh
    const mesh = new OBJMesh(FlatShader.program, gl, objString, mtlString);

    let time = 0;
    let startTime = Date.now();
    let lastTime = 0;
    const loop = (now) => {        
        // clear screen
        gl.clearColor(0.75, 0.85, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        time = (now - startTime);        
        let deltaTime = (time - lastTime)/1000;
        lastTime = time;

        Camera.update(deltaTime);
        //rotate
        // const angle = Date.now() / 2000 / 6 * 2 * Math.PI;
        // mat4.rotate(mWorld, rotationMatrix, angle, [0, 1, 0]); //rotate around y axis

        // render
        mesh.render(Camera);
        requestAnimationFrame(loop);
    }

    return loop;
}

export default meshLoading;
