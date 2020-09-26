import { browser } from 'webextension-polyfill-ts';
import { STORAGE_NAME } from './constants';

const addChannelToStorage = async (channel: string) => {
    let favorites: string[]
    channel = channel.trim().toLowerCase()
    if (!channel) {
        return
    }
    await browser.storage.sync.get(STORAGE_NAME)
        .then(
            resp => {
                console.debug('resp from getting the storage data on addChannelToStorage')
                console.debug(resp)

                favorites = resp[STORAGE_NAME] || new Array()  // Get current values on storage

                if (favorites.includes(channel)) {
                    console.warn(`Attempting to add channel ${channel} to storage, but channel is already there.`)
                    return
                }

                favorites.push(channel)
                console.debug('favorities after push')
                console.debug(favorites)
                console.debug({ 'twitchFavoriteChannels': favorites })
                console.debug('--------')
                browser.storage.sync.set({ 'twitchFavoriteChannels': favorites })
                    .then(
                        resp => {
                            console.debug(resp)
                            console.debug(`Channel ${channel} added successfully to storage`)
                            getChannelsFromStorage().then(resp => console.debug(resp))
                        },
                        err => console.error(JSON.stringify(err))
                    )
            },
            err => console.error(JSON.stringify(err))
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