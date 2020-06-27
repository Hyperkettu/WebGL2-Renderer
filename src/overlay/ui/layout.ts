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
        this.overlay.stage.root.addChild(text.container);
    }

    data: LayoutData;
    overlay: Overlay;
}