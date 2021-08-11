import { mat4 } from "gl-matrix";
import MeshUtils from "../utils/mesh";
import { perlin2 } from "../utils/perlin";
import Transform from "./transform";

class Terrain extends Transform {
    /** @type {WebGL2RenderingContext} */
    gl = undefined
    /** @type {WebGLVertexArrayObject} */    
    vao = undefined;
    program = undefined;
    
    mesh = {
        indices: [],
        vertices: []
    };

    locations = {
        uniform: {
            mModel: undefined,
            mView: undefined,
            mProj: undefined,
            clipEnabled: undefined,
        }
    };    

    /**
     * 
     * @param {WebGLProgram} program 
     * @param {WebGL2RenderingContext} gl 
     * @param {number} size 
     */
    constructor(program, yFunc, heightToTerrainType, gl, transform={}, size=30) {
        super(transform.position, transform.rotation, transform.scale);
        this.gl = gl;
        this.program = program;
        
        this.vao = gl.createVertexArray();        
        gl.bindVertexArray(this.vao);
        
        //========================================================================
        //
        //                            MESH GENERATION                             
        //
        //========================================================================        
        let colorFunc = (y)=>{
            let terrainType = heightToTerrainType(y);
            switch (terrainType) {
                case 'WATER':
                    return [0.8, 0.8, 0.3];
                    break;
                case 'SAND':
                    return [0.8, 0.8, 0.3];
                    break;
                case 'GRASS':
                    return [0.2, 0.9, 0.2];
                    break;
                case 'MOUNTAIN':
                    return [0.7, 0.7, 0.5];
                    break;
                case 'MOUNTAINTOP':
                    return [0.9, 0.9, 0.9];
                    break;
                    
                default:
                    console.warn('invalid terrain type:', terrainType);
                    return [0.2, 0.2, 0.2];
                    break;
            }
        }

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
        
        //LINK ALL UNIFORM LOCATIONS
        for(let key in this.locations.uniform) {
            this.locations.uniform[key] = gl.getUniformLocation(program, key);
        }
    }

    render(Camera, clipEnabled=false) {
        this.gl.useProgram(this.program);
        this.gl.uniform1i(this.locations.uniform.clipEnabled, clipEnabled);
        this.gl.uniformMatrix4fv(this.locations.uniform.mModel, this.gl.FALSE, this.modelMatrix);
        this.gl.uniformMatrix4fv(this.locations.uniform.mView, this.gl.FALSE, Camera.matrices.view);
        this.gl.uniformMatrix4fv(this.locations.uniform.mProj, this.gl.FALSE, Camera.matrices.proj);
        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, this.mesh.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
}

export default Terrain;