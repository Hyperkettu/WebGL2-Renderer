import { VertexArrayObject } from './vertexarrayobject';
import { Vertex } from './vertex';
import { Triangle } from './triangle';

export class Submesh {

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

	updateVertices(gl: WebGL2RenderingContext, vertices: Vertex[]) {
		this.vertices = vertices;
		this.vertexArrayObject.updateVertices(gl, this.vertices);
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

	meshName: string;
	submeshName: string;

	vertexArrayObject: VertexArrayObject;
	vertices: Vertex[];
	indices: number[];
	materialID: string;

	wireFrame: boolean;

	displacementFactor: number;
	pointLightIndex: number;

}