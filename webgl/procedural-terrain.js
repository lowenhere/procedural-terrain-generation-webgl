import { glMatrix, mat4, quat, vec3 } from 'gl-matrix';
import Camera from '../src/camera';
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
    //                            INIT CAMERA
    //
    //========================================================================
    const aspectRatio = canvas.width / canvas.height;
    Camera.init(aspectRatio);

    // let [worldMatrix, viewMatrix, projMatrix] = glUtils.initWorldViewProjMatrices(aspectRatio);
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
    document.onmousemove = function(event) {
        deltaMouseX += event.movementX;
        deltaMouseY += event.movementY;
    }

    let inputKeys = {}
    document.onkeydown = function(event) {
        inputKeys[event.key] = true;
    }
    
    document.onkeyup = function(event) {
        inputKeys[event.key] = false;
    }

    let movementBindings = {
        'q': vec3.fromValues(0,1,0),
        'e': vec3.fromValues(0,-1,0),
        'w': vec3.fromValues(0,0,1),
        's': vec3.fromValues(0,0,-1),
        'a': vec3.fromValues(1,0,0),
        'd': vec3.fromValues(-1,0,0),
    }

    let locked = false;
    document.onmousedown = function(event) {
        let havePointerLock = 'pointerLockElement' in document ||
        'mozPointerLockElement' in document ||
        'webkitPointerLockElement' in document;
    
        if(havePointerLock) {
            if(locked) document.exitPointerLock();
            else canvas.requestPointerLock();
            locked = !locked;
        }
    }


    let time = 0;
    let startTime = performance.now();
    let lastTime = 0;


    function loop(now) {
        //reset
        gl.clearColor(0.75, 0.85, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        time = (now - startTime);        
        let deltaTime = (time - lastTime)/1000;
        lastTime = time;

        //========================================================================
        //
        //                            ROTATE CAMERA                             
        //
        //========================================================================
        // if(lastMouseX != 0 && lastMouseY != 0) {
        //     deltaMouseX = (mouseX - lastMouseX);
        //     deltaMouseY = (mouseY - lastMouseY);
        // }

        // lastMouseX = mouseX;
        // lastMouseY = mouseY;
        let deltaAngleHor = deltaMouseX * Math.PI/10;
        let deltaAngleVert = deltaMouseY * Math.PI/10;
        deltaMouseX = 0;
        deltaMouseY = 0;
        
        Camera.transform.rotation[1] -= deltaAngleHor;
        Camera.transform.rotation[0] = Math.min(89, Math.max(deltaAngleVert + Camera.transform.rotation[0], -89));
        console.log(Camera.transform.rotation[0]);

        //========================================================================
        //
        //                            MOVE CAMERA                             
        //
        //========================================================================
        for(let key in movementBindings) {
            if(inputKeys[key]) {
                let moveVector = vec3.create();
                
                //world space
                if(key == 'q' || key == 'e') {
                    moveVector = movementBindings[key];
                }
                else {
                    //move inlocal space
                    vec3.transformQuat(moveVector, movementBindings[key], Camera.transform.quatRotation);
                }
                
                let speedModifier = (inputKeys[' '] ? 3 : 1);
                vec3.normalize(moveVector, moveVector);
                vec3.scale(moveVector, moveVector, Camera.moveSpeed * deltaTime * speedModifier);
                vec3.add(Camera.transform.position, Camera.transform.position, moveVector);
            }
        }
        // console.log(Camera.matrices)

        Terrain.render(Camera.matrices.world, Camera.matrices.view, Camera.matrices.proj);
        Water.render(Camera.matrices.world, Camera.matrices.view, Camera.matrices.proj, time);
        // gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(loop);
    }

    //start loop
    requestAnimationFrame(loop);
}


