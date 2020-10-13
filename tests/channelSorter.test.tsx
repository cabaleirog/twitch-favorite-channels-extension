// const x = '<html><body><div>ABC</div></body></html>'
import ChannelSorter from '../source/ContentScript/channelSorter'



describe('ChannelSorter', () => {
  let intervalId: any
  let sorter: ChannelSorter | null

  beforeEach(() => {
    sorter = new ChannelSorter(50)
    intervalId = setInterval(() => sorter?.update(), 5)
  })
  
  afterEach(() => {
    clearInterval(intervalId)
    sorter = null
  })


  it('should only run once the interval time has been reached', () => {
    expect(false).toBeTruthy()
  }, 2000)

  it('should always run on the first update', () => {
    expect(false).toBeTruthy()
  }, 2000)

  it('should separate the Favorite channels from the rest into groups', () => {
    expect(false).toBeTruthy()
  }, 2000)

  it('should expand the list if there are still more channels live hidden', () => {
    expect(false).toBeTruthy()
  }, 2000)

  it('should not expand the list if all live channels are already displayed', () => {
    expect(false).toBeTruthy()
  }, 2000)

})
