import React, { Component } from "react";
import { ButtonGroup, ToggleButton } from "react-bootstrap";
import { STORAGE_NAME } from "../utils/constants";


interface IToggleState {
    channel: string
    isFavorite: boolean
}

class ToggleFavorite extends Component {

    state: IToggleState

    constructor(props: any) {
        super(props)
        this.state = {
            channel: 'brainlesssociety',
            isFavorite: this.checkStorage()
        }
    }

    checkStorage() {
        // returns true if the channel is on the browser storage
        this.state
        return false  // todo
    }

    setStorageValue(value: boolean) {
        if (typeof value !== 'boolean') {
            console.error(`setStorageValue expected a boolean, but ${typeof value} was provided`)
            return  // todo: maybe return false and check for the output
        }
        console.log('todo: set storage')
        if (value) {
            // todo: write to storage
        } else {
            // todo: remove from storage
        }
    }

    togglePressed(e: React.ChangeEvent) {
        const recordInStorage = this.checkStorage()
        console.log(`Current state is ${recordInStorage}`)
        if (recordInStorage) {
            console.log(`Removing favorite from storage`)
            this.setStorageValue(false)
        } else {
            console.log(`Adding favorite in storage`)
            this.setStorageValue(true)
        }
        console.log(`Done doing toggle stuff`)
    }

    render() {
        return (
            <>
                <ButtonGroup toggle>
                    <ToggleButton
                        type="checkbox"
                        variant="secondary"
                        checked={this.state.isFavorite}  // TODO: Pull from storage
                        onChange={(e) => this.togglePressed(e)}  // TODO: Update storage
                    >
                        <i className={this.state.isFavorite ? "fa fa-star" : "fa fa-star-o"}></i>
                    </ToggleButton>
                </ButtonGroup>
            </>
        );
    }

}

export default ToggleFavorite
