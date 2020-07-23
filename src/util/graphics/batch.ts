import { SceneNode } from "../../scenenode";
import { Vertex } from "../../vertex";
import { SceneGraph } from "../../scenegraph";
import { vec3, vec4, vec2 } from "gl-matrix";
import { MeshComponent } from "../../meshcomponent";
import { StaticMesh } from "../../mesh";


export function createBatch(gl: WebGL2RenderingContext, node: SceneNode, meshName: string, submeshName: string, materialId: string) {

    const vertices: Vertex[] = [];

    const sceneGraph = new SceneGraph();
    sceneGraph.root.addChild(node);
    sceneGraph.updateGraph(0);

    const newPosition = vec3.create();
    const newNormal = vec4.create();
    const newTangent = vec4.create();

    const indices: number[] = [];
    let offset = 0;

    sceneGraph.forEach(node => {

        if(node !== sceneGraph.root) {
            const transform = node.transform;
            const submesh = (node.getComponent('meshComponent') as MeshComponent<Vertex>).mesh;

            if(submesh) {
                for(let vertex of submesh.vertices) {
                    vec3.transformMat4(newPosition, vertex.position, transform.world);
                    vec4.transformMat4(newNormal, vec4.fromValues(vertex.normal[0], vertex.normal[1], vertex.normal[2], 0), transform.world);
                    vec4.transformMat4(newTangent, vec4.fromValues(vertex.tangent[0], vertex.tangent[1], vertex.tangent[2], 0), transform.world);

                    const newVertex = new Vertex();
                    newVertex.position = vec3.fromValues(newPosition[0], newPosition[1], newPosition[2]);
                    newVertex.normal = vec3.fromValues(newNormal[0], newNormal[1], newNormal[2]);
                    newVertex.tangent = vec3.fromValues(newTangent[0], newTangent[1], newTangent[2]);
                    newVertex.textureCoords = vec2.fromValues(vertex.textureCoords[0], vertex.textureCoords[1]);
                    vertices.push(newVertex);
                }

                for(let index of submesh.indices) {
                    indices.push(index + offset);
                }

                offset += submesh.vertices.length;
            }
        }
    });

    const staticMesh = new StaticMesh(meshName);
    staticMesh.createSubmesh(gl, submeshName, vertices, indices, materialId);

    return staticMesh;
}