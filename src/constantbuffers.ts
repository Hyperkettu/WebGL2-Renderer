import { mat4, mat3, vec4, vec3, vec2 } from 'gl-matrix';
import { Shader, ShaderType, ShaderTech } from './shader';
import * as shader from './shadermanager';
import * as settings from './settings';
import * as texture from './texturemanager';
import { PointLight } from './pointlight';
import { Buffer } from 'buffer';

export enum BufferDirtyFlag {
	NONE = 0,
	PER_OBJECT = (1 << 0),
	PER_FRAME = (1 << 1),
	PER_SOME_OBJECTS = (1 << 2),
	SELDOM = (1 << 3)
}

export class ConstantBuffers {


	constructor() { }


	static Syncronize(gl: WebGL2RenderingContext, shader: ShaderType, tech: ShaderTech) {

		if (this.shaderDirtyFlags & BufferDirtyFlag.PER_OBJECT) {
			ConstantBuffers.SyncPerObject(gl);
		}
		if(this.shaderDirtyFlags & BufferDirtyFlag.PER_SOME_OBJECTS) {

		}
		if (this.shaderDirtyFlags & BufferDirtyFlag.PER_FRAME) {
			ConstantBuffers.SyncPerFrame(gl);
		}
		if (this.shaderDirtyFlags & BufferDirtyFlag.SELDOM) {
			ConstantBuffers.SyncSeldom(gl);
		}

		ConstantBuffers.shaderDirtyFlags = BufferDirtyFlag.NONE;

		if (tech.dirtyFlags & BufferDirtyFlag.PER_FRAME) {
			tech.setSamplerTexture(gl, 'prefilterMap', texture.GetTexture('prefilterMap'), 7);
			tech.setSamplerTexture(gl, 'irradianceMap', texture.GetTexture('irradianceMap'), 8);
			tech.setSamplerTexture(gl, 'brdfLUT', texture.GetTexture('brdfLUT'), 9);

			for (let index = 1; index <= PointLight.NUM_LIGHTS; index++) {
				tech.setSamplerTexture(gl, `pointLightShadowMap${index}`, texture.GetDepthTexture(`pointLightShadowMap${index}`), 10 + (index - 1));
			}

			tech.setSamplerTexture(gl, 'dirLightShadowMap', texture.GetDepthTexture('dirLightShadowMap'), 11);
		}
		tech.dirtyFlags = BufferDirtyFlag.NONE;
	}

	static SyncPerObject(gl: WebGL2RenderingContext) {

		ConstantBuffers.bufferPerObject.update(gl, 'world', ConstantBuffers.world);
		ConstantBuffers.bufferPerObject.update(gl, 'displacementFactor', ConstantBuffers.displacementFactor);
		ConstantBuffers.bufferPerObject.update(gl, 'pointLightIndex', ConstantBuffers.pointLightIndex);
		ConstantBuffers.bufferPerObject.sendToGPU(gl);
	}

	static SyncPerFrame(gl: WebGL2RenderingContext) {

		ConstantBuffers.matricesPerFrame.update(gl, 'projection', ConstantBuffers.projection);
		ConstantBuffers.matricesPerFrame.update(gl, 'view', ConstantBuffers.view);
		ConstantBuffers.matricesPerFrame.update(gl, 'lightSpaceMatrix', ConstantBuffers.lightSpaceMatrix);
		ConstantBuffers.matricesPerFrame.sendToGPU(gl);

		for (let index = 0; index < PointLight.NUM_LIGHTS; index++) {
			ConstantBuffers.lights.update(gl, `pointLights[${index}].position`, ConstantBuffers.pointLightPosition[index]);
			ConstantBuffers.lights.update(gl, `pointLights[${index}].color`, ConstantBuffers.pointLightColor[index]);
			ConstantBuffers.lights.update(gl, `pointLights[${index}].radius`, ConstantBuffers.pointLightRadius[index]);
			ConstantBuffers.lights.update(gl, `pointLights[${index}].near`, ConstantBuffers.pointLightNear[index]);
			ConstantBuffers.lights.update(gl, `pointLights[${index}].intensity`, ConstantBuffers.pointLightIntensity[index]);
		}

		ConstantBuffers.lights.update(gl, 'dirLight.direction', ConstantBuffers.dirLightDirection);
		ConstantBuffers.lights.update(gl, 'dirLight.color', ConstantBuffers.dirLightColor);
		// dirlight intensity is in dirlight's color's padding float variable named intensity whose offset is 3
		ConstantBuffers.lights.updateWithOffset('dirLight.color', 3, ConstantBuffers.dirLightIntensity);

		ConstantBuffers.lights.update(gl, 'eyePositionW', ConstantBuffers.eyePosition);

		ConstantBuffers.lights.sendToGPU(gl);
	}

