'use strict'

const { PeerRPCClient }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new PeerRPCClient(link, {})
peer.init()

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

function placeOrder(orders, amount, quantity) {
  if(orders === 'buy'){
    placeBuyOrder(amount, quantity);
  }
  else{
    placeSellOrder(amount, quantity);
  }
  const currentOrderBook = getOrderBooks();
  const message = {
    orders: orders,
    amount: amount,
    quantity: quantity
  }
  peer.request('push_order', { msg: message }, { timeout: 10000 }, (err, data) => {
    if (err) {
      console.error(err)
      process.exit(-1)
    }
    console.log('current order book', currentOrderBook);
  })
}

setInterval(function () {
  peer.request('update_orderbook', { msg: 'currentOrderBook' }, { timeout: 10000 }, (err, data) => {
    if (err) {
      console.error(err)
      process.exit(-1)
    }
    orderBook = data.msg;
    console.log('orderbook received', JSON.stringify(getOrderBooks()))
  })
}, 5000)

async function executeTrade(bestBuyOrder, bestSellOrder){
  const quantity = Math.min(bestBuyOrder.quantity, bestSellOrder.quantity);
    orderBook.buyOrders[0].quantity -= quantity;
    orderBook.sellOrders[0].quantity -= quantity;
    if (bestBuyOrder.quantity === 0) {
      orderBook.buyOrders.shift();
    }
    if (bestSellOrder.quantity === 0) {
      orderBook.sellOrders.shift();
    }
    return { 
      price: bestSellOrder.price, quantity 
    };
  }
  

setInterval(async function () {
  if (orderBook.buyOrders.length === 0 || orderBook.sellOrders.length === 0) {
    return "No orders to trade"; 
  }

  const bestBuyOrder = orderBook.buyOrders[0];
  const bestSellOrder = orderBook.sellOrders[0];
  
  // check if order matches
  if (bestBuyOrder.price >= bestSellOrder.price) {

    // tempOrderBook - remove first orders
    let tempOrderBook = orderBook
    tempOrderBook.buyOrders.shift()
    tempOrderBook.sellOrders.shift()

    // tempOrderBook => Server
    peer.request('match_order', { msg: tempOrderBook }, { timeout: 10000 }, (err, data) => {
            if (err) {
              console.error(err)
              process.exit(-1)
            }
        console.log('after removing temp element',data);
    })

    await executeTrade(bestBuyOrder, bestSellOrder);
    
     // server - orderBook original
     peer.request('match_order', { msg: tempOrderBook }, { timeout: 10000 }, (err, data) => {
      if (err) {
        console.error(err)
        process.exit(-1)
      }
      console.log('after trade executed',data);
    })
   
  } 
  return "No trade executed";  
}, 6000)

module.exports = placeOrder;