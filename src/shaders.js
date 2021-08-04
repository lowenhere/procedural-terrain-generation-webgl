export const flatVertexShaderText = `#version 300 es
precision mediump float;

in vec3 vertPosition;
in vec3 vertColor;

uniform mat4 mNormal;
uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

out vec4 fragColor;
out vec4 vertexViewSpace;

void main()
{
    vec3 offset = vec3(0.0, 0.0, 0.0) * 0.2;
    fragColor = vec4(vertColor, 1.0);    
    vertexViewSpace = mView * mWorld * vec4(vertPosition + offset, 1.0);;
    gl_Position = mProj * vertexViewSpace;
}
`;


export const fragmentShaderText = `#version 300 es
// #extension GL_OES_standard_derivatives : enable
precision mediump float;

in vec4 vertexViewSpace;

in vec4 fragColor;
out vec4 outputColor;
void main()
{
    vec3 U = dFdx(vertexViewSpace.xyz);
    vec3 V = dFdy(vertexViewSpace.xyz);
    vec3 normal = normalize(cross(U,V));

    highp vec3 directionalLightColor = vec3(1, 1, 1);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
    // highp vec4 transformedNormal = normalTransformMatrix * vec4(normal, 1.0);
    highp float directional = max(dot(normal.xyz, directionalVector), 0.0);
    vec3 vLighting = (directionalLightColor * directional);
    outputColor = vec4(fragColor.xyz * vLighting, 1.0);
}

`;

export const flatFragmentShaderText = `#version 300 es
// #extension GL_OES_standard_derivatives : enable

attribute vec3 vertexViewSpace;
varying vec4 fragColor;

void main() {
    vec3 U = dFdx(vertexViewSpace);                     
    vec3 V = dFdy(vertexViewSpace);                 
    vec3 normal = normalize(cross(U,V));

    highp vec3 directionalLightColor = vec3(1, 1, 1);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

    highp vec4 transformedNormal = mNormal * normal;

    highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);

    vLighting = directionalLightColor * directional;
    // fragColor 

}
`;


export const waterVertexShaderText = `#version 300 es
precision mediump float;


in vec3 vertPosition;
in vec3 vertColor;
uniform float time;

uniform mat4 mNormal;
uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

out vec4 color;
out vec4 vertexViewSpace;
out vec4 clipSpace;

void main()
{
    float scale = 500.0;
    vec3 offset = vec3(0.0, sin(time + vertPosition[0]*scale + vertPosition[2]*scale), 0.0) * 0.05;
    color = vec4(vertColor, 1.0);        
    vertexViewSpace = mView * mWorld * vec4(vertPosition + offset, 1.0);;
    clipSpace = mProj * vertexViewSpace;
    gl_Position = clipSpace;
}
`;


export const flatWaterFragmentShaderText = `#version 300 es
// #extension GL_OES_standard_derivatives : enable
precision mediump float;

in vec4 vertexViewSpace;
in vec4 clipSpace;
in vec4 color;

uniform sampler2D uSampler;

out vec4 outputColor;

void main()
{
    vec3 U = dFdx(vertexViewSpace.xyz);
    vec3 V = dFdy(vertexViewSpace.xyz);
    vec3 normal = normalize(cross(U,V));

    highp vec3 directionalLightColor = vec3(1, 1, 1);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
    // highp vec4 transformedNormal = normalTransformMatrix * vec4(normal, 1.0);
    highp float directional = max(dot(normal.xyz, directionalVector), 0.0);
    vec3 vLighting = (directionalLightColor * directional);
    // outputColor = vec4(fragColor.xyz * vLighting, 1.0);

    vec2 normalisedDeviceSpace = clipSpace.xy/clipSpace.w;
    vec2 screenSpaceCoords = (normalisedDeviceSpace/2.0) + 0.5;
    vec4 texel = texture(uSampler, screenSpaceCoords);
    vec4 waterMixedFrameTextureColor = mix(texel, color, 0.5);
    outputColor = vec4(waterMixedFrameTextureColor.xyz * vLighting, 1.0);
}
`;


    
    // highp vec3 directionalLightColor = vec3(1, 1, 1);
    // highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

    // highp vec4 transformedNormal = mNormal * vec4(vertNormal, 1.0);

    // highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);

    // vLighting = directionalLightColor * directional;