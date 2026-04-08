var allCoins = [];
var favorites = [];
var isLightMode = false;

var API_URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false";

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
      document.getElementById("loading").classList.add("hidden");
      document.getElementById("errorMsg").classList.remove("hidden");
      console.error("Error:", error);
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

  document.getElementById("resultInfo").textContent = "Showing " + sorted.length + " coins";

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