import { glMatrix, mat4, quat, vec3 } from 'gl-matrix';
import Camera from '../src/scene/camera';
import DirLight from '../src/scene/directional-light';
import Water from '../src/objects/water';
import FlatShader from '../src/shaders/flat-shader';
import WaterShader from '../src/shaders/water-shader';
import Terrain from '../src/objects/terrain';

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
    Camera.init(aspectRatio, canvas);
    
    //========================================================================
    //
    //                            INIT OBJECTS        
    //
    //========================================================================
    let size = 60;
    let terrain = new Terrain(FlatShader.program, gl, size);
    let waterHeight = -0.1;
    let water =new Water(WaterShader.program, gl, size, waterHeight);


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

        Camera.update(deltaTime);

        //========================================================================
        //
        //                      RENDER TO REFRACTION TEXTURE                             
        //
        //========================================================================
        gl.bindFramebuffer(gl.FRAMEBUFFER, refractionFrameBuffer);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        terrain.render(Camera);
        
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
        terrain.render(Camera, true);
        Camera.transform.position[1] += distance;
        Camera.transform.rotation[0] = -Camera.transform.rotation[0]; //invert pitch

        //========================================================================
        //
        //                            RENDER TO CANVAS                             
        //
        //========================================================================
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        terrain.render(Camera);
        water.render(Camera, time, refractionTexture, reflectionTexture);
        requestAnimationFrame(loop);
    }

    //start loop
    requestAnimationFrame(loop);
}


