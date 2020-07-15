import { Vertex, PositionVertex, NormalVertexType, PositionVertexType, GeneralVertexType } from './vertex';
import { StaticMesh } from './mesh';
import { vec3, vec2 } from 'gl-matrix';
import * as mesh from './meshmanager';
import { Texture } from './texture';
import { FrameBuffer } from './framebuffer';
import * as math from './util/math';

export class GeometryGenerator {
	constructor() { }

	static GenerateSphere(gl: WebGL2RenderingContext, name: string, radius: number, stackCount: number, sectorCount: number) {

		const PI = 3.1415926;

		let x, y, z, xy;                              // vertex position
		let nx, ny, nz, lengthInv = 1.0 / radius;    // normal
		let s, t;                                     // texCoord

		let sectorStep = 2 * PI / sectorCount;
		let stackStep = PI / stackCount;
		let sectorAngle, stackAngle;

		const vertices: Vertex[] = [];
		const worldUp = vec3.fromValues(0, 1, 0);

		for (let i = 0; i <= stackCount; ++i) {
			stackAngle = PI / 2 - i * stackStep;        // starting from pi/2 to -pi/2
			xy = radius * Math.cos(stackAngle);             // r * cos(u)
			z = radius * Math.sin(stackAngle);              // r * sin(u)

			// add (sectorCount+1) vertices per stack
			// the first and last vertices have same position and normal, but different tex coords
			for (let j = 0; j <= sectorCount; ++j) {
				sectorAngle = j * sectorStep;           // starting from 0 to 2pi

				const vertex = new Vertex();

				// vertex position
				x = xy * Math.cos(sectorAngle);             // r * cos(u) * cos(v)
				y = xy * Math.sin(sectorAngle);             // r * cos(u) * sin(v)
				const position = vec3.fromValues(x, y, z);
				vertex.position = position;

				// normalized vertex normal
				nx = x * lengthInv;
				ny = y * lengthInv;
				nz = z * lengthInv;
				const normal = vec3.fromValues(nx, ny, nz);
				vertex.normal = normal;

				let tangent = vec3.create();
				vec3.cross(tangent, worldUp, normal);
				vertex.tangent = tangent;

				// vertex tex coord between [0, 1]
				s = j / sectorCount;
				t = i / stackCount;
				vertex.textureCoords = vec2.fromValues(s, t);

				vertices.push(vertex);
			}
		}

		const indices: number[] = [];

		function addIndices(k1: number, k2: number, k3: number) {
			indices.push(k1);
			indices.push(k2);
			indices.push(k3);
		}

		// indices
		//  k1--k1+1
		//  |  / |
		//  | /  |
		//  k2--k2+1
		let k1, k2;
		for (let i = 0; i < stackCount; ++i) {
			k1 = i * (sectorCount + 1);     // beginning of current stack
			k2 = k1 + sectorCount + 1;      // beginning of next stack

			for (let j = 0; j < sectorCount; ++j, ++k1, ++k2) {
				// 2 triangles per sector excluding 1st and last stacks
				if (i !== 0) {
					addIndices(k1, k2, k1 + 1);   // k1---k2---k1+1
				}

				if (i !== (stackCount - 1)) {
					addIndices(k1 + 1, k2, k2 + 1); // k1+1---k2---k2+1
				}

			}
		}
		const sphere = new StaticMesh(name);
		sphere.createSubmesh(gl, 'sphere', vertices, indices, 'default');
		mesh.SetMesh(name, sphere);

	}

