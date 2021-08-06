import { mat4 } from "gl-matrix";
import MeshUtils from "../utils/mesh";
import { perlin2 } from "../utils/perlin";

export const Terrain = {
    /** @type {WebGL2RenderingContext} */
    gl: undefined,
    /** @type {WebGLVertexArrayObject} */    
    vao: undefined,
    program: undefined,
    mesh: {
        indices: [],
        vertices: []
    },
    locations: {
        uniform: {
            model: undefined,
            view: undefined,
            proj: undefined,
            clipEnabled: undefined,
        }
    },
    /**
     * 
     * @param {*} program 
     * @param {WebGL2RenderingContext} gl 
     */
    init(program, gl, size=30) {
        this.gl = gl;
        this.program = program;
        
        this.vao = gl.createVertexArray();        
        gl.bindVertexArray(this.vao);
        
        //========================================================================
        //
        //                            MESH GENERATION                             
        //
        //========================================================================
        let perlinScale=4;
        let heightScale=1.8;
        let yFunc = (x,z)=>perlin2(x/perlinScale, z/perlinScale) * heightScale;
        let colorFunc = (y)=>{
            if(y <= 0.0) {
                return [0.8, 0.8, 0.3];
            }
            else
            {
                return [0.2, 0.9, 0.2];
            }
        }

        let [ vertices, indices ] = MeshUtils.GenerateSquarePlaneTriangleMesh(size, yFunc, colorFunc, 0.6);
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
        
        this.locations.uniform.model = this.gl.getUniformLocation(this.program, 'mModel');
        this.locations.uniform.view = this.gl.getUniformLocation(this.program, 'mView');
        this.locations.uniform.proj = this.gl.getUniformLocation(this.program, 'mProj');
        this.locations.uniform.clipEnabled = this.gl.getUniformLocation(this.program, 'clipEnabled');
    },    
    get modelMatrix(){ 
        return mat4.identity(new Float32Array(16));
    },
    render(Camera, clipEnabled=false) {
        this.gl.useProgram(this.program);
        this.gl.uniform1i(this.locations.uniform.clipEnabled, clipEnabled);
        this.gl.uniformMatrix4fv(this.locations.uniform.model, this.gl.FALSE, this.modelMatrix);
        this.gl.uniformMatrix4fv(this.locations.uniform.view, this.gl.FALSE, Camera.matrices.view);
        this.gl.uniformMatrix4fv(this.locations.uniform.proj, this.gl.FALSE, Camera.matrices.proj);
        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, this.mesh.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
}