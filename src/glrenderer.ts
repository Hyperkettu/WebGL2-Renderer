import * as shader from './shadermanager';
import * as mesh from './meshmanager';
import { ShaderType, Shader, ShaderTech } from './shader';
import * as texture from './texturemanager';
import * as material from './material';
import { TextureType } from './texture';
import { Context } from './context';
import { BatchRenderer, Layer } from './batchrenderer';
import * as camera from './cameramanager';
import { Scene } from './scene';
import { MeshComponent } from './meshcomponent';
import { ConstantBuffers, BufferDirtyFlag } from './constantbuffers';
import { PostProcess } from './postprocess';
import { Texture } from './texture';
import { RenderTargetState } from './rendertarget';
import { Skybox } from './skybox';
import * as settings from './settings';
import { CubeMapRenderer } from './cubemaprenderer';
import { TestScene } from './testscene';
import { PointLight } from './pointlight';
import { ParticleSystem } from './particlesystem';
import { wait } from './util/math';
import { loadMaterial } from './material'; 
import { VertexBase } from './vertex';
import { Overlay } from './overlay/overlay';
import { Sprite } from './overlay/sprite'; 
import { vec2, vec3, mat4 } from 'gl-matrix';
import { TextTexture } from './texttexture';
import { Color } from './util/color';
import { UILayout } from './overlay/ui/layout';
import * as layout from './overlay/ui/layout';
import { Cloth } from './cloth';
import { Submesh } from './submesh';
import { Subtexture } from './subtexture';
import { BillboardText } from './billboardtext';
import { Tree } from './tree';
import * as instanceBuffer from './instancebuffer';
import { FoliageGenerator } from './foliagegeneration';
import { BBSphere } from './util/bvh/boundingvolumesphere';
import { BoundingVolume } from './util/bvh/boundingvolume';
import { Frustum } from './frustum';
import { UnitSphere } from './util/bvh/unitsphere';

export enum ShaderMode {
	DEFAULT = 0,
	NORMAL = 1,
	NORMAL_MAP = 2,
	NUM_MODES
};

export enum ShadowPass {
	POINT_LIGHT,
	DIRECTIONAL_LIGHT
}

export class Renderer {

	constructor(canvas: HTMLCanvasElement, gl?: WebGL2RenderingContext) {
		if (gl) {
			this.gl = gl;
		} else {
			this.gl = canvas.getContext('webgl2') as any;
			console.log(`Inited WebGL version ${this.gl.getParameter(this.gl.VERSION)}`);
		}

		this.settings = new settings.SettingsManager(this);
		this.settings.populateDefaultOptions();
		this.context = new Context(this.gl, this);
		this.materialID = null;
		this.shader = null;

		this.batchRenderer = new BatchRenderer();
		this.postProcess = new PostProcess(this.gl, this);
		this.cubeMapRenderer = new CubeMapRenderer(this.gl);
		this.overlay = new Overlay(this.gl);

		this.queryExtensions();

		this.resetCounter();

		ConstantBuffers.createUniformBuffers(this.gl);
		UnitSphere.initRenderableUnitSphere(this.gl);
	}

	queryExtensions() {
		// use this extension to enable texture internal format gl.RG16F
		const colorBufferExtension = this.gl.getExtension('EXT_color_buffer_float');
		if (!colorBufferExtension) {
			console.log('No color buffer extension available');
		}

		const floatintPointBlend = this.gl.getExtension('EXT_float_blend');
		if(!floatintPointBlend) {
			console.log('No floating point blend');
		}

		const floatingPointTextures = this.gl.getExtension('OES_texture_float');

		if(!floatingPointTextures) {
			console.log('No floating point texture support');	
		}

		const halfFloatTextures = this.gl.getExtension('OES_texture_half_float');
		if(!halfFloatTextures) {
			console.log('No half float support for textures');
		}

		const halfFloatLinearFilter = this.gl.getExtension('OES_texture_half_float_linear');
		if(!halfFloatLinearFilter) {
			console.log('No half float linear filtering');
		}

		const linearFloatingPointFiltering = this.gl.getExtension('OES_texture_float_linear');

		if(!linearFloatingPointFiltering) {
			console.log('Linear floating point filtering disabled');
		}

		const cubemapArrayExtension = this.gl.getExtension('EXT_texture_cube_map_array');
		if (!cubemapArrayExtension) {
			console.log('No cubemap array extension');
		}

		const seamless = this.gl.getExtension('WEBGL_seamless_cube_map');
		if (!seamless) {
			console.log('No seamless cube map extension');
		}

		const tessellation = this.gl.getExtension('EXT_tessellation_shader');
		if (!tessellation) {
			console.log('No tessellation shader');
		}
	}

