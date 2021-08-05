import { glMatrix, mat4, quat, vec3 } from 'gl-matrix';
import Camera from '../src/scene/camera';
import DirLight from '../src/scene/directional-light';
import { Terrain } from '../src/objects/terrain';
import { Water } from '../src/objects/water';
import FlatShader from '../src/shaders/flat-shader';
import WaterShader from '../src/shaders/water-shader';

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {HTMLCanvasElement} canvas 
 * @param {WebGL2RenderingContext} textureGlContext 
 */
export function Initialise(gl, canvas) {
    console.log("Initialising Web GL");

    //set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);//counter clockwise determines which side the face is facing
    gl.cullFace(gl.BACK);

    //========================================================================
    //
    //                            INIT SHADERS/PROGRAM
    //
    //========================================================================
    FlatShader.init(gl);
    WaterShader.init(gl);
    DirLight.initForProgram(FlatShader.program, gl);
    DirLight.initForProgram(WaterShader.program, gl);

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
    Terrain.init(FlatShader.program, gl);
    let waterHeight = -0.1;
    Water.init(WaterShader.program, gl, waterHeight);


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


    //========================================================================
    //
    //                       RENDER REFRACTION TEXTURE                             
    //
    //========================================================================

    let refractionFrameBuffer = gl.createFramebuffer();    
    gl.bindFramebuffer(gl.FRAMEBUFFER, refractionFrameBuffer);
    
    const textureWidth = canvas.width;
    const textureHeight = canvas.height;
    const refractionTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, refractionTexture);
        // define size and format of level 0
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, textureWidth, textureHeight, border, format, type, data);
    
    // set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, refractionTexture, level);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error('frame buffer attachment failed');
    }
   
    //========================================================================
    //
    //                       RENDER REFLECTION TEXTURE
    //
    //========================================================================

    let reflectionFrameBuffer = gl.createFramebuffer();    
    gl.bindFramebuffer(gl.FRAMEBUFFER, reflectionFrameBuffer);
    
    const reflectionTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, reflectionTexture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, textureWidth, textureHeight, border, format, type, data);
    
    // set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, reflectionTexture, level);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error('frame buffer attachment failed');
    }

    //========================================================================
    //
    //                       MAIN RENDER LOOP
    //
    //========================================================================

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

        //========================================================================
        //
        //                      RENDER TO REFRACTION TEXTURE                             
        //
        //========================================================================
        gl.bindFramebuffer(gl.FRAMEBUFFER, refractionFrameBuffer);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        Terrain.render(Camera.matrices.world, Camera.matrices.view, Camera.matrices.proj);
        
        //========================================================================
        //
        //                      RENDER TO REFLECTION TEXTURE                             
        //
        //========================================================================
        gl.bindFramebuffer(gl.FRAMEBUFFER, reflectionFrameBuffer);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //assuming water is at pos y = 0, then camera to water distance is y pos of camera
        let distance = (Camera.transform.position[1] - waterHeight) * 2;
        Camera.transform.position[1] -= distance;
        Camera.transform.rotation[0] = -Camera.transform.rotation[0]; //invert pitch
        Terrain.render(Camera.matrices.world, Camera.matrices.view, Camera.matrices.proj, true);
        Camera.transform.position[1] += distance;
        Camera.transform.rotation[0] = -Camera.transform.rotation[0]; //invert pitch

        //========================================================================
        //
        //                            RENDER TO CANVAS                             
        //
        //========================================================================
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        Terrain.render(Camera.matrices.world, Camera.matrices.view, Camera.matrices.proj);
        Water.render(Camera.matrices.world, Camera.matrices.view, Camera.matrices.proj, time, refractionTexture, reflectionTexture, Camera.transform.position);
        requestAnimationFrame(loop);
    }

    //start loop
    requestAnimationFrame(loop);
}


