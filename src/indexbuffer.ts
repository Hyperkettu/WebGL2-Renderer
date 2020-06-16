export class IndexBuffer {

	constructor(gl: WebGL2RenderingContext, indices: number[]) {
		this.createBuffer(gl, indices);
	}

	createBuffer(gl: WebGL2RenderingContext, indices: number[]) {
		this.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	}

	indexBuffer: WebGLBuffer;
}