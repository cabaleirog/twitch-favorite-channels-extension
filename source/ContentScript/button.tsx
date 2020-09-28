import React, { Component } from 'react'
import Button from 'react-bootstrap/esm/Button'
import { browser } from "webextension-polyfill-ts"
import './styles.scss'




browser.runtime.onMessage.addListener((message, sender) => {
    console.log('From Button Over the')
    console.log(message)
    console.log(sender)

    if (message === 'added') {
        const element = document.getElementById("twitch-favorite-channels-extension")
        element?.setAttribute('background', 'red')
    }

})


class FavoriteButton extends Component<{}, { isFavorite: boolean }> {

    constructor(props: any) {
        super(props)
        this.state = { isFavorite: true }
        console.info(this)
    }

    async handleClick() {
        console.debug('Button clicked!')
        browser.runtime.sendMessage({
            source: 'favorite button',
            action: 'toggle',
            status: 'todo'
        })
            .then(resp => {
                console.debug(resp)
                if (resp === 'added') {
                    console.info(this)
                    const element = document.getElementById('twitch-favorite-channels-extension')
                    if (element) element.style.backgroundColor = 'rgba(0, 255, 0, 0.25)'
                } else if (resp === 'removed') {
                    console.info(this)
                    const element = document.getElementById('twitch-favorite-channels-extension')
                    if (element) element.style.backgroundColor = 'rgba(0, 0, 0, 0.0)'
                } else {
                    console.debug(`Unhandled response received from background. Expected 'added' or 'removed', but got ${resp}`)
                }
            })
    }

    getStyle() {
       return {
           padding: '10px'
       }
    }

    getSpanStyle() {
        return {
            paddingLeft: '5px'
        }
    }

    // className={this.state.isFavorite ? 'favorite' : ''}
    render() {
        return (
            <Button
                className={this.state.isFavorite ? 'tw-align-items-center tw-align-middle tw-border-bottom-left-radius-medium tw-border-bottom-right-radius-medium tw-border-top-left-radius-medium tw-border-top-right-radius-medium tw-core-button tw-core-button--secondary tw-full-width tw-inline-flex tw-interactive tw-justify-content-center tw-overflow-hidden tw-relative' : ''}
                style={this.getStyle()}
                variant="primary"
                onClick={this.handleClick}
            >
                <figure className="tw-svg"><svg className="tw-svg__asset tw-svg__asset--heart tw-svg__asset--inherit" width="20px" height="20px" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9.171 4.171A4 4 0 006.343 3H6a4 4 0 00-4 4v.343a4 4 0 001.172 2.829L10 17l6.828-6.828A4 4 0 0018 7.343V7a4 4 0 00-4-4h-.343a4 4 0 00-2.829 1.172L10 5l-.829-.829z" fillRule="evenodd" clipRule="evenodd"></path></g></svg></figure>
            <span style={this.getSpanStyle()} >Favorite</span>
            </Button>
        )
    }
}


export default FavoriteButton

