import { Submesh } from './submesh';
import { Vertex, MorphVertex } from './vertex';
import { VertexDataType } from './vertexbuffer';
import { MorphedSubmesh } from './morphedsubmesh';

export abstract class Mesh<VertexType> {

    constructor(name: string) {
        this.name = name;
        this.submeshes = {};
        this.type = VertexDataType.VERTEX;
    }

    createSubmesh(gl: WebGL2RenderingContext, submeshName: string, vertices: VertexType[], indices: number[], materialId: string) {
        const submesh = new Submesh(gl, vertices, indices, this.type);
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

    update(gl: WebGL2RenderingContext, dt: number) {}

    name: string;
    type: VertexDataType;
    submeshes: { [name: string]: Submesh<VertexType> };
}

export class StaticMesh extends Mesh<Vertex> {
    constructor(name: string) {
        super(name);
    }
}

export class MorphedMesh extends Mesh<MorphVertex> {
    constructor(name: string, numMorphTargets: number) {
        super(name);
        this.type = VertexDataType.MORPHED_VERTEX;
    }

    update(gl: WebGL2RenderingContext, dt: number) {

    }

    createSubmesh(gl: WebGL2RenderingContext, submeshName: string, vertices: MorphVertex[], indices: number[], materialId: string) {
        const submesh = new MorphedSubmesh(gl, vertices, indices, this.type);
        submesh.materialID = 'morphed-stone-with-displacement';
        submesh.submeshName = submeshName;
        submesh.meshName = this.name;
        this.submeshes[submeshName] = submesh;

    }
}