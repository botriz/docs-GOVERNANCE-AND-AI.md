/**
 * اسکلت دفتر سفارش صرافی ثریا
 * فقط وقتی policy.exchangeEnabled === true فعال می‌شود
 */
'use strict';

class OrderBook {
  constructor(pair) {
    this.pair = pair || 'ARZA/USDT';
    this.bids = [];
    this.asks = [];
    this.trades = [];
    this.nextId = 1;
  }

  place(side, price, amount, owner) {
    if (amount <= 0 || price <= 0) throw new Error('مقدار/قیمت نامعتبر');
    var order = {
      id: this.nextId++,
      side: side,
      price: price,
      amount: amount,
      remaining: amount,
      owner: owner,
      at: Date.now()
    };
    var book = side === 'buy' ? this.bids : this.asks;
    book.push(order);
    book.sort(function (a, b) {
      return side === 'buy' ? b.price - a.price : a.price - b.price;
    });
    this.match();
    return order;
  }

  match() {
    while (this.bids.length && this.asks.length && this.bids[0].price >= this.asks[0].price) {
      var buy = this.bids[0];
      var sell = this.asks[0];
      var qty = Math.min(buy.remaining, sell.remaining);
      var px = sell.price;
      this.trades.push({
        price: px,
        amount: qty,
        buyId: buy.id,
        sellId: sell.id,
        at: Date.now()
      });
      buy.remaining -= qty;
      sell.remaining -= qty;
      if (buy.remaining <= 0) this.bids.shift();
      if (sell.remaining <= 0) this.asks.shift();
    }
  }

  snapshot() {
    return {
      pair: this.pair,
      bids: this.bids.slice(0, 10),
      asks: this.asks.slice(0, 10),
      lastTrades: this.trades.slice(-20)
    };
  }
}

function createExchange(policy) {
  if (!policy || !policy.exchangeEnabled) {
    return { enabled: false, message: 'صرافی هنوز از مرکز فعال نشده است' };
  }
  return {
    enabled: true,
    book: new OrderBook('ARZA/USDT')
  };
}

module.exports = {
  OrderBook: OrderBook,
  createExchange: createExchange
};
