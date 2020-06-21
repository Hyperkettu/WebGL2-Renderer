import { VertexArrayObject } from './vertexarrayobject';
import { Vertex, PositionVertexType } from './vertex';
import { Triangle } from './triangle';

export class Submesh<VertexType> {

	constructor(gl: WebGL2RenderingContext, vertices: VertexType[], indices: number[]) {
		this.vertices = vertices;
		this.indices = indices;
		this.createMesh(gl, vertices, indices);

		this.wireFrame = false;

		this.displacementFactor = 0;
		this.pointLightIndex = -1;
	}

	createMesh(gl: WebGL2RenderingContext, vertices: VertexType[], indices: number[]) {
		this.vertexArrayObject = new VertexArrayObject(gl, vertices, indices);
	}

	updateVertices(gl: WebGL2RenderingContext, vertices: VertexType[]) {
		this.vertices = vertices;
		this.vertexArrayObject.updateVertices(gl, this.vertices);
	}

	getTriangleCount() {
		return this.indices.length / 3;
	}

	getTriangle(index: number) {
		return new Triangle(
			(((this.vertices[this.indices[3 * index]]) as unknown) as PositionVertexType).position, 
			((this.vertices[ this.indices[3 * index + 1]]as unknown) as PositionVertexType).position, 
			((this.vertices[this.indices[3 * index + 2]]as unknown) as PositionVertexType).position);
	}

	meshName: string;
	submeshName: string;

	vertexArrayObject: VertexArrayObject<VertexType>;
	vertices: VertexType[];
	indices: number[];
	materialID: string;

	wireFrame: boolean;

	displacementFactor: number;
	pointLightIndex: number;

}