import * as main from './main';
import { mat4 } from 'gl-matrix';
import { Sprite } from './sprite';
import { SceneGraph } from './scenegraph';
import { Container } from './container';

export const vsSource = `
	attribute vec3 aVertexPositionRotation;
	attribute vec4 aTextureCoordSpritePosition;
	attribute vec4 aSpriteSizePivot;

	uniform mat4 uProjectionMatrix;
	uniform mat4 uViewMatrix;

	varying highp vec2 vTextureCoord;

	mat4 translate(vec2 translation) {
		vec4 c0 = vec4(1.0, 0.0, 0.0, 0.0);
		vec4 c1 = vec4(0.0, 1.0, 0.0, 0.0);
		vec4 c2 = vec4(0.0, 0.0, 1.0, 0.0);
		vec4 c3 = vec4(translation.xy, 0.0, 1.0);
		return mat4(c0, c1, c2, c3);
	}

	mat4 rotateZ(float angle) {
		return mat4(
			vec4(cos(angle), sin(angle), 0, 0),
            vec4(-sin(angle), cos(angle), 0, 0),
            vec4(0, 0, 1, 0),
			vec4(0.0, 0.0, 0.0, 1));
	}

	mat4 scale(float scaleX, float scaleY) {
		return mat4(
			vec4(scaleX, 0, 0, 0),
		  	vec4(0, scaleY, 0, 0),
			vec4(0, 0, 1, 0),
			vec4(0.0, 0.0, 0.0, 1));
	}

	mat4 genModelMatrix(vec2 position, float rotation, vec2 size, vec2 pivot) {
		return translate(position) * translate(pivot) * rotateZ(rotation) * translate(-pivot) * scale(size.x, size.y);
	}

	void main() {

		mat4 modelMatrix = genModelMatrix(aTextureCoordSpritePosition.zw, aVertexPositionRotation.z,
			aSpriteSizePivot.xy, aSpriteSizePivot.zw);
		gl_Position = uProjectionMatrix * uViewMatrix * modelMatrix * vec4(aVertexPositionRotation.xy, 0.0, 1.0);
		vTextureCoord = aTextureCoordSpritePosition.xy;
	}

`;

export const fsSource = `

	varying highp vec2 vTextureCoord;

	uniform sampler2D uSampler;

	void main() {
		gl_FragColor = texture2D(uSampler, vTextureCoord); //vec4(1.0, 1.0, 1.0, 1.0);
	}
`;

let positionsBuffer: number[] = [];
let allSprites: Sprite[] = [];

function createBuffers(gl: WebGLRenderingContext, sprites: Sprite[]) {

	const positions = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0,
		1.0, 1.0
	];

	const indices = [
		//	0, 2, 1,
		//		1, 3, 2
	];

	const texCoords = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0,
		1.0, 1.0
	];

	const vertexTexCoords: number[] = [];
	const spriteSizePivots: number[] = [];

	for (let i = 0; i < sprites.length; i++) {
		for (let vertex = 0; vertex < 4; vertex++) {
			positionsBuffer.push(positions[2 * vertex]);
			positionsBuffer.push(positions[2 * vertex + 1]);
			positionsBuffer.push(sprites[i].rotation);

			vertexTexCoords.push(texCoords[2 * vertex]);
			vertexTexCoords.push(texCoords[2 * vertex + 1]);
			vertexTexCoords.push(sprites[i].position[0]);
			vertexTexCoords.push(sprites[i].position[1]);

			spriteSizePivots.push(sprites[i].size[0]);
			spriteSizePivots.push(sprites[i].size[1]);
			spriteSizePivots.push(sprites[i].pivot[0]);
			spriteSizePivots.push(sprites[i].pivot[1]);
		}

		indices.push(0 + 4 * i);
		indices.push(2 + 4 * i);
		indices.push(1 + 4 * i);

		indices.push(1 + 4 * i);
		indices.push(3 + 4 * i);
		indices.push(2 + 4 * i);
	}

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionsBuffer), gl.STATIC_DRAW);

	const texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexTexCoords), gl.STATIC_DRAW);

	const spriteSizePivotBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, spriteSizePivotBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spriteSizePivots), gl.STATIC_DRAW);

	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	return {
		positionBuffer,
		texCoordBuffer,
		indexBuffer,
		spriteSizePivotBuffer
	};
}

let vertexPosRotateUpdateBuffer: Float32Array = null;
let texCoordSpritePosUpdateBuffer: Float32Array = null;
let sizePivotUpdateBuffer: Float32Array = null;

