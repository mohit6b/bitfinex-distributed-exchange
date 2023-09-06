
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
// const peer = new PeerPub(link,{})
peer.init()

const port = 3000;//1024 + Math.floor(Math.random() * 1000)
const service = peer.transport('server')
service.listen(port)
const service2 = peer.transport('server')
service2.listen(3003);
const service3 = peer.transport('server')
service3.listen(3004);

setInterval(function () {
  link.announce('push_order', service.port, {})
  link.announce('update_orderbook', service2.port,{})
  link.announce('match_order', service3.port, {} )
}, 1000)

let orderBook = {
  buyOrders: [],
  sellOrders: [],
};

function getOrderBooks() {
  return {
    buyOrders: orderBook.buyOrders,
    sellOrders: orderBook.sellOrders,
  };
}
// Place a buy order
function placeBuyOrder(price, quantity) {
  orderBook.buyOrders.push({ price, quantity });
  sortOrdersByPrice(orderBook.buyOrders);
}

// Place a sell order
function placeSellOrder(price, quantity) {
  orderBook.sellOrders.push({ price, quantity });
  sortOrdersByPrice(orderBook.sellOrders);
}
// Utility function to sort orders by price (ascending)
function sortOrdersByPrice(orders) {
  orders.sort((a, b) => a.price - b.price);
}

// Get the current order book state
const currentOrderBook = getOrderBooks();
console.log('initial order book', currentOrderBook);

service.on('request', (rid, key, payload, handler) => {
  if(payload.msg.orders === 'buy'){
    placeBuyOrder(payload.msg.amount, payload.msg.quantity);
  }
  else{
    placeSellOrder(payload.msg.amount, payload.msg.quantity);
  }

  // add global order book 
  console.log(JSON.stringify(payload))
  const newOrderBook = getOrderBooks();
  console.log(JSON.stringify(newOrderBook)); 
  // const trade1 = executeTrade();
  // console.log('trade exec: ', trade1);
  // console.log(JSON.stringify(getOrderBooks()));

  console.log('handler', JSON.stringify(handler));
  handler.reply(null, { msg: 'orderbook updated' })
})

service2.on('request', (rid, key, payload, handler) => {
  handler.reply(null, { msg: getOrderBooks() })
})

service3.on('request', (rid, key, payload, handler) => {
  orderBook = payload.msg;

  // add global order book 
  console.log(JSON.stringify(payload.msg))
  const newOrderBook = getOrderBooks();
  console.log(JSON.stringify(newOrderBook)); 

  console.log('handler', JSON.stringify(handler));
  handler.reply(null, { msg: 'orderbook match updated' })
})