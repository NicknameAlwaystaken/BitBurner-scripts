/** @param {NS} ns */
let stocksInfo = [];
let startingPrice = [];
let lowestPrice = [];
let highestPrice = [];

export async function main(ns) {

let highestPriceMarginSell = 0.01; // When the highest peak drops by this margin, sell
let lowestPriceMarginBuy = 0.01; // When the lowest peak drops by this margin, buy
let lowestForecastMarginBuy = 0.60; // Start considering buying at this margin
let lowestForecastMarginSell = 0.49; // Start considering selling at this marginlet marginToRecognizeDirection = 0.02; // Before having any stocks, first program wants to understand where the stock market is heading
let maxPlayerMoneyUsed = 0.15;
let minProfitToShowOnTerminal = 0.05;
let panicSellTreshhold = (-0.03);
let expectedProfitPerShare = 0.10;
let commissionCost = 100000;
let totalProfitFromSession = 0;
let maxSharesToBuy = 1;
let totalProfit = 0;

let fileName = "stocklog.txt";
let logger;
if(!ns.fileExists(fileName)) {
    logger = [];
    await ns.write(fileName, JSON.stringify(logger), "w");
}

ns.disableLog("sleep");
let playerInfo = ns.getPlayer();
if(!playerInfo.hasWseAccount || !playerInfo.hasTixApiAccess) return;
ns.tail();

stocksInfo = await updateStocksInfo(ns);
initStockTempValues(startingPrice, lowestPrice, highestPrice);
logger = JSON.parse(await ns.read(fileName));
while(true) {
    let count = Object.keys(stocksInfo).length;
    stocksInfo = await updateStocksInfo(ns);
    for(var i = 0; i < count; i++) {
        playerInfo = ns.getPlayer();
        let currentStock = stocksInfo[Object.keys(stocksInfo)[i]];
        let currentPrice = currentStock.price;
        let currentSharesAmount = currentStock.position[0];
        let currentForecast = currentStock.forecast;
        if(currentSharesAmount < 1){
            let maxShares = ns.stock.getMaxShares(currentStock.name) * maxSharesToBuy;
            let costPerShare;
            let stockAmount;
            let costForAllShares;
            let currentPlayerMaxMoneyToUse = playerInfo.money * maxPlayerMoneyUsed;
            costForAllShares = ns.stock.getPurchaseCost(currentStock.name, maxShares, "Long");
            if(costForAllShares < currentPlayerMaxMoneyToUse) {
                stockAmount = maxShares;
                costPerShare = costForAllShares / maxShares;
            }
            else {
                stockAmount = currentPlayerMaxMoneyToUse / currentPrice;
                if(stockAmount >= maxShares) {
                    stockAmount = maxShares;
                }
                costForAllShares = ns.stock.getPurchaseCost(currentStock.name, stockAmount, "Long");
                costPerShare = costForAllShares / stockAmount;
                if(stockAmount * costPerShare * expectedProfitPerShare < commissionCost) {
                    continue;
                }
            }
            if(startingPrice[i] == 0) {
                startingPrice[i] = costPerShare;
            }
            if(lowestPrice[i] == 0) {
                lowestPrice[i] = costPerShare;
            }
            let lowestPriceChange = (1 / (lowestPrice[i] / costPerShare) - 1)
            if(costPerShare < lowestPrice[i]) {
                lowestPrice[i] = costPerShare;
            }
            if(lowestPriceChange > lowestPriceMarginBuy && currentStock.forecast >= lowestForecastMarginBuy) {
                let pricePerShare = ns.stock.buy(currentStock.name, stockAmount)
                costForAllShares = pricePerShare * stockAmount;
                if(pricePerShare != 0) {
                    if(playerInfo.money * minProfitToShowOnTerminal < costForAllShares) {
                        /*
                        ns.print("Bought " + currentStock.name +" at price " + ns.nFormat(costForAllShares, "$0.00a") + 
                            " " + ns.nFormat(costForAllShares / playerInfo.money, "0.00%") + " of total money.     --------");
                        */
                        resetStockTempValues(i)
                        continue;
                    }
                }
            }
        }
        else if(currentSharesAmount > 0) {
            let soldGainsForAllShares = ns.stock.getSaleGain(currentStock.name, currentSharesAmount, "Long");
            let soldGainsForAShare = soldGainsForAllShares / currentSharesAmount;
            let currentOwnedAverageSharesPrice = currentStock.position[1];
            let currentTotalCostOfOwnedShares = currentSharesAmount * currentOwnedAverageSharesPrice;
            let currentProfitPercentage = (1 / (currentOwnedAverageSharesPrice / soldGainsForAShare) - 1);
            let currentProfitDecimal = soldGainsForAllShares - currentTotalCostOfOwnedShares;
            if(highestPrice[i] < soldGainsForAShare) {
                highestPrice[i] = soldGainsForAShare;
            }
            let highestPriceChange = (1 / (highestPrice[i] / soldGainsForAShare)) - 1;
            if(highestPriceChange < Math.abs(highestPriceMarginSell) && currentForecast <= lowestForecastMarginSell &&
                soldGainsForAShare > currentOwnedAverageSharesPrice ||
                panicSellTreshhold > currentProfitPercentage  && currentForecast <= lowestForecastMarginSell) {

                soldGainsForAShare = ns.stock.sell(currentStock.name, currentSharesAmount);
                if(soldGainsForAShare != 0) {
                    soldGainsForAllShares = soldGainsForAShare * currentSharesAmount;
                    currentProfitDecimal = soldGainsForAllShares - currentTotalCostOfOwnedShares;
                    let gainsInPercentage = (soldGainsForAllShares / currentTotalCostOfOwnedShares) - 1;
                    totalProfitFromSession += soldGainsForAllShares - currentTotalCostOfOwnedShares;
                    playerInfo = ns.getPlayer();
                    logger.push({'name':currentStock.name,'stockamount':currentSharesAmount,'stockprice':soldGainsForAShare,'totalsoldfor':soldGainsForAllShares,'totalgains':
                        soldGainsForAllShares - currentTotalCostOfOwnedShares,'gaininpercentage':gainsInPercentage,'playermoneyafter':playerInfo.money});
                    await ns.write(fileName, JSON.stringify(logger), "w");
                    resetStockTempValues(i)
                    if(soldGainsForAllShares > playerInfo.money * minProfitToShowOnTerminal) {
                        /*
                        ns.print("Sold " + currentStock.name +" at price " + ns.nFormat(soldGainsForAllShares, "$0.00a") +
                            " Profit: "+ ns.nFormat(currentProfitDecimal, "$0.00a") + " " + ns.nFormat(gainsInPercentage, "0.00%") + "     ++++++++");
                        */
                    }
                    continue;
                }
            }
        }
    }
    var loggercount = Object.keys(logger).length;
    totalProfit = 0;
    var biggestSale = 0;
    var biggestSaleStockName = "";
    for(var i = 0; i < loggercount; i++) {
        let newNumber = logger[i].totalgains;
        totalProfit += newNumber;
        if (biggestSale < newNumber) {
            biggestSale = newNumber;
            biggestSaleStockName = logger[i].name;
        }
    }
    for(var i = (loggercount - 5) > 0 ? (loggercount - 5) : 0; i < loggercount; i++) {
        ns.print("Recent profit: " + ns.nFormat(logger[i].totalgains, "$0.00a") + " " + ns.nFormat(logger[i].gaininpercentage, "0.00%") + " " + logger[i].name);
    }
    ns.print("Current profit from this session: " + ns.nFormat(totalProfitFromSession, "$0.00a") + " Total profit alltime: " + ns.nFormat(totalProfit, "$0.00a"));
    ns.print("Biggest profit on single sell: " + ns.nFormat(biggestSale, "$0.00a") + " " + biggestSaleStockName)
    await ns.sleep(1000);
    ns.clearLog();
}
}

