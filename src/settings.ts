import { Renderer } from './glrenderer';

export type SettingType = 'Gamma Correction' | 'Blending' | 'Tone Mapping' |
							'Displacement Mapping' | 'Normal Mapping' | 'Gray Scale' | 
							'Bloom' | 'Skybox';

export type DebugSetting = 'Shadow Map Debug' | 'Normal Debug' | 'Wireframe Debug';

export type SettingValueType = 'Saturation' | 'Brightness' | 'Contrast';

export interface Settings {
	setting?: Setting;
	option?: number;
	options?: any;
	numberOfOptions?: number;
}

export enum SettingCategory {
	DEFAULT = 0,
	DEBUG = 1,
	MAX_CATEGORIES
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

export class SettingsManager {
	constructor(renderer: Renderer) {
		this.settingOptions = {};
		this.debugOptions = {};

		this.settingsCategories = [];
		this.settingsCategories[SettingCategory.DEFAULT] = this.settingOptions;
		this.settingsCategories[SettingCategory.DEBUG] = this.debugOptions;

		this.settingValues = {};

		this.renderer = renderer;
	}

	getCategories() {
		return this.settingsCategories;
	}

	public getSettings(category: SettingCategory = SettingCategory.DEFAULT) {
		return this.settingsCategories[category];
	}

	public getSetting(key: SettingType | DebugSetting, category: SettingCategory = SettingCategory.DEFAULT): number {
		const setting = this.settingsCategories[category][key];
		if(setting.setting !== undefined) {
			return setting.setting;
		} else {
			return setting.option;
		}
	}

	public populateDefaultOptions() {
		this.settingOptions['Blending'] = {
			setting: Setting.ENABLED
		}
		this.settingOptions['Gamma Correction'] = {
			setting: Setting.DISABLED
		};
		this.settingOptions['Tone Mapping'] = {
			numberOfOptions: ToneMapping.MAX_TONEMAPPINGS,
			option: ToneMapping.NONE
		};
		this.settingOptions['Displacement Mapping'] = {
			setting: Setting.DISABLED
		};
		this.settingOptions['Normal Mapping'] = {
			setting: Setting.ENABLED
		};
		this.settingOptions['Gray Scale'] = {
			setting: Setting.DISABLED
		};
		this.settingOptions['Bloom'] = {
			setting: Setting.DISABLED
		};
		this.settingOptions['Skybox'] = {
			setting: Setting.ENABLED
		};

		this.debugOptions['Shadow Map Debug'] = {
			setting: Setting.DISABLED
		};
		this.debugOptions['Wireframe Debug'] = {
			setting: Setting.DISABLED
		};
		this.debugOptions['Normal Debug'] = {
			numberOfOptions: NormalDebugSettings.MAX_OPTIONS,
			option: NormalDebugSettings.NONE
		};	

		this.changeValue('Brightness', 0.0);
		this.changeValue('Saturation', 1.0);
		this.changeValue('Contrast', 1.0);

	}

	public getSettingText(key: string, category: SettingCategory = SettingCategory.DEFAULT) {
		const setting = this.settingsCategories[category][key];
		if(setting.setting !== undefined) {
			return setting.setting === Setting.ENABLED ? 'Enabled' : 'Disabled';
		} else {
			const option = setting.option;
			switch(key) {
				case 'Normal Debug': 
					return this.getNormalDebugOptionText(option);
				case 'Tone Mapping':
					return this.getToneMapping(option);
			}
		}
		return "None";
	}

	private getNormalDebugOptionText(option: NormalDebugSettings) {
		switch(option) {
			case NormalDebugSettings.NONE: 
				return 'None';
				case NormalDebugSettings.NORMALS:
					return 'Normals';
				case NormalDebugSettings.NORMAL_MAP:
					return 'Normal Map';
		}
	}
	public changeSetting(key: string, category: SettingCategory = SettingCategory.DEFAULT) {
		const setting = this.settingsCategories[category][key];
		if(setting.setting !== undefined) {
			setting.setting = setting.setting == Setting.ENABLED ? Setting.DISABLED : Setting.ENABLED;
		} else {
			let option = setting.option;
			option = (option + 1) % setting.numberOfOptions;
			setting.option = option;
			this.makeEffect(key, setting.option);
		}
	}

	private makeEffect(key: string, optionValue: number) {
		switch(key) {
			case 'Normal Debug': 
				this.renderer.setShaderMode(optionValue);
				break;
			case 'Wireframe Debug': 
				break;
		}
	}

	public changeValue(key: SettingValueType, value: number) {
		this.settingValues[key] = value;
	}

	public getSettingValue(key: SettingValueType) {
		return this.settingValues[key];
	}

	public getToneMapping(option: ToneMapping) {
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

	private settingsCategories: {[name: string]: Settings }[];
	private settingOptions: {[name: string]: Settings };
	private debugOptions: {[name: string]: Settings };
	private settingValues: {[name: string]: number };
	public renderer: Renderer;

}