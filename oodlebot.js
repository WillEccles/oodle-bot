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

// c = channel
// p = permission (i.e. "SEND_MESSAGES")
// u = user (if not the client user)
function hasPermission(c, p, u = client.user) {
	if (c.permissionsFor(u).hasPermission(p))
		return true;
	else return false;
}

client.on('ready', () => {
	console.log("Client ready.");
	//console.info(`Invite link:\nhttps://discordapp.com/oauth2/authorize?client_id=${clientID}&scope=bot&permissions=${7168}`);
	// the 7168 there is the permissions, and that one basically just means the bot can read messages and post them.
});

client.on('message', (message) => {
	if (!hasPermission(message.channel, "SEND_MESSAGES")) {
		message.author.sendMessage(":warning: I don't have permission to send messages in that channel.");
		return;
	}
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
	else if (/^!oodletts\s+(.*)?/i.test(message.content)) {
		var msg = message.content.trim().replace(/^!oodletts/i, "");
		if (!hasPermission(message.channel, "SEND_TTS_MESSAGES")) {
			message.reply(":warning: I don't have permission to TTS here.");
		} else if (!hasPermission(message.channel, "SEND_TTS_MESSAGES", message.author)) {
			message.reply(":warning: You don't have permission to TTS here.");
		} else
			message.channel.sendTTSMessage(msg.toLowerCase().replace(/[aeiou]/ig, "oodle"));
	}

	// !delmessages -[fq] <number>
	else if (/^!del(messages)?\s+(-[fq]{1,2}\s+)*\d+(\s+(-[fq]{1,2}\s*)*)?/i.test(message.content)) {
		var force = false;
		var quiet = false;
		var flags = /(-[fq]{1,2})/g;
		var searchResults;
		while ((searchResults = flags.exec(message.content)) != null) {
			if (searchResults[0].includes("q"))
				quiet = true;
			if (searchResults[1].includes("f"))
				force = true;
		}

		// first, find out the if bot has the ability to delete messages in the first place
		if (hasPermission(message.channel, "MANAGE_MESSAGES", message.author)) {
			// the user has the permission, so now we can delete the messages
			var num = parseInt(/\d+/.exec(message.content));
			if (num >= 100 || num < 2) {
				// regect any more than 500 messages
				message.channel.sendMessage(`:warning: I can only delete [2, 100) messages. ${num} is ${num>=100?"too many":"too few"}.`);
			} else {
				if (hasPermission(message.channel, "MANAGE_MESSAGES")) {
					if (!quiet) message.channel.sendMessage(`Removing ${num} messages from this channel${force?" (including pins)":" (excluding pins)"}...`)
						.then(msg => {
							// add 1 to num to account for !delmessages <number>
							deleteMessages(num, message.channel, msg, force, quiet);
						});
					else
						deleteMessages(num, message.channel, message, force, quiet);
				} else {
					message.channel.sendMessage(":warning: I don't have permission to do that.");
				}
			}
		} else {
			message.channel.sendMessage(":warning: You don't have permission to use this command.");
		}
	}
	
	else if (/^!oodleinvite/i.test(message.content)) {
		message.author.sendMessage(`Invite link:\nhttps://discordapp.com/oauth2/authorize?client_id=${clientID}&scope=bot&permissions=${7168}`);
	}

	else if (/^!oodlehelp/i.test(message.content)) {
		message.author.sendMessage("Here are the things I can do for you:\n```\n!oodle <message>\n  replaces every vowel in <message> with 'oodle'\n!oodlecaps <MESSAGE>\n  replaces every vowel in <MESSAGE> with 'OODLE'\n!oodletitle <Message>\n  replaces every vowel in <Message> with 'Oodle'\n!oodleinvite\n  messages you the invite link for the bot\n!delmessages <number> or !del <number>\n  deletes <number> messages. also deletes your !del or !delnum message. <number> must be in the range [2, 100). user running the command must have the \"manage messages\" permission. any pinned messages found will be kept. if run with -f, will delete pinned messages. if run with -q, will not say anything.\n!oodletts <message>\n  replaces every vowel in the message with 'oodle', lowercases the message, and then TTSs the message.\n```");
		if (hasPermission(message.channel, "MANAGE_MESSAGES")) {
			message.delete();
		}
	}

	if (reply) {
		var commandregex = new RegExp("^" + command, "i");
		var msg = message.content.replace(commandregex, "");
		msg = msg.replace(pattern, replacement);
		if (!/oodle/i.test(msg))
			message.channel.sendMessage(":warning: Nothing there to oodle. (!oodlehelp for more info)");
		else
			message.channel.sendMessage(msg.trim());
	}
});

// num = number of messages to delete [2, 100)
// channel = the channel in which to delete the messages
// message = the message to retrieve messages before
// force = whether or not to delete pinned messages
// quiet = whether the bot should say anything
function deleteMessages(num, channel, message, force, quiet) {
	var lim = num + 1;
	if (quiet)
		lim = num;
	channel.fetchMessages({limit: lim, before: message.id})
		.then(messages => {
			var msgs = messages.array();
			var pinnedCount = 0;
			if (quiet)
				msgs.push(message);
			if (!force)
				for (var i = 0; i < msgs.length; i++) {
					if (msgs[i].pinned) {
						pinnedCount++;
						msgs.splice(i, 1);
						i--;
					}
				}
			if (pinnedCount > 0 && !quiet) channel.sendMessage(`Kept ${pinnedCount} pinned message${pinnedCount>1?"s":""}.`);
			channel.bulkDelete(msgs);
		});
}

try {
	client.login(token);
} catch(e) {
	console.error("There was an error logging in. Make sure you specified your token!");
}
