import React, { Component } from "react";
import Button from "react-bootstrap/esm/Button";
import { browser } from "webextension-polyfill-ts";
import { getChannelsFromStorage, urlToChannel } from "../utils";
import { getLogger } from "../utils/logging";
import { usesDarkTheme } from "../utils/twitch";
import { arrayToRGBA, COLORS } from "./colors";

const logger = getLogger("ContentScript");

// TODO: Add a variable to storage with user defined colors, and listen for changes on those to update the button.
let colors = COLORS;

// browser.runtime.onMessage.addListener((message, sender) => {
//   logger.debug("Listener on button.tsx");
//   logger.debug(message);
//   logger.trace(sender);

//   if (message === "added") {
//     const element = document.getElementById(
//       "twitch-favorite-channels-extension"
//     );
//     element?.setAttribute("background", "red");
//   }
// });

class FavoriteButton extends Component<
  {},
  { isFavorite: boolean; color: string }
> {
  constructor(props: any) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.state = { isFavorite: false, color: "" };
    logger.debug(this);
  }

  componentDidMount() {
    this.updateState();
  }

  updateState() {
    const channel = urlToChannel(window.location.href);
    if (channel) {
      getChannelsFromStorage().then((resp) => {
        this.setState({ isFavorite: resp.includes(channel) });
        this.updateBackgroundColor();
      });
    }
    logger.debug(this);
  }

  updateBackgroundColor() {
    const theme = usesDarkTheme() ? colors.dark : colors.light;
    const btnColor = arrayToRGBA(
      this.state.isFavorite ? theme.button.enabled : theme.button.disabled
    );
    this.setState({ color: btnColor });
  }

  async handleClick() {
    logger.info("Toggling Favorite...");
    await browser.runtime
      .sendMessage({
        source: "favorite button",
        action: "toggle",
        status: "todo",
      })
      .then((resp) => {
        logger.debug(resp);
        logger.debug(this);
        if (resp === "added") {
          this.setState({ isFavorite: true });
          this.updateBackgroundColor();
        } else if (resp === "removed") {
          this.setState({ isFavorite: false });
          this.updateBackgroundColor();
        } else {
          logger.debug(
            `Unhandled response received from background. Expected 'added' or 'removed', but got ${resp}`
          );
        }
      });
  }

  render() {
    return (
      <Button
        className="tw-align-items-center tw-align-middle tw-border-bottom-left-radius-medium tw-border-bottom-right-radius-medium tw-border-top-left-radius-medium tw-border-top-right-radius-medium tw-core-button tw-core-button--secondary tw-full-width tw-inline-flex tw-interactive tw-justify-content-center tw-overflow-hidden tw-relative"
        style={{ backgroundColor: this.state.color, padding: "10px" }}
        variant="primary"
        onClick={this.handleClick}
      >
        <figure className="tw-svg">
          <svg
            className="tw-svg__asset tw-svg__asset--heart tw-svg__asset--inherit"
            width="20px"
            height="20px"
            version="1.1"
            viewBox="0 -6 20 26"
            x="0px"
            y="0px"
            fill="none"
          >
            <path
              d="M10 15.27L16.18 19L14.54 11.97L20 7.24L12.81 6.63L10 0L7.19 6.63L0 7.24L5.46 11.97L3.82 19L10 15.27Z"
              fill="var(--color-text-button-secondary)"
            />
          </svg>
        </figure>
        <span style={{ paddingLeft: "5px" }}>Favorite</span>
      </Button>
    );
  }
}

export default FavoriteButton;
