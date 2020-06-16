import { vec3 } from 'gl-matrix';

export abstract class Light {
	constructor(color: vec3, intensity) {
		this.color = color;
		this.intensity = intensity;
	}

	color: vec3;
	intensity: number;
}