	static SyncSeldom(gl: WebGL2RenderingContext) {
	}

	static UpdateBuffer(flags: BufferDirtyFlag, shaderType: ShaderType) {
		ConstantBuffers.shaderDirtyFlags |= flags;

		const techs = shader.GetShaderOfType(shaderType).techniques;
		for (let techName in techs) {
			techs[techName].dirtyFlags |= flags;
		}
	}

	static createUniformBuffers(gl: WebGL2RenderingContext) {
		ConstantBuffers.matricesPerFrame = new UniformBufferObject();
		ConstantBuffers.matricesPerFrame.addUniform('mat4', 'projection');
		ConstantBuffers.matricesPerFrame.addUniform('mat4', 'view');
		ConstantBuffers.matricesPerFrame.addUniform('mat4', 'lightSpaceMatrix');
		ConstantBuffers.matricesPerFrame.create(gl);
		ConstantBuffers.matricesPerFrame.bindTo(gl, 0);

		ConstantBuffers.bufferPerObject = new UniformBufferObject();
		ConstantBuffers.bufferPerObject.addUniform('mat4', 'world');
		ConstantBuffers.bufferPerObject.addUniform('float', 'displacementFactor');
		ConstantBuffers.bufferPerObject.addUniform('float', 'pointLightIndex');
		ConstantBuffers.bufferPerObject.create(gl);
		ConstantBuffers.bufferPerObject.bindTo(gl, 1);

		ConstantBuffers.lights = new UniformBufferObject();

		for (let index = 0; index < PointLight.NUM_LIGHTS; index++) {
			ConstantBuffers.lights.addUniform('vec3', `pointLights[${index}].color`);
			ConstantBuffers.lights.addUniform('vec3', `pointLights[${index}].position`);
			ConstantBuffers.lights.addUniform('float', `pointLights[${index}].near`);
			ConstantBuffers.lights.addUniform('float', `pointLights[${index}].radius`);
			ConstantBuffers.lights.addUniform('float', `pointLights[${index}].intensity`);
			ConstantBuffers.lights.addUniform('float', `pointLights[${index}].padding`);
		}
		ConstantBuffers.lights.addUniform('vec3', 'dirLight.color');
		ConstantBuffers.lights.addUniform('vec3', 'dirLight.direction');
		ConstantBuffers.lights.addUniform('vec3', 'eyePositionW');

		ConstantBuffers.lights.create(gl);
		ConstantBuffers.lights.bindTo(gl, 2);

		ConstantBuffers.generalData = new UniformBufferObject();
		ConstantBuffers.generalData.addUniform('vec4', 'dataVec1');
		ConstantBuffers.generalData.addUniform('vec4', 'dataVec2');
		ConstantBuffers.generalData.addUniform('vec4', 'dataVec3');
		ConstantBuffers.generalData.addUniform('bool', 'value');

		ConstantBuffers.generalData.create(gl);
		ConstantBuffers.generalData.bindTo(gl, 3);

		ConstantBuffers.particleData = new UniformBufferObject();

		ConstantBuffers.particleData.addUniform('vec3', 'particleData.gravity');
		ConstantBuffers.particleData.addUniform('vec3', 'particleData.origin');
		ConstantBuffers.particleData.addUniform('vec2', 'particleData.angleLimits');
		ConstantBuffers.particleData.addUniform('vec2', 'particleData.speedLimits');

		ConstantBuffers.particleData.create(gl);
		ConstantBuffers.particleData.bindTo(gl, 4);

		ConstantBuffers.pointLightColor = [];
		ConstantBuffers.pointLightIntensity = [];
		ConstantBuffers.pointLightNear = [];
		ConstantBuffers.pointLightPosition = [];
		ConstantBuffers.pointLightRadius = [];

		ConstantBuffers.overlayMatrices = new UniformBufferObject();
		ConstantBuffers.overlayMatrices.addUniform('mat4', 'ortho');
		ConstantBuffers.overlayMatrices.addUniform('mat4', 'view');
		ConstantBuffers.overlayMatrices.create(gl);
		ConstantBuffers.overlayMatrices.bindTo(gl, 5);

	}

	static shaderDirtyFlags: number = BufferDirtyFlag.NONE;

	static dirtyFlags: number;

