import { VertexArrayObject } from './vertexarrayobject';
import { Vertex, PositionVertexType } from './vertex';
import { Triangle } from './triangle';
import { VertexDataType } from './vertexbuffer';
import { VertexData } from './meshmanager';
import { ShaderMode } from './glrenderer';
import { ShaderType } from './shader';

export class Submesh<VertexType> {

	constructor(gl: WebGL2RenderingContext, vertices: VertexType[], indices: number[], type: VertexDataType) {
		this.vertices = vertices;
		this.indices = indices;
		this.createMesh(gl, vertices, indices, type);

		this.shaderModes = [];
		this.shaderModes[ShaderMode.DEFAULT] = { shader: null, tech: 'default' };
		this.shaderModes[ShaderMode.NORMAL] = { shader: ShaderType.VISUALIZE_NORMALS, tech: 'Vis' };
		this.shaderModes[ShaderMode.NORMAL_MAP] = { shader: ShaderType.VISUALIZE_NORMALS, tech: 'VisN' };
	

		this.wireFrame = false;

		this.displacementFactor = 0;
		this.pointLightIndex = -1;
	}

	createMesh(gl: WebGL2RenderingContext, vertices: VertexType[], indices: number[], type: VertexDataType) {
		this.vertexArrayObject = new VertexArrayObject(gl, vertices, indices, type);
	}

	updateVertices(gl: WebGL2RenderingContext, vertices: VertexType[]) {
		this.vertices = vertices;
		this.vertexArrayObject.updateVertices(gl, this.vertices);
	}

	getTriangleCount() {
		return this.indices.length / 3;
	}

	update(gl: WebGL2RenderingContext, dt: number) {

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

	shaderModes: { shader: ShaderType, tech: string }[];

	wireFrame: boolean;

	displacementFactor: number;
	pointLightIndex: number;

}