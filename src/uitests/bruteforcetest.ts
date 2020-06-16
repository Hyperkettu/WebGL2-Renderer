import { Sprite } from './sprite';
import * as main from './main';
import { mat3 } from 'gl-matrix';
import { SceneGraph } from './scenegraph';
import { Container } from './container';

export const vsSource = `
	attribute vec2 aVertexPosition;
	attribute vec2 aTextureCoord;

	uniform mat4 uProjectionMatrix;
	uniform vec4 uSizePivot;
	uniform vec3 uPositionRotation;

	varying highp vec2 vTextureCoord;

	mat3 translate(vec2 translation) {
		return mat3(
			vec3(1.0, 0.0, 0.0),
			vec3(0.0, 1.0, 0.0),
			vec3(translation.xy, 1.0));
	}

	mat3 rotateZ(float angle) {
		return mat3(
			vec3(cos(angle), sin(angle), 0),
            vec3(-sin(angle), cos(angle), 0),
			vec3(0, 0, 1));
	}

	mat3 scale(float scaleX, float scaleY) {
		return mat3(
			vec3(scaleX, 0, 0),
		  	vec3(0, scaleY, 0),
			vec3(0, 0, 1));
	}

	mat3 genModelMatrix(vec2 position, float rotation, vec2 size, vec2 pivot) {
		return translate(position) * rotateZ(rotation) * translate(-pivot) * scale(size.x, size.y);
	}

	void main() {
		mat3 model = genModelMatrix(uPositionRotation.xy, uPositionRotation.z, uSizePivot.xy, uSizePivot.zw);
		vec3 worldPos = model * vec3(aVertexPosition, 1.0);
		gl_Position = uProjectionMatrix * vec4(worldPos.xy, 0.0, 1.0);
		vTextureCoord = aTextureCoord;
	}
`;

export const fsSource = `

	varying highp vec2 vTextureCoord;

	uniform sampler2D uSampler;

	void main() {
		gl_FragColor =  texture2D(uSampler, vTextureCoord); //vec4(1.0, 1.0, 1.0, 1.0);
	}
`;

export const sprites: Sprite[] = [];

function createQuad(gl: WebGLRenderingContext) {
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

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	const texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

	return {
		positions: positionBuffer,
		texCoords: texCoordBuffer
	};
}

export function init(gl: WebGLRenderingContext, world: SceneGraph) {
	const quad = createQuad(gl);

	world.forEach((node: Container) => {
		if (node instanceof Sprite) {
			node.quad = quad;
			sprites.push(node);
		}

	});
}

export function draw(gl: WebGLRenderingContext, program: WebGLProgram, texture: WebGLTexture) {

	main.setProjection();

	vertexAttribLocation = gl.getAttribLocation(program, 'aVertexPosition');
	texCoordAttribLocation = gl.getAttribLocation(program, 'aTextureCoord');
	projectionUniform = gl.getUniformLocation(program, 'uProjectionMatrix');
	samplerUniformLocation = gl.getUniformLocation(program, 'uSampler');
	positionRotationUniformLocation = gl.getUniformLocation(program, 'uPositionRotation');
	sizePivotUniformLocation = gl.getUniformLocation(program, 'uSizePivot');

	const numComponents = 2;  // pull out 2 values per iteration
	const type = gl.FLOAT;    // the data in the buffer is 32bit floats
	const normalize = false;  // don't normalize
	const stride = 0;         // how many bytes to get from one set of values to the next
	// 0 = use type and numComponents above
	const offset = 0;         // how many bytes inside the buffer to start from

	gl.bindBuffer(gl.ARRAY_BUFFER, sprites[0].quad.positions);
	gl.vertexAttribPointer(
		vertexAttribLocation,
		numComponents,
		type,
		normalize,
		stride,
		offset
	);
	gl.enableVertexAttribArray(
		vertexAttribLocation
	);

	gl.useProgram(program);

	// Tell WebGL we want to affect texture unit 0
	gl.activeTexture(gl.TEXTURE0);

	// Bind the texture to texture unit 0
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Tell the shader we bound the texture to texture unit 0
	gl.uniform1i(samplerUniformLocation, 0);

	main.world.root.children.forEach(sprite => {
		drawSpriteBruteForce(gl, sprite as Sprite, program, texture);
	});
	//	console.log('bruteforce, numSprites:', sprites.length);
}

let texCoordAttribLocation: number = 0;
let vertexAttribLocation: number = 0;
let projectionUniform: WebGLUniformLocation = null;
let samplerUniformLocation: WebGLUniformLocation = null;
let positionRotationUniformLocation: WebGLUniformLocation = null;
let sizePivotUniformLocation: WebGLUniformLocation = null;

export function drawSpriteBruteForce(gl: WebGLRenderingContext, sprite: Sprite, program: WebGLProgram, texture: WebGLTexture) {

	const numComponents = 2;  // pull out 2 values per iteration
	const type = gl.FLOAT;    // the data in the buffer is 32bit floats
	const normalize = false;  // don't normalize
	const stride = 0;         // how many bytes to get from one set of values to the next
	// 0 = use type and numComponents above
	const offset = 0;         // how many bytes inside the buffer to start from

	gl.bindBuffer(gl.ARRAY_BUFFER, sprite.quad.texCoords);
	gl.vertexAttribPointer(texCoordAttribLocation,
		numComponents,
		type,
		normalize,
		stride,
		offset
	);
	gl.enableVertexAttribArray(
		texCoordAttribLocation
	);

	gl.uniformMatrix4fv(
		projectionUniform,
		false,
		main.projectionMatrix);

	gl.uniform3f(positionRotationUniformLocation, sprite.position[0], sprite.position[1], sprite.rotation);
	gl.uniform4f(sizePivotUniformLocation, sprite.size[0], sprite.size[1], sprite.pivot[0], sprite.pivot[1]);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	main.increaseDrawCalls();
}