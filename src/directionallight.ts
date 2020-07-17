import { Light } from './light';
import { vec3 } from 'gl-matrix';
import { DirLightShadowMap } from './dirlightshadowmap';

export class DirectionalLight extends Light {
	constructor(gl: WebGL2RenderingContext, color: vec3, direction: vec3, intensity = 1.0) {
		super(color, intensity);
		this.direction = direction;
		this.shadowMap = new DirLightShadowMap(gl, this.direction, 1024, 1024, 1.0, 50.0);
	}
	direction: vec3;

	shadowMap: DirLightShadowMap;
}