	static GenerateCube(gl: WebGL2RenderingContext, name: string, width: number, height: number, depth: number) {

		const vertices: Vertex[] = [];

		const w2 = width / 2;
		const h2 = height / 2;
		const d2 = depth / 2;

		// front
		const vertex1 = new Vertex();
		vertex1.position = vec3.fromValues(-w2, -h2, d2);
		vertex1.normal = vec3.fromValues(0, 0, 1);
		vertex1.tangent = vec3.fromValues(1, 0, 0);
		vertex1.textureCoords = vec2.fromValues(0, 1);
		vertices.push(vertex1);

		const vertex2 = new Vertex();
		vertex2.position = vec3.fromValues(w2, -h2, d2);
		vertex2.normal = vec3.fromValues(0, 0, 1);
		vertex2.tangent = vec3.fromValues(1, 0, 0);
		vertex2.textureCoords = vec2.fromValues(1, 1);
		vertices.push(vertex2);

		const vertex3 = new Vertex();
		vertex3.position = vec3.fromValues(w2, h2, d2);
		vertex3.normal = vec3.fromValues(0, 0, 1);
		vertex3.tangent = vec3.fromValues(1, 0, 0);
		vertex3.textureCoords = vec2.fromValues(1, 0);
		vertices.push(vertex3);

		const vertex4 = new Vertex();
		vertex4.position = vec3.fromValues(-w2, h2, d2);
		vertex4.normal = vec3.fromValues(0, 0, 1);
		vertex4.tangent = vec3.fromValues(1, 0, 0);
		vertex4.textureCoords = vec2.fromValues(0, 0);
		vertices.push(vertex4);

		// right face
		let vertex = new Vertex();
		vertex.position = vec3.fromValues(w2, -h2, d2);
		vertex.normal = vec3.fromValues(1, 0, 0);
		vertex.tangent = vec3.fromValues(0, 0, -1);
		vertex.textureCoords = vec2.fromValues(0, 1);
		vertices.push(vertex);

		vertex = new Vertex();
		vertex.position = vec3.fromValues(w2, -h2, -d2);
		vertex.normal = vec3.fromValues(1, 0, 0);
		vertex.tangent = vec3.fromValues(0, 0, -1);
		vertex.textureCoords = vec2.fromValues(1, 1);
		vertices.push(vertex);

		vertex = new Vertex();
		vertex.position = vec3.fromValues(w2, h2, -d2);
		vertex.normal = vec3.fromValues(1, 0, 0);
		vertex.tangent = vec3.fromValues(0, 0, -1);
		vertex.textureCoords = vec2.fromValues(1, 0);
		vertices.push(vertex);

		vertex = new Vertex();
		vertex.position = vec3.fromValues(w2, h2, d2);
		vertex.normal = vec3.fromValues(1, 0, 0);
		vertex.tangent = vec3.fromValues(0, 0, -1);
		vertex.textureCoords = vec2.fromValues(0, 0);
		vertices.push(vertex);

		// back face
		vertex = new Vertex();
		vertex.position = vec3.fromValues(w2, -h2, -d2);
		vertex.normal = vec3.fromValues(0, 0, -1);
		vertex.tangent = vec3.fromValues(-1, 0, 0);
		vertex.textureCoords = vec2.fromValues(0, 1);
		vertices.push(vertex);

		vertex = new Vertex();
		vertex.position = vec3.fromValues(-w2, -h2, -d2);
		vertex.normal = vec3.fromValues(0, 0, -1);
		vertex.tangent = vec3.fromValues(-1, 0, 0);
		vertex.textureCoords = vec2.fromValues(1, 1);
		vertices.push(vertex);

		vertex = new Vertex();
		vertex.position = vec3.fromValues(-w2, h2, -d2);
		vertex.normal = vec3.fromValues(0, 0, -1);
		vertex.tangent = vec3.fromValues(-1, 0, 0);
		vertex.textureCoords = vec2.fromValues(1, 0);
		vertices.push(vertex);

		vertex = new Vertex();
		vertex.position = vec3.fromValues(w2, h2, -d2);
		vertex.normal = vec3.fromValues(0, 0, -1);
		vertex.tangent = vec3.fromValues(-1, 0, 0);
		vertex.textureCoords = vec2.fromValues(0, 0);
		vertices.push(vertex);

		// left face
		vertex = new Vertex();
		vertex.position = vec3.fromValues(-w2, -h2, -d2);
		vertex.normal = vec3.fromValues(-1, 0, 0);
		vertex.tangent = vec3.fromValues(0, 0, 1);
		vertex.textureCoords = vec2.fromValues(0, 1);
		vertices.push(vertex);

		vertex = new Vertex();
		vertex.position = vec3.fromValues(-w2, -h2, d2);
		vertex.normal = vec3.fromValues(-1, 0, 0);
		vertex.tangent = vec3.fromValues(0, 0, 1);
		vertex.textureCoords = vec2.fromValues(1, 1);
		vertices.push(vertex);

		vertex = new Vertex();
		vertex.position = vec3.fromValues(-w2, h2, d2);
		vertex.normal = vec3.fromValues(-1, 0, 0);
		vertex.tangent = vec3.fromValues(0, 0, 1);
		vertex.textureCoords = vec2.fromValues(1, 0);
		vertices.push(vertex);

		vertex = new Vertex();
		vertex.position = vec3.fromValues(-w2, h2, -d2);
		vertex.normal = vec3.fromValues(-1, 0, 0);
		vertex.tangent = vec3.fromValues(0, 0, 1);
		vertex.textureCoords = vec2.fromValues(0, 0);
		vertices.push(vertex);

		// left top
		vertex = new Vertex();
		vertex.position = vec3.fromValues(-w2, h2, d2);
		vertex.normal = vec3.fromValues(0, 1, 0);
		vertex.tangent = vec3.fromValues(1, 0, 0);
		vertex.textureCoords = vec2.fromValues(0, 1);
		vertices.push(vertex);

		vertex = new Vertex();
		vertex.position = vec3.fromValues(w2, h2, d2);
		vertex.normal = vec3.fromValues(0, 1, 0);
		vertex.tangent = vec3.fromValues(1, 0, 0);
		vertex.textureCoords = vec2.fromValues(1, 1);
		vertices.push(vertex);

		vertex = new Vertex();
		vertex.position = vec3.fromValues(w2, h2, -d2);
		vertex.normal = vec3.fromValues(0, 1, 0);
		vertex.tangent = vec3.fromValues(1, 0, 0);
		vertex.textureCoords = vec2.fromValues(1, 0);
		vertices.push(vertex);

		vertex = new Vertex();
		vertex.position = vec3.fromValues(-w2, h2, -d2);
		vertex.normal = vec3.fromValues(0, 1, 0);
		vertex.tangent = vec3.fromValues(1, 0, 0);
		vertex.textureCoords = vec2.fromValues(0, 0);
		vertices.push(vertex);

		// left bottom
		vertex = new Vertex();
		vertex.position = vec3.fromValues(-w2, -h2, -d2);
		vertex.normal = vec3.fromValues(0, -1, 0);
		vertex.tangent = vec3.fromValues(1, 0, 0);
		vertex.textureCoords = vec2.fromValues(0, 1);
		vertices.push(vertex);

		vertex = new Vertex();
		vertex.position = vec3.fromValues(w2, -h2, -d2);
		vertex.normal = vec3.fromValues(0, -1, 0);
		vertex.tangent = vec3.fromValues(1, 0, 0);
		vertex.textureCoords = vec2.fromValues(1, 1);
		vertices.push(vertex);

		vertex = new Vertex();
		vertex.position = vec3.fromValues(w2, -h2, d2);
		vertex.normal = vec3.fromValues(0, -1, 0);
		vertex.tangent = vec3.fromValues(1, 0, 0);
		vertex.textureCoords = vec2.fromValues(1, 0);
		vertices.push(vertex);

		vertex = new Vertex();
		vertex.position = vec3.fromValues(-w2, -h2, d2);
		vertex.normal = vec3.fromValues(0, -1, 0);
		vertex.tangent = vec3.fromValues(1, 0, 0);
		vertex.textureCoords = vec2.fromValues(0, 0);
		vertices.push(vertex);


		const indices = [
			0, 1, 2,
			0, 2, 3,

			4, 5, 6,
			4, 6, 7,

			8, 9, 10,
			8, 10, 11,

			12, 13, 14,
			12, 14, 15,

			16, 17, 18,
			16, 18, 19,

			20, 21, 22,
			20, 22, 23

		];

		const cube = new StaticMesh(name);
		cube.createSubmesh(gl, 'cube', vertices, indices, 'default');
		mesh.SetMesh(name, cube);
	}

