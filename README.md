The EXP CLI allows developers to run a local web application in an EXP player. This gives the application access to the Player App SDK.

# Installation

Install [NodeJS](https://nodejs.org/en/download/) on your operating system. For OSX users with homebrew you can use `brew install node`. 

Once Node is installed, install the `exp-cli` package globally using NPM. 

```bash
npm install -g exp-cli
```

Note: You may need to use `sudo` or be logged in as `root`.


# Launch Your Application 

Assuming you have a local HTML5 application, change your working directory to the directory containing `index.html` and run

```bash
exp play
```

You can also specify the path:

```bash
exp play ./my-app/
```

This will launch an EXP player in a webrowser. The first time you run `exp play` you'll be presented with a pairing screen. Use the EXP user interface to pair a device with your browser.

After pairing the device, your app will now be running inside of a full featured EXP player. The `exp play` command will automatically reload the player when you make changes to your application's code.


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

These options will be accessible in side the application from `exp.app.config`.


# Running Multiple Players

You can run multiple players by specifying a port to the `exp play` command, i.e. `exp play -p 8899`. Each running player will need to be paired individually. 


