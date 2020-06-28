import { Overlay } from "../overlay";
import { Text } from './text';
import { vec2 } from "gl-matrix";
import { Container } from "../container";
import { Renderer } from "../../glrenderer";
import { Button } from "./button";
import { Element } from "./element";
import * as math from '../../util/math';
import * as resource from "../../resource";
import * as textelement from './text';
import { Sprite } from "../sprite";
import { UISprite } from "./sprite";

const layouts: { [name: string]: UILayout } = {};

export function get(name: string) {
    return layouts[name];
}

export type ElementDataType = 'button' | 'text' | 'sprite';
export type ElementType = Element | Button | Text;

export interface LayoutFile {
    logicalSize: vec2;
    atlasFile: string;
    elements?: ElementData[];
}

export interface ElementData {
    name: string;
    position: vec2;
    rotation: number;
    scale: vec2;
    anchor?: vec2;
    type: ElementDataType;
    children?: ElementData[];
}

export interface ButtonData extends ElementData {
    textData: TextData;
    spriteData: SpriteData;
}

export interface TextData extends ElementData {
    text: string;
    atlasText?: AtlasTextData;
}

export interface SpriteData extends ElementData {
    path: string;
}

export interface AtlasTextData {
    letterWidth: number;
    letterHeight: number;
    letterStyle: 'normal' | 'tilted';
    lineWidth: number;
    textAppearAnimation: textelement.TextAnimation;
}



export class UILayout {
    constructor(renderer: Renderer, overlay: Overlay, logicalSize: vec2) {
        this.renderer = renderer;
        this.overlay = overlay;
        this.logicalSize = logicalSize;
        this.children = [];
        this.root = new Container('root');
//        this.overlay.stage.root.addChild(this.root);

        this.size = vec2.create();
        const size = vec2.fromValues(window.innerWidth, window.innerHeight);
        this.resize(size);

    }

    static async loadFromFile(renderer: Renderer, fileName: string) {
        const file: LayoutFile = await resource.loadFile<LayoutFile>(fileName);
        const layout = new UILayout(renderer, renderer.overlay, file.logicalSize);
        await renderer.overlay.textureAtlas.loadFromJson(renderer.gl, file.atlasFile, renderer);

        for(let elementData of file.elements) {
            let element: ElementType = null;

            switch(elementData.type) {
                case 'button':
                    const data = elementData as ButtonData;
                    const sprite = layout.createSprite(data.spriteData);
                    const text = layout.createText(data.textData);
                    element = layout.createButton(data, sprite, text);
                    break;
                case 'text':
                    element = layout.createText(elementData as TextData);
                    break;
                    case 'sprite':
                        element = layout.createUISprite(elementData as SpriteData);
                        break;
                default: 
                    break;
            }

            layout.addElement(element);
        }

        layouts[fileName] = layout;
    }

    toJson() {

        const fileData: LayoutFile = { 
            logicalSize: this.logicalSize,
            atlasFile: 'images/atlas.json'
         };

         fileData.elements = [];

        for(let element of this.children) {
            fileData.elements.push(element.toJson());
        }

        return JSON.stringify(fileData);
    }

    createButton(data: ButtonData, sprite: Sprite, text: Text) {
        const button = new Button(data.name, this.overlay, sprite, text);
        button.setPosition(data.position);
        button.setScale(data.scale);
        button.setRotation(data.rotation);
        return button;
    }

    createSprite(data: SpriteData) {
        const sprite = new Sprite(data.name, this.overlay.textureAtlas.subtextures[data.path]);
        sprite.setPosition(data.position);
        sprite.setScale(data.scale);
        sprite.setAngle(data.rotation);
        if(data.anchor) {
            sprite.setAnchor(data.anchor[0], data.anchor[1]);
        }
        return sprite;
    }

    createUISprite(data: SpriteData) {
        const sprite = new UISprite(data.name, this.overlay, { 
            path: data.path
        });
        sprite.setPosition(data.position);
        sprite.setScale(data.scale);
        sprite.setRotation(data.rotation);
        if(data.anchor) {
            sprite.setAnchor(data.anchor);
        }
        return sprite;
    }

    createText(data: TextData) {
        
        const text = new Text(data.name, this.overlay, { 
			atlas: this.overlay.textureAtlas,
			gapInPixels: data.atlasText.letterWidth, 
			style: data.atlasText.letterStyle,
			lineHeight: data.atlasText.letterHeight,
			lineWidth: data.atlasText.lineWidth,
			textAppearAnimation: data.atlasText.textAppearAnimation
         });
         
         text.setText(data.text);
         text.setPosition(data.position);
         text.setRotation(data.rotation);
		 text.setScale(data.scale);
    
         if(data.anchor) {
            text.container.setAnchor(data.anchor[0], data.anchor[1]);
        }
         
         return text;
    } 

    addElement<T extends Element>(element: T) {
        this.root.addChild(element.container);
        this.children.push(element);
    }
    
    find<T extends Element>(name: string) {
        for(let child of this.children) {
            if(child.name === name) {
                return child;
            }
            const element = child.find<T>(name);

            if(element) {
                return element as (T extends Element ? T : Element);
            }
        }

        return undefined;
    }

    mapToScreen(vector: vec2, size: vec2) {
        const screenSize = vec2.create();
        const scale = Math.min(size[0] / this.logicalSize[0], size[1] / this.logicalSize[1]);
        vec2.scale(screenSize, vector, scale);
        return screenSize;
    }

    mapToLogical(vector: vec2, size: vec2) {
        const scale = this.mapToScreen(vec2.fromValues(1,1), size);
        const logical = vec2.create();
        vec2.scale(logical, vector, 1 / scale[0]);
        return logical;
    }

    resize(size: vec2) {
        if(this.size[0] !== size[0] || this.size[1] !== size[1]) {
            this.size = size;
            const scale = this.mapToScreen(vec2.fromValues(1,1), this.size);
            this.root.setScale(scale);

            for(let child of this.children) {
                
                const position = this.mapToLogical(child.position, this.size);
                child.container.setPosition(position);
            }
        }
    }

    renderer: Renderer;

    size: vec2;

    children: Element[];

    root: Container;
    logicalSize: vec2;
    overlay: Overlay;
}