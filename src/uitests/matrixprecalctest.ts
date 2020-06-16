import { Sprite, createSprite } from './sprite';
import { vec2, mat3 } from 'gl-matrix';
import * as main from './main';
import { SceneGraph } from './scenegraph';
import { Container } from './container';
import { Transform } from './transform';

export const vsSource = `
	attribute vec2 aVertexPosition;
	attribute vec2 aTextureCoord;

	uniform mat4 uProjectionMatrix;

	varying highp vec2 vTextureCoord;

	void main() {
		gl_Position = uProjectionMatrix * vec4(aVertexPosition, 0.0, 1.0);
		vTextureCoord = aTextureCoord;
	}s
`;

export const fsSource = `

	varying highp vec2 vTextureCoord;

	uniform sampler2D uSampler;

	void main() {
		gl_FragColor = texture2D(uSampler, vTextureCoord); //vec4(1.0, 1.0, 1.0, 1.0);
	}
`;

export let sprites: Sprite[] = [];

let transformedPositions: Float32Array = null;
let vertexPositions: Float32Array = null;
let vertexTexCoords: Float32Array = null;

let vertexBuffer: {
	positions: WebGLBuffer;
	texCoords: WebGLBuffer;
	indices: WebGLBuffer;
};

function createDynamicBuffer(gl: WebGLRenderingContext, batchSize: number) {
	transformedPositions = new Float32Array(batchSize * 8);
	vertexPositions = new Float32Array(batchSize * 8);
	vertexTexCoords = new Float32Array(batchSize * 8);

	const positions = [
		0.0, 1.0,
		1.0, 1.0,
		0.0, 0.0,
		1.0, 0.0
	];

	const texCoords = [
		0.0, 1.0,
		1.0, 1.0,
		0.0, 0.0,
		1.0, 0.0
	];

	const indices: number[] = [];

	for (let i = 0; i < batchSize; i++) {
		for (let vertex = 0; vertex < 4; vertex++) {
			vertexPositions[i * 8 + vertex * 2 + 0] = positions[2 * vertex + 0];
			vertexPositions[i * 8 + vertex * 2 + 1] = positions[2 * vertex + 1];

			vertexTexCoords[i * 8 + vertex * 2 + 0] = texCoords[2 * vertex + 0];
			vertexTexCoords[i * 8 + vertex * 2 + 1] = texCoords[2 * vertex + 1];
		}

		indices.push(0 + 4 * i);
		indices.push(2 + 4 * i);
		indices.push(1 + 4 * i);

		indices.push(2 + 4 * i);
		indices.push(3 + 4 * i);
		indices.push(1 + 4 * i);
	}

	//indexBufferRaw = indices;

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertexPositions, gl.DYNAMIC_DRAW);

	const texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertexTexCoords, gl.STATIC_DRAW);

	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	return {
		positions: positionBuffer,
		texCoords: texCoordBuffer,
		indices: indexBuffer
	};
}

export function init(gl: WebGLRenderingContext, world: SceneGraph) {
	vertexBuffer = createDynamicBuffer(gl, 128 * 128);
}

function updateBuffer(gl: WebGLRenderingContext) {
	const model = mat3.create();
	const vecToTransform = vec2.create();

	for (let i = 0; i < sprites.length; i++) {
		const sprite = sprites[i];

		mat3.copy(model, Transform.IDENTITY);

		mat3.scale(
			model,
			model,
			sprite.size
		);

		mat3.multiply(model, sprite.worldTransform, model);

		for (let vertex = 0; vertex < 4; vertex++) {
			const offset = i * 8 + vertex * 2;
			vecToTransform[0] = vertexPositions[offset + 0];
			vecToTransform[1] = vertexPositions[offset + 1];
			vec2.transformMat3(vecToTransform, vecToTransform, model);
			transformedPositions[offset + 0] = vecToTransform[0];
			transformedPositions[offset + 1] = vecToTransform[1];
		}
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.positions);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, transformedPositions);
}

export function draw(gl: WebGLRenderingContext, program: WebGLProgram, texture: WebGLTexture) {

	sprites = [];

	main.world.forEach(node => {

		if (node.parent) {
			node.updateWorldTransform(node.parent);
		} else {
			node.update(0.16667);
			node.updateRootTransform();
		}

		if (node instanceof Sprite) {
			sprites.push(node);
		}
	});


	updateBuffer(gl);

	const numComponents = 2;  // pull out 2 values per iteration
	const type = gl.FLOAT;    // the data in the buffer is 32bit floats
	const normalize = false;  // don't normalize
	const stride = 0;         // how many bytes to get from one set of values to the next
	// 0 = use type and numComponents above
	const offset = 0;         // how many bytes inside the buffer to start from

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.positions);
	gl.vertexAttribPointer(
		gl.getAttribLocation(program, 'aVertexPosition'),
		numComponents,
		type,
		normalize,
		stride,
		offset
	);
	gl.enableVertexAttribArray(
		gl.getAttribLocation(program, 'aVertexPosition')
	);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.texCoords);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoord'),
		numComponents,
		type,
		normalize,
		stride,
		offset
	);
	gl.enableVertexAttribArray(
		gl.getAttribLocation(program, 'aTextureCoord')
	);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexBuffer.indices);

	gl.useProgram(program);

	// Tell WebGL we want to affect texture unit 0
	gl.activeTexture(gl.TEXTURE0);

	// Bind the texture to texture unit 0
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Tell the shader we bound the texture to texture unit 0
	gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0);

	gl.uniformMatrix4fv(
		gl.getUniformLocation(program, 'uProjectionMatrix'),
		false,
		main.projectionMatrix);

	gl.drawElements(gl.TRIANGLES, 6 * sprites.length, gl.UNSIGNED_SHORT, 0);
	main.increaseDrawCalls();
	console.log('matrixPreCalc, numSprites', sprites.length);
}