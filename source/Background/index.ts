import { browser } from 'webextension-polyfill-ts'
import { addChannelToStorage, getChannelsFromStorage, removeChannelFromStorage } from '../utils/storage'


const parseChannelName = (url: string) => {
  const match = url?.match(/.*twitch.tv\/(\w+)[\/|\?]?/i)
  return match ? match[1].toLowerCase() : 'nomatch'
}

const checkStorage = async (channel: string) => {
  // returns true if the channel is on the browser storage
  const channels = await getChannelsFromStorage()
  console.debug(channels)
  return channels && channels.includes(channel)
}

const setStorageValue = async (channel: string, value: boolean) => {
  // adds or removes the channel on storage, adds if value is true, removes otherwise.
  if (typeof value !== 'boolean') {
    console.error(`setStorageValue expected a boolean, but ${typeof value} was provided`)
    return  // todo: maybe return false and check for the output
  }

  if (value === true) {
    console.debug(`setStorageValue(true) to storage ${channel}`)
    await addChannelToStorage(channel)
  } else {
    console.debug(`setStorageValue(false) to storage ${channel}`)
    await removeChannelFromStorage(channel)
  }
}

browser.runtime.onMessage.addListener((message, sender) => {
  //browser.runtime.sendMessage('IM HERE').then(() => console.debug('Message sent from the listener'))
  console.log(sender.tab ?
    "from a content script:" + sender.tab.url :
    "from the extension")
  console.debug(message)
  console.debug(sender)
  checkStorage('k1gg1').then(resp => console.debug(resp))

  if (message.source === 'favorite button' && message.action === 'toggle') {
    if (sender.url) {
      let channel = parseChannelName(sender.url)
      console.debug(channel)

      return checkStorage(channel)
        .then(resp => {
          if (resp) {  // Channel is currently on storage, we will remove it
            console.log(`Removing favorite from storage`)
            return setStorageValue(channel, false).then(() => 'removed')
            //browser.runtime.sendMessage('added')
            //return 'added' 
          } else {
            console.log(`Adding favorite in storage`)
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
  return
})


browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  browser.tabs.sendMessage(tabId, { changeInfo: changeInfo, tab: tab, tabId: tabId})
})