	static GeneratePlane(gl: WebGL2RenderingContext, name: string, width: number, height: number) {

		const vertices: Vertex[] = [];

		const w2 = width / 2;
		const h2 = height / 2;

		const vertex1 = new Vertex();
		vertex1.position = vec3.fromValues(-w2, -h2, 0);
		vertex1.normal = vec3.fromValues(0, 0, 1);
		vertex1.tangent = vec3.fromValues(1, 0, 0);
		vertex1.textureCoords = vec2.fromValues(0, 1);
		vertices.push(vertex1);

		const vertex2 = new Vertex();
		vertex2.position = vec3.fromValues(w2, -h2, 0);
		vertex2.normal = vec3.fromValues(0, 0, 1);
		vertex2.tangent = vec3.fromValues(1, 0, 0);
		vertex2.textureCoords = vec2.fromValues(1, 1);
		vertices.push(vertex2);

		const vertex3 = new Vertex();
		vertex3.position = vec3.fromValues(w2, h2, 0);
		vertex3.normal = vec3.fromValues(0, 0, 1);
		vertex3.tangent = vec3.fromValues(1, 0, 0);
		vertex3.textureCoords = vec2.fromValues(1, 0);
		vertices.push(vertex3);

		const vertex4 = new Vertex();
		vertex4.position = vec3.fromValues(-w2, h2, 0);
		vertex4.normal = vec3.fromValues(0, 0, 1);
		vertex4.tangent = vec3.fromValues(1, 0, 0);
		vertex4.textureCoords = vec2.fromValues(0, 0);
		vertices.push(vertex4);

		const indices = [
			0, 1, 2,
			0, 2, 3
		];

		const plane = new StaticMesh(name);
		plane.createSubmesh(gl, 'plane', vertices, indices, 'default');
		mesh.SetMesh(name, plane);
	}

