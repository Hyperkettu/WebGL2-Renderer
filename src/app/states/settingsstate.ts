import { MenuState, MenuSettings } from "./menustate";
import { StateMachine, State } from "../statemachine";
import { Button } from "../../overlay/ui/button";

export interface Settings extends MenuSettings {

}

export class SettingsState extends MenuState {
    constructor(name: string, settings: Settings) {
        super(name, settings);
    }

    public enableInput(fsm: StateMachine) {
        console.log('enabled');
        const settings = this.settings as Settings;
        const button = settings.layout.find('myButton') as Button;
        button.onClick((x, y) => {
            console.log('here');
            fsm.set(fsm.getState('MainMenu'));
        });
    }

    public disableInput(fsm: StateMachine) {
        const settings = this.settings as Settings;
        settings.layout.clickHandlers = [];
        settings.layout.releaseClickHandlers = [];
    }
}