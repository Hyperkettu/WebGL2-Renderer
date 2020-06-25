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
import { wait, DEG_TO_RAD } from './util/math';
import { loadMaterial } from './material'; 
import { VertexBase } from './vertex';
import { Overlay } from './overlay/overlay';
import { Sprite } from './overlay/sprite'; 
import { runInThisContext } from 'vm';
import { vec2, vec3 } from 'gl-matrix';
import * as math from './util/math';
import { Animation } from './overlay/animationsystem';
import { TextTexture } from './texttexture';
import { Color } from './util/color';

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
		this.overlay = new Overlay(this.gl);

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

	sprite: Sprite;

	async Load(scenePaths: string[]) {

		await mesh.LoadMeshes(this.gl);
		this.currentScene = new TestScene('test-scene', this);
		await this.currentScene.initScene(this, scenePaths[0]);

		shader.LoadShaders(this.gl);

		loadMaterial('materials/default.mat.json', true, this.gl);

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

		await texture.LoadTexture(this.gl, 'images/A.png');

		const texture2 = new TextTexture();
		texture2.generateFromCanvas(this.gl, 'Testi', {
			family: 'Verdana',
			fontSize: 100,
			fillStyle: 'rgba(255, 0, 0, 1)',
			gradient: [ new Color(0, 1, 1, 1), new Color(1, 1, 0, 1) ],
			textAlign: 'center',
			textBaseLine: 'middle',
			strokeColor: '#ff00ffff',
			strokeThickness: 3.5
		});

		//this.overlay.setAtlas(texture.GetTexture('images/A.png'));
		this.overlay.setAtlas(texture2);

		console.log(texture2.width, texture2.height);

        const sprite = new Sprite('sprite', texture2);
        this.overlay.stage.root.addChild(sprite);
        sprite.setPosition(vec2.fromValues(window.innerWidth / 2, window.innerHeight / 2));
		sprite.setAnchor(0.5, 0.5);
		sprite.setAlpha(1.0);
		//sprite.setAngle(45 * DEG_TO_RAD);
		//sprite.setSize(512, 256);

		console.log(sprite);

		this.sprite = sprite;

		/*const sprite2 = new Sprite('sprite', texture.GetTexture('images/rock/rock-albedo.png'));
        this.overlay.stage.root.addChild(sprite2);
        sprite2.setPosition(vec2.fromValues(window.innerWidth / 4, window.innerHeight / 4));
		sprite2.setAnchor(0, 0);
		sprite2.setAlpha(1);
		sprite2.setAngle(90 * DEG_TO_RAD);
		//sprite2.setSize(100, 100);*/
		
		//this.overlay.setAtlas(texture.GetTexture('images/rock/rock-albedo.png'));
		
		addEventListener('keypress', event => {

			const animationMoveDown = new Animation(this.sprite, 'position', 'easeInOutBack', 4, 'animate', 0);
			animationMoveDown.from = vec2.fromValues(this.sprite.position[0], this.sprite.position[0]);
			animationMoveDown.to = vec2.fromValues(this.sprite.position[0], this.sprite.position[0] + 200);
			const animationWait = new Animation(this.sprite, 'position', 'easeInOutBack', 4, 'wait', 2);
			const animationMoveRight = new Animation(this.sprite, 'position', 'easeInOutBack', 4, 'animate', 0);
			animationMoveRight.from = vec2.fromValues(this.sprite.position[0], this.sprite.position[0] + 200);
			animationMoveRight.to = vec2.fromValues(this.sprite.position[0] + 300, this.sprite.position[0] + 200);
			const animationWaitLonger = new Animation(this.sprite, 'position', 'easeInOutBack', 4, 'wait', 0);
			const animationScaleDown = new Animation(this.sprite, 'scale', 'easeInOutBack', 4, 'animate', 0);
			animationScaleDown.from = vec2.fromValues(this.sprite.scale[0], this.sprite.scale[1]);
			animationScaleDown.to = vec2.fromValues(this.sprite.scale[0] * 0.5, this.sprite.scale[1] * 0.5);
			const fadeout = new Animation(this.sprite, 'alpha', 'easeInOutBack', 4, 'animate', 5);
			fadeout.from = 1;
			fadeout.to = 1;

			const colorAnimate = new Animation(this.sprite, 'color', 'easeInOutBack', 4, 'animate', 5);
			colorAnimate.from = vec3.fromValues(1,1,1);
			colorAnimate.to = vec3.fromValues(1, 0.5, 0);

			const rotate = new Animation(this.sprite, 'angle', 'easeInOutBack', 4, 'animate', 0);
			rotate.from = 90 * DEG_TO_RAD;
			rotate.to = 135 * DEG_TO_RAD;

			const rotate2 = new Animation(this.sprite, 'angle', 'easeInOutBack', 4, 'animate', 0);
			rotate2.from = 45 * DEG_TO_RAD;
			rotate2.to = 90 * DEG_TO_RAD;

			this.overlay.startAnimation([
				animationMoveDown,
				animationWait,
				animationMoveRight,
				animationWaitLonger,
				animationScaleDown,
				fadeout,
				colorAnimate,
				rotate
			]);

			this.overlay.startAnimation([
				rotate2
			]);
		});
	
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

	renderCurrentScene(time: number, dt: number) {
		this.overlay.animationSystem.updateAnimations(dt);
		this.render(this.currentScene, time, dt);
	}

	render(scene: Scene, time: number, dt: number) {

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
		ConstantBuffers.UpdateBuffer(BufferDirtyFlag.PER_FRAME, ShaderType.MORPHED_PBR);

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

		let rtsOverlay = new RenderTargetState(gl, this.context.screenViewPort);
		rtsOverlay.addColorTarget(gl, 0, this.postProcess.hdrBuffer);
		this.context.renderTargetBegin(rtsOverlay);
		this.overlay.overlayBegin(gl);
		this.context.viewport();
		this.overlay.render(gl, dt);
		this.overlay.overlayEnd(gl);
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
				const meshComponent = node.getComponent('meshComponent') as MeshComponent<VertexBase>;

				// cull frustum in the future
				if(meshComponent.mesh) {
					this.batchRenderer.addBatch({ submesh: meshComponent.mesh, world: node.transform.world }, meshComponent.layer);
				}
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

	overlay: Overlay;

	generatePBREnvironmentMaps: boolean = true;

}