	static async GenerateTerrain(gl: WebGL2RenderingContext, name: string, heightRange: number, dimension: number, tileScale: number, tileOffset: number, heightMapFile: string) {

		const heightTexture = new Texture();
		await heightTexture.loadTexture(gl, heightMapFile, null, false);

		const framebuffer = new FrameBuffer();
		framebuffer.create(gl);
		framebuffer.bind(gl);
		framebuffer.attachTexture(gl, heightTexture, 0);
		const pixels = framebuffer.readPixels(gl, heightTexture);
		framebuffer.destroy(gl);

		function average(i: number, j: number) {

			function inBounds(n: number, m: number) {
				return n >= 0 && n < heightTexture.width &&
					m >= 0 && m < heightTexture.height;
			}

			let avg = 0;
			let num = 0;

			for (let y = j - 1; y <= j + 1; y++) {
				for (let x = i - 1; x <= i + 1; x++) {
					if (inBounds(x, y)) {
						avg += pixels[y * heightTexture.width * 4 + x * 4 + 0];
						num += 1.0;
					}
				}
			}

			return avg / num;
		}

		const heights = new Float32Array(heightTexture.width * heightTexture.height);

		function smooth() {

			for (let y = 0; y < heightTexture.height; y++) {
				for (let x = 0; x < heightTexture.width; x++) {
					heights[y * heightTexture.width + x] = average(x, y);
				}
			}
		}

		smooth();

		const vertices: Vertex[] = [];

		const w2 = heightTexture.width * 0.5;
		const h2 = heightTexture.height * 0.5;

		let xPixel = 0;
		let yPixel = 0;

		for (let y = -h2; y <= h2; y += 1) {
			for (let x = -w2; x <= w2; x += 1) {

				xPixel = x + w2;
				yPixel = y + h2;

				const xPercent = (x + w2) / heightTexture.width;
				const yPercent = (y + h2) / heightTexture.height;

				if (xPixel === w2 * 2) {
					xPixel--;
				}

				if (yPixel === h2 * 2) {
					yPixel--;
				}

				let heightValue = heights[yPixel * heightTexture.width + xPixel + 0];
				heightValue /= 255.0;

				const vertex = new Vertex();

				vertex.position = vec3.fromValues(x * dimension, heightValue * heightRange, y * dimension);
				vertex.textureCoords = vec2.fromValues(xPercent * tileScale + tileOffset, yPercent * tileScale + tileOffset);
				vertex.normal = vec3.fromValues(0, 1, 0);
				vertex.tangent = vec3.fromValues(1, 0, 0);
				vertices.push(vertex);


			}
		}

		const indices: number[] = [];

		let x = 0, y = 0;
		for (let i = 0; i < heightTexture.width; i++) {
			for (let j = 0; j < heightTexture.height; j++) {
				// first triangle
				indices.push((heightTexture.height + 1) * x + y);
				indices.push((heightTexture.height + 1) * x + y + 1);
				indices.push((heightTexture.height + 1) * (x + 1) + y);
				// second triangle
				indices.push((heightTexture.height + 1) * (x + 1) + y);
				indices.push((heightTexture.height + 1) * x + y + 1);
				indices.push((heightTexture.height + 1) * (x + 1) + y + 1);
				y++;
			}
			y = 0;
			x++;
		}

		heightTexture.destroy(gl);

		function ComputeTangentAndNormal(x: number, y: number) {
			const heightL = heights[math.clamp(y, 0, heightTexture.height - 1) * heightTexture.width + math.clamp(x - 1, 0, heightTexture.width - 1) + 0] / 255 || 0;
			const heightR = heights[math.clamp(y, 0, heightTexture.height - 1) * heightTexture.width + math.clamp(x + 1, 0, heightTexture.width - 1) + 0] / 255 || 0;
			const heightD = heights[math.clamp(y - 1, 0, heightTexture.height - 1) * heightTexture.width + math.clamp(x, 0, heightTexture.width - 1) + 0] / 255 || 0;
			const heightU = heights[math.clamp(y + 1, 0, heightTexture.height - 1) * heightTexture.width + math.clamp(x, 0, heightTexture.width - 1) + 0] / 255 || 0;

			const vertex = vertices[y * (heightTexture.width + 1) + x];
			vertex.tangent = vec3.fromValues(2.0 * dimension, (heightR - heightL) * heightRange, 0);
			vec3.normalize(vertex.tangent, vertex.tangent);
			const bitangent = vec3.fromValues(0, (heightD - heightU) * heightRange, -2.0 * dimension);
			vec3.normalize(bitangent, bitangent);
			vec3.cross(vertex.normal, vertex.tangent, bitangent);
			vec3.normalize(vertex.normal, vertex.normal);
		}

		for (let y = 0; y <= (heightTexture.height); y++) {
			for (let x = 0; x <= (heightTexture.width); x++) {
				ComputeTangentAndNormal(x, y);
			}
		}

		function AverageNormals(vertices: Vertex[], indices: number[]) {

			const normals: vec3[] = [];

			for (let i = 0; i < vertices.length; i++) {
				normals[i] = vec3.create();
			}

			for (let e = 0; e < indices.length; e += 3) {
				const v = vertices[indices[e]];
				const v2 = vertices[indices[e + 1]];
				const v3 = vertices[indices[e + 2]];

				vec3.add(normals[indices[e]], normals[indices[e]], v.normal);
				vec3.add(normals[indices[e + 1]], normals[indices[e + 1]], v.normal);
				vec3.add(normals[indices[e + 2]], normals[indices[e + 2]], v.normal);

				vec3.add(normals[indices[e]], normals[indices[e]], v2.normal);
				vec3.add(normals[indices[e + 1]], normals[indices[e + 1]], v2.normal);
				vec3.add(normals[indices[e + 2]], normals[indices[e + 2]], v2.normal);

				vec3.add(normals[indices[e]], normals[indices[e]], v3.normal);
				vec3.add(normals[indices[e + 1]], normals[indices[e + 1]], v3.normal);
				vec3.add(normals[indices[e + 2]], normals[indices[e + 2]], v3.normal);
			}

			// normalize normals
			for (let i = 0; i < vertices.length; i += 3) {
				vec3.normalize(normals[i], normals[i]);
			}
			// set normals to vertices
			for (let i = 0; i < vertices.length; i += 3) {
				vertices[i].normal = normals[i];
			}
		}

		//	AverageNormals(vertices, indices);

		const terrain = new StaticMesh(name);
		terrain.createSubmesh(gl, 'terrain', vertices, indices, 'default');
		mesh.SetMesh(name, terrain);
	}

