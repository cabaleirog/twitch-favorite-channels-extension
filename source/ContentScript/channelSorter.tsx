import { getLogger } from "../utils/logging";
import {
  Stream,
  getChannelsFromStorage,
  getElementByXpath,
  XPATH_FOLLOWED_LIST,
} from "../utils";
import { arrayToRGBA, COLORS } from "./colors";
import { usesDarkTheme } from "../utils/twitch";

const logger = getLogger("ContentScript");

let colors = COLORS;

export default class ChannelSorter {
  // checkInterval: Milliseconds between checks; if value is zero, will check every time its called.
  lastExecution: Date | null; // Last this the function was called (Based on the interval)
  lastUpdated: Date | null; // Last time the page was modified
  updateInterval: number;
  processInterval: number; // The main thread, this will be used as a timeout
  container?: HTMLElement;
  lastSortedLists: { favorites: Stream[]; others: Stream[] };
  isInitialized: boolean;
  intervalId: any;
  favoritesSet: Set<string>;

  constructor(updateInterval: number = 0, processInterval: number = 100) {
    this.updateInterval = updateInterval;
    this.lastSortedLists = { favorites: new Array(), others: new Array() };
    this.lastExecution = null;
    this.lastUpdated = null;
    this.intervalId = null;
    this.processInterval = processInterval;
    this.isInitialized = false;
    this.favoritesSet = new Set();
  }

