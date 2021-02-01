# BUGS
- <s>When the screen is reduced to a side where the sidebar is collapsed and no info about viewcount is visible, offline favorites channels will appear as online, and they will remain even after the screen is maximized.</s>
- <s>Clicking streamer's name below the video sometimes causes it to un-favorite the stream.</s>
- <s>Logged out user while trigger a huge loop as there is no button to find.</s>
- <s>Newly followed channels dont display Favorite botton after following, unless a page event is triggered (onListen); this can lead to the button not been displayed for some time.</s>
- <s>When the sidebad is collapsed, things like the view count are not present, but its still trying to parse the value, giving an error (TypeError: Cannot read property 'textContent' of undefined)</s>
- <s>Channel which goes offline, will not have the color removed. Maybe compare the new favorites lists to the previous one, or iterate thru the list looking for "Offline" ones and remove them from the list (maybe) and remove the color.</s>

# TODO

- When the sidebar is collapsed, and no information related to view count is displayed; Just grab all the favorites, and put them on top, let
Twitch handle the ordering of the rest.
- Button looks horrible in light mode; code a detection algorithm and make independent colors, or let the user pick the colors.
- Toggling the Favorite button on one page, wont update another page currently open from the same streamer. Causing a possible case where a toggle wont produce the expected result for the user.
- Optimize the sorting algorithm.
- If a followed channel raids a channel the user doesnt follow, the button will still be present, and the state will be the last it had.
- Recognize user, so multiple users can use the extension on the same browser
- Find a way to sort the list when the sidebar is collapsed.
- Avoid fetching storage information on every refresh, better add a listener for storage changes to improve performance.
- Skip Rearranging nodes inter-group while the sidebar is collapses and there is no viewers information.