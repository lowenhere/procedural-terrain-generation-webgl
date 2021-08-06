function GenerateSquarePlaneTriangleMesh(width=10, yFunc=(x,z)=>0, colorFunc=(y)=>[Math.random(), Math.random(), Math.random()], vertexStepDistance=1) {
    let vertices = []; 
    let indices = [];
    let height = width;

    let offsetX = width/2;
    let offsetZ = height/2;

    for(let z=0; z<height; z++) {
        for(let x=0; x<width; x++) {
            let y = yFunc(x, z);
            let vertexColor = colorFunc(y);

            let index = (x+z*width);
            vertices = [...vertices, (x-offsetX)*vertexStepDistance, y, (z-offsetZ)*vertexStepDistance, ...vertexColor];            
            if(x < width-1 && z < height-1) {
                //|*
                //|  *
                //|    *
                let triangle1Vertices = [index, index+width, index+width+1];
                //*    |
                //  *  |
                //    *|
                let triangle2Vertices = [index, index+width+1, index+1];
                indices = [...indices, ...triangle1Vertices, ...triangle2Vertices];
            }
        }
    }

    return [vertices, indices]
}


const MeshUtils = {
    GenerateSquarePlaneTriangleMesh
}

export default MeshUtils;