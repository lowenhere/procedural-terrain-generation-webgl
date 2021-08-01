export const basicVertexShaderText = 
`# version 300 es
precision highp float;

in vec3 vertPosition;

void main(){
    gl_Position = vec4(vertPosition, 1.0);
}
`;

export const basicFragmentShaderText = 
`# version 300 es
precision highp float;

out vec4 outputColor;

void main(){
    outputColor = vec4(0.8, 0.0, 0.0, 1.0);
}
`;
