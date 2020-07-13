import { StaticMesh } from './mesh';
import * as texture from './texturemanager';
import { Renderer, ShaderMode } from './glrenderer';
import { GeometryGenerator } from './geometrygenerator';
import * as mesh from './meshmanager';
import { ShaderType } from './shader';
import * as shader from './shadermanager';
import { PointLight } from './pointlight';
import { ConstantBuffers } from './constantbuffers';
import { mat4, vec4 } from 'gl-matrix';
import * as settings from './settings';
import { Texture } from './texture';

export class Terrain {
	constructor() {

	}

	async load(renderer: Renderer) {
		this.renderer = renderer;
		const gl = renderer.gl;
		[
			this.albedos,
			this.normals,
			this.roughnesses,
			this.metallic,
			this.aos,
			this.displacements

		] = await Promise.all([
			Texture.LoadTexture2DArray(gl, 'images/terrain/albedos.png', 5, gl.RGBA, gl.RGBA, gl.REPEAT, gl.LINEAR_MIPMAP_LINEAR),
			Texture.LoadTexture2DArray(gl, 'images/terrain/normals.png', 5, gl.RGBA, gl.RGBA, gl.REPEAT, gl.LINEAR_MIPMAP_LINEAR),
			Texture.LoadTexture2DArray(gl, 'images/terrain/roughnesses.png', 5, gl.RGBA, gl.RGBA, gl.REPEAT, gl.LINEAR_MIPMAP_LINEAR),
			Texture.LoadTexture2DArray(gl, 'images/terrain/metallic.png', 5, gl.RGBA, gl.RGBA, gl.REPEAT, gl.LINEAR_MIPMAP_LINEAR),
			Texture.LoadTexture2DArray(gl, 'images/terrain/aos.png', 5, gl.RGBA, gl.RGBA, gl.REPEAT, gl.LINEAR_MIPMAP_LINEAR),
			Texture.LoadTexture2DArray(gl, 'images/terrain/displacements.png', 5, gl.RGBA, gl.RGBA, gl.REPEAT, gl.LINEAR_MIPMAP_LINEAR)
		]);

		await Promise.all([
			texture.LoadTexture(gl, 'images/blendmap.png'),
			GeometryGenerator.GenerateTerrain(gl, 'terrain', 50.0, 2, 1.0, 0.0, 'images/height-map11.png')
		]);
		this.terrain = mesh.GetMesh('terrain');

		this.world = mat4.create();
		this.tileScale = 1.0;

		this.shaderModes = [];
		this.shaderModes[ShaderMode.DEFAULT] = { shader: ShaderType.TERRAIN, tech: 'default'};
		this.shaderModes[ShaderMode.NORMAL] = { shader: ShaderType.VISUALIZE_NORMALS, tech: 'normals'};
		this.shaderModes[ShaderMode.NORMAL_MAP] = { shader: ShaderType.VISUALIZE_NORMALS_TERRAIN, tech: 'default'};


	}

	render(gl: WebGL2RenderingContext) {

		const terrainTech = shader.GetShader(this.shaderModes[this.renderer.shaderMode].shader, this.shaderModes[this.renderer.shaderMode].tech);
		terrainTech.use(gl);
		if (this.renderer.shaderMode === ShaderMode.DEFAULT) {
			terrainTech.setSamplerTexture(gl, 'blendMap', texture.GetTexture('images/blendmap.png'), 6);
			terrainTech.setSamplerTextureArray(gl, 'albedos', this.albedos, 0);
			terrainTech.setSamplerTextureArray(gl, 'normals', this.normals, 1);
			terrainTech.setSamplerTextureArray(gl, 'roughnesses', this.roughnesses, 2);
			terrainTech.setSamplerTextureArray(gl, 'metallics', this.metallic, 3);
			terrainTech.setSamplerTextureArray(gl, 'aos', this.aos, 4);
			terrainTech.setSamplerTextureArray(gl, 'displacements', this.displacements, 5);

			terrainTech.setSamplerTexture(gl, 'prefilterMap', texture.GetTexture('prefilterMap'), 7);
			terrainTech.setSamplerTexture(gl, 'irradianceMap', texture.GetTexture('irradianceMap'), 8);
			terrainTech.setSamplerTexture(gl, 'brdfLUT', texture.GetTexture('brdfLUT'), 9);

			for (let index = 1; index <= PointLight.NUM_LIGHTS; index++) {
				terrainTech.setSamplerTexture(gl, `pointLightShadowMap${index}`, texture.GetDepthTexture(`pointLightShadowMap${index}`), 10 + (index - 1));
			}
		} else {
			if(this.renderer.shaderMode === ShaderMode.NORMAL_MAP) {
				terrainTech.setSamplerTexture(gl, 'blendMap', texture.GetTexture('images/blendmap.png'), 6);
				terrainTech.setSamplerTextureArray(gl, 'normals', this.normals, 1);
			}
		}

		const submesh = this.terrain.getSubmesh('terrain');
		ConstantBuffers.world = this.world;
		ConstantBuffers.displacementFactor = submesh.displacementFactor;
		ConstantBuffers.pointLightIndex = submesh.pointLightIndex;
		ConstantBuffers.SyncPerObject(gl);
		ConstantBuffers.SyncPerFrame(gl);

		ConstantBuffers.generalData.update(gl, 'dataVec1', vec4.fromValues(this.tileScale, 0, 0, 0));
		ConstantBuffers.generalData.sendToGPU(gl);

		Renderer.numDrawCallsPerFrame++;

		let mode = gl.TRIANGLES;

		if (submesh.wireFrame) {
			mode = gl.LINE_STRIP;
		}
		gl.bindVertexArray(submesh.vertexArrayObject.vao);
		gl.drawElements(mode, submesh.indices.length, gl.UNSIGNED_SHORT, 0);
		gl.bindVertexArray(null);
	}

	terrain: StaticMesh;
	world: mat4;

	albedos: Texture;
	normals: Texture;
	displacements: Texture;
	aos: Texture;
	roughnesses: Texture;
	metallic: Texture;

	tileScale: number;

	renderer: Renderer;
	shaderModes: { shader: ShaderType, tech: string }[];
}