	static async GeneratePlaneTerrain(gl: WebGL2RenderingContext, name: string, dimension: number, numSections: number, tileScale: number, tileOffset: number) {

		const vertices: Vertex[] = [];

		const w2 = numSections * 0.5;
		const h2 = numSections * 0.5;

		for (let x = -w2; x <= w2; x += 1) {
			for (let y = - h2; y <= h2; y += 1) {

				const xPercent = (x + w2) / w2 * 2;
				const yPercent = (y + h2) / h2 * 2;

				const vertex = new Vertex();

				vertex.position = vec3.fromValues(x * dimension, 0, y * dimension);
				vertex.textureCoords = vec2.fromValues(xPercent * tileScale + tileOffset, yPercent * tileScale + tileOffset);
				vertex.normal = vec3.fromValues(0, 1, 0);
				vertex.tangent = vec3.fromValues(1, 0, 0);
				vertices.push(vertex);


			}
		}

		const indices: number[] = [];

		let x = 0, y = 0;
		for (let i = 0; i < numSections; i++) {
			for (let j = 0; j < numSections; j++) {
				// first triangle
				indices.push((numSections + 1) * x + y);
				indices.push((numSections + 1) * x + y + 1);
				indices.push((numSections + 1) * (x + 1) + y);
				// second triangle
				indices.push((numSections + 1) * (x + 1) + y);
				indices.push((numSections + 1) * x + y + 1);
				indices.push((numSections + 1) * (x + 1) + y + 1);
				y++;
			}
			y = 0;
			x++;
		}

		const terrain = new StaticMesh(name);
		terrain.createSubmesh(gl, 'terrain', vertices, indices, 'default');
		mesh.SetMesh(name, terrain);
		//terrain.wireFrame = true;
	}

