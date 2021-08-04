import MeshUtils from "./mesh";

export const Water = {
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
            world: undefined,
            view: undefined,
            proj: undefined,
            time: undefined,
            uSampler: undefined
        },
    },
    /**
     * 
     * @param {*} program 
     * @param {WebGL2RenderingContext} gl 
     */
    init(program, gl) {
        this.gl = gl;
        this.program = program;
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        
        //========================================================================
        //
        //                            MESH GENERATION                             
        //
        //========================================================================
        let yFunc = (x,z)=>-0.1;
        let colorFunc = (y)=>[0.3,0.5,1.0]

        let [ vertices, indices ] = MeshUtils.GenerateSquarePlaneTriangleMesh(30, yFunc, colorFunc, 0.6);
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
        this.locations.uniform.time = gl.getUniformLocation(program, 'time');        
        this.locations.uniform.uSampler = gl.getUniformLocation(program, 'uSampler');
        
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
      
        this.initView();
    },    
    initView() {
        this.locations.uniform.world = this.gl.getUniformLocation(this.program, 'mWorld');
        this.locations.uniform.view = this.gl.getUniformLocation(this.program, 'mView');
        this.locations.uniform.proj = this.gl.getUniformLocation(this.program, 'mProj');
    },
    render(worldMatrix, viewMatrix, projMatrix, time, texture) {        
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.locations.uniform.time, time/1000);
        this.gl.uniformMatrix4fv(this.locations.uniform.world, this.gl.FALSE, worldMatrix);
        this.gl.uniformMatrix4fv(this.locations.uniform.view, this.gl.FALSE, viewMatrix);
        this.gl.uniformMatrix4fv(this.locations.uniform.proj, this.gl.FALSE, projMatrix);
        
        // Tell WebGL we want to affect texture unit 0
        this.gl.activeTexture(this.gl.TEXTURE0);

        // Bind the texture to texture unit 0
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        // Tell the shader we bound the texture to texture unit 0
        this.gl.uniform1i(this.locations.uniform.uSampler, 0);

        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, this.mesh.indices.length, this.gl.UNSIGNED_SHORT, 0);


    }
}