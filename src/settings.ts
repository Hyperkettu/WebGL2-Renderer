import { ConstantBuffers, BufferDirtyFlag } from './constantbuffers';
import { ShaderType } from './shader';

export enum ToneMapping {
	NONE = 0,
	LINEAR,
	SIMPLE_REINHARD,
	LUMA_BASED_REINHARD,
	WHITE_PRESERVING_LUMA_BASED_REINHARD,
	ROM_BIN_DA_HOUSE,
	FILMIC,
	UNCHARTED_2,
	SIMPLE,
	MY_TONEMAP,
	MAX_TONEMAPPINGS
}

export function getToneMapping() {
	switch (enableToneMapping) {
		case ToneMapping.NONE: return 'disabled';
		case ToneMapping.LINEAR: return 'linear';
		case ToneMapping.SIMPLE_REINHARD: return 'simple reinhard';
		case ToneMapping.LUMA_BASED_REINHARD: return 'luma based reinhard';
		case ToneMapping.WHITE_PRESERVING_LUMA_BASED_REINHARD: return 'white preserving luma based reinhard';
		case ToneMapping.ROM_BIN_DA_HOUSE: return 'rom bin da house';
		case ToneMapping.FILMIC: return 'filmic';
		case ToneMapping.UNCHARTED_2: return 'uncharted 2';
		case ToneMapping.SIMPLE: return 'simple';
		case ToneMapping.MY_TONEMAP: return 'olli tonemap';
	}
}



export let enableGammaCorrection: number = 1;

export function setEnableGammaCorrection(value: boolean) {
	enableGammaCorrection = value ? 1 : 0;
	ConstantBuffers.UpdateBuffer(BufferDirtyFlag.SELDOM, ShaderType.PBR);
}

export let enableToneMapping: number = ToneMapping.MY_TONEMAP;

export function setEnableToneMapping() {
	enableToneMapping = (enableToneMapping + 1) % ToneMapping.MAX_TONEMAPPINGS;
	ConstantBuffers.UpdateBuffer(BufferDirtyFlag.SELDOM, ShaderType.PBR);

}

export let enableDisplacement: number = 0;

export function setEnableDisplacement(value: boolean) {
	enableDisplacement = value ? 1 : 0;
	ConstantBuffers.UpdateBuffer(BufferDirtyFlag.SELDOM, ShaderType.PBR);

}

export let displacementFactor = 0;

export function addDisplacementFactor(delta: number) {
	displacementFactor += delta;
	ConstantBuffers.UpdateBuffer(BufferDirtyFlag.SELDOM, ShaderType.PBR);
}

export let enableNormalMap: number = 1;

export function setEnableNormalMap(value: boolean) {
	enableNormalMap = value ? 1 : 0;
	ConstantBuffers.UpdateBuffer(BufferDirtyFlag.SELDOM, ShaderType.PBR);

}

export let enableSkybox: boolean = true;

export function setEnableSkybox(value: boolean) {
	enableSkybox = value;
}

export let enableGrayScale: boolean = false;

export function setEnableGrayScale(value: boolean) {
	enableGrayScale = value;
	ConstantBuffers.UpdateBuffer(BufferDirtyFlag.SELDOM, ShaderType.PBR);
}

export let enableBloom: boolean = false;

export function setEnableBloom(value: boolean) {
	enableBloom = value;
}

export let enableShadowMapDebug: boolean = false;

export function setEnableShadowMapDebug(value: boolean) {
	enableShadowMapDebug = value;
}

export let enableBlending: boolean = false;

export function setEnableBlending(value: boolean) {
	enableBlending = value;
}

export let debugNormals: boolean = true;

export function setEnableDebugNormals(debug: boolean) {
	debugNormals = debug;
}

export let debugWireFrame: boolean = false;

export function setEnabledDebugWireframe(debug: boolean) {
	debugWireFrame = debug;
}

export let saturation: number = 1.4;

export function setSaturation(value: number) {
	saturation = value;
}

export let contrast: number = 1.2;

export function setContrast(value: number) {
	contrast = value;
}

export let brightness: number = 0;

export function setBrightness(value: number) {
	brightness = value;
}