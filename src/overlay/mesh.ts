import { SpriteVertex } from '../vertex';
import { VertexArrayObject } from '../vertexarrayobject';
import { VertexDataType } from '../vertexbuffer';
import { Sprite } from './sprite';
import { Overlay } from './overlay';
import { TextureCoordinate } from '../subtexture';

export class OverlayMesh {

    static VERTICES_PER_SPRITE = 4;
    static COMPONENTS_PER_SPRITE_VERTEX = 20;

    constructor(gl: WebGL2RenderingContext, batchSize: number) {
        this.batchSize = batchSize;
        const indices = this.computeIndicesForBatch();
        this.vao = new VertexArrayObject(gl, null, indices, VertexDataType.SPRITE_VERTEX);
    }

    updateMesh(gl: WebGL2RenderingContext, sprites: Sprite[]) {
        const positions = [
            0.0, 1.0,
            1.0, 1.0,
            0.0, 0.0,
            1.0, 0.0
        ];
    
        const texCoords = [
            0.0, 1.0,
            1.0, 1.0,
            0.0, 0.0,
            1.0, 0.0
        ];

        for(let index = 0; index < sprites.length; index++) {
            const sprite = sprites[index];
            for(let vertex = 0; vertex < OverlayMesh.VERTICES_PER_SPRITE; vertex++) {
                const baseIndex = (OverlayMesh.VERTICES_PER_SPRITE * index + vertex) 
                * OverlayMesh.COMPONENTS_PER_SPRITE_VERTEX;
               // OverlayMesh.VERTICES_PER_SPRITE * vertex;

                this.vao.vertexBuffer.floatArray[baseIndex + 0] = positions[2 * vertex + 0];
                this.vao.vertexBuffer.floatArray[baseIndex + 1] = positions[2 * vertex + 1];

                this.vao.vertexBuffer.floatArray[baseIndex + 2] = sprite.texture.textureCoordinates[vertex][0];
                this.vao.vertexBuffer.floatArray[baseIndex + 3] = sprite.texture.textureCoordinates[vertex][1];

                this.vao.vertexBuffer.floatArray[baseIndex + 4] = sprite.tintColor[0];
                this.vao.vertexBuffer.floatArray[baseIndex + 5] = sprite.tintColor[1];
                this.vao.vertexBuffer.floatArray[baseIndex + 6] = sprite.tintColor[2];
                this.vao.vertexBuffer.floatArray[baseIndex + 7] = sprite.alpha;

                this.vao.vertexBuffer.floatArray[baseIndex + 8] = sprite.worldTransform[0];
                this.vao.vertexBuffer.floatArray[baseIndex + 9] = sprite.worldTransform[1];
                this.vao.vertexBuffer.floatArray[baseIndex + 10] = sprite.worldTransform[2];
                this.vao.vertexBuffer.floatArray[baseIndex + 11] = 5

                this.vao.vertexBuffer.floatArray[baseIndex + 12] = sprite.worldTransform[3];
                this.vao.vertexBuffer.floatArray[baseIndex + 13] = sprite.worldTransform[4];
                this.vao.vertexBuffer.floatArray[baseIndex + 14] = sprite.worldTransform[5];
                this.vao.vertexBuffer.floatArray[baseIndex + 15] = 7.5

                this.vao.vertexBuffer.floatArray[baseIndex + 16] = sprite.worldTransform[6];
                this.vao.vertexBuffer.floatArray[baseIndex + 17] = sprite.worldTransform[7];
                this.vao.vertexBuffer.floatArray[baseIndex + 18] = sprite.worldTransform[8];
                this.vao.vertexBuffer.floatArray[baseIndex + 19] = 10
            }
        }

        this.vao.updateVertexBuffer(gl);
    }

    computeIndicesForBatch() {
        const VERTICES_PER_SPRITE = 4;
        const indices: number[] = [];
        for(let index = 0 ; index < this.batchSize; index++) {
            indices.push(0 + index * VERTICES_PER_SPRITE);
            indices.push(2 + index * VERTICES_PER_SPRITE);
            indices.push(1 + index * VERTICES_PER_SPRITE);

            indices.push(2 + index * VERTICES_PER_SPRITE);
            indices.push(3 + index * VERTICES_PER_SPRITE);
            indices.push(1 + index * VERTICES_PER_SPRITE);
        }
        return indices;
    }

   // vertices: SpriteVertex[];
    vao: VertexArrayObject<SpriteVertex>;
    batchSize: number;
}