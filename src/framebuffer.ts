import { Texture } from './texture';
import { DepthTexture } from './depthtexture';

export class FrameBuffer {

	constructor() {

	}

	create(gl: WebGL2RenderingContext) {
		this.id = gl.createFramebuffer();
		this.RBO = gl.createRenderbuffer();
	}

	bind(gl: WebGL2RenderingContext) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.id);
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.RBO);
	}

	attachDepthTexture(gl: WebGL2RenderingContext, depthTexture: DepthTexture) {
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture.textureId, 0);
	}

	attachDepthCubeMapFace(gl: WebGL2RenderingContext, depthTexture: DepthTexture, faceIndex: number) {
		gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, depthTexture.textureId, 0);
	}

	attachTexture(gl: WebGL2RenderingContext, texture: Texture, colorRenderTargetIndex: number) {
		this.bind(gl);
		gl.bindTexture(texture.isCubeMap ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, texture.textureId);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, texture.width, texture.height);
		if (!texture.isCubeMap) {
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + colorRenderTargetIndex, gl.TEXTURE_2D, texture.textureId, 0);
		}

	}

	readPixels(gl: WebGL2RenderingContext, texture: Texture) {
		const data = new Uint8Array(texture.width * texture.height * 4);
		gl.readPixels(0, 0, texture.width, texture.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
		return data;
	}

	resize(gl: WebGL2RenderingContext, width: number, height) {
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.RBO);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
		gl.viewport(0, 0, width, height);
	}

	destroy(gl: WebGL2RenderingContext) {
		gl.deleteFramebuffer(this.id);
		gl.deleteRenderbuffer(this.RBO);
	}

	id: WebGLFramebuffer;
	RBO: WebGLRenderbuffer;
}