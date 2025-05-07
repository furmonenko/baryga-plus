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

### Environment Variables

Create a `.env` file with the following variables:

```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
RAPIDAPI_KEY=your_rapidapi_key
PORT=3000
SESSION_SECRET=your_session_secret
SERVER_IP=your_server_ip_or_domain
```

### Installation Steps

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in the `.env` file
4. Start the server: `npm start`
5. (Optional) Set up a webhook using the `resetWebhook.js` script

### Webhook Setup

To ensure reliable message delivery, set up a webhook:

1. Ensure your server is accessible via HTTPS
2. Run the webhook setup script: `node resetWebhook.js`
3. Verify webhook status via Telegram Bot API

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
