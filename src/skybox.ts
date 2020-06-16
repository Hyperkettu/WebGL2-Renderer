import { Texture } from './texture';
import * as mesh from './meshmanager';
import { VertexArrayObject } from './vertexarrayobject';
import { Renderer } from './glrenderer';
import { ShaderType } from './shader';
import * as shader from './shadermanager';
import { DepthTexture } from './depthtexture';
import { ConstantBuffers } from './constantbuffers';
import { vec4 } from 'gl-matrix';

export class Skybox {
	constructor(gl: WebGL2RenderingContext, path: string) {
		this.path = path;
		const vertices = mesh.GenerateUnitCubeVertices();
		this.bufferData = VertexArrayObject.GenerateUnitCubeVertexArrayObject(gl, vertices);

		this.debugTextureCubeMap = null;
		this.intensity = 1.0;
	}

	renderSkybox(renderer: Renderer, gl: WebGL2RenderingContext) {
		gl.depthFunc(gl.LEQUAL);
		let skyboxShader = shader.GetShader(ShaderType.SKYBOX);
		skyboxShader.use(gl);
		if (this.debugTextureCubeMap) {
			skyboxShader.setSamplerTexture(gl, 'skybox', this.debugTextureCubeMap, 0);
		} else if (this.debugDepthTextureCubemap) {
			skyboxShader = shader.GetShader(ShaderType.VISUALIZE_CUBEMAP_DEPTH);
			skyboxShader.use(gl);
			skyboxShader.setSamplerTexture(gl, 'skybox', renderer.currentScene.pointLights[0].shadowMap.shadowCubeMap, 0);
			ConstantBuffers.generalData.update(gl, 'dataVec1',
				vec4.fromValues(0.1, renderer.currentScene.pointLights[0].shadowMap.radius, 0, 0));
			ConstantBuffers.generalData.sendToGPU(gl);

		} else {
			if (this.skyboxTextureCubeMap.textureId) {
				ConstantBuffers.generalData.update(gl, 'dataVec1',
					vec4.fromValues(this.intensity, 0, 0, 0));
				ConstantBuffers.generalData.sendToGPU(gl);
				skyboxShader.setSamplerTexture(gl, 'skybox', this.skyboxTextureCubeMap, 0);
			}
		}

		Renderer.numDrawCallsPerFrame++;
		gl.bindVertexArray(this.bufferData.vertexArrayObject);
		gl.drawArrays(gl.TRIANGLES, 0, 36); // 36 vertices per skybox cube
		gl.bindVertexArray(null);
		gl.depthFunc(gl.LESS); // restore depth func

	}

	async loadSkyboxCubeMapImages(gl: WebGL2RenderingContext, path: string) {

		const faces = [
			'right.png',
			'left.png',
			'top.png',
			'bottom.png',
			'front.png',
			'back.png'
		];

		const images: string[] = [];

		for (let face of faces) {
			images.push(`${path}${face}`);
		}

		const texture = new Texture();
		texture.isCubeMap = true;

		const internalFormat = gl.RGB;
		const format = gl.RGB;
		const wrapMode = gl.CLAMP_TO_EDGE;
		const minificationFilter = gl.LINEAR;

		texture.textureId = await texture.loadTextureInternal(gl, images, internalFormat, format, wrapMode, minificationFilter);
		this.skyboxTextureCubeMap = texture;
	}

	path: string;
	skyboxTextureCubeMap: Texture;
	bufferData: { vertexArrayObject: WebGLVertexArrayObject, vertexBuffer: WebGLBuffer };

	debugTextureCubeMap: Texture;
	debugDepthTextureCubemap: DepthTexture;
	intensity: number;
}