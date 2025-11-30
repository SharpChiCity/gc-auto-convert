# gc-auto-convert

# Z!ft Gift Card Auto-Purchase Extension

A Chrome extension that automatically purchases gift cards from Zillions Gift (zillionsgift.com).

## What This Does

This extension automates the process of buying gift cards. Instead of manually:
1. Navigating to the product
2. Selecting a denomination
3. Entering email addresses
4. Clicking through checkout

The extension does all of this for you automatically.

## How to Install

1. **Download the extension files**
   - Save all files from this folder to your computer

2. **Open Chrome Extensions**
   - Open Google Chrome
   - Type `chrome://extensions/` in the address bar
   - Press Enter

3. **Enable Developer Mode**
   - Look for "Developer mode" toggle in the top-right corner
   - Click it to turn it ON

4. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to the folder where you saved these files
   - Click "Select Folder"

5. **Verify Installation**
   - You should see the extension icon in your Chrome toolbar
   - It looks like a puzzle piece icon

## How to Use

### First Time Setup

1. **Add Brands** (Optional)
   - Click the extension icon in your toolbar
   - In the "New Brand" field, enter a gift card brand (e.g., "Amazon", "Best Buy")
   - Click "Add"
   - Repeat for any other brands you want

2. **Set Your Defaults**
   - Select a brand from the dropdown
   - Enter the denomination (amount) you want to purchase (e.g., "25" for $25)
   - Enter your email address
   - These will be saved automatically

### Making a Purchase

1. **Navigate to zillionsgift.com**
   - Go to https://www.zillionsgift.com in Chrome
   - Make sure you're logged in

2. **Open the Extension**
   - Click the extension icon in your toolbar
   - Verify the brand, amount, and email are correct
   - Change any of these if needed

3. **Click "Start on current tab"**
   - The extension will take over
   - A timer overlay will appear showing you what it's doing
   - Do NOT close the tab or navigate away
   - The extension will handle everything automatically

4. **Wait for Completion**
   - The script will:
     - Find the gift card product
     - Select the amount you specified
     - Enter the recipient email
     - Add to cart
     - Fill in checkout information
     - Place the order
   - This typically takes 1-2 minutes

## What You Need

- **Google Chrome** browser
- **Active account** on zillionsgift.com
- **Email address** for the gift card recipient
- **Denomination** (amount) you want to purchase

## Supported Brands

Default brands included:
- Lowe's
- The Home Depot

You can add more brands using the "Add" button in the extension popup.

## Troubleshooting

### "Content script not reachable" Error
- Make sure you're on zillionsgift.com
- The extension only works on this website
- Try refreshing the page and try again

### Timer appears but nothing happens
- Check your internet connection
- The page might be loading slowly
- Wait for the page to fully load before clicking "Start"

### Extension doesn't find the gift card
- The website layout may have changed
- Contact the extension creator with details about what happened

### Email fields aren't being filled
- Make sure you're using a valid email address
- Some email providers might be blocked by the site

## Privacy & Safety

- This extension only works on zillionsgift.com
- It does NOT collect your personal information
- It does NOT store passwords
- Your email and settings are stored locally on your computer only
- All code is visible and can be reviewed

## Need Help?

If something isn't working:
1. Check that you're on zillionsgift.com
2. Check the browser console for error messages (F12 → Console tab)
3. Try refreshing the page and starting over
4. Make sure all fields are filled in correctly

## Advanced Users

For developers who want to modify this:
- `popup.js` - The extension UI and controls
- `content_script.js` - The automation logic
- `manifest.json` - Extension
