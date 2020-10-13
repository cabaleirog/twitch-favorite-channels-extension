import React, { Component } from "react";
import Button from "react-bootstrap/esm/Button";
import { browser } from "webextension-polyfill-ts";
import { buttonMainColor, Color } from "../utils";
import { getLogger } from "../utils/logging";
import { usesDarkTheme } from "../utils/twitch";
import "./styles.scss";

const logger = getLogger("ContentScript");

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

class FavoriteButton extends Component<{}, { isFavorite: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { isFavorite: true };
    logger.debug(this);
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
        if (resp === "added") {
          logger.debug(this);
          const element = document.getElementById(
            "twitch-favorite-channels-extension"
          );
          if (element) {
            element.style.backgroundColor = usesDarkTheme()
              ? buttonMainColor.toHtml(0.75)
              : new Color(175, 41, 255).toHtml();
          }
        } else if (resp === "removed") {
          logger.debug(this);
          const element = document.getElementById(
            "twitch-favorite-channels-extension"
          );
          if (element) {
            element.style.backgroundColor = buttonMainColor.toHtml(0.0);
          }
        } else {
          logger.debug(
            `Unhandled response received from background. Expected 'added' or 'removed', but got ${resp}`
          );
        }
      });
  }

  getStyle() {
    return { padding: "10px" };
  }

  getSpanStyle() {
    return { paddingLeft: "5px" };
  }

  // className={this.state.isFavorite ? 'favorite' : ''}
  render() {
    return (
      <Button
        className={
          this.state.isFavorite
            ? "tw-align-items-center tw-align-middle tw-border-bottom-left-radius-medium tw-border-bottom-right-radius-medium tw-border-top-left-radius-medium tw-border-top-right-radius-medium tw-core-button tw-core-button--secondary tw-full-width tw-inline-flex tw-interactive tw-justify-content-center tw-overflow-hidden tw-relative"
            : ""
        }
        style={this.getStyle()}
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
              fill="#EFEFF1"
            />
          </svg>
        </figure>
        <span style={this.getSpanStyle()}>Favorite</span>
      </Button>
    );
  }
}

export default FavoriteButton;
