export class IndexBuffer {

	constructor(gl: WebGL2RenderingContext, indices: number[], usage: number = gl.STATIC_DRAW) {
		this.createBuffer(gl, indices, usage);
	}

	createBuffer(gl: WebGL2RenderingContext, indices: number[], usage: number = gl.STATIC_DRAW) {
		this.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), usage);
	}

	indexBuffer: WebGLBuffer;
}