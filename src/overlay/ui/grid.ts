import { Overlay } from "../overlay";
import { Element } from "./element";
import { UILayout, ElementType } from "./layout";
import { vec2 } from "gl-matrix";

function createInstance<A extends Element>(c: new () => A): A {
    return new c();
  }

export class Grid<T extends Element> extends Element {
    constructor(name: string, overlay: Overlay, layout: UILayout, parent?: Element) {
        super(name, overlay, layout, parent);
    }

    setGrid(numX: number, numY: number, callback: (x: number, y: number) => T) {
        this.xElements = numX;
        this.yElements = numY;

        this.elements = [];
        for(let i = 0; i < this.xElements; i++) {
            this.elements[i] = [];
        }

        let offsetX = 5;

        const offset = vec2.create();
        vec2.divide(offset, this.contentSize, vec2.fromValues(this.xElements, this.yElements));

        for(let j = 0; j < this.yElements; j++) {
            for(let i = 0; i < this.xElements; i++) {
                const element = callback(i, j);
                this.elements[i][j] = element;
                const contentSize = element.getContentSize();
                const scaleX = ((this.contentSize[0] - (this.xElements-1) * offsetX) / this.xElements) / contentSize[0];
                const scaleY = ((this.contentSize[1] - (this.yElements-1) * offsetX) / this.yElements) / contentSize[1];
                element.setScale(vec2.fromValues(scaleX, scaleY));
                const position = vec2.fromValues(offset[0] * i + contentSize[0] * 0.5 * scaleX, offset[1] * j + contentSize[1] * 0.5 * scaleY);
                element.setPosition(position);
                this.container.addChild(element.container);
            }
        }
    }

    xElements: number;
    yElements: number;

    elements: T[][];
}