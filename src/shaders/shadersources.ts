// overlay
import * as overlayVs from './overlayvs';
import * as overlayFs from './overlayfs';

// particle systems
import * as billboardParticleFS from './billboardparticlefs';
import * as billboardParticleVS from './billboardparticlevs';
import * as particleUpdateVS from './particleupdatevs';
import * as particleUpdateFS from './particleupdatefs';

// terrain
import * as terrain from './terrain';

// visualization
import * as visualizeTerrainNormalMaps from './visualizenormalmapsterrainfs';
import * as visualizeNormals from './visualizenormalsfs';
import * as visuzalizeDepthCubemapFS from './cubemapdepthfs';
import * as visualizeDepthFS from './visualizedepthfs';

// shadow map
import * as shadowMapVS from './shadowmapvs';
import * as shadowMapFS from './shadowmapfs';

// post process
import * as sharpEdgeFS from './sharpedgefs';
import * as gaussianBlurFS from './gaussianblurfs';
import * as bloomFS from './bloomfs';
import * as grayScaleFS from './grayscalefs';
import * as toneMappingFS from './tonemappingfs';
import * as inversionFS from './inversionfs';

// fill screen
import * as fillScreenVS from './fillscreenvs';
import * as fillScreenFS from './fillscreenfs';

// skybox
import * as skyboxVS from './skyboxvs';
import * as skyboxFS from './skyboxfs';

// precompute PBR
import * as prefilterVS from './prefiltervs';
import * as prefilterFS from './prefilterfs';
import * as irradianceVS from './irradiancevs';
import * as irradianceFS from './irradiancefs';
import * as brdfFS from './brdffs';

// PBR
import * as pbrStatic from './pbrstatic';
import * as pbrMorphed from './pbrmorphed';

const prefixToShaderSource: {[name: string]: string } = {};

export function getShaderSource(prefix: string) {
	return prefixToShaderSource[prefix];
}

