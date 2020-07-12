import { ConstantBuffers, BufferDirtyFlag } from './constantbuffers';
import { ShaderType } from './shader';

const settingOptions: {[name: string]: Settings } = {};

export type SettingType = 'Gamma Correction' | 'Blending' | 'Tone Mapping' |
							'Displacement Mapping' | 'Normal Mapping' | 'Gray Scale' | 
							'Bloom' | 'Shadow Map Debug' | 'Wireframe Debug' | 'Normal Debug';

export function getSettings() {
	return settingOptions;
}

export function getSetting(key: SettingType): number {
	const setting = settingOptions[key];
	if(setting.setting !== undefined) {
		return setting.setting;
	} else {
		return setting.option;
	}
}

export function populateDefaultOptions() {
	settingOptions['Blending'] = {
		setting: Setting.ENABLED
	}
	settingOptions['Gamma Correction'] = {
		setting: Setting.DISABLED
	};
	settingOptions['Tone Mapping'] = {
		numberOfOptions: ToneMapping.MAX_TONEMAPPINGS,
		option: ToneMapping.NONE
	};
	settingOptions['Displacement Mapping'] = {
		setting: Setting.DISABLED
	};
	settingOptions['Normal Mapping'] = {
		setting: Setting.ENABLED
	};
	settingOptions['Gray Scale'] = {
		setting: Setting.DISABLED
	};
	settingOptions['Bloom'] = {
		setting: Setting.DISABLED
	};
	settingOptions['Shadow Map Debug'] = {
		setting: Setting.DISABLED
	};
	settingOptions['Wireframe Debug'] = {
		setting: Setting.DISABLED
	};
	settingOptions['Normal Debug'] = {
		numberOfOptions: NormalDebugSettings.MAX_OPTIONS,
		option: NormalDebugSettings.NONE
	};	
}

export function getSettingText(key: string) {
	const setting = settingOptions[key];
	if(setting.setting !== undefined) {
		return setting.setting === Setting.ENABLED ? 'Enabled' : 'Disabled';
	} else {
		const option = setting.option;
		switch(key) {
			case 'Normal Debug': 
				return getNormalDebugOptionText(option);
			case 'Tone Mapping':
				return getToneMapping(option);
		}
	}
	return "None";
}

function getNormalDebugOptionText(option: NormalDebugSettings) {
	switch(option) {
		case NormalDebugSettings.NONE: 
			return 'None';
			case NormalDebugSettings.NORMALS:
				return 'Normals';
			case NormalDebugSettings.NORMAL_MAP:
				return 'Normal Map';
	}
}

export function changeSetting(key: string) {
	const setting = settingOptions[key];
	if(setting.setting !== undefined) {
		setting.setting = setting.setting == Setting.ENABLED ? Setting.DISABLED : Setting.ENABLED;
	} else {
		let option = setting.option;
		option = (option + 1) % setting.numberOfOptions;
		setting.option = option;
		}
}

export interface Settings {
	setting?: Setting;
	option?: number;
	options?: any;
	numberOfOptions?: number;
}

export enum NormalDebugSettings {
	NONE = 0,
	NORMALS,
	NORMAL_MAP,
	MAX_OPTIONS
}

export enum Setting {
	DISABLED = 0,
	ENABLED = 1
}

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

export function getToneMapping(option: ToneMapping) {
	switch (option) {
		case ToneMapping.NONE: return 'Disabled';
		case ToneMapping.LINEAR: return 'Linear';
		case ToneMapping.SIMPLE_REINHARD: return 'Simple Reinhard';
		case ToneMapping.LUMA_BASED_REINHARD: return 'Luma based reinhard';
		case ToneMapping.WHITE_PRESERVING_LUMA_BASED_REINHARD: return 'White preserving luma based reinhard';
		case ToneMapping.ROM_BIN_DA_HOUSE: return 'Rom bin da house';
		case ToneMapping.FILMIC: return 'Filmic';
		case ToneMapping.UNCHARTED_2: return 'Uncharted 2';
		case ToneMapping.SIMPLE: return 'Simple';
		case ToneMapping.MY_TONEMAP: return 'Olli tonemap';
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

export let debugNormals: boolean = false;

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