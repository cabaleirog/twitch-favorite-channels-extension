import * as React from "react";
import ReactDOM from "react-dom";
import { browser } from "webextension-polyfill-ts";
import {
  buttonMainColor,
  Color,
  FAVORITE_BUTTON_ID,
  getElementByXpath,
  XPATH_NOTIFICATIONS,
  XPATH_TARGET_BUTTON_LOCATION,
} from "../utils";
import { getLogger, levels } from "../utils/logging";
import { usesDarkTheme } from "../utils/twitch";
import FavoriteButton from "./button";
import ChannelSorter from "./channelSorter";
import "./styles.scss";

const logger = getLogger("ContentScript");
logger.setLevel(levels.DEBUG);

let initialized = false;
let favoriteButtonShown = false;

const checkUserLoggedIn = (): boolean => {
  const element = document.getElementsByClassName("onsite-notifications");
  return element.length > 0;
};

const renderFavoriteButton = (divId: string) => {
  logger.info("Creating Favorite button...");
  const div = document.createElement("div");
  div.id = divId;

  const target = getElementByXpath(XPATH_TARGET_BUTTON_LOCATION);
  target ? target.appendChild(div) : document.body.appendChild(div);
  ReactDOM.render(<FavoriteButton />, div);
  favoriteButtonShown = true;
  logger.debug("Favorite button added.");
};

const removeFavoriteButton = (divId: string) => {
  logger.info("Removing Favorite button...");
  const element = document.getElementById(divId);
  element?.parentNode?.removeChild(element);
  favoriteButtonShown = false;
  logger.debug("Favorite button removed.");
};

const checkFollowing = (): boolean => {
  const notificationBtn: any = getElementByXpath(XPATH_NOTIFICATIONS);
  return notificationBtn ? notificationBtn["disabled"] === false : false;
};

const sorter = new ChannelSorter(500, 250);

browser.runtime.onMessage.addListener((message) => {
  logger.debug(message);

  const isPageLoaded = message.tab.status === "complete";
  const isPageLoadedNotification = message.changeInfo.status === "complete";

  // Do nothing until page is fully loaded.
  if (!(isPageLoaded || isPageLoadedNotification)) {
    logger.debug(
      `Page still loading (Loaded: ${isPageLoaded}, Loaded Notification ${isPageLoadedNotification})...`
    );
    return;
  }

  // Only run if the user is logged in the site
  if (!checkUserLoggedIn()) return;

  // Initialize the sorting process
  if (!initialized && (isPageLoaded || isPageLoadedNotification)) {
    logger.info("Initializing...");
    initialized = true;

    // XXX: Maybe use a global or local variable to check if running already
    const intervalId = sorter.initialize();
    console.log(intervalId);
    // setInterval(() => sorter.update(), REFRESH_INTERVAL)
    // setInterval(() => sortFollowed(), REFRESH_INTERVAL)
  }

  const isFollowing = checkFollowing();

  if (
    isFollowing &&
    !favoriteButtonShown &&
    !document.getElementById(FAVORITE_BUTTON_ID)
  ) {
    renderFavoriteButton(FAVORITE_BUTTON_ID);
  }

  // Check if the channel was just now unfollowed
  if (!isFollowing && favoriteButtonShown) {
    removeFavoriteButton(FAVORITE_BUTTON_ID);
    // browser.runtime
    //   .sendMessage({ action: "unfollow" })
    //   .then((resp) => logger.info(resp));
  }

  // TODO: change variable name for the message sent from background
  // TODO: This has some duplicate code inside ToggleButton which should be combined in a single place.
  if (message.status === true) {
    const element = document.getElementById(FAVORITE_BUTTON_ID);
    if (element)
      element.style.backgroundColor = usesDarkTheme()
        ? buttonMainColor.toHtml(0.75)
        : new Color(175, 41, 255).toHtml();
  }

  if (message.status === false) {
    const element = document.getElementById(FAVORITE_BUTTON_ID);
    if (element) element.style.backgroundColor = buttonMainColor.toHtml(0.0);
  }
});

export {};