export function init() {

	// overlay
	prefixToShaderSource[overlayVs.prefix] = overlayVs.overlayVsSrc;
	prefixToShaderSource[overlayFs.prefix] = overlayFs.overlayFsSrc;

	// particle effects
	prefixToShaderSource[billboardParticleVS.prefix] = billboardParticleVS.billboardParticleVsSrc;
	prefixToShaderSource[billboardParticleFS.prefix] = billboardParticleFS.billboardParticleFsSrc;

	prefixToShaderSource[particleUpdateVS.prefix] = particleUpdateVS.particleUpdateVsSrc;
	prefixToShaderSource[particleUpdateFS.prefix] = particleUpdateFS.particleUpdateFsSrc;

	// visualization
	prefixToShaderSource[visualizeTerrainNormalMaps.prefix] = visualizeTerrainNormalMaps.visualizeNormalMapsTerrainFsSrc;
	
	const visNormals = visualizeNormals.getVisualizeNormalsShaderSource(false);
	const visNormalMap = visualizeNormals.getVisualizeNormalsShaderSource(true);
	prefixToShaderSource[`${visualizeNormals.prefix}/normals`] = visNormals;	
	prefixToShaderSource[`${visualizeNormals.prefix}/normalMap`] = visNormalMap;

	prefixToShaderSource[visuzalizeDepthCubemapFS.prefix] = visuzalizeDepthCubemapFS.cubemapDepthFsSrc;
	prefixToShaderSource[visualizeDepthFS.prefix] = visualizeDepthFS.visualizeDepthFsSrc;

	// shadow map
	prefixToShaderSource[shadowMapVS.prefix] = shadowMapVS.shadowMapVsSrc;
	prefixToShaderSource[shadowMapFS.prefix] = shadowMapFS.shadowMapFsSrc;

	// post process
	prefixToShaderSource[sharpEdgeFS.prefix] = sharpEdgeFS.sharpEdgesFsSrc;
	prefixToShaderSource[gaussianBlurFS.prefix] = gaussianBlurFS.gaussianBlurFsSrc;
	prefixToShaderSource[bloomFS.prefix] = bloomFS.bloomFsSrc;
	prefixToShaderSource[grayScaleFS.prefix] = grayScaleFS.grayScaleFsSrc;
	prefixToShaderSource[toneMappingFS.prefix] = toneMappingFS.tonemappingFsSrc;
	prefixToShaderSource[inversionFS.prefix] = inversionFS.inversionFsSrc;

	// fill screen
	prefixToShaderSource[fillScreenVS.prefix] = fillScreenVS.fillScreenVsSrc;
	prefixToShaderSource[fillScreenFS.prefix] = fillScreenFS.fillScreenFsSrc;

	// skybox
	prefixToShaderSource[skyboxVS.prefix] = skyboxVS.skyboxVsSrc;
	prefixToShaderSource[skyboxFS.prefix] = skyboxFS.skyboxFsSrc;

	// pbr precompute
	prefixToShaderSource[prefilterVS.prefix] = prefilterVS.prefilterVsSrc;
	prefixToShaderSource[prefilterFS.prefix] = prefilterFS.prefilterFsSrc;
	prefixToShaderSource[irradianceVS.prefix] = irradianceVS.irradianceVsSrc;
	prefixToShaderSource[irradianceFS.prefix] = irradianceFS.irradianceFsSrc;
	prefixToShaderSource[brdfFS.prefix] = brdfFS.brdfFsSrc;

	// pbr
	const techs = iteratePBR(terrain.getTerrainSrc);

	for(let technique in techs) {
		const sources = techs[technique];
		prefixToShaderSource[`${terrain.prefixVS}/${technique}`] = sources.vsSrc;
		prefixToShaderSource[`${terrain.prefixFS}/${technique}`] = sources.fsSrc;

	}

	const staticPbrTechs = iteratePBR(pbrStatic.getPbrSrc);

	for(let technique in staticPbrTechs) {
		const sources = staticPbrTechs[technique];
		prefixToShaderSource[`${pbrStatic.prefixVS}/${technique}`] = sources.vsSrc;
		prefixToShaderSource[`${pbrStatic.prefixFS}/${technique}`] = sources.fsSrc;

	}

	const morphedPbrTechs = iteratePBR(pbrMorphed.getPbrSrc);

	for(let tech in morphedPbrTechs) {
		const sources = morphedPbrTechs[tech];
		prefixToShaderSource[`${pbrMorphed.prefixVS}/${tech}`] = sources.vsSrc;
		prefixToShaderSource[`${pbrMorphed.prefixFS}/${tech}`] = sources.fsSrc;

	}	
}

function iteratePBR(func: (normal: boolean, roughness: boolean, metallic: boolean, ao: boolean, displacement: boolean, emission: boolean) => {vsSrc: string, fsSrc: string } ) {

		const techSources: { [name: string]: { vsSrc: string, fsSrc: string } } = {};

		for (let emission = 0; emission < 2; emission++) {
			for (let displacement = 0; displacement < 2; displacement++) {
				for (let ao = 0; ao < 2; ao++) {
					for (let metallic = 0; metallic < 2; metallic++) {
						for (let roughness = 0; roughness < 2; roughness++) {
							for (let normal = 0; normal < 2; normal++) {
								let techName = 'A';

								if (normal === 1) {
									techName += 'N';
								}
								if (roughness === 1) {
									techName += 'R';
								}
								if (metallic === 1) {
									techName += 'M';
								}
								if (ao === 1) {
									techName += 'A';
								}
								if (displacement === 1) {
									techName += 'D';
								}
								if (emission === 1) {
									techName += 'E';
								}

								techSources[techName] = func(normal === 1,
									roughness === 1, metallic === 1, ao === 1, displacement === 1, emission === 1);
							}
						}
					}
				}
			}
		}

	return techSources;
}

