# Bitfinex-distributed-exchange
Distributed Exchange implemented using grenache

# The BFX challenge
Your task is to create a simplified distributed exchange

* Each client will have its own instance of the orderbook.
* Clients submit orders to their own instance of orderbook. The order is distributed to other instances, too.
* If a client's order matches with another order, any remainer is added to the orderbook, too.

Requirement:
* Code in Javascript
* Use Grenache for communication between nodes
* Simple order matching engine
* You don't need to create a UI or HTTP API

## Commands to run the application

### Setting up the DHT
```
npm i -g grenache-grape
```

### boot two grape servers
```
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

### Setting up Grenache in your project

```
npm install
npm install --save grenache-nodejs-http
npm install --save grenache-nodejs-link
```


### Run Server
Open New Terminal for server with multiple workers
```
node server/server.js
```

###
Open New terminal for each client
```
node client/client1.js
node client/client2.js
node client/client3.js
node client/client4.js
```

## Send ultiple buy and sell orders through file
```
node test.js
```

## Tasks Breakdown
- [x] Set up a Grenache network with multiple nodes (clients)
- [x] Each client will have its own instance of the order book
- [x] configure the network, and establish node discovery each other
- [ ] Implement the service for submitting orders on each client node using Grenache
- [ ] Order Book Structure 
    - [x] List of Buy Orders
    - [x] List of Sell Orders
    - [x] Add Order Function 
    - [x] Remove Order Function
    - [x] Match Order Function 
- [x] Implement a service on each client node that allows users to submit buy and sell orders
- [x] When an order is submitted, broadcast it to other nodes in the Grenache network
- [x] Implement the order matching logic on each client node
    - [x] Check if any newly submitted order matches with existing orders in the order book
    - [x] Execute trades when orders match, and update the order book accordingly
- [x] When an order is matched or updated (e.g., partially filled), broadcast the changes to all nodes in the network using Grenache


# Edge Cases
- [ ] Handle Partial Fills and Remaining Orders - create a new order with the remaining quantity and add it back to the order book

# Best Practices
- [x] Error Handling and Resilience
- [ ] Testing and Optimization - Unit tests, integration tests can be implemented using mocha/chai
- [x] Documentation 
- [ ] Deployment - Can be done through Docker containers where each peer(server, client, etc) will run in a separate container

## Limitations


## Possible Issues



### Example RPC server / client with "Hello World"

```js
// This RPC server will announce itself as `rpc_test`
// in our Grape Bittorrent network
// When it receives requests, it will answer with 'world'

'use strict'

const { PeerRPCServer }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')


const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new PeerRPCServer(link, {
  timeout: 300000
})
peer.init()

const port = 1024 + Math.floor(Math.random() * 1000)
const service = peer.transport('server')
service.listen(port)

setInterval(function () {
  link.announce('rpc_test', service.port, {})
}, 1000)

service.on('request', (rid, key, payload, handler) => {
  console.log(payload) //  { msg: 'hello' }
  handler.reply(null, { msg: 'world' })
})

```

```js
// This client will as the DHT for a service called `rpc_test`
// and then establishes a P2P connection it.
// It will then send { msg: 'hello' } to the RPC server

'use strict'

const { PeerRPCClient }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new PeerRPCClient(link, {})
peer.init()

peer.request('rpc_test', { msg: 'hello' }, { timeout: 10000 }, (err, data) => {
  if (err) {
    console.error(err)
    process.exit(-1)
  }
  console.log(data) // { msg: 'world' }
})
```

### More Help

 - http://blog.bitfinex.com/tutorial/bitfinex-loves-microservices-grenache/
 - https://github.com/bitfinexcom/grenache-nodejs-example-fib-client
 - https://github.com/bitfinexcom/grenache-nodejs-example-fib-server


