import { Submesh } from './submesh';
import { Vertex } from './vertex';
import { SceneNodeData } from './meshmanager';

export abstract class Mesh<VertexType> {

    constructor(name: string) {
        this.name = name;
        this.submeshes = {};
    }

    createSubmesh(gl: WebGL2RenderingContext, submeshName: string, vertices: VertexType[], indices: number[], materialId: string) {
        const submesh = new Submesh(gl, vertices,indices);
        submesh.materialID = materialId ? materialId : 'default';
        submesh.submeshName = submeshName;
        submesh.meshName = this.name;
        this.submeshes[submeshName] = submesh;
    }

    getSubmesh(name: string) {
        return this.submeshes[name];
    }

    getSubmeshes() {
        return Object.values(this.submeshes);
    }

    name: string;
    submeshes: { [name: string]: Submesh<VertexType> };
}

export class StaticMesh extends Mesh<Vertex> {
    constructor(name: string) {
        super(name);
    }
}

export class MorphedMesh extends Mesh<Vertex> {

}