import { MenuState, MenuSettings } from "./menustate";
import { StateMachine, State, Size } from "../statemachine";
import { Button } from "../../overlay/ui/button";

export interface Settings extends MenuSettings {

}

export class SettingsState extends MenuState {

    constructor(name: string, settings: Settings) {
        super(name, settings);
    }

    public enableInput(fsm: StateMachine) {
        const settings = this.settings as Settings;
        const button = settings.layout.find('myButton') as Button;
        button.onClick((x, y) => {
            fsm.set(fsm.getState('MainMenu'));
        });
    }

    public disableInput(fsm: StateMachine) {
        const settings = this.settings as Settings;
        settings.layout.clickHandlers = [];
        settings.layout.releaseClickHandlers = [];
    }

    public handleInput(dt: number, keys: { [id: string]: boolean; }) {
    }

    public handleKeyPress(key: string) {
    }

    public postExit(fsm: StateMachine) {
    }

    public update(dt: number, time: number, inputDt: number) {
    }

    public onResize(size: Size) {
    }
}