function resetStockTempValues(i) {
startingPrice[i] = 0;
lowestPrice[i] = 0;
highestPrice[i] = 0;
}

function initStockTempValues(startingPrice, lowestPrice, highestPrice) {
let stockLength = Object.keys(stocksInfo).length;
for (var i = 0; i < stockLength; i++) {
    startingPrice[i] = 0;
    lowestPrice[i] = 0;
    highestPrice[i] = 0;
}
return {startingPrice, lowestPrice, highestPrice};
}

export async function updateStocksInfo(ns) {
let stockNames = ns.stock.getSymbols();
let newStocksInfo = [];
let stockPrices;
let stockVolatility;
let stockAskPrice;
let stockBidPrice;
let stockForecast;
let stockMaxShares;
let stockPosition;
for (var i = 0; i < stockNames.length; i++) {
    stockPrices = ns.stock.getPrice(stockNames[i]);
    stockVolatility = ns.stock.getVolatility(stockNames[i]);
    stockAskPrice = ns.stock.getAskPrice(stockNames[i]);
    stockBidPrice = ns.stock.getBidPrice(stockNames[i]);
    stockForecast = ns.stock.getForecast(stockNames[i]);
    stockMaxShares = ns.stock.getMaxShares(stockNames[i]);
    stockPosition = ns.stock.getPosition(stockNames[i]);

    newStocksInfo[stockNames[i]] = {
        'name': stockNames[i], 'price': stockPrices, 'volatility': stockVolatility, 'askprice': stockAskPrice,
        'bidprice': stockBidPrice, 'forecast': stockForecast, 'maxshares': stockMaxShares, 'position': stockPosition
    };
}

return newStocksInfo;
}
/*

function syntaxHighlight(json) {
if (typeof json != 'string') {
     json = JSON.stringify(json, undefined, 2);
}
json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    var cls = 'number';
    if (/^"/.test(match)) {
        if (/:$/.test(match)) {
            cls = 'key';
        } else {
            cls = 'string';
        }
    } else if (/true|false/.test(match)) {
        cls = 'boolean';
    } else if (/null/.test(match)) {
        cls = 'null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
});
}

*/