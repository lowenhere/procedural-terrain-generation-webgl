import glUtils from "../utils/gl-utils";

const WaterShader = {
    /** @type {WebGLProgram} */
    program: undefined,
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     */
    init(gl) {
        let vertexShader = glUtils.createShader(this.vertexShaderText, gl.VERTEX_SHADER, gl);
        let fragmentShader = glUtils.createShader(this.fragmentShaderText, gl.FRAGMENT_SHADER, gl);        
        this.program = glUtils.createProgramWithShaders([vertexShader, fragmentShader], gl);
    },
    vertexShaderText: `#version 300 es
    precision mediump float;
    
    in vec3 vertPosition;
    in vec3 vertColor;
    uniform float time;
    
    uniform mat4 mNormal;
    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;
    uniform vec3 cameraPosition;
    
    out vec3 toCameraVector;
    out vec4 color;
    out vec4 vertPositionAfterOffset;
    out vec4 clipSpacePreOffset;
    out vec2 dudvTextureCoordinates;
    
    const float dudvTiling = 0.2;
    const float scale = 500.0;
    
    void main()
    {
        mat4 _m = mProj * mView * mWorld;
        float timePositionValue = (time + vertPosition[0]*scale + vertPosition[2]*scale);
        vec3 offset = vec3(0.0, sin(time + vertPosition[0]*scale) + cos(time + vertPosition[2]*scale), 0.0) * 0.05;
        color = vec4(vertColor, 1.0);        
        clipSpacePreOffset = _m * vec4(vertPosition, 1.0);
        
        vertPositionAfterOffset = vec4(vertPosition + offset, 1.0);;
        gl_Position = _m * vertPositionAfterOffset;
        dudvTextureCoordinates = vec2(vertPosition.x/2.0 + 0.5, vertPosition.z/2.0 + 0.5) * dudvTiling;
    
        toCameraVector = (cameraPosition - vertPosition.xyz);
    }
    `,
    fragmentShaderText: `#version 300 es
    // #extension GL_OES_standard_derivatives : enable
    precision mediump float;
    
    in vec4 vertPositionAfterOffset;
    in vec4 clipSpacePreOffset;
    in vec4 color;
    in vec2 dudvTextureCoordinates;
    in vec3 toCameraVector;
    
    uniform sampler2D refractionTexture;
    uniform sampler2D reflectionTexture;
    uniform sampler2D dudvMap;
    uniform float distortionMoveFactor;
    uniform vec3 directionalLightColor;
    uniform vec3 directionalLightVector;
    
    const float distortionStrength = 0.01;
    const float specularReflectivity = 0.8;
    const float shininessDampening = 7.0;
    
    out vec4 outputColor;
    const bool distortionEnabled = false;
    void main()
    {
        vec3 viewVector = normalize(toCameraVector);
    
        vec3 U = dFdx(vertPositionAfterOffset.xyz);
        vec3 V = dFdy(vertPositionAfterOffset.xyz);
        vec3 normal = normalize(cross(U,V));
        
        //diffuse
        highp float directional = max(dot(normal.xyz, -directionalLightVector), 0.0);
        vec3 diffuse = (directionalLightColor * directional);
        
        vec2 distortion = vec2(0.0, 0.0);
        if(distortionEnabled) {
            distortion = (texture(dudvMap, vec2(dudvTextureCoordinates.x + distortionMoveFactor, dudvTextureCoordinates.y)).rg * 2.0 - 1.0) * distortionStrength; //converts [0,1] to [-1, 1];
        }
        vec2 normalisedDeviceCoordinates = (clipSpacePreOffset.xy/clipSpacePreOffset.w)/2.0 + 0.5; ///2 + 0.5 to convert from [0, 1] to [-1, 1]
        vec4 refractionTexel = texture(refractionTexture, normalisedDeviceCoordinates+ distortion); // + distortion
        vec4 reflectionTexel = texture(reflectionTexture, vec2(normalisedDeviceCoordinates.x, 1.0-normalisedDeviceCoordinates.y)+ distortion); // + distortion
        
        //fresnel effect    
        //fresnel = [-1, 1] => [view from side, view from top]
        float fresnelFactor = dot(viewVector, vec3(0.0, 1.0, 0.0));
        vec4 texel = mix(reflectionTexel, refractionTexel, fresnelFactor);

        //specular
        vec3 reflectedLightVector = reflect(directionalLightVector, normal);
        float specularFactor = max(dot(reflectedLightVector, viewVector), 0.0);
        specularFactor = pow(specularFactor, shininessDampening);
        vec3 specular = specularFactor * (specularReflectivity - fresnelFactor*0.4) * directionalLightColor;
    
        vec4 waterMixedFrameTextureColor = mix(texel, color, 0.3);
        outputColor = vec4(waterMixedFrameTextureColor.xyz * diffuse + specular, 1.0);
    }
    `,
}

export default WaterShader;