import log from 'loglevel'
import * as React from 'react'
import ReactDOM from 'react-dom'
import { browser } from 'webextension-polyfill-ts'
import { buttonMainColor, favoriteChannelColor, FAVORITE_BUTTON_ID, FollowedRow } from '../utils'
import { XPATH_FOLLOWED_LIST, XPATH_NOTIFICATIONS, XPATH_SHOW_MORE, XPATH_TARGET_BUTTON_LOCATION } from '../utils'
import { getChannelsFromStorage } from "../utils/storage"
import FavoriteButton from './button'
import './styles.scss'

log.setLevel(log.levels.INFO)


let initialized = false
let favoriteButtonShown = false


const checkUserLoggedIn = (): boolean => {
    const element = document.getElementsByClassName('onsite-notifications')
    return element.length > 0
}


const renderFavoriteButton = (divId: string) => {
    log.info('Creating Favorite button...')
    const div = document.createElement('div')
    div.id = divId

    const target = getElementByXpath(XPATH_TARGET_BUTTON_LOCATION)
    target ? target.appendChild(div) : document.body.appendChild(div)
    ReactDOM.render(<FavoriteButton />, div)
    favoriteButtonShown = true
    log.debug('Favorite button added.')
}

const removeFavoriteButton = (divId: string) => {
    log.info('Removing Favorite button...')
    const element = document.getElementById(divId)
    element?.parentNode?.removeChild(element)
    favoriteButtonShown = false
    log.debug('Favorite button removed.')
}

const checkFollowing = (): boolean => {
    const notificationBtn: any = getElementByXpath(XPATH_NOTIFICATIONS)
    return notificationBtn ? notificationBtn['disabled'] === false : false
}

const parseViewers = (viewerCount: string | null): number => {
    if (viewerCount === null || typeof viewerCount === 'undefined' ) return Number.NaN
    
    let viewers = viewerCount.trim().toUpperCase()
    if (viewers === 'OFFLINE' || viewers === '') {
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

const getFavorites = async (): Promise<Set<string>> => {
    // TODO: Optimize this, currently polling every time it updates the values from local storage
    const mapping: Set<string> = new Set()
    const channels = await getChannelsFromStorage()
    for (let item of channels) {
        mapping.add(item)
    }
    return mapping
}

// FIXME: This will still return a valid value in the case the user is not logged in and there is no span
const canExpandFurther = (element: HTMLElement) => {
    if (element && element.lastChild) {
        const lastChild = element.lastChild as HTMLElement
        const span = lastChild.getElementsByTagName('span')
        if (span.length > 0)
        {
            const viewers = span[0] as HTMLElement
            if (viewers && typeof viewers.textContent === 'string') {
                return viewers.textContent.trim().toLowerCase() !== 'offline'
            }
        }
    }
    return false
}

const getElementByXpath = (path: string) => {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
}

const showMore = (): void => {
    const showMore = getElementByXpath(XPATH_SHOW_MORE) as HTMLElement
    if (showMore) showMore.click()
}

const sortFollowed = async (): Promise<void> => {
    log.debug('sortFollow function starts...')
    const startTime = new Date()

    const favoriteChannels = await getFavorites()
    log.debug(favoriteChannels)

    // Get the list of all live followed channels (some offline channels may be included)
    let container = getElementByXpath(XPATH_FOLLOWED_LIST) as HTMLElement
    for (let i = 0; i < 100; i++) {
        // TODO: Using a for loop instead of a while loop just to avoid issues, but could be optimized.
        if (!canExpandFurther(container)) {
            break
        }
        showMore()
        container = getElementByXpath(XPATH_FOLLOWED_LIST) as HTMLElement
    }

    const channelRows = Array.from(container.children) as HTMLElement[]
    log.trace(channelRows)

    let liveStreams: Array<FollowedRow> = new Array()
    channelRows.forEach((element: HTMLElement, idx: number) => {
        let info: FollowedRow = { div: element, viewers: Number.NaN }

        // TODO: If the sidebar is collapsed, viewers will be NaN and we wont be able to sort.
        // Maybe refactor this to make 2 groups first, and then consider the numbers.
        // <div data-test-selector="side-nav-card-collapsed"> gives an indication of the sidebar status.
        info.viewers = parseViewers(element.getElementsByTagName('span')[0]?.textContent)
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

            info.isFavorite = info.channel ? favoriteChannels.has(info.channel.toLowerCase()) : false
            info.currentPosition = idx
            liveStreams.push(info)
        }
    })
    log.debug(liveStreams)

    liveStreams.sort((a, b) => ((b.isFavorite ? 1000000000 : 1) + b.viewers) - ((a.isFavorite ? 1000000000 : 1) + a.viewers))  // FIXME: Quick and dirty way to sort, implement something else.
    log.debug(liveStreams)

    // TODO: Optimize this to avoid swaping nodes which are already in the right place
    let sortedFavorites: number = 0
    for (let idx = liveStreams.length - 1; idx >= 0; idx--) {
        const row = liveStreams[idx]
        const parentNode = row.div.parentNode
        if (row.isFavorite && parentNode) {
            parentNode.removeChild(row.div)
            container.insertBefore(row.div, container.childNodes[0])
            row.div.style.backgroundColor = favoriteChannelColor.toHtml()
            sortedFavorites += 1
        } else {
            parentNode?.removeChild(row.div)
            container.insertBefore(row.div, container.childNodes[sortedFavorites])
            row.div.style.backgroundColor = favoriteChannelColor.toHtml(0.0)  // FIXME: Workaround to fix the issue of deleted favorites for now.
        }
    }

    const endTime = new Date()
    const elapsed = (endTime.getTime() - startTime.getTime())
    log.debug(`sortFollow function completed in ${elapsed} milliseconds.`)
}


browser.runtime.onMessage.addListener(message => {
    log.trace(message)

    const isPageLoaded = message.tab.status === 'complete'
    const isPageLoadedNotification = message.changeInfo.status === 'complete'

    // Do nothing until page is fully loaded.
    if (!(isPageLoaded || isPageLoadedNotification)) {
        log.debug(`Page still loading (Loaded: ${isPageLoaded}, Loaded Notification ${isPageLoadedNotification})...`)
        return
    }

    // Only run if the user is logged in the site
    if (!checkUserLoggedIn()) return

    // Initialize the sorting process
    if (!initialized && isPageLoadedNotification) {
        log.info('Initializing...')

        // XXX: Maybe use a global or local variable to check if running already
        setInterval(() => sortFollowed(), 250)
        initialized = true
    }

    const isFollowing = checkFollowing()

    if (isFollowing && !favoriteButtonShown && !document.getElementById(FAVORITE_BUTTON_ID)) {
        renderFavoriteButton(FAVORITE_BUTTON_ID)
    }

    // Check if the channel was just now unfollowed
    if (!isFollowing && favoriteButtonShown) {
        removeFavoriteButton(FAVORITE_BUTTON_ID)
        browser.runtime.sendMessage({ action: 'unfollow' }).then(resp => log.info(resp))
    }

    // TODO: change variable name for the message sent from background
    // TODO: This has some duplicate code inside ToggleButton which should be combined in a single place.
    if (message.status === true) {
        const element = document.getElementById(FAVORITE_BUTTON_ID)
        if (element) element.style.backgroundColor = buttonMainColor.toHtml(0.75)
    }

    if (message.status === false) {
        const element = document.getElementById(FAVORITE_BUTTON_ID)
        if (element) element.style.backgroundColor = buttonMainColor.toHtml(0.0)
    }

})


export { }


