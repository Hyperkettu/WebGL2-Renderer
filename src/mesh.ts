import { Submesh } from './submesh';
import { Vertex, MorphVertex } from './vertex';
import { VertexDataType } from './vertexbuffer';
import * as math from './util/math';
import { ShaderMode } from './glrenderer';
import { ShaderType } from './shader';

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

export class MorphedSubmesh extends Submesh<MorphVertex> {
    constructor(gl: WebGL2RenderingContext, vertices: MorphVertex[], indices: number[], numMorphTargets: number, 
        type?: VertexDataType) {
        super(gl, vertices, indices, VertexDataType.MORPHED_VERTEX);
        this.weights = [];
        this.numMorphTargets = numMorphTargets;
        this.weights.push(0);
        
        for(let index = 1; index < numMorphTargets; index++) {
            this.weights.push(0);
        }

        this.shaderModes = [];
		this.shaderModes[ShaderMode.DEFAULT] = { shader: null, tech: 'default' };
		this.shaderModes[ShaderMode.NORMAL] = { shader: ShaderType.VISUALIZE_NORMALS_MOPRHED, tech: 'Vis' };
		this.shaderModes[ShaderMode.NORMAL_MAP] = { shader: ShaderType.VISUALIZE_NORMALS_MOPRHED, tech: 'VisN' };
    }

    update(gl: WebGL2RenderingContext, dt: number) {
     //   this.weights[0] -= 0.05 * dt;
      //  this.weights[0] = math.clamp(this.weights[0], 0, 1);
    }

    weights: number[];
    numMorphTargets: number;
}