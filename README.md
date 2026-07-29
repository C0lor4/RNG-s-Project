# Sneaky Switch
**Sneaky Switch is a browser-based maze game in which you guide a stickman to a diamond. The maze is divided across multiple browser windows, which must be rearranged to reveal the complete path or taste your luck. Different maze sizes and piece counts provide multiple difficulty combinations.**

[Play the demo](https://c0lor4.github.io/SneakySwitch/)

![](https://i.imgur.com/TIKA1Gp.png)


## Game requirements
Some browsers may block background music because they do not support the audio encoding format or because of their autoplay policies.

If the device's screen is too small, the pop-up windows may experience errors.
The game requires pop-ups to be enabled.
**For Chrome, open ```chrome://settings/content/popups```, Add "c0lor4.github.io" to "Allowed to send pop-ups and use redirects"**
**For Edge, open ```edge://settings/privacy/sitePermissions/allSites/siteDetails?site=https://c0lor4.github.io/```, click allow Pop-ups and redirects**
**For Firefox, open ```about:preferences#permissionsData```, Add "c0lor4.github.io" to "Manage Exceptions"**

## Run Locally

1. Clone the repository and enter the project folder:

   ```bash
   git clone https://github.com/C0lor4/SneakySwitch.git
   cd SneakySwitch
   ```

2. Start a local web server with Python 3:

   ```bash
   python -m http.server 3000
   ```

   Alternatively, if Node.js is installed, run:

   ```bash
   npx serve .
   ```
3. Open [http://localhost:3000](http://localhost:3000) in a desktop browser.

4. Allow pop-ups and redirects for `localhost:3000`, then click **Start**.

Do not open `index.html` directly as a local file. The game uses JavaScript modules, multiple windows, and same-origin messaging, so it must run through a local web server.


## How to play
- Use WASD or arrows to move
- Press **Start** to play
- Select a maze size and piece count from the **Difficulty** menu.
| Option | Width | Height | Pop-ups
|---|---:|---:|---:|
| Easy | 33 | 25 | 8 |
| Medium | 41 | 31 | 16 |
| HARD | 49 | 35 | 20 |
- Click **Close** to close all game pop-ups.
- Minimizing the main window disables the pop-up repulsion effect.


## Recommendations
We recommend running the game on a laptop or computer
