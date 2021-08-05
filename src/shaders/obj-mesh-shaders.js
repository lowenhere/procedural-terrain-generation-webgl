export const basicVertexShaderText = 
`# version 300 es
precision highp float;

in vec3 vertPosition;
in vec4 vertColor;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

out vec4 fragColor;
out vec4 vertexViewSpace;

void main(){
    // fragColor = vec4(0.8, 0.0, 0.0, 1.0);
    fragColor = vertColor;
    vertexViewSpace = mView * mWorld * vec4(vertPosition, 1.0);
    gl_Position = mProj * vertexViewSpace;
}
`;

export const basicFragmentShaderText = 
`# version 300 es
precision highp float;

in vec4 vertexViewSpace;
in vec4 fragColor;

out vec4 outputColor;

void main(){
    outputColor = fragColor;
}
`;
