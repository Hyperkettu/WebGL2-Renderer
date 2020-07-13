import { Texture } from './texture';
import { Renderer } from './glrenderer';
import { ShaderType } from './shader';
import * as shader from './shadermanager';
import * as mesh from './meshmanager';
import { screenVertexToFloat32Array } from './vertex';
import { VertexArrayObject } from './vertexarrayobject';
import { RenderTargetState } from './rendertarget';
import { DepthTexture } from './depthtexture';
import { Viewport } from './context';
import { Camera } from './camera';
import { ConstantBuffers } from './constantbuffers';
import { vec4 } from 'gl-matrix';

export class PostProcess {

	constructor(gl: WebGL2RenderingContext, renderer: Renderer) {

		const vertices = mesh.GenerateScreenQuadVertices();
		this.screenQuadVertices = screenVertexToFloat32Array(vertices);
		this.bufferData = VertexArrayObject.GenerateVertexArrayObjectForScreen(gl, this.screenQuadVertices);

		const width = renderer.context.screenViewPort.width;
		const height = renderer.context.screenViewPort.height;
		this.finalScreenTexture = Texture.createRenderTarget(gl, gl.RGBA, gl.RGBA,
			width, height, gl.UNSIGNED_BYTE, gl.LINEAR);

		this.hdrBuffer = Texture.createRenderTarget(gl, gl.RGBA16F, gl.RGBA, width, height);
		this.screenDepthTexture = DepthTexture.create(gl, width, height);
		this.bloomTexture = Texture.createRenderTarget(gl, gl.RGBA16F, gl.RGBA, width, height);
		this.bloomLumaTexture = Texture.createRenderTarget(gl, gl.RGBA16F, gl.RGBA, width, height);
		this.grayScaledTexture = Texture.createRenderTarget(gl, gl.RGBA16F, gl.RGBA, width, height);

	}

	resize(gl: WebGL2RenderingContext, width: number, height: number) {

		if (this.hdrBuffer) {
			this.hdrBuffer.destroy(gl);
		}

		if (this.screenDepthTexture) {
			this.screenDepthTexture.destroy(gl);
		}

		if (this.bloomLumaTexture) {
			this.bloomLumaTexture.destroy(gl);
		}

		if (this.bloomTexture) {
			this.bloomTexture.destroy(gl);
		}

		if (this.grayScaledTexture) {
			this.grayScaledTexture.destroy(gl);
		}

		if (this.finalScreenTexture) {
			this.finalScreenTexture.destroy(gl);
		}

		this.hdrBuffer = Texture.createRenderTarget(gl, gl.RGBA16F, gl.RGBA, width, height);
		this.screenDepthTexture = DepthTexture.create(gl, width, height);
		this.bloomTexture = Texture.createRenderTarget(gl, gl.RGBA16F, gl.RGBA, width, height);
		this.bloomLumaTexture = Texture.createRenderTarget(gl, gl.RGBA16F, gl.RGBA, width, height);
		this.grayScaledTexture = Texture.createRenderTarget(gl, gl.RGBA16F, gl.RGBA, width, height);
		this.finalScreenTexture = Texture.createRenderTarget(gl, gl.RGBA, gl.RGBA,
			width, height, gl.UNSIGNED_BYTE, gl.LINEAR);

	}

	renderToScreen(renderer: Renderer, texture: Texture) {
		this.screenTexture = texture;
		const context = renderer.getContext();

		const fillShader = shader.GetShader(ShaderType.FILL_SCREEN);
		fillShader.use(context.gl);
		fillShader.setSamplerTexture(context.gl, 'screenTexture', this.screenTexture, 0);

		context.gl.clear(context.gl.COLOR_BUFFER_BIT | context.gl.DEPTH_BUFFER_BIT);
		this.renderQuad(context.gl);
	}

	renderToViewport(renderer: Renderer, texture: Texture | DepthTexture, viewport: Viewport, type: ShaderType, camera?: Camera) {
		const gl = renderer.gl;

		const fillShader = shader.GetShader(type);
		fillShader.use(gl);

		if (texture instanceof DepthTexture && camera) {
			ConstantBuffers.generalData.update(gl, 'dataVec1', vec4.fromValues(camera.nearZ, camera.farZ, 0, 0));
			ConstantBuffers.generalData.update(gl, 'value', camera.isPerspective);
			ConstantBuffers.generalData.sendToGPU(gl);
		}

		fillShader.setSamplerTexture(gl, 'screenTexture', texture, 0);

		renderer.context.setViewport(viewport);
		//	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		this.renderQuad(gl);
	}

	renderQuad(gl: WebGL2RenderingContext) {
		Renderer.numDrawCallsPerFrame++;
		gl.bindVertexArray(this.bufferData.vertexArrayObject);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		gl.bindVertexArray(null);
	}


