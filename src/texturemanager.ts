import { Texture, TextureType } from './texture';
import { DepthTexture } from './depthtexture';

export interface TextureData {
	path: string;
	type: 'albedo' | 'normal' | 'metallic' | 'roughness' | 'ambient-occlusion' | 'displacement' | 'emission';
}

const textures: { [id: string]: Texture } = {};
const depthTextures: { [id: string]: DepthTexture } = {};

export function GetTexture(name: string) {
	return textures[name];
}

export function setTexture(name: string, texture: Texture) {
	textures[name] = texture;
}

export function destroyTexture(gl: WebGL2RenderingContext, texture: Texture) {
	texture.destroy(gl);
	delete textures[texture.path];
}

export function getType(textureData: TextureData) {
	switch (textureData.type) {
		case 'albedo': return TextureType.Albedo;
		case 'normal': return TextureType.Normal;
		case 'metallic': return TextureType.Metallic;
		case 'roughness': return TextureType.Roughness;
		case 'ambient-occlusion': return TextureType.Ambient_Occlusion;
		case 'displacement': return TextureType.Displacement;
		case 'emission': return TextureType.Emission;
	}
}

export async function LoadTexture(gl: WebGL2RenderingContext, path: string, type?: TextureType) {
	const texture = new Texture();
	await texture.loadTexture(gl, path, type);
	textures[path] = texture;

}



export async function LoadTextures(gl: WebGL2RenderingContext, textureDatas: TextureData[]) {
	const promises: Promise<void>[] = [];
	for (let data of textureDatas) {
		const texture = new Texture();
		textures[data.path] = texture;
		promises.push(texture.loadTexture(gl, data.path, getType(data)));
	}

	await Promise.all(promises);
}

export function GetDepthTexture(name: string) {
	return depthTextures[name];
}

export function setDepthTexture(name: string, texture: DepthTexture) {
	depthTextures[name] = texture;
}