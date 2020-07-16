import { vec3 } from 'gl-matrix';
import { Light } from './light';
import { PointLightShadowMap } from './pointlightshadowmap';

export class PointLight extends Light {

	static NUM_LIGHTS = 1;

	constructor(gl: WebGL2RenderingContext, position: vec3, color: vec3, intensity: number, radius: number) {
		super(color, intensity);
		this.localPosition = vec3.fromValues(position[0], position[1], position[2]);
		this.position = position;
		this.radius = radius;
		this.shadowMap = new PointLightShadowMap(gl, 512, 512, this.position, this.radius);

	}

	setPosition(x: number, y: number, z: number) {
		this.position = vec3.fromValues(x, y, z);
		this.shadowMap.position = this.position;
	}

	changeRadius(velocity: number, dt: number) {
		this.radius += velocity * dt;
		if (this.radius < 0) {
			this.radius = 0;
		}

		this.shadowMap.setRadius(this.radius);
	}

	localPosition: vec3;
	position: vec3;
	radius: number; // falloff = (clamp10(1 - (distance / lightRadius )^4)^2) / distance * distance + 1
	shadowMap: PointLightShadowMap;
}