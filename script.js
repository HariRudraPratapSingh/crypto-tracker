const cryptoContainer = document.getElementById("cryptoContainer");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const refreshBtn = document.getElementById("refreshBtn");

const API_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false";

async function fetchCryptoData() {
  try {
    showLoading();
    hideError();

    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Failed to fetch crypto data");
    }

    const data = await response.json();
    displayCryptoData(data);
  } catch (err) {
    console.error("Error fetching crypto data:", err);
    showError();
  } finally {
    hideLoading();
  }
}

function displayCryptoData(coins) {
  cryptoContainer.innerHTML = "";

  coins.forEach((coin) => {
    const changeClass =
      coin.price_change_percentage_24h >= 0 ? "positive" : "negative";

    const card = document.createElement("div");
    card.classList.add("crypto-card");

    card.innerHTML = `
      <div class="coin-header">
        <img src="${coin.image}" alt="${coin.name}" />
        <div>
          <div class="coin-name">${coin.name}</div>
          <div class="coin-symbol">${coin.symbol}</div>
        </div>
      </div>

      <div class="coin-info">
        <p><strong>Rank:</strong> #${coin.market_cap_rank}</p>
        <p><strong>Price:</strong> $${coin.current_price.toLocaleString()}</p>
        <p><strong>Market Cap:</strong> $${coin.market_cap.toLocaleString()}</p>
        <p><strong>24h Change:</strong> 
          <span class="${changeClass}">
            ${coin.price_change_percentage_24h.toFixed(2)}%
          </span>
        </p>
      </div>
    `;

    cryptoContainer.appendChild(card);
  });
}

function showLoading() {
  loading.classList.remove("hidden");
  cryptoContainer.innerHTML = "";
}

function hideLoading() {
  loading.classList.add("hidden");
}

function showError() {
  error.classList.remove("hidden");
}

function hideError() {
  error.classList.add("hidden");
}

refreshBtn.addEventListener("click", fetchCryptoData);

// Initial fetch when page loads
fetchCryptoData();