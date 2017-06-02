The EXP CLI allows developers to run a local web application in an EXP player. This gives the application access to the Player App SDK.

# Installation

Install [NodeJS](https://nodejs.org/en/download/) on your operating system. For OSX users with homebrew you can use `brew install node`.

Once Node is installed, install the `exp-cli` package globally using NPM.

```bash
npm install -g exp-cli
```

Note: You may need to use `sudo` or be logged in as `root`.

## Running CLI manually

An alternative to using NPM to install and start the CLI is cloning the git repository and running the script directly.

```bash
git clone https://github.com/ScalaInc/exp-cli.git
node ./exp-cli/bin/exp.js
```

# Create the App

Create a directory where you want to create your application and run

```bash
exp init
```

This will generate an `index.html`, `style.css`, `main.js`, and `manifest.json`.

# Launch the App

From the directory where you created the app run

```bash
exp play
```

This will launch an EXP player in a webrowser. The first time you run `exp play` you'll be presented with a pairing screen. Use the EXP user interface to pair the device to your browser.

After pairing the device, your app will now be running inside of a full featured EXP player. The browser tab will automatically reload the player when you make changes to your application's code.


# Configuring the Application

You can provide configuration to the application by putting a `manifest.json` file in your web application's root directory. Default options can be specified as in the example below.

```json
{
  "config": {
    "option1": [true, false, "45"],
    "another_option": 1234
  }
}
```

These options will be accessible inside the application at `exp.app.config`.


# Running Multiple Players

You can run multiple players by specifying a port to the `exp play` command, i.e. `exp play -p 8899`. Each running player will need to be paired individually.

# Deploy the App

From the directory where you created the app run

```bash
exp deploy
```

This will begin the process of uploading new or changed files and folders to an app in your content tree. The first time you run `exp deploy` you'll be required to log into an organization.  The authentication will be saved temporarily to make subsequent deploys faster.  If for any reason you need to remove the saved authentication you can use the `exp logout` command.

During deployment you will be asked to enter the relative (to root) or absolute path to the app in your content tree.  Optionally, you can specify the app path to the `exp deploy` command, i.e. `exp deploy --app custom-weather-app`

If the app does not exist you will be asked to confirm that you want to create the app.  Enter `y` or `yes` to approve the upload.






