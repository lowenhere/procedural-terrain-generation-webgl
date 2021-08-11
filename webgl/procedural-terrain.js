import { glMatrix, mat4, quat, vec3 } from 'gl-matrix';
import Camera from '../src/scene/camera';
import DirLight from '../src/scene/directional-light';
import Water from '../src/objects/water';
import FlatShader from '../src/shaders/flat-shader';
import WaterShader from '../src/shaders/water-shader';
import Terrain from '../src/objects/terrain';
import objString from "../assets/tree00.obj";
import mtlString from "../assets/tree00.mtl";
import OBJMesh from '../src/objects/obj-mesh';
import { perlin2 } from '../src/utils/perlin';
import { Perlin2D } from '../src/utils/noise-utils';

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {HTMLCanvasElement} canvas
 * @param {Object} perlinParams
 */
export function Initialise(gl, canvas, perlinParams = {}, reportTimeCallback = () => {}) {
    console.log("Initialising Web GL");

    //set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);//counter clockwise determines which side the face is facing
    gl.cullFace(gl.BACK);

    //terrain types = 'WATER', 'SAND', 'GRASS', 'MOUNTAIN', 
    let terrainConfig = {
        WATER: -0.3,
        SAND: -0.1,
        GRASS: 0.2,
        MOUNTAIN: 1
    }
    
    let config = {
        water: {
            maxVertexOscillation: 0.05
        }
    }

    //========================================================================
    //
    //                            INIT SHADERS/PROGRAM
    //
    //========================================================================
    //to clip less, we lower the clipping plane as a buffer. this is to make up for water oscillation
    FlatShader.init(gl, terrainConfig.WATER - config.water.maxVertexOscillation*2); 
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
    //returns [-1,1];
    let normalisedHeightToTerrainType = (height)=>{
        for(let terrainType in terrainConfig) {
            let upperBound = terrainConfig[terrainType];
            if(height <= upperBound) {
                return terrainType;
            }
        }
        return Object.keys(terrainConfig)[0];
    }


    let perlinScale=4;
    // const p = new Perlin2D();
    // const terrainYFunction = (x, z) => p.perlin(x/perlinScale, z/perlinScale);
    let terrainYFunction = (x,z)=>perlin2(x/perlinScale, z/perlinScale);
    let size = 60;
    let terrain = new Terrain(FlatShader.program, terrainYFunction, normalisedHeightToTerrainType, gl, {scale: vec3.fromValues(1,1.8,1)}, size);
    let water = new Water(WaterShader.program, gl, size, terrainConfig['WATER']);

    let sceneObjects = [];
    
    //tree generator
    let treeScale = vec3.fromValues(0.5, 0.5, 0.5);
    let treeSpawnProbability = 0.05;
    for(let x=0; x<size; x++) {
        for(let z=0; z<size; z++) {
            let sampleHeight = terrainYFunction(x, z);
            let terrainType = normalisedHeightToTerrainType(sampleHeight);
            if(terrainType == 'GRASS') {
                if(Math.random() < treeSpawnProbability) {
                    let scale = vec3.create();
                    vec3.scale(scale, treeScale, Math.max(Math.random(), 0.9));
                    let tree = new OBJMesh(FlatShader.program, gl, objString, mtlString, {position: vec3.fromValues(x-size/2, sampleHeight*1.8, z-size/2), scale});
                    sceneObjects.push(tree);
                }
            }
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
    let stop = false;

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
        
        for(let object of sceneObjects) {
            object.render(Camera);
        }
        
        //========================================================================
        //
        //                      RENDER TO REFLECTION TEXTURE                             
        //
        //========================================================================
        gl.bindFramebuffer(gl.FRAMEBUFFER, reflectionFrameBuffer);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //assuming water is at pos y = 0, then camera to water distance is y pos of camera
        let distance = (Camera.transform.position[1] - terrainConfig['WATER']) * 2;
        Camera.transform.position[1] -= distance;
        Camera.transform.rotation[0] = -Camera.transform.rotation[0]; //invert pitch
        terrain.render(Camera, true);
        for(let object of sceneObjects) {
            object.render(Camera, true);
        }
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
        for(let object of sceneObjects) {
            object.render(Camera);
        }

        reportTimeCallback(performance.now());

        if (!stop) {
            requestAnimationFrame(loop);
        }
    }

    const startLoop = () => {
        stop = false;
        requestAnimationFrame(loop);
    };

    const stopLoop = () => {
        stop = true;
    }

    return {
        startLoop,
        stopLoop,
    }
}


