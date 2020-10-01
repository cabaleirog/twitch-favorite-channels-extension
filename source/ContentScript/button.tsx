import log from 'loglevel'
import React, { Component } from 'react'
import Button from 'react-bootstrap/esm/Button'
import { browser } from "webextension-polyfill-ts"
import { buttonMainColor } from '../utils'
import './styles.scss'


browser.runtime.onMessage.addListener((message, sender) => {
    log.debug('Listener on button.tsx')
    log.debug(message)
    log.trace(sender)

    if (message === 'added') {
        const element = document.getElementById("twitch-favorite-channels-extension")
        element?.setAttribute('background', 'red')
    }
})


class FavoriteButton extends Component<{}, { isFavorite: boolean }> {

    constructor(props: any) {
        super(props)
        this.state = { isFavorite: true }
        log.debug(this)
    }

    async handleClick() {
        log.info('Toggling Favorite...')
        await browser.runtime.sendMessage({
            source: 'favorite button',
            action: 'toggle',
            status: 'todo'
        })
            .then(resp => {
                log.debug(resp)
                if (resp === 'added') {
                    log.debug(this)
                    const element = document.getElementById('twitch-favorite-channels-extension')
                    if (element) element.style.backgroundColor = buttonMainColor.toHtml(0.75)
                } else if (resp === 'removed') {
                    log.debug(this)
                    const element = document.getElementById('twitch-favorite-channels-extension')
                    if (element) element.style.backgroundColor = buttonMainColor.toHtml(0.0)
                } else {
                    log.debug(`Unhandled response received from background. Expected 'added' or 'removed', but got ${resp}`)
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
//<figure className="tw-svg"><svg className="tw-svg__asset tw-svg__asset--heart tw-svg__asset--inherit" width="20px" height="20px" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M228.32 202.47C118.54 223.2 49.92 236.16 22.47 241.34C20.02 241.8 19.07 244.82 20.82 246.61C41.56 267.69 93.41 320.4 176.37 404.74C152.71 516.91 137.93 587.02 132.02 615.06C131.44 617.83 134.33 620.02 136.83 618.71C162.75 605.17 227.55 571.3 331.23 517.11C433.28 571.87 497.07 606.09 522.58 619.78C524.29 620.69 526.3 619.27 526.02 617.36C521.51 587.35 510.25 512.31 492.24 392.26C559.63 316.42 601.75 269.02 618.6 250.06C621.6 246.69 619.79 241.33 615.36 240.47C589.43 235.4 524.62 222.74 420.91 202.47C374.22 106.91 345.04 47.19 333.36 23.3C331.21 18.89 324.97 18.8 322.68 23.14C310.1 47.05 278.65 106.83 228.32 202.47Z"></path></g></svg></figure>

export default FavoriteButton