	static GenerateCylinder(gl: WebGL2RenderingContext, name: string, radius: number, numSegmentsAngle, numSegments: number, height: number) {
		
		const vertices: Vertex[] = [];

		for(let angle = 0; angle <= 2 * Math.PI; angle += (2 * Math.PI) / numSegmentsAngle) {
			for(let i = 0; i <= numSegments; i++) {
				const vertex = new Vertex();
				vertex.position = vec3.fromValues(Math.cos(angle) * radius, (height / numSegments) * i, Math.sin(angle) * radius);
				vertex.normal = vec3.fromValues(vertex.position[0], 0, vertex.position[2]);
				vec3.normalize(vertex.normal, vertex.normal);
				vertex.tangent = vec3.fromValues(Math.sin(angle), 0, -Math.cos(angle));
				vertex.textureCoords = vec2.fromValues(angle / (2.0 * Math.PI), vertex.position[1] / height);
				vertices.push(vertex);
			}
		}

		const indices: number[] = [];

		let x = 0, y = 0;
		for (let i = 0; i < numSegmentsAngle; i++) {
			for (let j = 0; j < numSegments; j++) {
				// first triangle
				indices.push((numSegments + 1) * x + y);
				indices.push((numSegments + 1) * x + y + 1);
				indices.push((numSegments + 1) * (x + 1) + y);
				// second triangle
				indices.push((numSegments + 1) * (x + 1) + y);
				indices.push((numSegments + 1) * x + y + 1);
				indices.push((numSegments + 1) * (x + 1) + y + 1);
				y++;
			}
			y = 0;
			x++;
		}

		const cylinder = new StaticMesh(name);
		cylinder.createSubmesh(gl, 'cylinder', vertices, indices, 'default');
		mesh.SetMesh(name, cylinder);
	}