	static projection: mat4;
	static view: mat4;
	static lightSpaceMatrix: mat4;
	static world: mat4;
	static dirLightDirection: vec3;
	static dirLightColor: vec3;
	static eyePosition: vec3;
	static dirLightIntensity: number;

	static pointLightPosition: vec3[];
	static pointLightColor: vec3[];
	static pointLightIntensity: number[];
	static pointLightRadius: number[];
	static pointLightNear: number[];

	static pointLightIndex: number;

	static displacementFactor: number;

	static hasEmissionMap: boolean;
	static hasAlbedoMap: boolean;
	static hasNormalMap: boolean;
	static hasRoughnessMap: boolean;
	static hasMetallicMap: boolean;
	static hasAoMap: boolean;
	static hasDisplacementMap: boolean;

	static matricesPerFrame: UniformBufferObject;
	static bufferPerObject: UniformBufferObject;
	static lights: UniformBufferObject;
	static generalData: UniformBufferObject;
	static particleData: UniformBufferObject;
	static overlayMatrices: UniformBufferObject;

}

export type UniformType = 'float' | 'int' | 'bool' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4';

export interface UniformVariable {
	type: UniformType;
	bufferOffset: number;
	size: number;
}

export class UniformBufferObject {
	constructor() {
		this.size = 0;
		this.chunkOffset = 0;
		this.variables = {};
	}

	addUniform(type: UniformType, name: string, arraySize: number = 0) {
		const typeSize = this.getStd140Size(type, arraySize);
		let padding = 0;

		if (arraySize === 0) {
			if (this.chunkOffset + typeSize > 16) {

				if (typeSize > 16) {
					if (this.chunkOffset > 0) {
						padding = 16 - this.chunkOffset;
						this.chunkOffset = 0;
					}
				} else {
					padding = 16 - this.chunkOffset;
					this.chunkOffset = 0;
				}
			} else {
				if (this.chunkOffset + typeSize === 16) {
					this.chunkOffset = 0;
				} else {
					this.chunkOffset += typeSize;
				}
			}
		} else {
			if (this.chunkOffset > 0) {
				padding = 16 - this.chunkOffset;
				this.chunkOffset = 0;
			}
		}

		this.variables[name] = { type, bufferOffset: this.size + padding, size: typeSize };
		this.size += typeSize + padding;
	}

	update(gl: WebGL2RenderingContext, uniformName: string, value: mat4 | mat3 | vec4 | vec3 | vec2 | number | boolean) {
		const variable = this.variables[uniformName];

		if (typeof value === 'number') {
			this.data[variable.bufferOffset * 0.25] = value;
		} else if (typeof value === 'boolean') {
			this.data[variable.bufferOffset * 0.25] = value ? 1 : 0;
		} else {
			this.data.set(value, variable.bufferOffset * 0.25);
		}
	}

	updateWithOffset(uniformName: string, offset: number, value: number) {
		const variable = this.variables[uniformName];
		this.data[variable.bufferOffset * 0.25 + offset] = value;
	}

	sendToGPU(gl: WebGL2RenderingContext) {
		gl.bindBuffer(gl.UNIFORM_BUFFER, this.id);
		gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.data);
		gl.bindBuffer(gl.UNIFORM_BUFFER, null);
	}

	bindTo(gl: WebGL2RenderingContext, bindingPoint: number) {
		gl.bindBufferRange(gl.UNIFORM_BUFFER, bindingPoint, this.id, 0, this.size);
	}


	create(gl: WebGL2RenderingContext) {

		if (this.chunkOffset > 0) {
			this.size += 16 - this.chunkOffset;
		}

		this.id = gl.createBuffer();
		gl.bindBuffer(gl.UNIFORM_BUFFER, this.id);
		gl.bufferData(gl.UNIFORM_BUFFER, this.size, gl.STATIC_DRAW);
		gl.bindBuffer(gl.UNIFORM_BUFFER, null);

		this.data = new Float32Array(this.size * 0.25);
	}

	private getStd140Size(type: string, arraySize: number = 0) {
		switch (type) {
			case 'float':
			case 'int':
			case 'bool':
				if (arraySize !== 0) {
					return arraySize * 16;
				} else {
					return 4;
				}
			case 'vec2':
				return 2 * 4;
			case 'vec3':
				return 4 * 4;
			case 'vec4':
				return 4 * 4;
			case 'mat3':
				return 3 * 16;
			case 'mat4':
				return 4 * 16;
		}
	}

	id: WebGLBuffer;
	size: number;

	chunkOffset: number;

	variables: { [name: string]: UniformVariable };
	data: Float32Array;
}