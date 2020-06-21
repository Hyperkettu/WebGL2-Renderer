import { Submesh } from './submesh';
import { Vertex } from './vertex';
import { SceneNodeData } from './meshmanager';

export class Mesh {

    constructor(name: string) {
        this.name = name;
        this.submeshes = {};
    }

    createSubmesh(gl: WebGL2RenderingContext, submeshName: string, vertices: Vertex[], indices: number[], materialId: string) {
        const submesh = new Submesh(gl, vertices,indices);
        submesh.materialID = materialId ? materialId : 'default-material-id';
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
    submeshes: { [name: string]: Submesh };
}