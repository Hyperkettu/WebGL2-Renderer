import { Texture } from './texture';
import { ShaderType, Shader } from './shader';
import * as texture from './texturemanager';
import * as resource from './resource';

export const materials: { [id: string]: Material } = {};

export function GetMaterial(name: string) {
	return materials[name];
}

export function setMaterial(name: string, material: Material) {
	materials[name] = material;
}

export interface Material {
	textures?: Texture[];
	customTextures?: Texture[];
	shader?: ShaderType;
	tech?: string;
	name?: string;
	path?: string;
}

export interface MaterialFile {
	material: MaterialData;
}

export interface MaterialData {
	name: string;
	shader: 'pbr' | 'morphed-pbr' | 'pbr-morphed-texture-transform' | 'billboard' | 'billboard-plain';
	tech: string;
	textures: texture.TextureData[];
	customTextures?: { name: string, path: string }[];
}

export async function loadMaterial(path: string, load: boolean = false, gl: WebGL2RenderingContext = null) {
	if (load) {
		await resource.loadFile<MaterialFile>(path);
	}
	const file: MaterialFile = resource.get<MaterialFile>(path);
	const material: Material = {};
	material.name = file.material.name;
	material.path = path;

	switch(file.material.shader) {
		case 'pbr': 
			material.shader = ShaderType.PBR;
			break;
		case 'morphed-pbr':
			material.shader = ShaderType.MORPHED_PBR;
			break;
		case 'pbr-morphed-texture-transform':
			material.shader = ShaderType.MORPHED_PBR_TEXTURE_TRANSFORM;
			break;
		case 'billboard':
			material.shader = ShaderType.BILLBOARD;
			break;
		case 'billboard-plain':
				material.shader = ShaderType.BILLBOARD_PLAIN;
				break;
	}

	material.tech = file.material.tech;

	material.textures = [];
	for (let textureData of file.material.textures) {
		if (load) {
			await texture.LoadTexture(gl, textureData.path, texture.getType(textureData));
		}
		material.textures[texture.getType(textureData) as number] = texture.GetTexture(textureData.path);
	}

	if(file.material.customTextures) {
		material.customTextures = [];
		for(let customTexture of file.material.customTextures) {
			if(load) {
				await texture.LoadTexture(gl, customTexture.path);
				const tex = texture.GetTexture(customTexture.path);
				tex.name = customTexture.name;
				material.customTextures.push(tex);
			} else {
				const tex = texture.GetTexture(customTexture.path);
				if(tex) {
					tex.name = customTexture.name;
					material.customTextures.push(tex);
				}
			}

		}
	}

	materials[material.name] = material;
}