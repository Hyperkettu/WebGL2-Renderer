import { vec2, mat3 } from 'gl-matrix';
import { Container } from './container';
import { Shader } from './shader';

interface Model {
	positions: WebGLBuffer;
	texCoords: WebGLBuffer;
}

export class Sprite extends Container {

	constructor() {
		super();
		this.size = vec2.fromValues(1, 1);

		this.tint = 0xFFFFFF;
		this.shader = null;
		this.texture = null;
	}

	setSize(width: number, height: number) {
		this.size = vec2.fromValues(width, height);
	}

	quad?: Model;
	size: vec2;
	tint: number;

	shader: Shader;
	texture: WebGLTexture;

}

export function createSprite(position: { x: number, y: number }, quad?: Model) {

	const sprite = new Sprite();
	sprite.setPosition(position.x, position.y);
	sprite.quad = quad;
	sprite.setRotation(0);
	sprite.setSize(16, 16);
	sprite.setPivot(8, 8);

	return sprite;
}
