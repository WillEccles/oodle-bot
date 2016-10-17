const discord = require('discord.js'),
	fs = require('fs');

const client = new discord.Client();

var token = "";

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
} catch (err) {
	console.error("Error reading config.json.\nYou may need to create this file.\nMake it say:\n   {\"token\":\"yourtokenhere\"}");
}

client.on('ready', () => {
	console.log("Client ready.");
});

client.on('message', message => {
	var reply = false;
	var pattern = /[a-zA-Z]/g;
	var replacement = "oodle";
	var command = "!oodle";
	if (/^!oodle\s+/i.test(message.content)) {
		// the default parameters above handle this case, so just true
		reply = true;
	}
	else if (/^!oodlecaps\s+/i.test(message.content)) {
		// pattern still works, as with all of these
		command = "!oodlecaps";
		replace = "OODLE";
		reply = true;
	}
	else if (/^!oodletitle\s+/i.test(message.content)) {
		command = "!oodletitle";
		replace = "Oodle";
		reply = true;
	}

	else if (/^!help/i.test(message.content)) {
		message.author.sendMessage("Here are the things I can do for you:\n```\n  - !oodle <message>\n    replaces every vowel in <message> with 'oodle'\n  - !oodlecaps <MESSAGE>\n    replaces every vowel in <MESSAGE> with 'OODLE'\n  - !oodletitle <Message>\n    replaces every vowel in <Message> with 'Oodle'\n```");
	}

	if (reply) {
		var msg = message.content.replace(new RegExp("^"+command+"\s+", "i"), "").replace(pattern, replacement);
		if (!/oodle/i.test(msg))
			message.reply("Nothing there to oodle. (!help for more info)");
		else
			message.reply(msg);
	}
});

try {
	client.login(token);
} catch(e) {
	console.error("There was an error logging in. Make sure you specified your token!");
}
