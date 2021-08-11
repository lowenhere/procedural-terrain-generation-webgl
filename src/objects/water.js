import { mat4 } from "gl-matrix";
import MeshUtils from "../utils/mesh";
import Transform from "./transform";

export default class Water extends Transform{

    /** @type {WebGL2RenderingContext} */
    gl = undefined;
    /** @type {WebGLVertexArrayObject} */    
    vao = undefined;
    program = undefined;
    mesh = {
        indices: [],
        vertices: []
    }

    locations = {
        uniform: {
            mModel: undefined,
            mView: undefined,
            mProj: undefined,
            time: undefined,
            distortionMoveFactor: undefined,
            reflectionTexture: undefined,
            refractionTexture: undefined,
            dudvMap: undefined,
            cameraPosition: undefined,
        },
    };

    uniformConfigurations = {
        bool: {
            distortionEnabled: true
        },
        float: {
            distortionStrength: 0.01,
            specularReflectivity: 0.8,
            shininessDampening: 4.0,
            maxVertexOscillation: 0.05,
            dudvTiling: 0.2,
            oscillationScale: 500.0,
        }
    }

    constructor(program, gl, size=30, waterHeight=-0.1, waterParams={}) {
        super();
        this.gl = gl;
        this.program = program;
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.uniformConfigurations.bool.distortionEnabled = waterParams.distortionEnabled;
        this.uniformConfigurations.float.distortionStrength = waterParams.distortionStrength;
        this.uniformConfigurations.float.specularReflectivity = waterParams.specularReflectivity;
        this.uniformConfigurations.float.shininessDampening = waterParams.shininessDampening;
        this.uniformConfigurations.float.maxVertexOscillation = waterParams.maxVertexOscillation;
        this.uniformConfigurations.float.dudvTiling = waterParams.dudvTiling;
        this.uniformConfigurations.float.oscillationScale = waterParams.oscillationScale;

        //========================================================================
        //
        //                            LOAD DUDV IMAGE                             
        //
        //========================================================================
        this.dudvTexture = this.loadTexture('/waterDUDV.png');

        
        //========================================================================
        //
        //                            MESH GENERATION                             
        //
        //========================================================================
        let yFunc = (x,z)=>waterHeight;
        let colorFunc = (y)=>[52/255,235/255,229/255];

        let [ vertices, indices ] = MeshUtils.GenerateSquarePlaneTriangleMesh(size, yFunc, colorFunc);
        this.mesh.vertices = vertices;
        this.mesh.indices = indices;

        let vertexBufferObject = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        //indices buffer
        let indicesBufferObject = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBufferObject);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        //========================================================================
        //
        //                            SHADER ATTRIBUTES                             
        //
        //========================================================================
        gl.useProgram(program);
        let positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
        let colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

        //========================================================================
        //
        //                            LOCATION AND CONFIGURATIONS                             
        //
        //========================================================================
        
        //uniform locations
        for(let key in this.locations.uniform) {
            this.locations.uniform[key] = gl.getUniformLocation(program, key);
        }
        
        //uniform flags
        for(let key in this.uniformConfigurations.bool) {
            this.locations.uniform[key] = gl.getUniformLocation(program, key);
            this.gl.uniform1i(this.locations.uniform[key], this.uniformConfigurations.bool[key]);
        }
        
        //uniform floats
        for(let key in this.uniformConfigurations.float) {
            this.locations.uniform[key] = gl.getUniformLocation(program, key);
            this.gl.uniform1f(this.locations.uniform[key], this.uniformConfigurations.float[key]);
        }

        this.gl.uniform1i(this.locations.uniform.refractionTexture, 0);
        this.gl.uniform1i(this.locations.uniform.reflectionTexture, 1);
        this.gl.uniform1i(this.locations.uniform.dudvMap, 2);

        const valuesPerVertex = 6;

        gl.vertexAttribPointer(
            positionAttribLocation, //attribute location
            3,  //no of elements per attribute vec2
            gl.FLOAT, //element type
            gl.FALSE, //is normalised
            valuesPerVertex * Float32Array.BYTES_PER_ELEMENT, //stride
            0 //offset from begging of single vertex to this attribute
        );

        gl.vertexAttribPointer(
            colorAttribLocation, //attribute location
            3,  //no of elements per attribute 
            gl.FLOAT, //element type
            gl.FALSE, //is normalised
            valuesPerVertex * Float32Array.BYTES_PER_ELEMENT,
            3 * Float32Array.BYTES_PER_ELEMENT //offset from begging of single vertex to this attribute
        );
        
        gl.enableVertexAttribArray(positionAttribLocation);
        gl.enableVertexAttribArray(colorAttribLocation);
    }

    loadTexture(url) {
        const image = new Image();
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        //init image before loaded
        const level = 0;
        const internalFormat = this.gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = this.gl.RGBA;
        const srcType = this.gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
        this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

        function isPowerOf2(value) {
            return (value & (value - 1)) == 0;
        }

        image.onload = () => {
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

            // WebGL1 has different requirements for power of 2 images
            // vs non power of 2 images so check if the image is a
            // power of 2 in both dimensions.
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                // Yes, it's a power of 2. Generate mips.
                this.gl.generateMipmap(this.gl.TEXTURE_2D);
            } else {
                // No, it's not a power of 2. Turn off mips and set
                // wrapping to clamp to edge
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            }
        }

        image.src = url;
        return texture;
    };

    render(Camera, time, refractionTexture, reflectionTexture) {
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.locations.uniform.time, time/1000);
        this.gl.uniform1f(this.locations.uniform.distortionMoveFactor, (time/1000 * 0.05) % 1);
        this.gl.uniform3fv(this.locations.uniform.cameraPosition, Camera.transform.position);
        this.gl.uniformMatrix4fv(this.locations.uniform.mModel, this.gl.FALSE, this.modelMatrix);
        this.gl.uniformMatrix4fv(this.locations.uniform.mView, this.gl.FALSE, Camera.matrices.view);
        this.gl.uniformMatrix4fv(this.locations.uniform.mProj, this.gl.FALSE, Camera.matrices.proj);

        //refraction
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, refractionTexture);
        
        //reflection
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, reflectionTexture);
        
        //dudv
        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.dudvTexture);

        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, this.mesh.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
}