	async Load(resources: {scenePaths: string[], layouts: string[] }) {
		await mesh.LoadMeshes(this.gl);
		this.currentScene = new TestScene('test-scene', this);
		await this.currentScene.initScene(this, resources.scenePaths[0]);

		await shader.LoadTechniques();
		shader.LoadShaders(this.gl);
		this.shaderModes = [];
		this.shaderModes[ShaderMode.DEFAULT] = { shader: null, tech: 'default' };
		this.shaderModes[ShaderMode.NORMAL] = { shader: ShaderType.VISUALIZE_NORMALS, tech: 'Vis' };
		this.shaderModes[ShaderMode.NORMAL_MAP] = { shader: ShaderType.VISUALIZE_NORMALS, tech: 'VisN' };
		this.setShaderMode(ShaderMode.DEFAULT);

		loadMaterial('materials/default.mat.json', true, this.gl);
		await loadMaterial('materials/stone.mat.json', true, this.gl);

		this.particleSystem = new ParticleSystem({
			birthRate: 400,
			minAge: 1.0,
			maxAge: 4.0,
			numParticles: 2000
		});
		this.particleSystem.load(this);

		camera.AddCameras();

		await this.preCompute();

		ConstantBuffers.UpdateBuffer(BufferDirtyFlag.SELDOM, ShaderType.PBR);

		await UILayout.loadLayouts(this, resources.layouts);
		this.currentScene.loadAssets(this);

		this.cloth = new Cloth(this.gl, this.currentScene);

		this.tree = new Tree(this);
		
		const foliage = new FoliageGenerator(this);

	}

	getLayout(layoutPath: string) {
		return layout.get(layoutPath);
	}

	getContext() {
		return this.context;
	}

	getCurrentCamera() {
		return camera.GetCamera('default');
	}

	reset() {
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LESS);

