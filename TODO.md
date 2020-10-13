# BUGS

- Logged out user while trigger a huge loop as there is no button to find.
- Newly followed channels dont display Favorite botton after following, unless a page event is triggered (onListen); this can lead to the button not been displayed for some time.
- When the sidebad is collapsed, things like the view count are not present, but its still trying to parse the value, giving an error (TypeError: Cannot read property 'textContent' of undefined)
- Channel which goes offline, will not have the color removed.


# TODO

- Toggling the Favorite button on one page, wont update another page currently open from the same streamer. Causing a possible case where a toggle wont produce the expected result for the user.
- Optimize the sorting algorithm.
- If a followed channel raids a channel the user doesnt follow, the button will still be present, and the state will be the last it had.
- Recognize user, so multiple users can use the extension on the same browser
- Find a way to sort the list when the sidebar is collapsed.
- Avoid fetching storage information on every refresh, better add a listener for storage changes to improve performance.