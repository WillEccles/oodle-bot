const discord = require('discord.js'),
	fs = require('fs');

const client = new discord.Client();

var token = "";
var clientID = "";

// load the config
try {
	fs.accessSync("config.json", fs.F_OK);
	var settings = JSON.parse(fs.readFileSync("config.json"));
	if (settings.token) {
		token = settings.token;
	} else {
		console.error("Please set your token in config.json.");
		process.exit(1);
	}
	if (settings.clientID) {
		clientID = settings.clientID;
	} else {
		console.error("Please set your clientID in config.json.");
		process.exit(2);
	}
} catch (err) {
	console.error("Error reading config.json.\nYou may need to create this file.\nMake it say:\n   {\"token\":\"yourtokenhere\",\"clientID\":\"clientID\"}");
}

client.on('ready', () => {
	console.log("Client ready.");
	//console.info(`Invite link:\nhttps://discordapp.com/oauth2/authorize?client_id=${clientID}&scope=bot&permissions=${7168}`);
	// the 7168 there is the permissions, and that one basically just means the bot can read messages and post them.
});

client.on('message', message => {
	var reply = false;
	var pattern = /[aeiou]/ig;
	var replacement = "oodle";
	var command = "!oodle";
	if (/^!oodle\s+(.*)?/i.test(message.content)) {
		// the default parameters above handle this case, so just true
		reply = true;
	}
	else if (/^!oodlecaps\s+(.*)?/i.test(message.content)) {
		// pattern still works, as with all of these
		command = "!oodlecaps";
		replace = "OODLE";
		reply = true;
	}
	else if (/^!oodletitle\s+(.*)?/i.test(message.content)) {
		command = "!oodletitle";
		replace = "Oodle";
		reply = true;
	}
	else if (/^!oodleauto\s+(.*)?/i.test(message.content)) {
		// this one is more complicated, and does not use the reply function below
		reply = false;
		var msg = message.content.replace(/^!oodleauto/i, "");
		msg = msg.replace(/[aeiou]/g, "oodle")
				.replace(/[AEIOU](?=[a-z])/g, "Oodle")
				.replace(/[AEIOU](?!=[a-z])/g, "OODLE");
		if (!/oodle/i.test(msg)) {
			message.channel.sendMessage(":warning: Nothing there to oodle. (!oodlehelp for more info)");
		} else
			message.channel.sendMessage(msg.trim());
	}
	else if (/^!oodleinvite/i.test(message.content)) {
		message.author.sendMessage(`Invite link:\nhttps://discordapp.com/oauth2/authorize?client_id=${clientID}&scope=bot&permissions=${7168}`);
	}

	else if (/^!oodlehelp/i.test(message.content)) {
		message.author.sendMessage("Here are the things I can do for you:\n```\n!oodle <message>\n  replaces every vowel in <message> with 'oodle'\n!oodlecaps <MESSAGE>\n  replaces every vowel in <MESSAGE> with 'OODLE'\n!oodletitle <Message>\n  replaces every vowel in <Message> with 'Oodle'\n!oodleauto <Message>\n  replaces every vowel, guessing between 'Oodle', 'oodle', and 'OODLE'. (Experimental)\n!oodleinvite\n  messages you the invite link for the bot\n```");
	}

	if (reply) {
		var commandregex = new RegExp("^" + command, "i");
		var msg = message.content.replace(commandregex, "");
		console.log(msg);
		msg = msg.replace(pattern, replacement);
		if (!/oodle/i.test(msg))
			message.channel.sendMessage(":warning: Nothing there to oodle. (!oodlehelp for more info)");
		else
			message.channel.sendMessage(msg.trim());
	}
});

try {
	client.login(token);
} catch(e) {
	console.error("There was an error logging in. Make sure you specified your token!");
}
