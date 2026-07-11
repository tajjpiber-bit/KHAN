# Trading Confluence & SMT Dashboard Web Server

This is a premium, real-time Web Dashboard and Signal Center designed to receive webhook alerts from your TradingView Pine Script ("10-in-1 Strategy Matrix Dashboard & SMT").

## 🚀 Quick Start Guide

### 1. Install Dependencies
Make sure you have Node.js installed on your computer. Open your terminal inside this project directory (`trading_dashboard`) and run:
```bash
npm install
```

### 2. Run the Server
Start the local Express server by running:
```bash
npm start
```
The server will start on port `8080`.

### 3. Open the Dashboard
Open your web browser and navigate to:
```
http://localhost:8080
```
You will see the 12 symbol cards. You can click the **"Simulate Signal"** button to instantly see mock alerts trigger on the dashboard with sound and animations.

---

## 🔗 Connecting TradingView to Your Local Server

TradingView needs a public URL to send webhooks to your local machine.

### Option A: Using Ngrok (Recommended & Free)
1. Download and install [ngrok](https://ngrok.com/).
2. Run ngrok in your terminal to forward port 8080:
   ```bash
   ngrok http 8080
   ```
3. Ngrok will give you a public `https://...` forwarding URL (e.g., `https://a1b2-34-56.ngrok-free.app`).
4. Your Webhook URL in TradingView will be:
   ```
   https://YOUR_SUBDOMAIN.ngrok-free.app/webhook
   ```

---

## 📈 Configuring TradingView Alerts

1. Open your XAUUSD chart on TradingView and load the **10-in-1 Strategy Matrix Dashboard & SMT** script.
2. Click the **Alert** button (bell icon) in TradingView.
3. Configure the alert:
   - **Condition:** Select `10-in-1 Strategy Matrix Dashboard & SMT`
   - **Trigger:** Select **`Any alert() function call`** *(Crucial to get dynamic signals)*
4. Under **Notifications**:
   - Check **Webhook URL**
   - Paste your ngrok webhook URL (e.g., `https://a1b2-34-56.ngrok-free.app/webhook`)
5. Under **Settings (Message Body)**:
   Paste the following JSON payload exactly:
   ```json
   {
     "symbol": "{{ticker}}",
     "timeframe": "{{interval}}",
     "direction": "{{plot_2}}",
     "score": "{{plot_0}}",
     "rules": "{{plot_4}}",
     "smt": "{{plot_3}}",
     "price": "{{close}}"
   }
   ```
6. Click **Create**.

Your live dashboard will now display strong signals in real-time with sound alerts and desktop notifications whenever they trigger on TradingView!
