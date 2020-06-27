import { Overlay } from "../overlay";
import { Text } from './text';

export interface LayoutData {
    texts: Text[];
}

export class UILayout {
    constructor(overlay: Overlay) {
        this.overlay = overlay;
        this.data = {
            texts: []
        };
    }

    addText(text: Text) {
        this.data.texts.push(text);
    }

    data: LayoutData;
    overlay: Overlay;
}