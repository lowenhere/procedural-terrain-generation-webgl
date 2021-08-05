import {glMatrix, mat4} from "gl-matrix";

/**
 * Creates a shader
 * @param {String} shaderText 
 * @param {(gl.VERTEX_SHADER|gl.FRAGMENT_SHADER)} shaderType 
 * @param {WebGL2RenderingContext} gl 
 * @returns {WebGLShader}
 */
function createShader(shaderText, shaderType, gl) {
    let newShader = gl.createShader(shaderType);
    gl.shaderSource(newShader, shaderText);
    gl.compileShader(newShader);
    if (!gl.getShaderParameter(newShader, gl.COMPILE_STATUS)) {
        let compilationLog = gl.getShaderInfoLog(newShader);
        console.error(`failed to compile ${shaderType} shader`);
        console.log('Shader compiler log: ' + compilationLog);
    }
    return newShader;
}

/**
<<<<<<< HEAD:src/gl-utils.js
 * Creates a program from a list of shaders
 * @param {Array<WebGLShader>} shaders 
=======
 * 
 * @param {Array<any>} shaders 
>>>>>>> main:src/utils/gl-utils.js
 * @param {WebGL2RenderingContext} gl 
 * @returns {WebGLProgram}
 */
function createProgramWithShaders(shaders, gl) {
    let program = gl.createProgram();    
    for(let shader of shaders) {
        gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) console.error('failed to link program');
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) console.error('failed to validate program');
    return program
}

function initWorldViewProjMatrices(aspectRatio) {
    let worldMatrix = new Float32Array(16);
    let viewMatrix = new Float32Array(16);
    let projMatrix = new Float32Array(16);

    mat4.identity(worldMatrix);
    const cameraPos = [0, 5, 6];
    const lookAt = [0, 0, 0];
    const up = [0, 1, 0];
    mat4.lookAt(viewMatrix, cameraPos, lookAt, up);    
    const fieldOfView = glMatrix.toRadian(45);
    const nearClipPlane = 0.1;
    const farClipPlane = 1000;
    mat4.perspective(projMatrix, fieldOfView, aspectRatio, nearClipPlane, farClipPlane);

    return [worldMatrix, viewMatrix, projMatrix];
}

const glUtils = {
    createProgramWithShaders,
    createShader,
    initWorldViewProjMatrices
}

export default glUtils;