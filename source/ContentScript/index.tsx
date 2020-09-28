import * as React from 'react'
import ReactDOM from 'react-dom';
import { browser } from 'webextension-polyfill-ts'
import { getChannelsFromStorage } from "../utils/storage"
import FavoriteButton from './button';
import './styles.scss';



browser.runtime.onMessage.addListener((message, sender) => {
    console.log('From onMessage in content script')
    console.log(message)
    console.log(sender)

    if (message === 'added') {
        const element = document.getElementById("twitch-favorite-channels-extension")
        element?.setAttribute('background', 'red')
    }

})



interface FollowedRow {
    div: HTMLElement
    isFavorite?: boolean
    url?: string
    channel?: string
    game?: string
    viewers: number
    currentPosition?: number
}

const parseViewers = (viewerCount: string | null) => {
    if (viewerCount === null) { return Number.NaN }
    let viewers = viewerCount.trim().toUpperCase()
    if (viewers === 'OFFLINE' || viewers === '') {  // Should not be necessary to check for empty string here, but just in case.
        return Number.NaN
    }
    if (viewers.endsWith('K')) {
        return 1000 * Number.parseFloat(viewers.substr(0, viewers.length - 1))
    }
    if (viewers.endsWith('M')) {
        return 1000000 * Number.parseFloat(viewers.substr(0, viewers.length - 1))
    }
    return Number.parseInt(viewers)
}

const getFavorites = async () => {
    // TODO: Optimize this, currently polling every time it updates the values from local storage
    const channels = await getChannelsFromStorage()
    let mapping: any = {}
    for (let item of channels) {
        mapping[item] = true
    }
    return mapping
}

const canExpandFurther = (element: HTMLElement) => {
    if (element && element.lastChild) {
        const lastChild: HTMLElement = element.lastChild as HTMLElement
        const viewers: HTMLElement = lastChild.getElementsByTagName('span')[0]
        return viewers.textContent?.trim().toLowerCase() !== 'offline'
    }
    return false
}

const getElementByXpath = (path: string) => {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

const showMore = () => {
    const showMore: HTMLElement = getElementByXpath('//*[@data-test-selector="ShowMore"]') as HTMLElement
    if (showMore) {
        try {
            showMore.click()
        }
        catch (error) {
            console.log(error);
        }
    }
}

// const showLess = () => {
//     const showLess = getElementByXpath('//*[@data-test-selector="ShowLess"]');
//     try {
//         showLess.click();
//     }
//     catch (error) {
//         console.log(error);
//     }
// }

const sortFollowed = async () => {
    let FAVORITES = await getFavorites()
    const checkFavorite = (channel: string) => FAVORITES[channel.toLowerCase()] !== undefined

    let container = getElementByXpath('//*[@id="sideNav"]//div[contains(@class, "tw-transition-group")]') as HTMLElement
    for (let i = 0; i < 20; i++) {  // TODO: This is currently hard-coded.
        if (!canExpandFurther(container)) {
            break;
        }
        showMore()
        container = getElementByXpath('//*[@id="sideNav"]//div[contains(@class, "tw-transition-group")]') as HTMLElement
    }

    let liveStreams: FollowedRow[] = new Array()

    let xx = Array()
    for (let index = 0; index < container.children.length; index++) {
        xx.push(container.children[index] as HTMLElement)
    }

    xx.forEach((element: HTMLElement, idx: number) => {
        let info: FollowedRow = { div: element, viewers: Number.NaN }

        // info.viewers = Number.parseInt(element.getElementsByTagName('span')[0].textContent || '')
        info.viewers = parseViewers(element.getElementsByTagName('span')[0].textContent || '')
        if (!Number.isNaN(info.viewers)) {
            info.url = element.getElementsByTagName('a')[0].href

            let p = element.getElementsByTagName('p')
            if (p !== undefined && p.length > 0 && p[0].textContent !== null) {
                info.channel = p[0].textContent.toLowerCase()
            }

            p = element.getElementsByTagName('p')
            if (p !== undefined && p.length >= 2 && p[1].textContent !== null) {
                info.game = p[1].textContent
            }

            info.isFavorite = info.channel ? checkFavorite(info.channel) : false
            info.currentPosition = idx
            liveStreams.push(info)
            // console.log(info)
        }
    });

    liveStreams.sort((a, b) => ((b.isFavorite ? 1000000000 : 1) + b.viewers) - ((a.isFavorite ? 1000000000 : 1) + a.viewers));  // FIXME: Quick and dirty way to sort, implement something else.

    let sortedFavorites: number = 0
    for (let idx = liveStreams.length - 1; idx >= 0; idx--) {
        const row = liveStreams[idx];
        const parentNode = row.div.parentNode
        if (row.isFavorite && parentNode) {
            parentNode.removeChild(row.div);
            container.insertBefore(row.div, container.childNodes[0]);
            row.div.style.backgroundColor = 'rgba(30, 165, 20, 0.25)';
            sortedFavorites += 1
        } else {
            parentNode?.removeChild(row.div);  // XXX: Check me
            container.insertBefore(row.div, container.childNodes[sortedFavorites]);
            row.div.style.backgroundColor = 'rgba(30, 165, 20, 0)';  // FIXME: Workaround to fix the issue of deleted favorites for now.
        }
    }

}



browser.runtime.onMessage.addListener(message => {
    const favoriteDivId = "twitch-favorite-channels-extension"

    setTimeout(() => {  // Allow the page to load first
        
        if (!document.getElementById(favoriteDivId)) {  // For page first print
            const div = document.createElement('div');
            div.id = favoriteDivId;
        
            const target = getElementByXpath('//*[@class="metadata-layout__secondary-button-spacing"]')
            target ? target.appendChild(div) : document.body.appendChild(div)
            ReactDOM.render(<FavoriteButton />, div)

            setInterval(() => sortFollowed(), 5000);  // todo: maybe use a global or local variable to check if running already
        }
    }, 10000)
    getChannelsFromStorage().then(resp => console.debug(`Channels in storage: ${JSON.stringify(resp)}`))
    if (message.status === true) {
        const element = document.getElementById(favoriteDivId)
        if (element) element.style.backgroundColor = 'rgba(0, 255, 0, 0.25)'
    }
    if (message.status === false) {
        const element = document.getElementById(favoriteDivId)
        if (element) element.style.backgroundColor = 'rgba(0, 0, 0, 0.0)'
    }
})


export { };
