import { glMatrix, mat4} from 'gl-matrix';
import glUtils from '../src/gl-utils';
import { flatVertexShaderText, fragmentShaderText, waterVertexShaderText } from '../src/shaders';
import { Terrain } from '../src/terrain';
import { Water } from '../src/water';

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {HTMLCanvasElement} canvas 
 */
export function Initialise(gl, canvas) {
    console.log("Initialising Web GL");

    //set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);//counter clockwise determines which side the face is facing
    gl.cullFace(gl.BACK);

    //========================================================================
    //
    //                            INIT SHADERS/PROGRAM
    //
    //========================================================================
    let flatVertexShader = glUtils.createShader(flatVertexShaderText, gl.VERTEX_SHADER, gl);
    let waterVertexShader = glUtils.createShader(waterVertexShaderText, gl.VERTEX_SHADER, gl);
    let fragmentShader = glUtils.createShader(fragmentShaderText, gl.FRAGMENT_SHADER, gl);

    //PROGRAM: create -> attach -> link -> validate
    let flatMaterialProgram = glUtils.createProgramWithShaders([flatVertexShader, fragmentShader], gl);
    let waterMaterialProgram = glUtils.createProgramWithShaders([waterVertexShader, fragmentShader], gl);
    
    //========================================================================
    //
    //                            INIT TRANSFORM MATRICES                             
    //
    //========================================================================
    const aspectRatio = canvas.width / canvas.height;
    let [worldMatrix, viewMatrix, projMatrix] = glUtils.initWorldViewProjMatrices(aspectRatio);
    let angle = 0;
    let rotationMatrix = new Float32Array(16);
    mat4.identity(rotationMatrix);
    
    
    //========================================================================
    //
    //                            INIT OBJECTS        
    //
    //========================================================================
    Terrain.init(flatMaterialProgram, gl);
    Water.init(waterMaterialProgram, gl);


    //========================================================================
    //
    //                            INIT CONTROLS                             
    //
    //========================================================================
    let deltaMouseX = 0;
    let deltaMouseY = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;
    document.onmousemove = function(event) {
        mouseX = event.clientX;
        mouseY = event.clientY;        
    }


    let time = 0;
    let startTime = performance.now();
    let lastTime = 0;
    let eulerRot = {
        x: 0,
        y: 0,
        z: 0,
    }
    function loop(now) {
        //reset
        gl.clearColor(0.75, 0.85, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        time = (now - startTime);        
        let deltaTime = (time - lastTime)/1000;
        lastTime = time;

        if(lastMouseX != 0 && lastMouseY != 0) {
            deltaMouseX = (mouseX - lastMouseX);
            deltaMouseY = (mouseY - lastMouseY);
        }

        lastMouseX = mouseX;
        lastMouseY = mouseY;

        //rotate
        // angle = performance.now() / 10000 / 6 * 2 * Math.PI;
        let deltaAngleHor = deltaMouseX * Math.PI/1000;
        let deltaAngleVert = deltaMouseY * Math.PI/1000;
        eulerRot.y += deltaAngleHor;
        eulerRot.x += deltaAngleVert;
        mat4.rotate(worldMatrix, rotationMatrix, eulerRot.y, [0, 1, 0]); //rotate camera around y axis
        mat4.rotate(worldMatrix, worldMatrix, eulerRot.x, [1, 0, 0]); //rotate camera around y axis
        mat4.rotate(worldMatrix, worldMatrix, eulerRot.z, [0, 0, 1]); //rotate camera around y axis

        Terrain.render(worldMatrix, viewMatrix, projMatrix);
        Water.render(worldMatrix, viewMatrix, projMatrix, time);
        // gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(loop);
    }

    //start loop
    requestAnimationFrame(loop);
}


