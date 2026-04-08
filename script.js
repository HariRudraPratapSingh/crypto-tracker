var allCoins = [];
var favorites = [];
var isLightMode = false;

var API_URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false";

var sampleData = [
  { id: "bitcoin", name: "Bitcoin", symbol: "btc", image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png", current_price: 83000, market_cap: 1640000000000, total_volume: 28000000000, price_change_percentage_24h: 2.15, market_cap_rank: 1, ath: 108000, circulating_supply: 19700000 },
  { id: "ethereum", name: "Ethereum", symbol: "eth", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", current_price: 1580, market_cap: 190000000000, total_volume: 12000000000, price_change_percentage_24h: -1.42, market_cap_rank: 2, ath: 4878, circulating_supply: 120000000 },
  { id: "tether", name: "Tether", symbol: "usdt", image: "https://assets.coingecko.com/coins/images/325/large/Tether.png", current_price: 1.00, market_cap: 144000000000, total_volume: 60000000000, price_change_percentage_24h: 0.01, market_cap_rank: 3, ath: 1.32, circulating_supply: 144000000000 },
  { id: "binancecoin", name: "BNB", symbol: "bnb", image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png", current_price: 580, market_cap: 84000000000, total_volume: 1500000000, price_change_percentage_24h: 0.85, market_cap_rank: 4, ath: 686, circulating_supply: 145000000 },
  { id: "solana", name: "Solana", symbol: "sol", image: "https://assets.coingecko.com/coins/images/4128/large/solana.png", current_price: 120, market_cap: 58000000000, total_volume: 3000000000, price_change_percentage_24h: -3.10, market_cap_rank: 5, ath: 259, circulating_supply: 480000000 },
  { id: "ripple", name: "XRP", symbol: "xrp", image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png", current_price: 2.05, market_cap: 117000000000, total_volume: 5000000000, price_change_percentage_24h: 1.30, market_cap_rank: 6, ath: 3.84, circulating_supply: 57000000000 },
  { id: "usd-coin", name: "USDC", symbol: "usdc", image: "https://assets.coingecko.com/coins/images/6319/large/usdc.png", current_price: 1.00, market_cap: 43000000000, total_volume: 8000000000, price_change_percentage_24h: 0.02, market_cap_rank: 7, ath: 1.17, circulating_supply: 43000000000 },
  { id: "dogecoin", name: "Dogecoin", symbol: "doge", image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png", current_price: 0.165, market_cap: 24000000000, total_volume: 1200000000, price_change_percentage_24h: -2.50, market_cap_rank: 8, ath: 0.7376, circulating_supply: 145000000000 },
  { id: "cardano", name: "Cardano", symbol: "ada", image: "https://assets.coingecko.com/coins/images/975/large/cardano.png", current_price: 0.62, market_cap: 22000000000, total_volume: 600000000, price_change_percentage_24h: 1.75, market_cap_rank: 9, ath: 3.09, circulating_supply: 35000000000 },
  { id: "tron", name: "TRON", symbol: "trx", image: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png", current_price: 0.22, market_cap: 19000000000, total_volume: 900000000, price_change_percentage_24h: 0.55, market_cap_rank: 10, ath: 0.3004, circulating_supply: 87000000000 },
  { id: "avalanche-2", name: "Avalanche", symbol: "avax", image: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png", current_price: 19.50, market_cap: 8000000000, total_volume: 350000000, price_change_percentage_24h: -4.20, market_cap_rank: 11, ath: 146, circulating_supply: 410000000 },
  { id: "polkadot", name: "Polkadot", symbol: "dot", image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png", current_price: 3.80, market_cap: 5800000000, total_volume: 200000000, price_change_percentage_24h: -1.10, market_cap_rank: 12, ath: 54.98, circulating_supply: 1530000000 },
  { id: "chainlink", name: "Chainlink", symbol: "link", image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", current_price: 12.50, market_cap: 7600000000, total_volume: 450000000, price_change_percentage_24h: 3.40, market_cap_rank: 13, ath: 52.88, circulating_supply: 608000000 },
  { id: "shiba-inu", name: "Shiba Inu", symbol: "shib", image: "https://assets.coingecko.com/coins/images/11939/large/shiba.png", current_price: 0.0000122, market_cap: 7200000000, total_volume: 310000000, price_change_percentage_24h: -0.80, market_cap_rank: 14, ath: 0.00008845, circulating_supply: 589000000000000 },
  { id: "litecoin", name: "Litecoin", symbol: "ltc", image: "https://assets.coingecko.com/coins/images/2/large/litecoin.png", current_price: 82, market_cap: 6100000000, total_volume: 280000000, price_change_percentage_24h: 1.95, market_cap_rank: 15, ath: 410, circulating_supply: 74000000 },
  { id: "uniswap", name: "Uniswap", symbol: "uni", image: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png", current_price: 5.40, market_cap: 4100000000, total_volume: 180000000, price_change_percentage_24h: 2.60, market_cap_rank: 16, ath: 44.97, circulating_supply: 760000000 },
  { id: "stellar", name: "Stellar", symbol: "xlm", image: "https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png", current_price: 0.27, market_cap: 8400000000, total_volume: 220000000, price_change_percentage_24h: -0.45, market_cap_rank: 17, ath: 0.8752, circulating_supply: 31000000000 },
  { id: "monero", name: "Monero", symbol: "xmr", image: "https://assets.coingecko.com/coins/images/69/large/monero_logo.png", current_price: 215, market_cap: 3900000000, total_volume: 140000000, price_change_percentage_24h: 0.70, market_cap_rank: 18, ath: 542, circulating_supply: 18500000 },
  { id: "ethereum-classic", name: "Ethereum Classic", symbol: "etc", image: "https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png", current_price: 17.80, market_cap: 2600000000, total_volume: 130000000, price_change_percentage_24h: -2.00, market_cap_rank: 19, ath: 167, circulating_supply: 146000000 },
  { id: "filecoin", name: "Filecoin", symbol: "fil", image: "https://assets.coingecko.com/coins/images/12817/large/filecoin.png", current_price: 2.85, market_cap: 1700000000, total_volume: 95000000, price_change_percentage_24h: -3.50, market_cap_rank: 20, ath: 236, circulating_supply: 600000000 }
];

function loadData() {
  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("errorMsg").classList.add("hidden");
  document.getElementById("cardContainer").innerHTML = "";
  document.getElementById("resultInfo").textContent = "";

  fetch(API_URL)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      allCoins = data;
      document.getElementById("loading").classList.add("hidden");
      applyAll();
    })
    .catch(function(error) {
      console.error("API failed, using sample data:", error);
      allCoins = sampleData;
      document.getElementById("loading").classList.add("hidden");
      document.getElementById("resultInfo").textContent = "⚠️ Live data unavailable — showing sample data";
      applyAll();
    });
}

function applyAll() {
  var searchText = document.getElementById("searchInput").value.toLowerCase();
  var filterValue = document.getElementById("filterSelect").value;
  var sortValue = document.getElementById("sortSelect").value;

  var searched = allCoins.filter(function(coin) {
    return coin.name.toLowerCase().includes(searchText) ||
           coin.symbol.toLowerCase().includes(searchText);
  });

  var filtered = searched.filter(function(coin) {
    if (filterValue === "gainers")   return coin.price_change_percentage_24h > 0;
    if (filterValue === "losers")    return coin.price_change_percentage_24h < 0;
    if (filterValue === "top10")     return coin.market_cap_rank <= 10;
    if (filterValue === "favorites") return favorites.includes(coin.id);
    return true;
  });

  var sorted = filtered.sort(function(a, b) {
    if (sortValue === "rank")        return a.market_cap_rank - b.market_cap_rank;
    if (sortValue === "price_high")  return b.current_price - a.current_price;
    if (sortValue === "price_low")   return a.current_price - b.current_price;
    if (sortValue === "change_high") return b.price_change_percentage_24h - a.price_change_percentage_24h;
    if (sortValue === "change_low")  return a.price_change_percentage_24h - b.price_change_percentage_24h;
    if (sortValue === "name_az")     return a.name.localeCompare(b.name);
    if (sortValue === "name_za")     return b.name.localeCompare(a.name);
    return 0;
  });

  var infoEl = document.getElementById("resultInfo");
  if (!infoEl.textContent.includes("sample")) {
    infoEl.textContent = "Showing " + sorted.length + " coins";
  }

  displayCards(sorted);
}

function displayCards(coins) {
  var container = document.getElementById("cardContainer");
  container.innerHTML = "";

  if (coins.length === 0) {
    container.innerHTML = "<p style='text-align:center;color:#888;padding:40px;'>No coins found.</p>";
    return;
  }

  coins.forEach(function(coin) {
    var card = document.createElement("div");
    card.className = "card";

    var change = coin.price_change_percentage_24h;
    var changeClass = change >= 0 ? "up" : "down";
    var changeSymbol = change >= 0 ? "▲" : "▼";
    var isFav = favorites.includes(coin.id);

    card.innerHTML =
      '<div class="card-top">' +
        '<div class="coin-left">' +
          '<img src="' + coin.image + '" alt="' + coin.name + '" />' +
          '<div>' +
            '<div class="coin-name">' + coin.name + '</div>' +
            '<div class="coin-symbol">' + coin.symbol + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;align-items:center;">' +
          '<span class="rank">#' + coin.market_cap_rank + '</span>' +
          '<button class="fav-btn ' + (isFav ? 'active' : '') + '" onclick="toggleFavorite(\'' + coin.id + '\')" title="Save to favorites">❤️</button>' +
        '</div>' +
      '</div>' +

      '<div class="price">$' + formatPrice(coin.current_price) + '</div>' +
      '<span class="change ' + changeClass + '">' + changeSymbol + ' ' + Math.abs(change).toFixed(2) + '%</span>' +

      '<div class="stats">' +
        '<div class="stat-item">' +
          '<div class="stat-label">Market Cap</div>' +
          '<div class="stat-value">' + formatBig(coin.market_cap) + '</div>' +
        '</div>' +
        '<div class="stat-item">' +
          '<div class="stat-label">24h Volume</div>' +
          '<div class="stat-value">' + formatBig(coin.total_volume) + '</div>' +
        '</div>' +
        '<div class="stat-item">' +
          '<div class="stat-label">All-Time High</div>' +
          '<div class="stat-value">$' + formatPrice(coin.ath) + '</div>' +
        '</div>' +
        '<div class="stat-item">' +
          '<div class="stat-label">Circulating Supply</div>' +
          '<div class="stat-value">' + formatBig(coin.circulating_supply) + '</div>' +
        '</div>' +
      '</div>';

    container.appendChild(card);
  });
}

function toggleFavorite(coinId) {
  if (favorites.includes(coinId)) {
    favorites = favorites.filter(function(id) {
      return id !== coinId;
    });
  } else {
    favorites.push(coinId);
  }
  applyAll();
}

function toggleTheme() {
  isLightMode = !isLightMode;
  var body = document.getElementById("body");
  var btn = document.getElementById("themeBtn");

  if (isLightMode) {
    body.classList.add("light");
    btn.textContent = "🌙 Dark Mode";
  } else {
    body.classList.remove("light");
    btn.textContent = "☀️ Light Mode";
  }
}

function formatPrice(value) {
  if (!value) return "N/A";
  if (value >= 1) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return value.toFixed(6);
}

function formatBig(value) {
  if (!value) return "N/A";
  if (value >= 1000000000000) return "$" + (value / 1000000000000).toFixed(2) + "T";
  if (value >= 1000000000)    return "$" + (value / 1000000000).toFixed(2) + "B";
  if (value >= 1000000)       return "$" + (value / 1000000).toFixed(2) + "M";
  return "$" + value.toLocaleString();
}

loadData();