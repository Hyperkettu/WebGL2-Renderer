import { VertexArrayObject } from './vertexarrayobject';
import { Vertex } from './vertex';
import { Material } from './material';
import { ShaderType } from './shader';
import { Texture, TextureType } from './texture';
import { Triangle } from './triangle';

export class Mesh {

	constructor(gl: WebGL2RenderingContext, vertices: Vertex[], indices: number[]) {
		this.vertices = vertices;
		this.indices = indices;
		this.createMesh(gl, vertices, indices);

		this.wireFrame = false;

		this.displacementFactor = 0;
		this.pointLightIndex = -1;
	}

	createMesh(gl: WebGL2RenderingContext, vertices: Vertex[], indices: number[]) {
		this.vertexArrayObject = new VertexArrayObject(gl, vertices, indices);
	}

	getTriangleCount() {
		return this.indices.length / 3;
	}

	getTriangle(index: number) {
		return new Triangle(
			this.vertices[this.indices[3 * index]].position, 
			this.vertices[ this.indices[3 * index + 1]].position, 
			this.vertices[this.indices[3 * index + 2]].position);
	}

	vertexArrayObject: VertexArrayObject;
	vertices: Vertex[];
	indices: number[];
	materialID: string;

	wireFrame: boolean;

	displacementFactor: number;
	pointLightIndex: number;

}