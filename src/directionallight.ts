import { Light } from './light';
import { vec3 } from 'gl-matrix';

export class DirectionalLight extends Light {
	constructor(color: vec3, direction: vec3, intensity = 1.0) {
		super(color, intensity);
		this.direction = direction;
	}
	direction: vec3;
}