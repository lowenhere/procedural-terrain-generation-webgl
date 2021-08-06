import {glMatrix, mat4} from "gl-matrix";

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
 * 
 * @param {Array<any>} shaders 
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

function initModelViewProjMatrices(aspectRatio) {
    let modelMatrix = new Float32Array(16);
    let viewMatrix = new Float32Array(16);
    let projMatrix = new Float32Array(16);

    mat4.identity(modelMatrix);
    const cameraPos = [0, 5, 6];
    const lookAt = [0, 0, 0];
    const up = [0, 1, 0];
    mat4.lookAt(viewMatrix, cameraPos, lookAt, up);    
    const fieldOfView = glMatrix.toRadian(45);
    const nearClipPlane = 0.1;
    const farClipPlane = 1000;
    mat4.perspective(projMatrix, fieldOfView, aspectRatio, nearClipPlane, farClipPlane);

    return [modelMatrix, viewMatrix, projMatrix];
}

const glUtils = {
    createProgramWithShaders,
    createShader,
    initModelViewProjMatrices
}

export default glUtils;