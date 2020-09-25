import { browser } from 'webextension-polyfill-ts';
import { STORAGE_NAME } from './constants';

const addChannelToStorage = (channel: string) => {
    let favorites: string[]
    channel = channel.trim().toLowerCase()
    browser.storage.sync.get(STORAGE_NAME)
        .then(
            (resp) => {
                favorites = resp[STORAGE_NAME] || new Array()  // Get current values on storage

                if (favorites.includes(channel)) {
                    console.warn(`Attempting to add channel ${channel} to storage, but channel is already there.`)
                    return
                }

                favorites.push(channel)
                browser.storage.sync.set({ STORAGE_NAME: favorites })
                    .then(
                        () => console.debug(`Channel ${channel} added successfully to storage`),
                        (err) => console.error(JSON.stringify(err))
                    )

            },
            (err) => console.error(JSON.stringify(err))
        )
}
}

export { addChannelToStorage };