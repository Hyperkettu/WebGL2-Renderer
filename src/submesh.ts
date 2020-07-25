import { VertexArrayObject } from './vertexarrayobject';
import { Vertex, PositionVertexType } from './vertex';
import { Triangle } from './triangle';
import { VertexDataType } from './vertexbuffer';
import { VertexData } from './meshmanager';
import { ShaderMode, Renderer, ShadowPass } from './glrenderer';
import { ShaderType } from './shader';
import { Batch } from './batchrenderer';
import { ConstantBuffers, BufferDirtyFlag } from './constantbuffers';
import { BoundingVolume } from './util/bvh/boundingvolume';
import { BBSphere } from './util/bvh/boundingvolumesphere';

export class Submesh<VertexType> {

	constructor(gl: WebGL2RenderingContext, vertices: VertexType[], indices: number[], type: VertexDataType) {
		this.vertices = vertices;
		this.indices = indices;
		this.createMesh(gl, vertices, indices, type);

		this.shaderModes = [];
		this.shaderModes[ShaderMode.DEFAULT] = { shader: null, tech: 'default' };
		this.shaderModes[ShaderMode.NORMAL] = { shader: ShaderType.VISUALIZE_NORMALS, tech: 'Vis' };
		this.shaderModes[ShaderMode.NORMAL_MAP] = { shader: ShaderType.VISUALIZE_NORMALS, tech: 'VisN' };
	
		this.shadowMapShaders = [
			ShaderType.SHADOW_MAP,
			ShaderType.DIR_LIGHT_SHADOW_MAP
		];

		this.wireFrame = false;
		this.renderBoundingVolume = false;

		this.displacementFactor = 0;
		this.pointLightIndex = -1;
	}
	
	getShadowMapShader(pass: ShadowPass) {
		return this.shadowMapShaders[pass];
	}

	addBoundingVolume(gl: WebGL2RenderingContext) {
		this.boundingVolume = new BBSphere(gl, this.vertices as unknown as PositionVertexType[]);
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

	updateConstantBuffers(renderer: Renderer, batch: Batch) {
		ConstantBuffers.world = batch.world;
		ConstantBuffers.displacementFactor = batch.submesh.displacementFactor;
		ConstantBuffers.pointLightIndex = batch.submesh.pointLightIndex;
		ConstantBuffers.UpdateBuffer(BufferDirtyFlag.PER_OBJECT, renderer.shader);
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

	boundingVolume: BBSphere;
	renderBoundingVolume: boolean;

	shaderModes: { shader: ShaderType, tech: string }[];

	wireFrame: boolean;

	displacementFactor: number;
	pointLightIndex: number;

	shadowMapShaders: ShaderType[];

}