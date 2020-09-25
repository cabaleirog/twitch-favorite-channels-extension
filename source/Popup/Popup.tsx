import React, { useState } from "react";
import { browser } from 'webextension-polyfill-ts';

import './styles.scss';


const Popup: React.FC = () => {
  const [channel, setChannel] = useState("");

  async function submitForm() {
    const value = channel.trim().toLowerCase()
    if (value) {
      // console.warn(`Submitting..."${value}"`)

      let favorites: string[] = new Array()
      browser.storage.sync.get('twitchFavoriteChannels')
        .then(
          (resp) => {
            if (resp && resp['twitchFavoriteChannels']) {
              favorites = resp['twitchFavoriteChannels']
            }

            if (!favorites.includes(value)) {
              favorites.push(value)
            }
            browser.storage.sync.set({ "twitchFavoriteChannels": favorites })
              .then(
                () => console.log(`Setting at 2 (SYNC) OK`),
                (error) => console.log(`Error 4: ${JSON.stringify(error)}`)
              )

          },
          (error) => console.error(`Error 1: ${JSON.stringify(error)}`)
        )
    }
  }

  return (
    <React.Fragment>
      <div>
        <label>Channel</label>
        <input
          value={channel}
          onChange={e => setChannel(e.target.value)}
          type="input"
          id="channel"
        />
      </div>

      <button className="btn-join" onClick={submitForm}
        id="options__button"
        type="button"
      >
        Add Channel
      </button>
    </React.Fragment>
  );
};

export default Popup;
