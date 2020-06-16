import { Vertex, toFloat32Array, ParticleVertex } from './vertex';

export class VertexBuffer {

	constructor(gl: WebGL2RenderingContext, vertices: Vertex[]) {
		this.createBuffer(gl, vertices);
	}

	private createBuffer(gl: WebGL2RenderingContext, vertices: Vertex[]) {
		this.vertexBuffer = gl.createBuffer();
		const floatArray = toFloat32Array(vertices);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.STATIC_DRAW);
		let size = 3;          // n components per iteration
		const type = gl.FLOAT;   // the data is 32bit floats
		const normalize = false; // don't normalize the data
		let stride = 4 * 11;        // 0 = move forward size * sizeof(type) each iteration to get the next position
		let offset = 0;        // start at the beginning of the buffer

		// set position data
		gl.vertexAttribPointer(
			0, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(0);

		// set normal data
		offset = 3 * 4;
		size = 3;
		gl.vertexAttribPointer(
			1, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(1);

		// set texture coordinate data
		offset = 6 * 4;
		size = 2;
		gl.vertexAttribPointer(
			2, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(2);

		// set tangent data
		offset = 8 * 4;
		size = 3;
		gl.vertexAttribPointer(
			3, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(3);

	}

	static createParticleBuffer(gl: WebGL2RenderingContext, vertices: Float32Array, buffer?: WebGLBuffer, divisor: boolean = false) {

		const vertexBuffer = buffer ? buffer : gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
		let size = 3;          // n components per iteration
		const type = gl.FLOAT;   // the data is 32bit floats
		const normalize = false; // don't normalize the data
		let stride = 4 * 8;        // 0 = move forward size * sizeof(type) each iteration to get the next position
		let offset = 0;        // start at the beginning of the buffer

		// set position data
		gl.vertexAttribPointer(
			0, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(0);

		if (divisor) {
			gl.vertexAttribDivisor(0, 1);
		}

		// set velocity data
		offset = 3 * 4;
		size = 3;
		gl.vertexAttribPointer(
			1, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(1);

		if (divisor) {
			gl.vertexAttribDivisor(1, 1);
		}

		// set age data
		offset = 6 * 4;
		size = 1;
		gl.vertexAttribPointer(
			2, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(2);

		if (divisor) {
			gl.vertexAttribDivisor(2, 1);
		}

		// set life data
		offset = 7 * 4;
		size = 1;
		gl.vertexAttribPointer(
			3, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(3);

		if (divisor) {
			gl.vertexAttribDivisor(3, 1);
		}

		return vertexBuffer;
	}

	static createRenderParticleBuffer(gl: WebGL2RenderingContext, vertices: Float32Array) {
		const vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		let size = 3;          // n components per iteration
		const type = gl.FLOAT;   // the data is 32bit floats
		const normalize = false; // don't normalize the data
		let stride = 4 * 7;        // 0 = move forward size * sizeof(type) each iteration to get the next position
		let offset = 0;        // start at the beginning of the buffer

		// set position data
		gl.vertexAttribPointer(
			4, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(4);

		// set texCoords data
		offset = 3 * 4;
		size = 2;
		gl.vertexAttribPointer(
			5, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(5);

		// set size data
		offset = 5 * 4;
		size = 2;
		gl.vertexAttribPointer(
			6, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(6);

		/*// set life data
		offset = 8 * 4;
		size = 2;
		gl.vertexAttribPointer(
			3, size, type, normalize, stride, offset);
		gl.enableVertexAttribArray(3);*/

		return vertexBuffer;
	}

	static GenerateVertexBufferForScreen(gl: WebGL2RenderingContext, vertices: Float32Array) {

		const quadVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		const stride = 5 * 4;
		let offset = 0;
		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, offset);
		gl.enableVertexAttribArray(1);
		offset = 3 * 4;
		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, offset);
		return quadVBO;
	}

	static GenerateVertexBufferForSkybox(gl: WebGL2RenderingContext, vertices: Float32Array) {

		const cubeVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVBO);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		const stride = 3 * 4;
		let offset = 0;
		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, offset);

		return cubeVBO;
	}

	vertexBuffer: WebGLBuffer;
}