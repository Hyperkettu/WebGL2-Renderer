import { Texture } from './texture';
import { mat4, vec3 } from 'gl-matrix';
import { DepthTexture } from './depthtexture';
import * as resource from './resource';
import { UniformType } from './constantbuffers';

export enum ShaderType {
	PBR = 0,
	MORPHED_PBR,
	FILL_SCREEN,
	BRDF_INTEGRATION,
	SKYBOX,
	IRRADIANCE,
	PREFILTER_ENV_MAP,
	TONEMAPPING,
	GRAY_SCALE,
	BLOOM,
	SHARP_EDGES,
	GAUSSIAN_BLUR,
	VISUALIZE_DEPTH,
	SHADOW_MAP,
	VISUALIZE_CUBEMAP_DEPTH,
	VISUALIZE_NORMALS,
	VISUALIZE_NORMALS_TERRAIN,
	TERRAIN,
	PARTICLE_UPDATE,
	BILLBOARD_PARTICLE,
	OVERLAY,
	VISUALIZE_NORMALS_MOPRHED,
	MORPHED_PBR_TEXTURE_TRANSFORM,
	NUM_SHADERS
}

export class Shader {

	static uniformSamplers = [
		'albedoMap',
		'normalMap',
		'roughnessMap',
		'metallicMap',
		'aoMap',
		'displacementMap',
		'emissionMap'
	];

	constructor(type: ShaderType) {
		this.type = type;
		this.techniques = {};
	}

	addTechnique(gl: WebGL2RenderingContext, name: string, vsSrc: string, fsSrc: string, transformFeedbackVaryings?: string[]) {
		const tech = new ShaderTech(gl, vsSrc, fsSrc, name, transformFeedbackVaryings);
		this.techniques[name] = tech;
		return tech;
	}

	type: ShaderType;

	techniques: { [id: string]: ShaderTech };

}

export interface TechniqueFile {
	shaderId: number;
	shaders: ShaderData[];
	technique: TechniqueData;
}

export interface Pass {
	name: string;
	vertexShader: string;
	fragmentShader: string;  
}

export interface TechniqueData {
	name: string;
	permutationVariables: string[];
	passes: Pass[];
}

export interface ShaderData {
	type: 'vertexShader' | 'fragmentShader';
	uniforms: UniformData[]
	source: string;
}

export interface UniformData {
	name: string;
	type: UniformType | 'buffer';
	arraySize?: number; 
	bindIndex?: number;
	fields?: {
		name: string;
		type: UniformType;
	} [];
}

export class ShaderTech {

	constructor(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string, name: string, transformFeedbackVaryings?: string[]) {
		this.name = name;
		const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vsSrc);
		const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
		this.createProgram(gl, vertexShader, fragmentShader, transformFeedbackVaryings);
	}

	createShader(gl: WebGL2RenderingContext, type: number, source: string) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (success) {
			return shader;
		}
		console.log(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
	}

	createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader, transformFeedbackVaryings?: string[]) {
		this.program = gl.createProgram();

		gl.attachShader(this.program, vertexShader);

		if (transformFeedbackVaryings) {
			gl.transformFeedbackVaryings(this.program, transformFeedbackVaryings, gl.INTERLEAVED_ATTRIBS);
		}

		gl.attachShader(this.program, fragmentShader);
		gl.linkProgram(this.program);
		const success = gl.getProgramParameter(this.program, gl.LINK_STATUS);
		if (success) {
			return;
		}
		console.log(gl.getProgramInfoLog(this.program));
		gl.deleteProgram(this.program);
		this.program = null;
	}

	setSamplerTexture(gl: WebGL2RenderingContext, samplerName: string, texture: Texture | DepthTexture, textureUnit: number) {
		gl.activeTexture(gl.TEXTURE0 + textureUnit);
		if (!texture) {
			gl.bindTexture(gl.TEXTURE_2D, null);
		} else {
			if (texture.isCubeMap) {
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture.textureId);
			} else {
				gl.bindTexture(gl.TEXTURE_2D, texture.textureId);

			}
		}
		gl.uniform1i(gl.getUniformLocation(this.program, samplerName), textureUnit);
	}

	setSamplerTextureArray(gl: WebGL2RenderingContext, samplerName: string, texture: Texture | DepthTexture, textureUnit: number) {
		gl.activeTexture(gl.TEXTURE0 + textureUnit);
		if (!texture) {
			gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
		} else {
			gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture.textureId);
		}
		gl.uniform1i(gl.getUniformLocation(this.program, samplerName), textureUnit);
	}

	bindTo(gl: WebGL2RenderingContext, uniformBufferName: string, bindingPoint: number) {
		const blockIndex = gl.getUniformBlockIndex(this.program, uniformBufferName);
		gl.uniformBlockBinding(this.program, blockIndex, bindingPoint);
	}

	setMat4(gl: WebGL2RenderingContext, name: string, matrix: mat4) {
		gl.uniformMatrix4fv(gl.getUniformLocation(this.program, name), false, matrix);
	}

	setBool(gl: WebGL2RenderingContext, name: string, value: boolean) {
		gl.uniform1i(gl.getUniformLocation(this.program, name), value ? 1 : 0);
	}

	setInt(gl: WebGL2RenderingContext, name: string, value: number) {
		gl.uniform1i(gl.getUniformLocation(this.program, name), value);
	}

	setFloat(gl: WebGL2RenderingContext, name: string, value: number) {
		gl.uniform1f(gl.getUniformLocation(this.program, name), value);
	}

	setVec3(gl: WebGL2RenderingContext, name: string, value: vec3) {
		gl.uniform3fv(gl.getUniformLocation(this.program, name), value);
	}

	use(gl: WebGL2RenderingContext) {
		gl.useProgram(this.program);
	}

	/**
	 * Has always albedo map, the other textures are voluntary
	 *
	 * Technique names like this:
	 * albedo - normal - roughness - metallic - ao -displacement - emission ->  ANRMADE
	 */
	static permutePBRShaders() {

		const techs: string[] = [];

		for (let emission = 0; emission < 2; emission++) {
			for (let displacement = 0; displacement < 2; displacement++) {
				for (let ao = 0; ao < 2; ao++) {
					for (let metallic = 0; metallic < 2; metallic++) {
						for (let roughness = 0; roughness < 2; roughness++) {
							for (let normal = 0; normal < 2; normal++) {
								let techName = 'A';

								if (normal === 1) {
									techName += 'N';
								}
								if (roughness === 1) {
									techName += 'R';
								}
								if (metallic === 1) {
									techName += 'M';
								}
								if (ao === 1) {
									techName += 'A';
								}
								if (displacement === 1) {
									techName += 'D';
								}
								if (emission === 1) {
									techName += 'E';
								}

								techs.push(techName);
							}
						}
					}
				}
			}
		}
		return techs;
	}

	vertexShaderData: ShaderData;
	fragmentShaderData: ShaderData;
	program: WebGLProgram;
	dirtyFlags: number;
	name: string;

}