	static ComputeTangents(vertices: GeneralVertexType[], indices: number[]) {

		for (let i = 0; i < indices.length; i += 3) {

			const v = vertices[indices[i]];
			const v2 = vertices[indices[i + 1]];
			const v3 = vertices[indices[i + 2]];

			const edge1 = vec3.create();
			vec3.sub(edge1, v2.position, v.position);

			const edge2 = vec3.create();
			vec3.sub(edge2, v3.position, v.position);

			const deltaUV1 = vec2.create();
			vec2.sub(deltaUV1, v2.textureCoords, v.textureCoords);
			const deltaUV2 = vec2.create();
			vec2.sub(deltaUV2, v3.textureCoords, v.textureCoords);

			const f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);

			const tangent = vec3.create();
			tangent[0] = f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]);
			tangent[1] = f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]);
			tangent[2] = f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]);
			vec3.normalize(tangent, tangent);

			v.tangent = tangent;
			v2.tangent = tangent;
			v3.tangent = tangent;
		}

	}

	static ComputeNormals(vertices: PositionVertexType[], indices: number[]) {

		const normals: vec3[] = [];

		for (let i = 0; i < vertices.length; i++) {
			normals[i] = vec3.create();
		}

		// calculate normals with cross product
		for (let e = 0; e < indices.length; e += 3) {
			const v = vertices[indices[e]];
			const v2 = vertices[indices[e + 1]];
			const v3 = vertices[indices[e + 2]];

			const a = v.position
			const b = v2.position;
			const c = v3.position;
			// cross product
			const n = vec3.create();
			const CB = vec3.create();
			vec3.sub(CB, c, b);
			const AB = vec3.create();
			vec3.sub(AB, a, b);
			vec3.cross(n, CB, AB);

			// add normals to every participating vertex
			normals[indices[e]][0] += n[0];
			normals[indices[e]][1] += n[1];
			normals[indices[e]][2] += n[2];

			normals[indices[e + 1]][0] += n[0];
			normals[indices[e + 1]][1] += n[1];
			normals[indices[e + 1]][2] += n[2];

			normals[indices[e + 2]][0] += n[0];
			normals[indices[e + 2]][1] += n[1];
			normals[indices[e + 2]][2] += n[2];
		}

		// normalize normals
		for (let i = 0; i < vertices.length; i += 3) {
			vec3.normalize(normals[i], normals[i]);
		}
		// set normals to vertices
		for (let i = 0; i < vertices.length; i += 3) {
			((vertices[i] as unknown) as NormalVertexType).normal = normals[i];
		}
	}

	static computeTangentAndNormal(x: number, y: number, vertices: Vertex[], numSections: number, dimension: number) {
		const heightL = vertices[math.clamp(y, 0, numSections - 1) * numSections + math.clamp(x - 1, 0, numSections - 1)].position[1] || 0;
		const heightR = vertices[math.clamp(y, 0, numSections - 1) * numSections + math.clamp(x + 1, 0, numSections - 1)].position[1] || 0;
		const heightD = vertices[math.clamp(y - 1, 0, numSections - 1) * numSections + math.clamp(x, 0, numSections - 1)].position[1] || 0;
		const heightU = vertices[math.clamp(y + 1, 0, numSections - 1) * numSections + math.clamp(x, 0, numSections - 1)].position[1] || 0;

		const vertex = vertices[y * (numSections + 1) + x];
		vertex.tangent = vec3.fromValues(2.0 * dimension, (heightR - heightL), 0);
		vec3.normalize(vertex.tangent, vertex.tangent);
		const bitangent = vec3.fromValues(0, (heightD - heightU), -2.0 * dimension);
		vec3.normalize(bitangent, bitangent);
		vec3.cross(vertex.normal, vertex.tangent, bitangent);
		vec3.normalize(vertex.normal, vertex.normal);
	}
}

