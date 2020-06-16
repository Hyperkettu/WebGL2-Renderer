import { Vertex } from './vertex';
import { VertexBuffer } from './vertexbuffer';
import { IndexBuffer } from './indexbuffer';

export class VertexArrayObject {

	constructor(gl: WebGL2RenderingContext, vertices: Vertex[], indices: number[]) {
		this.createVertexArrayObject(gl, vertices, indices);
	}

	createVertexArrayObject(gl: WebGL2RenderingContext, vertices: Vertex[], indices: number[]) {
		this.vao = gl.createVertexArray();
		gl.bindVertexArray(this.vao);
		this.vertexBuffer = new VertexBuffer(gl, vertices);
		this.indexBuffer = new IndexBuffer(gl, indices);
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

	vertexBuffer: VertexBuffer;
	indexBuffer: IndexBuffer;
}