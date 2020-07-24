import { Texture } from "./texture";
import * as appUtil from './app/util';
import * as math from './util/math';
import { Renderer } from "./glrenderer";
import { Color } from './util/color';
import * as texture from './texturemanager';

export interface FontDef {
    fontSize: number;
    family: string;
    fillStyle: string; 
    textAlign: CanvasTextAlign;
    textBaseLine: CanvasTextBaseline; 
    gradient?: Color[];
    strokeThickness?: number;
    strokeColor?: string;
}

export class TextTexture extends Texture {

    static MAX_WIDTH = 256;

    constructor() {
        super();
    }
    
    generateFromCanvas(gl: WebGL2RenderingContext, text: string, fontDef: FontDef) {
      
        const textSize = fontDef.fontSize;
        
        const canvas = document.createElement('canvas');
        
        const context = canvas.getContext("2d");
        context.textAlign = fontDef.textAlign;
        context.textBaseline = fontDef.textBaseLine;     
        context.font = textSize + "px " + fontDef.family.toLowerCase();
        
        const textWidth = context.measureText(text).width;
        const width = math.getPowerOfTwo(textWidth * 2);
        const height = math.getPowerOfTwo(2 * textSize);
        canvas.width = width;
        canvas.height = height;
        
        context.fillStyle = fontDef.gradient ? this.getGradient(context, fontDef.gradient, canvas.width) : fontDef.fillStyle;
        context.font = textSize + "px " + fontDef.family.toLowerCase();
        context.textAlign = fontDef.textAlign;
        context.textBaseline = fontDef.textBaseLine;
        
        context.fillText(text, canvas.width / 2, canvas.height / 2 + textSize * 0.25);

        if(fontDef.strokeColor && fontDef.strokeThickness) {  
            context.strokeStyle = fontDef.strokeColor;
            context.lineWidth = fontDef.strokeThickness;
            context.strokeText(text, canvas.width / 2, canvas.height / 2 + textSize * 0.25);
        }
        
        this.width = canvas.width;
        this.height = canvas.height;

        this.loadTextureFromCanvas(gl, canvas);
        texture.setTexture('text-' + text.substring(0, 5), this);
    }

    private loadTextureFromCanvas(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
        this.textureId = gl.createTexture();
        this.generateWebGLTexture(gl, canvas);
    }
    
    private generateWebGLTexture(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
    //    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, this.textureId);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas); 
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    //    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    }

    private getGradient(context: CanvasRenderingContext2D , colors: Color[], width: number) {
        const gradient = context.createLinearGradient(0, 0, width, 0);

        let value = 0;
        for(let color of colors) {
            gradient.addColorStop(value / colors.length, `rgba(${color.r * 255},${color.g * 255},${color.b * 255},${color.a})`);
            value++;
        }
        return gradient;
    }
}