# discord_bot
A discord bot for messing around with discord bots

# First steps
1. Create a `.env` file in your repo directory (or the directory the application will run from).
2. Follow steps from [Configure](#configure)
# Configure

First create a user/password at [MongoDB](https://www.mongodb.com/).
Then create a database cluster and give it a user/password combo that can access it.
Once the cluster is created, you'll need to create a database and two collections within the database.

One collection will track the bots to watch and the other will track the channels to report outages.
For example: `MONGO_BOT_COLLECTION=bots` and `MONGO_CHANNELS_COLLECTION=channels` will store bot information in a collection
called `bots` and the channels in a collection called `channels`

Once this is setup you'll need to create a `.env` file in your directory that contains:
```
MONGO_CLUSTER=<name_of_db_cluster>
MONGO_USER=<username_for_cluster>
MONGO_PASSWORD=<password_for_cluster>
MONGO_DB=<database_name>
MONGO_BOT_COLLECTION=<collection_name>
MONGO_CHANNELS_COLLECTION=<collection_name>
```

This will allow the watcher to establish a connection to mongo and to keep track of bots that its meant to track.

Next you'll need to create an account/bot in [Discord's developer console](https://discord.com/developers/applications).
Once the app is created, click on "Bot" on the left side, and then "Add Bot" to create a bot user.
Add the bots token to the .env file:
```
DISCORD_TOKEN=<your_bots_token>
```

# Creating commands

In order for the bot to pick up and add new commands a `commands.json` file must exist which holds an array of the commands to be entered.
The structure of a command which will be passed directly to Discord's API can be seen [here](https://discord.js.org/#/docs/discord.js/14.6.0/typedef/ApplicationCommandData). See `./commands/commands.example.json` for the command defs that come with this bot.

When the interaction is kicked off the bot will try to find the appropriate command's logic in commands. For instance, when someone invokes the `/watchbot` command,
Discord Bot Watcher will invoke the default function in `./commands/watchbot.js`. The commands.json file only registers commands with Discord. It does not create the appropriate files inside the ./commands folder, you'll have to do that yourself for each new command you intend to add.

Once the commands have been entered the application will also remove commands.json so that the next startup does not try to create new commands with the same names.

**NOTE: The bot does not currently have a path to edit already entered commands**

# How to run
Once the application is configured following the steps above, you're ready to spin up the bot!
```
npm i
```
to install node modules.

```
npm run start
```
to run the application

#Timezone support

If time reporting is required in a specific timezone you can set the `TIMEZONE_CODE` in your .env to the appropriate timezone code used by moment-timezone.js. [Timezone Identifier](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) 


