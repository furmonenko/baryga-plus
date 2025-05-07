# Baryga+ Bot Documentation

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [User Plans](#user-plans)
- [Bot Commands](#bot-commands)
- [Filters System](#filters-system)
- [Custom Presets](#custom-presets)
- [Search Functionality](#search-functionality)
- [Technical Architecture](#technical-architecture)
- [Admin Features](#admin-features)
- [Installation and Setup](#installation-and-setup)
- [Maintenance](#maintenance)

## Introduction

Baryga+ is a Telegram bot designed to help users search for and filter clothing items on Vinted. The bot monitors new listings in real-time and notifies users when items matching their set filters become available. Baryga+ is particularly useful for finding specific brand-name clothing, sports jerseys, and other fashion items at competitive prices.

## Features

- **Smart filtering system** that allows users to search for items by brand, size, price range, and category
- **Preset filters** for popular searches (like football jerseys under 70 PLN)
- **Custom filters** that users can create and save based on their preferences
- **Real-time notifications** when matching items appear
- **Tiered user plans** with different capabilities (search frequency, number of filters, etc.)
- **User-friendly menu system** via Telegram inline buttons
- **Automatic operating hours** (active from 9:00 to 23:00 Warsaw time)

## User Plans

The bot offers different service tiers with varying capabilities:

| Feature | Admin | Baron | Dealer | Casual |
|---------|-------|-------|--------|--------|
| Search interval | Immediate | 3 seconds | 7 seconds | 15 seconds |
| Max active filters | Unlimited | 3 | 2 | 1 |
| Custom presets | Unlimited | 4 | 2 | 0 |
| Special commands | Yes | No | No | No |

- **Admin**: Full access to all features, immediate search results, and administrative capabilities
- **Baron**: Fast search results (3-second intervals), up to 3 simultaneous filters, and 4 custom presets
- **Dealer**: Moderate search results (7-second intervals), up to 2 simultaneous filters, and 2 custom presets
- **Casual**: Basic functionality with slower search results (15-second intervals), 1 filter, and no custom presets

## Bot Commands

The bot responds to the following commands:

| Command | Description |
|---------|-------------|
| `/menu` | Open the main menu |
| `/active_filters` | Show active filters and options to manage them |
| `/custom_presets_settings` | Manage custom presets (create, delete) |
| `/reset` | Reset all filters and clear chat |
| `/start_search` | Start/resume searching with current filters |
| `/stop_search` | Pause the active search |

Admin-only commands:

| Command | Description |
|---------|-------------|
| `/changeplan [user_id] [plan]` | Change a user's plan |
| `/ban [user_id]` | Ban a user from using the bot |
| `/unban [user_id]` | Unban a previously banned user |
| `/restart_server` | Restart the bot server |

## Filters System

### Available Filter Options

1. **Brand**: Choose from popular brands like Stone Island, Ralph Lauren, Nike, Adidas, and more
2. **Size**: Select from standard sizes (M, L, XL, XXL, XXXL)
3. **Price**: Set a maximum price (in PLN)
4. **Category**: Choose between Men's clothing or Outerwear
5. **Keywords**: For preset filters, specific keywords are used to narrow searches

### Setting Up Filters

1. Navigate to the main menu and select "Set Filters"
2. Select a brand from the list or type a new one
3. Choose a category (Men or Outerwear)
4. Select one or more sizes
5. Set a maximum price
6. Start searching with the configured filter

## Custom Presets

Users with Baron or Dealer plans can create and save custom filter presets for quick access.

### Creating a Custom Preset

1. Navigate to "Custom Presets Settings" from the main menu
2. Select "Add Preset"
3. Follow the filter setup process (brand, category, sizes, price)
4. The preset will be automatically named in the format: "Brand + Category + Max Price"

### Managing Custom Presets

- View all your custom presets in the "Custom Presets Settings" menu
- Delete unwanted presets through the "Delete Presets" option
- Apply a saved preset by selecting it from the "Custom Filters" section

## Search Functionality

### Starting a Search

1. Set up at least one filter (through manual configuration or presets)
2. Select "Start Searching" from the main menu or use the `/start_search` command
3. The bot will begin scanning for new items matching your filters

### Search Process

- The bot fetches data from Vinted at intervals based on your user plan
- When a matching item is found, you'll receive a message with:
  - Item photo
  - Title and brand
  - Size and price
  - Direct link to purchase the item

### Operating Hours

- The bot actively searches from 9:00 to 23:00 (Warsaw time)
- During night hours (23:00 - 9:00), the bot pauses searching to respect API limits
- Users will be notified when searching pauses and resumes

## Technical Architecture

The Baryga+ bot is built with the following technologies:

- **Node.js**: Core runtime environment
- **Express**: Web server framework
- **Telegram Bot API**: For bot communication
- **RapidAPI**: For accessing Vinted data
- **JSON storage**: For persisting user data and search history

### Key Components

- **User Manager**: Handles user accounts, plans, and permissions
- **Filter System**: Processes and manages search criteria
- **Timer Manager**: Controls search intervals based on user plans
- **Message Handlers**: Processes user commands and menu interactions
- **Data Fetcher**: Retrieves and processes listing data from Vinted

## Admin Features

Administrators have access to special features:

### User Management

- Change user plans between admin, baron, dealer, and casual
- Ban users who violate terms of service
- Unban users when appropriate

### System Management

- Restart the server remotely using the `/restart_server` command
- Receive notifications about system events and errors
- Monitor bot activity and performance

## Installation and Setup

### Prerequisites

- Node.js (v14+)
- npm or yarn
- A Telegram Bot Token (from @BotFather)
- RapidAPI key with access to the Vinted3 API
- Server with public IP address (for webhook setup)

### Detailed Installation Guide

#### Step 1: Set Up Your Environment

1. **Install Node.js**:
   - Download and install Node.js from [nodejs.org](https://nodejs.org/)
   - Verify installation with: `node --version` and `npm --version`

2. **Get a Telegram Bot Token**:
   - Open Telegram and search for [@BotFather](https://t.me/BotFather)
   - Send the command `/newbot` and follow the instructions
   - Save the API token provided by BotFather

3. **Register for RapidAPI and Subscribe to Vinted3 API**:
   - Create an account on [RapidAPI](https://rapidapi.com/)
   - Search for "Vinted3" API
   - Subscribe to the API (free or paid tier depending on usage needs)
   - Copy your API key from the dashboard

#### Step 2: Clone and Configure the Repository

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/baryga-bot.git
   cd baryga-bot
   ```

2. **Create Environment Configuration**:
   - Create a `.env` file in the root directory:
   ```bash
   touch .env
   ```
   - Add the following configuration to the `.env` file:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   RAPIDAPI_KEY=your_rapidapi_key
   PORT=3000
   SESSION_SECRET=your_random_secure_string
   SERVER_IP=your_server_ip_or_domain
   ```
   
3. **Make sure `.env` is in `.gitignore`**:
   - Add `.env` to your `.gitignore` file to prevent committing sensitive information:
   ```bash
   echo ".env" >> .gitignore
   ```

#### Step 3: Install Dependencies and Prepare the Server

1. **Install Required Packages**:
   ```bash
   npm install
   ```

2. **Prepare Data Directory Structure**:
   ```bash
   mkdir -p data
   ```

3. **Initialize Base JSON Files** (if they don't exist):
   ```bash
   # Create empty JSON files with proper structure
   echo '{}' > data/users.json
   echo '{"admins":[],"barons":[],"dealers":[],"casuals":[]}' > data/userPlans.json
   echo '[]' > data/messageLog.json
   ```

#### Step 4: Start the Bot

1. **Run the Bot in Development Mode**:
   ```bash
   node server.js
   ```
   
   For production, consider using a process manager like PM2:
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start the bot with PM2
   pm2 start server.js --name "baryga-bot"
   
   # Set up PM2 to start on system boot
   pm2 startup
   pm2 save
   ```

#### Step 5: Set Up Webhook for Production

For reliable operation in production, set up a webhook:

1. **Ensure Your Server is Accessible**:
   - Make sure your server has a public IP address
   - Configure your firewall to allow incoming connections on the specified port
   - For production, HTTPS is required by Telegram's Bot API

2. **Set Up SSL Certificate** (required for webhook):
   - If you have a domain, use Let's Encrypt to get a free SSL certificate
   - Or use a reverse proxy like Nginx with SSL termination

3. **Configure the Webhook**:
   - Update the `SERVER_IP` variable in your `.env` file to include the protocol:
   ```
   SERVER_IP=https://your-domain.com
   ```
   - Run the webhook setup script:
   ```bash
   node resetWebhook.js
   ```

4. **Verify Webhook Status**:
   You can check if your webhook is set up correctly using:
   ```
   https://api.telegram.org/bot<your_bot_token>/getWebhookInfo
   ```

#### Step 6: Configure Bot as Admin

To set yourself as an admin:

1. **Start a conversation with your bot** in Telegram
2. **Get your Telegram User ID** (you can use @userinfobot)
3. **Add yourself to the admin list**:
   ```bash
   # Edit data/userPlans.json
   # Add your user ID to the "admins" array
   ```
4. **Restart the bot**:
   ```bash
   # If using PM2
   pm2 restart baryga-bot
   
   # If running directly
   # Press Ctrl+C to stop and then start again with node server.js
   ```

#### Step 7: Test the Bot

1. **Verify Basic Functionality**:
   - Send `/start` to your bot
   - You should receive a welcome message with buttons
   
2. **Configure Initial Filters**:
   - Follow the bot prompts to set up your first filter
   
3. **Test Search Functionality**:
   - Start searching and check if results appear

#### Troubleshooting Common Issues

- **Bot doesn't respond**: Check server logs and ensure the bot is running
- **Webhook errors**: Verify SSL certificate and server accessibility
- **No search results**: Check RapidAPI subscription status and key validity
- **Database errors**: Ensure proper permissions on the data directory and files

## Maintenance

### JSON Data Files

The bot uses several JSON files to store data:

- `users.json`: User information and settings
- `userPlans.json`: User plan assignments
- `brands.json`: Available brands and their IDs
- `categories.json`: Available categories
- `baryga_filters.json`: Preset filter configurations
- `messageLog.json`: Tracking of sent messages for cleanup

### Logging

The bot logs important events and errors to the console. For production deployment, consider implementing a more robust logging system like Winston or Bunyan.

### Scheduled Maintenance

- The bot automatically adapts its operation schedule based on the time of day
- No manual intervention is required for daily operation
- Server restarts can be performed via the `/restart_server` admin command

### Error Handling

The application includes error handling for common issues:

- API request failures
- Invalid user input
- Database read/write errors

For production environments, consider implementing additional monitoring and automated recovery procedures.
