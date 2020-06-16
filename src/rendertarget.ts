import { Viewport } from './context';
import { FrameBuffer } from './framebuffer';
import { Texture } from './texture';
import { DepthTexture } from './depthtexture';

export class RenderTargetState {

	static NUM_RENDERTARGETS = 4;

	constructor(gl: WebGL2RenderingContext, viewport: Viewport) {
		this.viewport = viewport;
		this.frameBuffer = new FrameBuffer();
		this.frameBuffer.create(gl);

		this.colorTargets = [false, false, false, false];
	}

	addColorTarget(gl: WebGL2RenderingContext, index: number, texture: Texture) {
		this.frameBuffer.attachTexture(gl, texture, index);
		this.colorTargets[index] = true;
	}

	addDepthStencilTarget(gl: WebGL2RenderingContext, depthTexture: DepthTexture) {
		this.frameBuffer.attachDepthTexture(gl, depthTexture);
	}

	destroy(gl: WebGL2RenderingContext) {
		this.frameBuffer.destroy(gl);
	}

	setRenderTarget(gl: WebGL2RenderingContext) {
		this.frameBuffer.bind(gl);
	}

	resize(gl: WebGL2RenderingContext, width: number, height: number) {
		this.frameBuffer.resize(gl, width, height);
	}

	setRenderTargetCubemapFace(gl: WebGL2RenderingContext, faceIndex: number, depthTexture: DepthTexture) {
		this.frameBuffer.attachDepthCubeMapFace(gl, depthTexture, faceIndex);
	}


	static renderTargetStack: RenderTargetState[] = [];


	frameBuffer: FrameBuffer;
	viewport: Viewport;

	colorTargets: boolean[];

}