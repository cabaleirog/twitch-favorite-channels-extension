import log from 'loglevel'
import { browser } from 'webextension-polyfill-ts'
import { addChannelToStorage, getChannelsFromStorage, removeChannelFromStorage } from '../utils/storage'

// log.setLevel(log.levels.INFO)  // Weirdly, this line produces an error in the entire thing.


const parseChannelName = (url: string) => {
  const match = url?.match(/.*twitch.tv\/(\w+)[\/|\?]?/i)
  return match ? match[1].toLowerCase() : 'nomatch'
}

const checkStorage = async (channel: string) => {
  // returns true if the channel is on the browser storage
  const channels = await getChannelsFromStorage()
  log.debug(channel)
  return channels && channels.includes(channel)
}

const setStorageValue = async (channel: string, value: boolean) => {
  // adds or removes the channel on storage, adds if value is true, removes otherwise.
  if (typeof value !== 'boolean') {
    log.error(`setStorageValue expected a boolean, but ${typeof value} was provided`)
    return  // todo: maybe return false and check for the output
  }

  if (value === true) {
    log.debug(`setStorageValue(true) to storage ${channel}`)
    await addChannelToStorage(channel)
  } else {
    log.debug(`setStorageValue(false) to storage ${channel}`)
    await removeChannelFromStorage(channel)
  }
}

browser.runtime.onMessage.addListener((message, sender) => {
  //browser.runtime.sendMessage('IM HERE').then(() => log.debug('Message sent from the listener'))
  log.debug(sender.tab ?
    "from a content script:" + sender.tab.url :
    "from the extension")
  log.debug(message)
  log.debug(sender)

  if (message.source === 'favorite button' && message.action === 'toggle') {
    if (sender.tab?.url) {
      let channel = parseChannelName(sender.tab.url)
      log.debug(channel)

      return checkStorage(channel)
        .then(resp => {
          if (resp) {  // Channel is currently on storage, we will remove it
            log.info(`Removing favorite from storage`)
            return setStorageValue(channel, false).then(() => 'removed')
            //browser.runtime.sendMessage('added')
            //return 'added' 
          } else {
            log.info(`Adding favorite in storage`)
            return setStorageValue(channel, true).then(() => 'added')
            //browser.runtime.sendMessage('removed')
            //return 'removed'
          }
        })
        .then(resp => {
          browser.runtime.sendMessage({
            source: 'background',
            action: resp,
            channel: channel
          })
          return resp
        })
    }

  }
  //return true  // todo: return a promise instead, as this is deprecated. https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#Sending_an_asynchronous_response_using_a_Promise

  if (message.action === 'unfollow') {
    if (sender.tab?.url) {
      let channel = parseChannelName(sender.tab.url)
      log.info(`Cleaning storage after channel "${channel}" was unfollowed`)
      setStorageValue(channel, false)
    }
  }

  return
})

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url) {
  const channel = parseChannelName(tab.url)
  checkStorage(channel)
    .then(resp => browser.tabs.sendMessage(tabId, { status: resp, changeInfo: changeInfo, tab: tab }))
  }
})