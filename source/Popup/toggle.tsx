import React, { Component } from "react";
// import { ButtonGroup, ToggleButton } from "react-bootstrap";
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import ToggleButton from 'react-bootstrap/ToggleButton'
import { browser } from "webextension-polyfill-ts";
import { addChannelToStorage, getChannelsFromStorage, removeChannelFromStorage } from "../utils/storage";


interface IToggleState {
    channel: string
    isFavorite: boolean
}

class ToggleFavorite extends Component {

    state: IToggleState

    constructor(props: any) {
        super(props)
        this.state = {
            channel: '',
            isFavorite: false
        }

        // attempt to pre-load
        this.parseChannelName()
            .then(() => this.checkStorage())
            .then(resp => {
                console.log(`Is on storage from preload: ${resp} ${typeof resp}`)
                this.state.isFavorite = resp
            })
    }

    async parseChannelName() {
        await browser.tabs.query({ active: true, currentWindow: true })
            .then(
                resp => {
                    let match = resp[0].url?.match(/.*twitch.tv\/(\w+)[\/|\?]?/i)
                    this.state.channel = match ? match[1].toLowerCase() : 'nomatch'
                },
                err => {
                    console.debug(err)
                }
            )
        return this.state.channel
    }

    async checkStorage() {
        // returns true if the channel is on the browser storage
        if (this.state.channel === '') { await this.parseChannelName() }
        const channels = await getChannelsFromStorage()
        return channels && channels.includes(this.state.channel)
    }

    async setStorageValue(value: boolean) {
        // adds or removes the channel on storage, adds if value is true, removes otherwise.
        if (typeof value !== 'boolean') {
            console.error(`setStorageValue expected a boolean, but ${typeof value} was provided`)
            return  // todo: maybe return false and check for the output
        }

        if (!this.state.channel) { await this.parseChannelName() }

        if (value === true) {
            console.debug(`setStorageValue(true) to storage ${this.state.channel}`)
            await addChannelToStorage(this.state.channel)
        } else {
            console.debug(`setStorageValue(false) to storage ${this.state.channel}`)
            await removeChannelFromStorage(this.state.channel)
        }
    }

    async togglePressed(e: React.ChangeEvent) {
        await this.parseChannelName()
        console.debug(this.state.channel)
        const recordInStorage = await this.checkStorage()
        console.debug(e)
        console.log(`Channel is on storage? ${recordInStorage}`)
        if (recordInStorage === true) {
            console.log(`Removing favorite from storage`)
            this.setStorageValue(false)
            this.state.isFavorite = false
        } else {
            console.log(`Adding favorite in storage`)
            this.setStorageValue(true)
            this.state.isFavorite = true
        }
        console.log(`Done doing toggle stuff`)
    }

    render() {
        return (
            <>
                <ButtonGroup toggle>
                    <ToggleButton
                        type="checkbox"
                        variant="primary"
                        checked={this.state.isFavorite}
                        onChange={(e) => this.togglePressed(e)}  // TODO: Update storage
                        value={this.state.channel}
                    >
                        Favorite <i className={this.state.isFavorite ? "fa fa-star" : "fa fa-star-o"}></i>
                    </ToggleButton>
                </ButtonGroup>
            </>
        );
    }

}

export default ToggleFavorite
