import { Vertex, toFloat32Array } from './vertex';
import { VertexBuffer } from './vertexbuffer';
import { IndexBuffer } from './indexbuffer';

export class VertexArrayObject<VertexType> {

	constructor(gl: WebGL2RenderingContext, vertices: VertexType[], indices: number[]) {
		this.createVertexArrayObject(gl, vertices, indices);
	}

	createVertexArrayObject(gl: WebGL2RenderingContext, vertices: VertexType[], indices: number[]) {
		this.vao = gl.createVertexArray();
		gl.bindVertexArray(this.vao);
		this.vertexBuffer = new VertexBuffer<VertexType>(gl, vertices);
		this.indexBuffer = new IndexBuffer(gl, indices);
		gl.bindVertexArray(null);
	}

	updateVertices(gl: WebGL2RenderingContext, vertices: VertexType[]) {
		gl.bindVertexArray(this.vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer.vertexBuffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, toFloat32Array(vertices));
		gl.bindVertexArray(null);
	}

	static GenerateVertexArrayObjectForScreen(gl: WebGL2RenderingContext, screenVertices: Float32Array) {
		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);
		const vertexBuffer = VertexBuffer.GenerateVertexBufferForScreen(gl, screenVertices);
		gl.bindVertexArray(null);
		return { vertexArrayObject: vao, vertexBuffer };
	}

	static GenerateUnitCubeVertexArrayObject(gl: WebGL2RenderingContext, skyboxVertices: Float32Array) {
		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);
		const vertexBuffer = VertexBuffer.GenerateVertexBufferForSkybox(gl, skyboxVertices);
		gl.bindVertexArray(null);
		return { vertexArrayObject: vao, vertexBuffer };
	}

	static GenerateRenderParticleObject(gl: WebGL2RenderingContext, particleVertices: Float32Array, instanceBuffer: Float32Array, buffer: WebGLBuffer) {
		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);
		const particleInstanceBuffer = VertexBuffer.createParticleBuffer(gl, instanceBuffer, buffer, true);
		const vertexBuffer = VertexBuffer.createRenderParticleBuffer(gl, particleVertices);
		const indices: number[] = [
			0, 1, 2,
			0, 2, 3
		];
		const indexBuffer = new IndexBuffer(gl, indices);
		gl.bindVertexArray(null);
		return { vertexArrayObject: vao, vertexBuffer, indexBuffer, particleInstanceBuffer };
	}

	vao: WebGLVertexArrayObject;

	vertexBuffer: VertexBuffer<VertexType>;
	indexBuffer: IndexBuffer;
}