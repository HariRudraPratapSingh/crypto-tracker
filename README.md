#  Crypto Tracker Dashboard

##  Project Overview

**Crypto Tracker Dashboard** is a web application that allows users to explore real-time cryptocurrency data in an interactive and user-friendly interface. Built using a public API, the app transforms raw crypto market data into a structured dashboard where users can search, filter, sort, and analyze different cryptocurrencies.

This project helps users gain early exposure to how financial markets work by visualizing key metrics such as price, market capitalization, and daily percentage changes.

---

## Purpose

The world of cryptocurrency and trading is growing rapidly, but understanding market movements and tracking assets can be overwhelming for beginners.

Crypto Tracker Dashboard simplifies this by:

* Providing real-time data in a clean format
* Allowing users to explore trends and compare assets
* Helping beginners understand core trading concepts

This application is ideal for:

* Students learning web development
* Beginners interested in trading and finance
* Anyone curious about cryptocurrency markets

---

## API Used

**CoinGecko API**

* Base URL: https://api.coingecko.com/api/v3/
* Authentication: Not required (Free and public)

### Key Endpoint Used:

* `/coins/markets?vs_currency=usd`
  → Returns a list of cryptocurrencies with price, market cap, rank, and 24h change

---

## ✨ Features

### ✅ Core Features

* 🔍 **Search**
  Search cryptocurrencies by name using `Array.filter()`

* 🎛️ **Filtering**
  Filter coins based on criteria such as:

  * Top ranked coins
  * Gainers / Losers

* 🔽 **Sorting**
  Sort cryptocurrencies by:

  * Price
  * Market Cap
  * 24h Percentage Change
    (Implemented using `Array.sort()`)

* 📊 **Crypto Cards**
  Each cryptocurrency displays:

  * Name & Symbol
  * Current Price
  * Market Cap
  * 24h Change (%)
  * Rank

* ⏳ **Loading States**
  Spinner displayed while fetching API data

* 📱 **Responsive Design**
  Works seamlessly across mobile, tablet, and desktop

---

### ⚡ Interactive Features

* ❤️ **Favorites / Bookmarking**
  Save coins to favorites using `localStorage`

* 🌙 **Dark / Light Mode Toggle**
  User theme preference is saved

* 📄 **Pagination**
  Displays large datasets in smaller, manageable pages

* 📈 **Trend Indicators**
  Visual cues for price increase/decrease

---

### ⭐ Bonus Features (Optional)

* 🔁 Debounced search input (improves performance)
* 📊 Basic price chart visualization
* 🚀 Highlight top-performing coin
* ⚡ Quick filters (Top 10, Trending, etc.)

---

## 🧠 Key Concepts Used

* API integration using `fetch()`
* DOM manipulation
* Array Higher-Order Functions:

  * `map()`
  * `filter()`
  * `sort()`
  * `reduce()`
* Event handling
* Local storage for persistence

---

## 🛠️ Tech Stack

* **HTML5** – Structure
* **CSS3 / Tailwind CSS** – Styling and layout
* **JavaScript (ES6+)** – Logic and interactivity
* **CoinGecko API** – Live data source
* **localStorage** – Saving user preferences

> No frameworks or build tools are used. This is a pure HTML, CSS, and JavaScript project.

---

## 📁 Project Structure

```
crypto-tracker/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

---

## 🚀 Setup and Running

This project runs entirely in the browser and requires no backend setup.

### Steps to run locally:

1. Clone the repository:

```
git clone https://github.com/HariRudraPratapSingh/crypto-tracker
```

2. Navigate to the project folder:

```
cd crypto-tracker
```

3. Open `index.html` in your browser:

* Double-click the file, OR
* Use **Live Server (VS Code)** for better experience

---

## 🌐 Deployment

The project will be deployed using **Vercel / Netlify**.

**Live URL:** Coming Soon 🚀

---

## ⚠️ Notes

* Internet connection is required to fetch live crypto data
* API rate limits may apply if refreshed too frequently
* Data updates depend on the CoinGecko API

---

## 📅 Milestones

* **Milestone 1:** Project planning and setup
* **Milestone 2:** API integration and data display
* **Milestone 3:** Search, filter, and sorting features
* **Milestone 4:** Final deployment and documentation

---

## 📈 Future Enhancements

* Real-time price updates
* Advanced charts and analytics
* Multi-currency support
* Portfolio tracking feature

---

## 👨‍💻 Author

**Hari Rudra Pratap Singh**
Individual Project, 2026

---

## 💡 Final Note

This project serves as a foundational step into the world of **financial technology and trading systems**, while also strengthening core frontend development skills.

---
