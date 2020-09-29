import { browser } from 'webextension-polyfill-ts';
import { STORAGE_NAME } from './constants';
import log from 'loglevel';


const addChannelToStorage = async (channel: string) => {
    let favorites: string[]
    channel = channel.trim().toLowerCase()
    if (!channel) {
        return
    }
    await browser.storage.sync.get(STORAGE_NAME)
        .then(
            resp => {
                log.debug('resp from getting the storage data on addChannelToStorage')
                log.debug(resp)

                favorites = resp[STORAGE_NAME] || new Array()  // Get current values on storage

                if (favorites.includes(channel)) {
                    log.warn(`Attempting to add channel ${channel} to storage, but channel is already there.`)
                    return
                }

                favorites.push(channel)
                log.debug('favorities after push')
                log.debug(favorites)
                log.debug({ 'twitchFavoriteChannels': favorites })
                log.debug('--------')
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
    return browser.storage.sync.get(STORAGE_NAME)
        .then(
            resp => resp[STORAGE_NAME] || new Array(),
            () => new Array()
        )
}


const removeChannelFromStorage = async (channel: string) => {
    let channels = await getChannelsFromStorage()
    channels = channels.filter(e => e !== channel)    
    await browser.storage.sync.set({ 'twitchFavoriteChannels': channels })
}

export { addChannelToStorage, getChannelsFromStorage, removeChannelFromStorage };