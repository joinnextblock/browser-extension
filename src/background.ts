import { Relay } from 'nostr-tools'

(async () => {
  try {
    const relay = await Relay.connect('wss://t-relay.nextblock.app')
    console.log(`connected to ${relay.url}`)
    
  } 
  catch (err){
    console.error(err)
  }   
  finally {
    console.log('Extension installed');
  }
})()