function updateBuffers(gl: WebGLRenderingContext, sprites: Sprite[]) {
	vertexPosRotateUpdateBuffer = vertexPosRotateUpdateBuffer || new Float32Array(sprites.length * 3);
	texCoordSpritePosUpdateBuffer = texCoordSpritePosUpdateBuffer || new Float32Array(sprites.length * 4);
	sizePivotUpdateBuffer = sizePivotUpdateBuffer || new Float32Array(sprites.length * 4);

	for (let i = 0; i < sprites.length; i++) {
		const sprite = sprites[i];

		const offsetVec3 = i * 4 * 3;
		const offsetVec4 = i * 4 * 4;

		for (let vertex = 0; vertex < 4; vertex++) {
			switch (vertex) {
				case 0:
					vertexPosRotateUpdateBuffer[offsetVec3 + 0] = 0;
					vertexPosRotateUpdateBuffer[offsetVec3 + 1] = 0;
					vertexPosRotateUpdateBuffer[offsetVec3 + 2] = sprite.rotation;
					texCoordSpritePosUpdateBuffer[offsetVec4 + 0] = 0;
					texCoordSpritePosUpdateBuffer[offsetVec4 + 1] = 0;
					texCoordSpritePosUpdateBuffer[offsetVec4 + 2] = sprite.position[0];
					texCoordSpritePosUpdateBuffer[offsetVec4 + 3] = sprite.position[1];
					break;

				case 1:
					vertexPosRotateUpdateBuffer[offsetVec3 + 3] = 1;
					vertexPosRotateUpdateBuffer[offsetVec3 + 4] = 0;
					vertexPosRotateUpdateBuffer[offsetVec3 + 5] = sprite.rotation;
					texCoordSpritePosUpdateBuffer[offsetVec4 + 4] = 1;
					texCoordSpritePosUpdateBuffer[offsetVec4 + 5] = 0;
					texCoordSpritePosUpdateBuffer[offsetVec4 + 6] = sprite.position[0];
					texCoordSpritePosUpdateBuffer[offsetVec4 + 7] = sprite.position[1];
					break;

				case 2:
					vertexPosRotateUpdateBuffer[offsetVec3 + 6] = 0;
					vertexPosRotateUpdateBuffer[offsetVec3 + 7] = 1;
					vertexPosRotateUpdateBuffer[offsetVec3 + 8] = sprite.rotation;
					texCoordSpritePosUpdateBuffer[offsetVec4 + 8] = 0;
					texCoordSpritePosUpdateBuffer[offsetVec4 + 9] = 1;
					texCoordSpritePosUpdateBuffer[offsetVec4 + 10] = sprite.position[0];
					texCoordSpritePosUpdateBuffer[offsetVec4 + 11] = sprite.position[1];
					break;

				case 3:
					vertexPosRotateUpdateBuffer[offsetVec3 + 9] = 1;
					vertexPosRotateUpdateBuffer[offsetVec3 + 10] = 1;
					vertexPosRotateUpdateBuffer[offsetVec3 + 11] = sprite.rotation;
					texCoordSpritePosUpdateBuffer[offsetVec4 + 12] = 1;
					texCoordSpritePosUpdateBuffer[offsetVec4 + 13] = 1;
					texCoordSpritePosUpdateBuffer[offsetVec4 + 14] = sprite.position[0];
					texCoordSpritePosUpdateBuffer[offsetVec4 + 15] = sprite.position[1];
					break;
			}

			sizePivotUpdateBuffer[offsetVec4 + vertex * 4 + 0] = sprite.size[0];
			sizePivotUpdateBuffer[offsetVec4 + vertex * 4 + 1] = sprite.size[1];
			sizePivotUpdateBuffer[offsetVec4 + vertex * 4 + 2] = sprite.pivot[0];
			sizePivotUpdateBuffer[offsetVec4 + vertex * 4 + 3] = sprite.pivot[1];
		}
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.positionBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexPosRotateUpdateBuffer);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.texCoordBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, texCoordSpritePosUpdateBuffer);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.spriteSizePivotBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, sizePivotUpdateBuffer);
}

let vertexBuffer: {
	positionBuffer: WebGLBuffer;
	texCoordBuffer: WebGLBuffer;
	indexBuffer: WebGLBuffer;
	spriteSizePivotBuffer: WebGLBuffer;
};

export function init(gl: WebGLRenderingContext, world: SceneGraph) {
	let sprites: Sprite[] = [];

	/*for (let j = 0; j < spriteGridY; j++) {
		for (let i = 0; i < spriteGridX; i++) {
			sprites.push(createSprite({ x: i * 16, y: j * 16 }));
		}
	}*/

	main.world.forEach((node: Container) => {
		if (node instanceof Sprite) {
			sprites.push(node);
		}
	});

	vertexBuffer = createBuffers(gl, sprites);
	allSprites = sprites;
}

export function draw(gl: WebGLRenderingContext, program: WebGLProgram, texture: WebGLTexture) {
	updateBuffers(gl, allSprites);

	main.setProjection();

	const numComponents = 2;  // pull out 2 values per iteration
	const type = gl.FLOAT;    // the data in the buffer is 32bit floats
	const normalize = false;  // don't normalize
	const stride = 0;         // how many bytes to get from one set of values to the next
	// 0 = use type and numComponents above
	const offset = 0;         // how many bytes inside the buffer to start from

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.positionBuffer);
	gl.vertexAttribPointer(
		gl.getAttribLocation(program, 'aVertexPositionRotation'),
		3,
		type,
		normalize,
		stride,
		offset
	);
	gl.enableVertexAttribArray(
		gl.getAttribLocation(program, 'aVertexPositionRotation')
	);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.texCoordBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoordSpritePosition'),
		4,
		type,
		normalize,
		stride,
		offset
	);
	gl.enableVertexAttribArray(
		gl.getAttribLocation(program, 'aTextureCoordSpritePosition')
	);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.spriteSizePivotBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aSpriteSizePivot'),
		4,
		type,
		normalize,
		stride,
		offset
	);
	gl.enableVertexAttribArray(
		gl.getAttribLocation(program, 'aSpriteSizePivot')
	);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexBuffer.indexBuffer);

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

	let view = mat4.create();

	mat4.lookAt(view, [0, 0, 0], [0, 0, -1], [0, 1, 0]);

	gl.uniformMatrix4fv(
		gl.getUniformLocation(program, 'uViewMatrix'),
		false,
		view
	);

	gl.drawElements(gl.TRIANGLES, 6 * allSprites.length, gl.UNSIGNED_SHORT, 0);
	main.increaseDrawCalls();
	console.log('GPU, numSprites', allSprites.length);
}