	Begin(renderer: Renderer) {
		const gl = renderer.gl;
		//	const rts = new RenderTargetState(gl, renderer.context.screenViewPort);
		//	rts.addColorTarget(gl, 0, this.bloomTexture);
		//	renderer.context.renderTargetBegin(rts);
	}

	End(renderer: Renderer) {
		renderer.context.renderTargetEnd();
	}

	ToneMapping(renderer: Renderer, source: Texture) {
		const gl = renderer.gl;

		const rts = new RenderTargetState(gl, renderer.context.screenViewPort);
		rts.addColorTarget(gl, 0, this.finalScreenTexture);
		renderer.context.renderTargetBegin(rts);

		const toneMappingShader = shader.GetShader(ShaderType.TONEMAPPING);
		toneMappingShader.use(gl);
		toneMappingShader.setSamplerTexture(gl, 'hdrScreenBuffer', source, 0);
		toneMappingShader.setInt(gl, 'enableToneMapping', renderer.settings.getSetting('Tone Mapping'));
		toneMappingShader.setInt(gl, 'enableGammaCorrection', renderer.settings.getSetting('Gamma Correction'));

		ConstantBuffers.generalData.update(gl, 'dataVec1', vec4.fromValues(
			renderer.settings.getSettingValue('Saturation'), 
			renderer.settings.getSettingValue('Contrast'), 
			renderer.settings.getSettingValue('Brightness'), 0));
		ConstantBuffers.generalData.sendToGPU(gl);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		this.renderQuad(gl);
	}

	GrayScale(renderer: Renderer, source: Texture) {

		const gl = renderer.gl;
		const rts = new RenderTargetState(gl, renderer.context.screenViewPort);
		rts.addColorTarget(gl, 0, this.grayScaledTexture);
		renderer.context.renderTargetBegin(rts);

		const grayScaleShader = shader.GetShader(ShaderType.GRAY_SCALE);
		grayScaleShader.use(gl);
		grayScaleShader.setSamplerTexture(gl, 'hdrScreenBuffer', source, 0);

		renderer.context.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		this.renderQuad(gl);

		renderer.context.renderTargetEnd();

		return this.grayScaledTexture;
	}

	Bloom(renderer: Renderer, source: Texture) {
		const gl = renderer.gl;

		const rts = new RenderTargetState(gl, renderer.context.screenViewPort);
		rts.addColorTarget(gl, 0, this.bloomTexture);
		renderer.context.renderTargetBegin(rts);

		const bloomLumaTextureBlurred = this.GaussianBlur(renderer, this.bloomLumaTexture);
		const bloomShader = shader.GetShader(ShaderType.BLOOM);
		bloomShader.use(gl);
		bloomShader.setSamplerTexture(gl, 'hdrScreenBuffer', source, 0);
		bloomShader.setSamplerTexture(gl, 'bloomTexture', bloomLumaTextureBlurred, 1);

		renderer.context.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		this.renderQuad(gl);

		renderer.context.renderTargetEnd();
		bloomLumaTextureBlurred.destroy(gl);

		return this.bloomTexture;

	}

	GaussianBlur(renderer: Renderer, source: Texture) {

		const gl = renderer.gl;
		let horizontal = true, first = true;
		const amount = 10;
		const gaussianBlurShader = shader.GetShader(ShaderType.GAUSSIAN_BLUR);
		gaussianBlurShader.use(gl);

		const width = renderer.context.screenViewPort.width;
		const height = renderer.context.screenViewPort.height;

		const pingpongBuffers: Texture[] = [
			Texture.createRenderTarget(gl, gl.RGBA16F, gl.RGBA, width, height),
			Texture.createRenderTarget(gl, gl.RGBA16F, gl.RGBA, width, height)
		];

		for (let i = 0; i < amount; i++) {
			const pingpongRTS = new RenderTargetState(gl, renderer.context.screenViewPort);
			const index = horizontal ? 1 : 0;
			pingpongRTS.addColorTarget(gl, 0, pingpongBuffers[index]);
			renderer.context.renderTargetBegin(pingpongRTS);
			ConstantBuffers.generalData.update(gl, 'value', horizontal);
			ConstantBuffers.generalData.sendToGPU(gl);
			gaussianBlurShader.setSamplerTexture(gl, 'screenHdrBuffer', first ? source : pingpongBuffers[!horizontal ? 1 : 0], 0);
			this.renderQuad(gl);
			horizontal = !horizontal;
			if (first) {
				first = false;
			}
			renderer.context.renderTargetEnd();
		}

		pingpongBuffers[1].destroy(gl);

		return pingpongBuffers[0];
	}

	screenTexture: Texture;
	screenQuadVertices: Float32Array;
	bufferData: { vertexArrayObject: WebGLVertexArrayObject, vertexBuffer: WebGLBuffer };

	hdrBuffer: Texture;
	screenDepthTexture: DepthTexture;
	finalScreenTexture: Texture;
	bloomTexture: Texture;
	bloomLumaTexture: Texture;
	grayScaledTexture: Texture;

	bloomLumaTextureBlurred: Texture;
}