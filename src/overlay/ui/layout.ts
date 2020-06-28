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
import { AnimationData, Animation } from "../animationsystem";

const layouts: { [name: string]: UILayout } = {};

export function get(name: string) {
    return layouts[name];
}

export type ElementDataType = 'button' | 'text' | 'sprite';
export type ElementType = Element | Button | Text;
export type ClickHandler = (x: number, y: number) => boolean;

export interface LayoutFile {
    logicalSize: vec2;
    atlasFile: string;
    elements?: ElementData[];
    actions: AnimationData[];
    events: { [ name: string ]: EventData };
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

export interface EventData {
    name: string; 
    actions: string[];
}

export class UILayout {
    constructor(renderer: Renderer, overlay: Overlay, logicalSize: vec2) {
        this.renderer = renderer;
        this.overlay = overlay;
        this.logicalSize = logicalSize;
        this.children = [];
        this.root = new Container('root');

        this.clickHandlers = [];
        this.releaseClickHandlers = [];

        this.size = vec2.create();
        const size = vec2.fromValues(window.innerWidth, window.innerHeight);
        this.resize(size);

    }

    async runAnimation(elementName: string, animationName: string, settings: { instant: boolean }) {
        let animationData: AnimationData = null;
        for(let animation of this.animations) {
            if(elementName === animation.elementName && animationName === animation.animationName) {
                animationData = animation;
            }
        }
 
        const promise =  new Promise<void>(resolve => {
            const animation = this.createAnimation(animationData);
            animation.setEndCallback(() => {
                resolve();
            });
            this.overlay.startAnimation([animation], settings.instant);
        });
        await promise;
    }

    async event(name: string, settings: { instant: boolean } = { instant: false }) {

        const event = this.events[name];
        const actions: string[] = [];

        for(let action of event.actions){
            actions.push(action);
        }

        while(actions.length > 0) {

            const action = actions.shift();
            const animationDatas: AnimationData[] = [];
            for(let data of this.animations) {
                if(data.animationName === action) {
                    animationDatas.push(data);
                }
            }

            const promises: Promise<void>[] = [];

            for(let animationData of animationDatas) {
                const promise =  new Promise<void>(resolve => {
                    const animation = this.createAnimation(animationData);
                    animation.setEndCallback(() => {
                        resolve();
                    });
                    this.overlay.startAnimation([animation], settings?.instant);
                    if(settings?.instant) {
                        resolve();
                    }
                });
                promises.push(promise);
            }
            await Promise.all(promises);
        }
        
    }

    createAnimation(data: AnimationData) {
        const animation = new Animation(data.animationName, this.find(data.elementName).container, 
        data.target, data.easing, data.duration, data.type, data.delay);
        animation.setFrom(data.from);
        animation.setTo(data.to);
        return animation;
    }

    static async loadLayouts(renderer: Renderer, filePaths: string[]) {
        const promises: Promise<void>[] = [];
        for(let filePath of filePaths) {
            promises.push(UILayout.loadFromFile(renderer, filePath));
        }

        await Promise.all(promises);
    }

    static async loadFromFile(renderer: Renderer, fileName: string) {
        const file: LayoutFile = await resource.loadFile<LayoutFile>(fileName);
        const layout = new UILayout(renderer, renderer.overlay, file.logicalSize);
        await renderer.overlay.textureAtlas.loadFromJson(renderer.gl, file.atlasFile, renderer);

        layout.events = file.events;
        layout.animations = file.actions;

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
            atlasFile: 'images/atlas.json',
            actions: this.animations,
            events: this.events
         };

         fileData.elements = [];

        for(let element of this.children) {
            fileData.elements.push(element.toJson());
        }

        return JSON.stringify(fileData);
    }

    createButton(data: ButtonData, sprite: Sprite, text: Text) {
        const button = new Button(data.name, this.overlay, sprite, text, this);
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
        const sprite = new UISprite(data.name, this.overlay, this, { 
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
        
        const text = new Text(data.name, this.overlay, this, { 
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

        if(name === 'root') {
            const element = new Element('root', this.overlay, null);
            element.container = this.root;
            return element;
        }

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

    clickHandlers: ClickHandler[];
    releaseClickHandlers: ClickHandler[];

    size: vec2;

    children: Element[];

    root: Container;
    logicalSize: vec2;
    overlay: Overlay;

    animations: AnimationData[];
    events: { [name: string]: EventData };
}