import { mat4, mat3 } from 'gl-matrix';
import * as sprite from './sprite';
import { SceneGraph } from './scenegraph';

//import * as test from './bruteforcetest';
import * as test from './matrixprecalctest';
//import * as test from './gputest';

export let projectionMatrix: mat4 = mat4.create();

export let world: SceneGraph = null;

let numDrawCalls: number = 0;

export function increaseDrawCalls() {
	numDrawCalls++;
}

export function resetCounter() {
	numDrawCalls = 0;
}

export function setProjection() {
	mat4.ortho(projectionMatrix, 0.0, window.innerWidth, window.innerHeight, 0.0, -1.0, 1.0);
}

interface Application {
	gl: WebGLRenderingContext;
	program: WebGLProgram;
}

function createCanvas() {
	const canvas = document.createElement('canvas');
	canvas.style.position = 'absolute';
	canvas.style.left = '0px';
	canvas.style.top = '0px';
	canvas.style.border = '0px';
	canvas.style.padding = '0px';
	canvas.style.margin = '0px';
	canvas.style.width = '100%';
	canvas.style.height = '100%';
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	return canvas;
}

function createShaderProgram(gl: WebGLRenderingContext) {
	function loadShader(type: number, source: string) {
		const shader = gl.createShader(type);

		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error(`Shader compile failed: ${gl.getShaderInfoLog(shader)}`);
		}

		return shader;
	}

	const vertexShader = loadShader(gl.VERTEX_SHADER, test.vsSource);
	const fragmentShader = loadShader(gl.FRAGMENT_SHADER, test.fsSource);

	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		throw new Error(`Shader program link failed: ${gl.getProgramInfoLog(shaderProgram)}`);
	}

	return shaderProgram;
}

function loadTexture(gl: WebGLRenderingContext, url: string) {

	const textureId = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, textureId);
	const level = 0;
	const internalFormat = gl.RGBA;
	const srcFormat = gl.RGBA;
	const border = 0;
	const width = 1;
	const height = 1;
	const srcType = gl.UNSIGNED_BYTE;
	const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
	gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
		width, height, border, srcFormat, srcType,
		pixel);

	const image = new Image();
	image.onload = function () {
		gl.bindTexture(gl.TEXTURE_2D, textureId);
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
			srcFormat, srcType, image);

		gl.generateMipmap(gl.TEXTURE_2D);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	};
	image.src = url;

	return textureId;
}

let fps = 0;
let seconds = 1;

let texture: WebGLTexture;
let texture2: WebGLTexture;

function initWorld() {
	world = new SceneGraph();

	const spriteGridX = 128;
	const spriteGridY = 128;

	/*for (let j = 0; j < spriteGridY; j++) {
		for (let i = 0; i < spriteGridX; i++) {
			const s = sprite.createSprite({ x: i * 16, y: j * 16 });
			world.root.addChild(s);
		}
	}*/
	const spriteLevel1 = sprite.createSprite({ x: 200, y: 200 });
	world.root.addChild(spriteLevel1);
	const spriteLevel2 = sprite.createSprite({ x: 16, y: 0 });
	spriteLevel1.addChild(spriteLevel2);
	//	spriteLevel2.setRotation(45 * Math.PI / 180);
}

export async function main() {
	const canvas = createCanvas();
	document.body.appendChild(canvas);

	const gl = canvas.getContext('webgl');
	const program = createShaderProgram(gl);

	initWorld();

	test.init(gl, world);

	texture = loadTexture(gl, 'images/image.png');
	gl.bindTexture(gl.TEXTURE_2D, null);

	texture2 = loadTexture(gl, 'images/image2.png');
	gl.bindTexture(gl.TEXTURE_2D, null);

	const app: Application = { gl, program };

	requestAnimationFrame(function frame(time) {
		loop(app, time);
		requestAnimationFrame(frame);
	});
}

export function loop(app: Application, time: number) {
	resetCounter();

	const { gl, program } = app;

	gl.clearDepth(1);
	gl.clearColor(0.75, 0.75, 0.75, 1);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.ALWAYS);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// todo: handle context resize too
	setProjection();

	test.draw(gl, program, texture);

	fps++;
	if (time * 0.001 >= seconds) {
		console.log('fps', fps);
		console.log('numDrawCalls', numDrawCalls);
		seconds++;
		fps = 0;
	}
}