  // Returns the intervalId or null if initialization failed
  initialize(): any {
    if (!this.isInitialized) {
      logger.info(`Creating main process using setInterval.`);
      logger.info(this);
      this.isInitialized = true;
      this.intervalId = setInterval(() => this.update(), this.processInterval);
      // this.update()
      logger.info(`Channel sorter initialized. IntervalID: ${this.intervalId}`);
    }
    return this.intervalId;
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.updateInterval = Number.MAX_SAFE_INTEGER;
      this.isInitialized = false;
    }
  }

  update(): void {
    // If update is called, but it hasnt been initialized, initialize it.
    if (!this.isInitialized) this.initialize();

    if (!this.container) {
      this.container = getElementByXpath(XPATH_FOLLOWED_LIST) as HTMLElement;
    }

    if (this.container) {
      this.sortElements().then((resp) => {
        if (resp) {
          logger.debug("List has been refreshed");
          logger.debug(this);
        }
      });
    }

    // setTimeout(() => this.update(), this.processInterval)
  }

  private async getFavorites(): Promise<Set<string>> {
    // TODO: Optimize this, currently polling every time it updates the values from local storage
    const mapping: Set<string> = new Set();
    const channels = await getChannelsFromStorage();
    for (let item of channels) {
      mapping.add(item);
    }
    return mapping;
  }

  // returns true if the list was sorted, false if it was skipped
  private async sortElements(): Promise<boolean> {
    if (this.timeSinceLast() < this.updateInterval) return false;

    this.lastExecution = new Date();

    // Check if there is enough information to sort the list

    const liveChannels = this.getSortableChannels();

    if (liveChannels.length === 0) {
      // There is no live channels to sort. Skipping.
      return false;
    }

    // Separate into groups for favorites channels and the rest
    const favoriteChannels: Stream[] = new Array();
    const otherChannels: Stream[] = new Array();

    const favorites = await this.getFavorites();
    liveChannels.forEach((element: HTMLElement, idx: number) => {
      let info: Stream = { div: element, viewers: Number.NaN };

      // TODO: If the sidebar is collapsed, viewers will be NaN and we wont be able to sort.
      // Maybe refactor this to make 2 groups first, and then consider the numbers.
      // <div data-test-selector="side-nav-card-collapsed"> gives an indication of the sidebar status.

      info.viewers = this.parseViewers(
        element.getElementsByTagName("span")[0]?.textContent
      );
      info.url = element.getElementsByTagName("a")[0]?.href;

      let p = element.getElementsByTagName("p");
      info.channel = p[0]?.textContent?.trim().toLowerCase();

      // FIXME: Exception has occurred: TypeError: Cannot read property 'textContent' of undefined (After minimizing the sidebar)
      // if (p[1].textContent) info.game = p[1].textContent
      info.game = p[1]?.textContent?.trim();

      if (!info.channel && info.url) {
        // Most likely the sidebar is collapsed; so we can use the url to extract the channel name.
        const chunks = info.url.split("/");
        if (chunks) info.channel = chunks[chunks.length - 1];
      }

      // info.isFavorite = info.channel ? favorites.has(info.channel) : false
      info.isFavorite = !!info.channel && favorites.has(info.channel);
      info.currentPosition = idx;

      if (info.isFavorite) {
        favoriteChannels.push(info);
      } else {
        otherChannels.push(info);
      }
    });

    // TODO: Pre-check the sizes of the previous and current favorite list to quickly determine if needs sorted.

    // Sort the favorites
    this.sortGroup(favoriteChannels);
    this.sortGroup(otherChannels);

    // Check if already sorted on the page
    let alreadySorted = true;
    favoriteChannels.forEach((element, idx) => {
      if (element.currentPosition !== idx) {
        alreadySorted = false;
        // break   // FIXME: Jump target cannot cross function boundary.ts(1107)
      }
    });

    if (alreadySorted) {
      otherChannels.forEach((element, idx) => {
        if (element.currentPosition !== favoriteChannels.length + idx) {
          alreadySorted = false;
          // break  // FIXME: Jump target cannot cross function boundary.ts(1107)
        }
      });
    }

    // If the list is already sorted, there is no need to refresh.
    if (alreadySorted) {
      return false;
    }

    // Recreate the list or modify in place (decide this one)
    this.updateFollowedListElements(favoriteChannels, otherChannels);

    // Keep a copy of the current lists
    this.lastSortedLists.favorites = favoriteChannels;
    this.lastSortedLists.others = otherChannels;
    this.lastUpdated = new Date();

    return true;
  }

  private updateFollowedListElements(favorites: Stream[], others: Stream[]) {
    // TODO: Optimize this to avoid swaping nodes which are already in the right place

    // FIXME: Quick hack to have the old code working
    let liveStreams = new Array();
    favorites.forEach((element) => {
      liveStreams.push(element);
    });
    others.forEach((element) => {
      liveStreams.push(element);
    });

    let sortedFavorites: number = 0;
    for (let idx = liveStreams.length - 1; idx >= 0; idx--) {
      const row = liveStreams[idx];
      const parentNode = row.div.parentNode;
      if (row.isFavorite && parentNode) {
          parentNode.removeChild(row.div);
          this.container?.insertBefore(row.div, this.container?.childNodes[0]);
          row.div.style.backgroundColor = arrayToRGBA(usesDarkTheme() ? colors.dark.sidebar : colors.light.sidebar) ;
          sortedFavorites += 1;
      } else {
        parentNode?.removeChild(row.div);
        this.container?.insertBefore(
          row.div,
          this.container?.childNodes[sortedFavorites]
        );
        row.div.style.backgroundColor = "rgba(0, 0, 0, 0.0)"; // FIXME: Workaround to fix the issue of deleted favorites for now.
      }
    }

    // const endTime = new Date()
    // const elapsed = (endTime.getTime() - startTime.getTime())
    // logger.debug(`sortFollow function completed in ${elapsed} milliseconds.`)
  }

  private sortGroup(group: Stream[]): void {
    // FIXME: Quick and dirty way to sort, implement something else.
    // Sort in-place
    group.sort(
      (a, b) =>
        (b.isFavorite ? 1000000000 : 1) +
        b.viewers -
        ((a.isFavorite ? 1000000000 : 1) + a.viewers)
    );
  }

  private timeSinceLast(): number {
    // Returns the time in milliseconds since the last sorting process was ran.
    if (this.lastExecution === null) return this.updateInterval;
    return new Date().getTime() - this.lastExecution.getTime();
  }

  expandChannelList(iterations: number = 10): void {
    for (let i = 0; i < iterations; i++) {
      if (!this.canExpandFurther()) return;
      this.showMore();
    }
  }

  private getShowMoreElement(): HTMLElement | null {
    return document.querySelector('[data-test-selector="ShowMore"]');
  }

  private canExpandFurther(): boolean {
    const showMore = this.getShowMoreElement();

    // Handle the cases when the sidebar is collapsed or user is not logged in.
    // if (showMore === null || typeof showMore === "undefined") return false;   // XXX: Can be written in a better way
    if (!showMore) return false;
    
    // return getElementByXpath('//*[@data-a-target="side-nav-live-status"]//span[text()="Offline"]') !== null
    if (!this.container) return false;
    const viewCounts = Array.from(
      this.container?.getElementsByTagName("span")
    ).map((e) => e.textContent);
    return !viewCounts.some((v) => v?.trim().toLowerCase() === "offline");
  }

  private showMore(): void {
    const showMore = this.getShowMoreElement();
    if (showMore) showMore.click();
  }

  getSortableChannels(): HTMLElement[] {
    // Get the list of all live followed channels
    this.expandChannelList();

    // FIXME: This should be using this.container instead of getting it again.
    const container = getElementByXpath(XPATH_FOLLOWED_LIST) as HTMLElement;
    const children = container.children
      ? Array.from(container.children)
      : new Array();
    const size = children.length;

    for (let i = 0; i < size; i++) {
      const element: HTMLElement = children[children.length - 1];
      if (!element.textContent?.endsWith("Offline")) {
        break;
      }
      children.pop();
    }
    return children;
  }

  parseViewers(viewerCount: string | null): number {
    if (viewerCount === null || typeof viewerCount === "undefined")
      return Number.NaN;

    let viewers = viewerCount.trim().toUpperCase();
    if (viewers === "OFFLINE" || viewers === "") {
      return Number.NaN;
    }
    if (viewers.endsWith("K")) {
      return 1000 * Number.parseFloat(viewers.substr(0, viewers.length - 1));
    }
    if (viewers.endsWith("M")) {
      return 1000000 * Number.parseFloat(viewers.substr(0, viewers.length - 1));
    }
    return Number.parseInt(viewers);
  }
}