		if (this.settings.getSetting('Blending')) {
			this.gl.enable(this.gl.BLEND);
			this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		} else {
			this.gl.disable(this.gl.BLEND);
		}
	}

	resize(width: number, height: number) {
		this.context.resize(width, height);
		this.postProcess.resize(this.gl, width, height);

		const camera = this.getCurrentCamera();
		camera.setPerspective(camera.fovY, width / height, camera.nearZ, camera.farZ);
	}

	async preCompute() {
		// compute pbr brdf intergration map
		const integrationBRDFMapSize = 512;
		const BRDFIntegrationMap = Texture.createRenderTarget(this.gl, this.gl.RG32F, this.gl.RG, integrationBRDFMapSize, integrationBRDFMapSize,
			this.gl.FLOAT, this.gl.NEAREST, false, this.gl.NEAREST);
		const rts = new RenderTargetState(this.gl, { x: 0, y: 0, width: integrationBRDFMapSize, height: integrationBRDFMapSize });
		rts.addColorTarget(this.gl, 0, BRDFIntegrationMap);
		this.context.renderTargetBegin(rts);

		const brdfShader = shader.GetShader(ShaderType.BRDF_INTEGRATION);
		brdfShader.use(this.gl);

		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		this.postProcess.renderQuad(this.gl);

		this.context.renderTargetEnd();

		texture.setTexture('brdfLUT', BRDFIntegrationMap);

		if (this.generatePBREnvironmentMaps) {
			await wait(600);
			this.cubeMapRenderer.generateIrradianceMap(this);
			this.cubeMapRenderer.generatePrefilterMap(this);
			this.generatePBREnvironmentMaps = false;

		}
	}

	renderCurrentScene(time: number, dt: number) {
		this.overlay.animationSystem.updateAnimations(dt);
		this.render(this.currentScene, time, dt);
	}

	render(scene: Scene, time: number, dt: number) {

		this.resetCounter();

		this.overlay.currentLayout.resize(vec2.fromValues(window.innerWidth, window.innerHeight));

		for (let index = 0; index < PointLight.NUM_LIGHTS; index++) {
			scene.pointLights[index].shadowMap.render(this, index + 1);
		}

		if(scene.dirLight) {
			scene.dirLight.shadowMap.render(this);
		}

		const gl = this.gl;
		const rts = new RenderTargetState(gl, this.context.screenViewPort);
		rts.addColorTarget(gl, 0, this.postProcess.hdrBuffer);
		rts.addColorTarget(gl, 1, this.postProcess.bloomLumaTexture);
		rts.addDepthStencilTarget(gl, this.postProcess.screenDepthTexture);
		this.context.renderTargetBegin(rts);

		this.context.viewport();

		this.context.clearColor(0, 0, 0, 1);
		this.context.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		const currentCamera = camera.GetCamera('default');

		ConstantBuffers.projection = currentCamera.projection;
		ConstantBuffers.view = currentCamera.view;
		ConstantBuffers.lightSpaceMatrix = scene.dirLight?.shadowMap.lightSpaceMatrix;
		ConstantBuffers.eyePosition = currentCamera.position;
		ConstantBuffers.dirLightColor = scene.dirLight.color;
		ConstantBuffers.dirLightDirection = scene.dirLight.direction;
		ConstantBuffers.dirLightIntensity = scene.dirLight.intensity;

		for (let index = 0; index < PointLight.NUM_LIGHTS; index++) {
			ConstantBuffers.pointLightColor[index] = scene.pointLights[index].color;
			ConstantBuffers.pointLightPosition[index] = scene.pointLights[index].position;
			ConstantBuffers.pointLightIntensity[index] = scene.pointLights[index].intensity;
			ConstantBuffers.pointLightRadius[index] = scene.pointLights[index].radius;
			ConstantBuffers.pointLightNear[index] = scene.pointLights[index].shadowMap.near;
		}

		ConstantBuffers.UpdateBuffer(BufferDirtyFlag.PER_FRAME, ShaderType.PBR);
		ConstantBuffers.UpdateBuffer(BufferDirtyFlag.PER_FRAME, ShaderType.MORPHED_PBR);
		ConstantBuffers.UpdateBuffer(BufferDirtyFlag.PER_FRAME, ShaderType.MORPHED_PBR_TEXTURE_TRANSFORM);
		ConstantBuffers.UpdateBuffer(BufferDirtyFlag.PER_FRAME, ShaderType.BILLBOARD);

		// ADD THIS BACK TO SEE BLENDMAPPED TERRAIN
		//	this.currentScene.terrain.render(this.gl);

		this.cloth.update(this.gl, dt);

		Renderer.visualizeBVH = true;
		this.resolveVisibility(scene, this.getCurrentCamera().frustum);
		Renderer.visualizeBVH = false;
		//this.batchRenderer.sortInAscendingOrder(Layer.OPAQUE);
		//this.batchRenderer.sortInDescendingOrder(Layer.TRANSPARENT);

		this.batchRenderer.flushSortedArray(this, Layer.OPAQUE);
		this.batchRenderer.flushSortedArray(this, Layer.TRANSPARENT);

		this.hdrBufferRenderCallback(gl);

		if (this.settings.getSetting('Skybox')) {
			//this.skybox.debugDepthTextureCubemap = this.currentScene.pointLights[0].shadowMap.shadowCubeMap;
			this.skybox.renderSkybox(this, this.gl);
		}

		/// ADD THIS BACK TO SEE PARTICLE SYSTEM
		//this.particleSystem.renderParticles(this, 1 / 60);

		this.context.renderTargetEnd();

		this.postProcess.Begin(this);

		let bloomTexture: Texture = null;
		if (this.settings.getSetting('Bloom')) {
			bloomTexture = this.postProcess.Bloom(this, this.postProcess.hdrBuffer);
		}
		let toneMapSource: Texture = null;
		if (this.settings.getSetting('Gray Scale')) {
			if (this.settings.getSetting('Bloom')) {
				toneMapSource = this.postProcess.GrayScale(this, bloomTexture);
			} else {
				toneMapSource = this.postProcess.GrayScale(this, this.postProcess.hdrBuffer);
			}
		} else {
			if (this.settings.getSetting('Bloom')) {
				toneMapSource = bloomTexture;
			} else {
				toneMapSource = this.postProcess.hdrBuffer;
			}
		}
		this.postProcess.ToneMapping(this, toneMapSource);
		this.postProcess.End(this);

		let rtsOverlay = new RenderTargetState(gl, this.context.screenViewPort);
		rtsOverlay.addColorTarget(gl, 0, this.postProcess.finalScreenTexture);
		this.context.renderTargetBegin(rtsOverlay);
		this.overlay.overlayBegin(gl);
		this.context.viewport();
		this.overlay.render(gl, dt);
		this.overlayRender(gl);
		/*const subtex = new Subtexture('df', this.billboardText.renderTexture, 0, 0, 
		this.billboardText.renderTexture.width, this.billboardText.renderTexture.height);
		const sp = new Sprite('name', subtex);
		sp.setPosition([400, 360]);
		sp.setScale([0.5, 0.5]);
		sp.setAnchor(0.5, 0.5);
		this.overlay.renderSingleSprite(gl, sp, true);*/
		this.overlay.overlayEnd(gl);
		this.context.renderTargetEnd();

		this.postProcess.renderToScreen(this, this.postProcess.finalScreenTexture);

		if (this.settings.getSetting('Shadow Map Debug', settings.SettingCategory.DEBUG)) {
			if (this.postProcess.screenDepthTexture) {
				const viewport = this.context.screenViewPort;
				const bottomRightCorner = { x: viewport.width / 2, y: 0, width: viewport.width / 2, height: viewport.height / 2 };
				this.gl.depthFunc(gl.LEQUAL);
				const defaultCamera = camera.GetCamera('default');
				this.postProcess.renderToViewport(this, this.currentScene.dirLight.shadowMap.shadowMap[0], bottomRightCorner, ShaderType.VISUALIZE_DEPTH, defaultCamera);
				this.gl.depthFunc(gl.LESS);
				this.context.setViewport(viewport);
			}
		}

	}

	public hdrBufferRenderCallback(gl: WebGL2RenderingContext) {}

	overlayRender(gl: WebGL2RenderingContext) {}

	resolveVisibility(scene: Scene, frustum: Frustum) {

		let count  = 0;
		this.batchRenderer.reset();

		scene.sceneGraph.forEachFrustumCull(this.gl, frustum, culledNode => {
			
			if (culledNode !== scene.sceneGraph.root && culledNode.enabled) {
				const meshComponent = culledNode.getComponent('meshComponent') as MeshComponent<VertexBase>;
				if(meshComponent.mesh) {
					count++;
					if(meshComponent.mesh.instancedDraw) {
						instanceBuffer.getInstanceBuffer(meshComponent.mesh.instanceBufferName, 
							meshComponent.layer).addTransform(meshComponent.mesh, culledNode.transform.world);
					} else {
						this.batchRenderer.addBatch({ submesh: meshComponent.mesh, world: culledNode.transform.world }, meshComponent.layer);
					}
				}
			}
		});

		console.log(count, scene.sceneGraph.totalObjects);
	}

	materialBegin(submesh: Submesh<VertexBase>, shadowPass?: ShadowPass) {

		this.materialID = submesh.materialID;
		const mat = material.GetMaterial(submesh.materialID);

		if (shadowPass === undefined) {
			submesh.shaderModes[ShaderMode.DEFAULT].shader = mat.shader;
			submesh.shaderModes[ShaderMode.DEFAULT].tech = mat.tech;
			this.shader = submesh.shaderModes[this.shaderMode].shader;
			this.shaderTech = shader.GetShader(submesh.shaderModes[this.shaderMode].shader, submesh.shaderModes[this.shaderMode].tech);
			this.shaderTech.use(this.gl);

		} else {
			this.shader = submesh.getShadowMapShader(shadowPass);
			this.shaderTech = shader.GetShader(this.shader, mat.textures[TextureType.Displacement] ? 'AD' : 'A');
			this.shaderTech.use(this.gl);

			this.shaderTech.setSamplerTexture(this.gl, Shader.uniformSamplers[0], mat.textures[0], 0);

			if(mat.textures[TextureType.Displacement]) {
				this.shaderTech.setSamplerTexture(this.gl, Shader.uniformSamplers[TextureType.Displacement], mat.textures[TextureType.Displacement], 5);
			}

			return; // skip material textures for depth passes
		}

		for (let index = 0; index < TextureType.Max_Types; index++) {
			if (mat.textures[index]) {
				this.shaderTech.setSamplerTexture(this.gl, Shader.uniformSamplers[index], mat.textures[index], index);
			}
		}
		if(mat.customTextures) {
			for(let index = 0; index < mat.customTextures.length; index++) {
				if(mat.customTextures[index]) {
					this.shaderTech.setSamplerTexture(this.gl, mat.customTextures[index].name, mat.customTextures[index], index + 15);
				}
			}
		}
	}

	materialEnd(shadowPass?: ShadowPass) {

		if (!this.materialID) {
			return;
		}

		if (shadowPass === undefined) {

			const mat = material.GetMaterial(this.materialID);

			for (let index = 0; index < TextureType.Max_Types; index++) {
				if (mat.textures[index]) {
					this.shaderTech.setSamplerTexture(this.gl, Shader.uniformSamplers[index], null, index);
				}
			}

			this.shader = null;
			this.materialID = null;
		}
	}

	resetCounter() {
		Renderer.numDrawCallsPerFrame = 0;
	}

	setShaderMode(mode: ShaderMode) {
		this.shaderMode = mode;
	}

	static numDrawCallsPerFrame: number;

	context: Context;
	materialID: string;
	shaderTech: ShaderTech;
	shader: ShaderType;
	
	shaderModes: { shader: ShaderType, tech: string }[];
	shaderMode: ShaderMode;
	
	gl: WebGL2RenderingContext;

	batchRenderer: BatchRenderer;
	cubeMapRenderer: CubeMapRenderer;

	postProcess: PostProcess;

	skybox: Skybox;

	currentScene: Scene;

	particleSystem: ParticleSystem;

	overlay: Overlay;

	generatePBREnvironmentMaps: boolean = true;

	cloth: Cloth;


	settings: settings.SettingsManager;

	tree: Tree;

	static visualizeBVH: boolean = false;

}