import MeshUtils from "../utils/mesh";

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
            distortionMoveFactor: undefined,
            refractionTexture: undefined,
            dudvMap: undefined,
            cameraPosition: undefined,
        },
    },
    /**
     * 
     * @param {*} program 
     * @param {WebGL2RenderingContext} gl 
     */
    init(program, gl, size=30, waterHeight=-0.1) {
        this.gl = gl;
        this.program = program;
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

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
        let colorFunc = (y)=>[52/255,235/255,229/255]

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
        this.locations.uniform.time = gl.getUniformLocation(program, 'time');        
        this.locations.uniform.distortionMoveFactor = gl.getUniformLocation(program, 'distortionMoveFactor');        
        this.locations.uniform.refractionTexture = gl.getUniformLocation(program, 'refractionTexture');
        this.locations.uniform.reflectionTexture = gl.getUniformLocation(program, 'reflectionTexture');
        this.locations.uniform.dudvMap = gl.getUniformLocation(program, 'dudvMap');
        
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
      
        this.locations.uniform.world = this.gl.getUniformLocation(this.program, 'mWorld');
        this.locations.uniform.view = this.gl.getUniformLocation(this.program, 'mView');
        this.locations.uniform.proj = this.gl.getUniformLocation(this.program, 'mProj');
        this.locations.uniform.cameraPosition = this.gl.getUniformLocation(this.program, 'cameraPosition');
    },    
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
    },
    render(worldMatrix, viewMatrix, projMatrix, time, refractionTexture, reflectionTexture, cameraPosition) {
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.locations.uniform.time, time/1000);
        this.gl.uniform1f(this.locations.uniform.distortionMoveFactor, (time/1000 * 0.05) % 1);
        this.gl.uniform3fv(this.locations.uniform.cameraPosition, cameraPosition);
        this.gl.uniformMatrix4fv(this.locations.uniform.world, this.gl.FALSE, worldMatrix);
        this.gl.uniformMatrix4fv(this.locations.uniform.view, this.gl.FALSE, viewMatrix);
        this.gl.uniformMatrix4fv(this.locations.uniform.proj, this.gl.FALSE, projMatrix);

        //refraction
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, refractionTexture);
        this.gl.uniform1i(this.locations.uniform.refractionTexture, 0);
        
        //reflection
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, reflectionTexture);
        this.gl.uniform1i(this.locations.uniform.reflectionTexture, 1);
        
        //dudv
        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.dudvTexture);
        this.gl.uniform1i(this.locations.uniform.dudvMap, 2);

        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, this.mesh.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
}