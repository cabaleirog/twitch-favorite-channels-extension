import { getLogger, levels } from "../utils/logging";
import { browser } from "webextension-polyfill-ts";
import { STORAGE_KEY } from "../utils";
import {
  addChannelToStorage,
  removeChannelFromStorage,
} from "../utils/storage";

const logger = getLogger("Background");
logger.setLevel(levels.DEBUG);

const parseChannelName = (url: string) => {
  const match = url?.match(/.*twitch.tv\/(\w+)[\/|\?]?/i);
  return match ? match[1].toLowerCase() : "nomatch";
};

const checkStorage = async (channel: string) => {
  // returns true if the channel is on the browser storage
  const channels = await getChannelsFromStorage();
  return channels && channels.includes(channel);
};

const setStorageValue = async (channel: string, value: boolean) => {
  // adds or removes the channel on storage, adds if value is true, removes otherwise.
  if (typeof value !== "boolean") {
    logger.error(
      `setStorageValue expected a boolean, but ${typeof value} was provided`
    );
    return; // todo: maybe return false and check for the output
  }

  if (value === true) {
    logger.info(`setStorageValue(true) to storage ${channel}`);
    await addChannelToStorage(channel);
    cache?.add(channel);
  } else {
    logger.info(`setStorageValue(false) to storage ${channel}`);
    await removeChannelFromStorage(channel);
    cache?.delete(channel);
  }

  // Notify every tab about the change on storage
  // browser.runtime.sendMessage({
  //   action: 'storage_change',
  //   channel: channel,
  //   value: value,
  //   date: new Date(),
  // }).then(() => logger.info('Message sent'))
};

browser.runtime.onMessage.addListener((message, sender) => {
  //browser.runtime.sendMessage('IM HERE').then(() => logger.info('Message sent from the listener'))
  logger.info(
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension"
  );
  logger.info(message);
  logger.info(sender);

  if (message.source === "favorite button" && message.action === "toggle") {
    if (sender.tab?.url) {
      let channel = parseChannelName(sender.tab.url);
      logger.info(channel);

      return checkStorage(channel)
        .then((resp) => {
          if (resp) {
            // Channel is currently on storage, we will remove it
            logger.info(`Removing favorite from storage (${channel}).`);
            return setStorageValue(channel, false).then(() => "removed");
            //browser.runtime.sendMessage('added')
            //return 'added'
          } else {
            logger.info(`Adding favorite into storage (${channel}).`);
            return setStorageValue(channel, true).then(() => "added");
            //browser.runtime.sendMessage('removed')
            //return 'removed'
          }
        })
        .then((resp) => {
          browser.runtime.sendMessage({
            source: "background",
            action: resp,
            channel: channel,
          });
          return resp;
        })
        .catch((err) => logger.error(err));
    }
  }
  //return true  // todo: return a promise instead, as this is deprecated. https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#Sending_an_asynchronous_response_using_a_Promise

  if (message.action === "unfollow") {
    if (sender.tab?.url) {
      let channel = parseChannelName(sender.tab.url);
      logger.info(`Cleaning storage after channel "${channel}" was unfollowed`);
      setStorageValue(channel, false).catch((err) => logger.error(err));
    }
  }

  return;
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url) {
    debugger;
    logger.info(tabId);
    logger.info(changeInfo);
    logger.info(tab);
    const channel = parseChannelName(tab.url);
    checkStorage(channel)
      .then((resp) => {
        try {
          logger.debug(resp);
          changeInfo = changeInfo;
          tabId = tabId;
          browser.tabs.sendMessage(tabId, {
            status: resp,
            changeInfo: changeInfo,
            tab: tab,
          });
        } catch (err) {
          logger.error(err);
        }
      })
      .catch((err) => logger.error(`ERROR: ${JSON.stringify(err)}`));
  }
});

const getChannelsFromStorage = (): Promise<string[]> => {
  if (cache) {
    logger.info("Returning from cache...");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(cache ? Array.from(cache.keys()) : []);
      }, 10);
    });
  }
  return browser.storage.sync
    .get(STORAGE_KEY)
    .then(
      (resp) => resp[STORAGE_KEY] || new Array(),
      () => new Array()
    )
    .catch((err) => logger.error(err));
};

let cache: Set<string>;

(async () => {
  await getChannelsFromStorage().then((resp) => {
    logger.info(resp);
    cache = new Set();
    resp.forEach((v) => cache?.add(v));
    if (cache)
      logger.info(`Cached: ${JSON.stringify(Array.from(cache.keys()))}`);
  });
})();
