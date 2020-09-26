// import React, { useState } from "react";
import React from "react";
// import { addChannelToStorage } from "../utils/storage";
import 'bootstrap/dist/css/bootstrap.min.css';
//import './styles.scss';
import ToggleFavorite from "./toggle";

const Popup: React.FC = () => {
  //const [channel, setChannel] = useState("");

  // async function submitForm() {
  //   addChannelToStorage(channel)
  // } 

  return (
    <React.Fragment>
      {/* <div>
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
      </button> */}
      <ToggleFavorite />
    </React.Fragment>
  );
};

export default Popup;
