import _ from "lodash";

function GenerateSquarePlaneTriangleMesh(width=10, yFunc=(x,z)=>0, colorFunc=(y)=>[Math.random(), Math.random(), Math.random()], vertexStepDistance=1) {
    const posVertices = [];
    const colorVertices = [];
    const indices = [];

    let height = width;

    let offsetX = width/2;
    let offsetZ = height/2;

    for (let z = 0; z < height; z++){
        for (let x = 0; x < width; x++){
            const y = yFunc(x, z);
            const vertexColor = colorFunc(y);

            const index = (x+z*width);
            posVertices.push([(x-offsetX)*vertexStepDistance, y, (z-offsetZ)*vertexStepDistance]);
            colorVertices.push(vertexColor);

            if (x < width-1 && z < height-1){
                //|*
                //|  *
                //|    *
                let triangle1Vertices = [index, index+width, index+width+1];
                //*    |
                //  *  |
                //    *|
                let triangle2Vertices = [index, index+width+1, index+1];
                indices.push(...triangle1Vertices, ...triangle2Vertices);
            }
        }
    }

    return [ posVertices, colorVertices, indices ]
}

function GenerateEdgeTriangleMesh(width=10, yFunc=(x, z)=>0, colorFunc=(y)=>[Math.random(), Math.random(), Math.random()], vertexStepDistance=1, floorHeight=-3.0, epsilon=0){
    const topPerimeter = [];
    const bottomPerimeter = [];
    const topPerimeterColor = [];
    const bottomPerimeterColor = [];

    const offset = width / 2;

    // bottom edge (z = -offset)
    _.range(-offset, offset-1, vertexStepDistance).forEach((x) => {
        const z = -offset + epsilon;
        const xr = (x / vertexStepDistance) + offset;
        const zr = (z / vertexStepDistance) + offset;
        topPerimeter.push([x, yFunc(xr, zr), z]);
        bottomPerimeter.push([x, floorHeight, z]);
        topPerimeterColor.push(colorFunc( yFunc(xr, zr) ));
        bottomPerimeterColor.push(colorFunc( yFunc(xr, zr) ));
    });

    // right edge (x = offset-1)
    _.range(-offset, offset-1, vertexStepDistance).forEach((z) => {
        const x = offset-1 - epsilon;
        const xr = (x / vertexStepDistance) + offset;
        const zr = (z / vertexStepDistance) + offset;
        topPerimeter.push([x, yFunc(xr, zr), z]);
        bottomPerimeter.push([x, floorHeight, z]);
        topPerimeterColor.push(colorFunc( yFunc(xr, zr) ));
        bottomPerimeterColor.push(colorFunc( yFunc(xr, zr) ));
    });

    // top edge (z = offset-1)
    _.range(offset-1, -offset+1, -vertexStepDistance).forEach((x) => {
        const z = offset-1 - epsilon;
        const xr = (x / vertexStepDistance) + offset;
        const zr = (z / vertexStepDistance) + offset;
        topPerimeter.push([x, yFunc(xr, zr), z]);
        bottomPerimeter.push([x, floorHeight, z]);
        topPerimeterColor.push(colorFunc( yFunc(xr, zr) ));
        bottomPerimeterColor.push(colorFunc( yFunc(xr, zr) ));
    });

    // bottom edge (x = -offset)
    _.range(offset-1, -offset, -vertexStepDistance).forEach((z) => {
        const x = -offset + epsilon ;
        const xr = (x / vertexStepDistance) + offset;
        const zr = (z / vertexStepDistance) + offset;
        topPerimeter.push([x, yFunc(xr, zr), z]);
        bottomPerimeter.push([x, floorHeight, z]);
        topPerimeterColor.push(colorFunc( yFunc(xr, zr) ));
        bottomPerimeterColor.push(colorFunc( yFunc(xr, zr) ));
    });

    const pl = topPerimeter.length;

    const posVertices = [ ...topPerimeter, ...bottomPerimeter ];
    const colorVertices = [ ...topPerimeterColor, ...bottomPerimeterColor ];
    const indices = [];


    _.range(0, pl, 1).forEach((i) => {
        const a = i;
        const b = a + pl;
        const d = (i + 1) % pl
        const c = d + pl;

        indices.push(a, c, b, a, d, c);
    });

    console.log(posVertices[0], posVertices[pl], posVertices[pl+1]);

    return [ posVertices, colorVertices, indices ];
}


const MeshUtils = {
    GenerateSquarePlaneTriangleMesh,
    GenerateEdgeTriangleMesh,
}

export default MeshUtils;