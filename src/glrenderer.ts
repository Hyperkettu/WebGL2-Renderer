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
import { Picker } from './raycast';
import { wait } from './util';

export class Renderer {

	constructor(canvas: HTMLCanvasElement, gl?: WebGL2RenderingContext) {
		if (gl) {
			this.gl = gl;
		} else {
			this.gl = canvas.getContext('webgl2') as any;
			console.log(`Inited WebGL version ${this.gl.getParameter(this.gl.VERSION)}`);
		}

		this.context = new Context(this.gl);
		this.materialID = null;
		this.shader = null;

		this.batchRenderer = new BatchRenderer();
		this.postProcess = new PostProcess(this.gl, this);
		this.cubeMapRenderer = new CubeMapRenderer(this.gl);

		// use this extension to enable texture internal format gl.RG16F
		const colorBufferExtension = this.gl.getExtension('EXT_color_buffer_float');

		if (!colorBufferExtension) {
			console.log('No color buffer extension available');
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

		this.resetCounter();

		ConstantBuffers.createUniformBuffers(this.gl);

	}

	async Load(scenePaths: string[]) {

		await mesh.LoadMeshes(this.gl);
		this.currentScene = new TestScene('test-scene');
		await this.currentScene.initScene(this, scenePaths[0]);

		shader.LoadShaders(this.gl);

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

		if (settings.enableBlending) {
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

	renderCurrentScene() {
		this.render(this.currentScene);
	}

	render(scene: Scene) {

		this.resetCounter();

		for (let index = 0; index < PointLight.NUM_LIGHTS; index++) {
			scene.pointLights[index].shadowMap.render(this, index + 1);
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

		// ADD THIS BACK TO SEE BLENDMAPPED TERRAIN
		//	this.currentScene.terrain.render(this.gl);

		this.resolveVisibility(scene);

		//this.batchRenderer.sortInAscendingOrder(Layer.OPAQUE);
		//this.batchRenderer.sortInDescendingOrder(Layer.TRANSPARENT);

		this.batchRenderer.flushSortedArray(this, Layer.OPAQUE, false);
		this.batchRenderer.flushSortedArray(this, Layer.TRANSPARENT, false);

		if (settings.enableSkybox) {
			this.skybox.renderSkybox(this, this.gl);
		}

		/// ADD THIS BACK TO SEE PARTICLE SYSTEM
		//this.particleSystem.renderParticles(this, 1 / 60);

		this.context.renderTargetEnd();

		this.postProcess.Begin(this);

		let bloomTexture: Texture = null;
		if (settings.enableBloom) {
			bloomTexture = this.postProcess.Bloom(this, this.postProcess.hdrBuffer);
		}
		let toneMapSource: Texture = null;
		if (settings.enableGrayScale) {
			if (settings.enableBloom) {
				toneMapSource = this.postProcess.GrayScale(this, bloomTexture);
			} else {
				toneMapSource = this.postProcess.GrayScale(this, this.postProcess.hdrBuffer);
			}
		} else {
			if (settings.enableBloom) {
				toneMapSource = bloomTexture;
			} else {
				toneMapSource = this.postProcess.hdrBuffer;
			}
		}
		this.postProcess.ToneMapping(this, toneMapSource);
		this.postProcess.End(this);

		this.postProcess.renderToScreen(this, this.postProcess.finalScreenTexture);

		if (settings.enableShadowMapDebug) {
			if (this.postProcess.screenDepthTexture) {
				const viewport = this.context.screenViewPort;
				const bottomRightCorner = { x: viewport.width / 2, y: 0, width: viewport.width / 2, height: viewport.height / 2 };
				this.gl.depthFunc(gl.LEQUAL);
				const defaultCamera = camera.GetCamera('default');
				this.postProcess.renderToViewport(this, this.postProcess.screenDepthTexture, bottomRightCorner, ShaderType.VISUALIZE_DEPTH, defaultCamera);
				this.gl.depthFunc(gl.LESS);
				this.context.setViewport(viewport);
			}
		}

	}

	resolveVisibility(scene: Scene) {

		this.batchRenderer.reset();
		scene.sceneGraph.forEach(node => {

			if (node !== scene.sceneGraph.root && node.enabled) {
				const meshComponent = node.getComponent('meshComponent') as MeshComponent;

				// cull frustum in the future
				this.batchRenderer.addBatch({ mesh: meshComponent.mesh, world: node.transform.world }, meshComponent.layer);
			}
		});

	}

	materialBegin(materialID: string, shadowPass: boolean = false) {

		this.materialID = materialID;
		const mat = material.GetMaterial(materialID);

		if (!shadowPass) {
			this.shader = settings.debugNormals ? ShaderType.VISUALIZE_NORMALS : mat.shader;
			this.shaderTech = settings.debugNormals ? shader.GetShader(ShaderType.VISUALIZE_NORMALS) : shader.GetShader(mat.shader, mat.tech);
			this.shaderTech.use(this.gl);
		} else {
			return; // skip material textures for depth passes
		}

		for (let index = 0; index < TextureType.Max_Types; index++) {
			if (mat.textures[index]) {
				this.shaderTech.setSamplerTexture(this.gl, Shader.uniformSamplers[index], mat.textures[index], index);
			}
		}
	}

	materialEnd(shadowPass: boolean = false) {

		if (!this.materialID) {
			return;
		}

		if (!shadowPass) {

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

	static numDrawCallsPerFrame: number;

	context: Context;
	materialID: string;
	shaderTech: ShaderTech;
	shader: ShaderType;
	gl: WebGL2RenderingContext;

	batchRenderer: BatchRenderer;
	cubeMapRenderer: CubeMapRenderer;

	postProcess: PostProcess;

	skybox: Skybox;

	currentScene: Scene;

	particleSystem: ParticleSystem;

	generatePBREnvironmentMaps: boolean = true;

}