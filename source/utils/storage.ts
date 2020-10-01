import log from 'loglevel'
import { browser } from 'webextension-polyfill-ts'
import { STORAGE_KEY } from './constants'


const addChannelToStorage = async (channel: string) => {
    let favorites: string[]
    channel = channel.trim().toLowerCase()
    if (!channel) {
        return
    }
    await browser.storage.sync.get(STORAGE_KEY)
        .then(
            resp => {
                log.info('Values in storage before inserting: ', JSON.stringify(resp))

                // Get current values on storage
                favorites = resp[STORAGE_KEY] || new Array()

                if (favorites.includes(channel)) {
                    log.warn(`Attempting to add channel ${channel} to storage, but channel is already there.`)
                    return
                }

                favorites.push(channel)
                log.debug(favorites)

                browser.storage.sync.set({ 'twitchFavoriteChannels': favorites })
                    .then(
                        resp => {
                            log.debug(resp)
                            log.debug(`Channel ${channel} added successfully to storage`)
                            getChannelsFromStorage().then(resp => log.debug(resp))
                        },
                        err => log.error(JSON.stringify(err))
                    )
            },
            err => log.error(JSON.stringify(err))
        )
}

const getChannelsFromStorage = (): Promise<string[]> => {
    return browser.storage.sync.get(STORAGE_KEY)
        .then(
            resp => resp[STORAGE_KEY] || new Array(),
            () => new Array()
        )
}


const removeChannelFromStorage = async (channel: string) => {
    let channels = await getChannelsFromStorage()
    channels = channels.filter(e => e !== channel)
    browser.storage.sync.set({ 'twitchFavoriteChannels': channels })
}

export { addChannelToStorage, getChannelsFromStorage, removeChannelFromStorage }

