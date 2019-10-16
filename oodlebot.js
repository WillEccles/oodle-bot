const discord = require('discord.js'),
	fs = require('fs');

const client = new discord.Client();

var token = "";
var clientID = "";
var debugChannelID = "";

// the permissions the bot requests when being added to a server
var perms = 0x00000400 | // READ_MESSAGES
	0x00000800 | // SEND_MESSAGES
	0x00002000 | // MANAGE_MESSAGES
	0x00001000 | // SEND_TTS_MESSAGES
	0x00004000 ; // EMBED_LINKS

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
	if (settings.debugChannelID) {
		debugChannelID = settings.debugChannelID;
	}
} catch (err) {
	console.error("Error reading config.json.\nYou may need to create this file.\nMake it say:\n   {\"token\":\"yourtokenhere\",\"clientID\":\"clientID\"}");
}

function hasPermission(channel, permission, user = client.user) {
	if (channel.type != "dm" && channel.permissionsFor(user).hasPermission(permission))
		return true;
	else if (channel.type == "dm" && permission != "MANAGE_MESSAGES")
		return true;
	else if (channel.type == "dm" && permission == "MANAGE_MESSAGES")
		return false;
	else return false;
}

// message = the message to send
// priority is one of the following:
//   'error': This will @me and show it as an error
//   'normal': This just prints a message
//   'status': This states the bot's status/what it's doing
//   'warning': The warning message
function debugChannelMessage(priority, message) {
	if (debugChannelID == "") return;
	switch(priority) {
		case 'error':
			client.channels.get(debugChannelID).sendMessage(`:exclamation: **Error:** ${message}\n(cc <@111943010396229632>)`);
			break;
		case 'normal':
			client.channels.get(debugChannelID).sendMessage(`${message}`);
			break;
		case 'status':
			client.channels.get(debugChannelID).sendMessage(`:information_source: **Bot status:** ${message}`);
			break;
		case 'warning':
			client.channels.get(debugChannelID).sendMessage(`:warning: **Warning:** ${message}\n(cc <@111943010396229632>)`);
	}
}

// these will be used when the ready event fires, so that if the bot has just connected after an error it will tell you what that error was
var hadError = false;
var errorMessage = "";

client.on('ready', () => {
	console.log("Client ready.");
	debugChannelMessage('status', "Ready");
	if (hadError && errorMessage != "") {
		debugChannelMessage('error', `Just recovered from error:\n\`\`\`\n${errorMessage}\n\`\`\``);
		hadError = false;
		errorMessage = "";
	}
	//console.info(`Invite link:\nhttps://discordapp.com/oauth2/authorize?client_id=${clientID}&scope=bot&permissions=${7168}`);
	// the 7168 there is the permissions, and that one basically just means the bot can read messages and post them.
});

client.on('message', (message) => {
	if (!hasPermission(message.channel, "SEND_MESSAGES")) {
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
		replacement = "OODLE";
		reply = true;
	}
	else if (/^!oodletitle\s+(.*)?/i.test(message.content)) {
		command = "!oodletitle";
		replacement = "Oodle";
		reply = true;
	}
	else if (/^!oodletts\s+(.*)?/i.test(message.content)) {
		var msg = message.content.trim().replace(/^!oodletts/i, "");
		if (!hasPermission(message.channel, "SEND_TTS_MESSAGES")) {
			message.reply(":warning: I don't have permission to TTS here.");
		} else if (!hasPermission(message.channel, "SEND_TTS_MESSAGES", message.author)) {
			message.reply(":warning: You don't have permission to TTS here.");
		} else
			message.channel.send(msg.toLowerCase().replace(/[aeiou]/ig, "oodle"), {tts: true});
	}
	
	else if (/^!coinflip/i.test(message.content)) {
		message.channel.sendMessage(`**${Math.random() < 0.5 ? "Heads!" : "Tails!"}**`);
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
	
	else if (/^!blockletters\s+.+/i.test(message.content)) {
		var content = message.content.replace(/^!blockletters\s+/i, "");
		message.channel.sendMessage(textToEmotes(content));
	}

	else if (/^!oodleinvite/i.test(message.content)) {
		message.author.sendMessage(`Invite link:\nhttps://discordapp.com/oauth2/authorize?client_id=${clientID}&scope=bot&permissions=${perms}`);
		if (hasPermission(message.channel, "MANAGE_MESSAGES"))
			message.delete();
	}

	else if (/^!oodlehelp/i.test(message.content)) {
		message.author.sendMessage("Here are the things I can do for you:\n```\n!oodle <message>\n  replaces every vowel in <message> with 'oodle'\n!oodlecaps <MESSAGE>\n  replaces every vowel in <MESSAGE> with 'OODLE'\n!oodletitle <Message>\n  replaces every vowel in <Message> with 'Oodle'\n!oodleinvite\n  messages you the invite link for the bot\n!delmessages <number> or !del <number>\n  deletes <number> messages. also deletes your !del or !delnum message. <number> must be in the range [2, 100). user running the command must have the \"manage messages\" permission. any pinned messages found will be kept. if run with -f, will delete pinned messages. if run with -q, will not say anything.\n!oodletts <message>\n  replaces every vowel in the message with 'oodle', lowercases the message, and then TTSs the message.\n!coinflip\n  flips a coin and returns heads or tails.\n!blockletters <message>\n  replaces all the characters in your message with block letters\n```");
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

// turns text into emotes using the :regional_indicator: emotes etc
function textToEmotes(t) {
	var text = t.toLowerCase();
	var output = "";
	for (var i = 0; i < text.length; i++) {
		if (/[a-z]/.test(text[i])) {
			output += ":regional_indicator_" + text[i] + ": ";
		} else if (/\s/.test(text[i])) {
			output += "  ";
		} else if (/[!?#*$]/.test(text[i])) {
			switch (text[i]) {
				case '!':
					output += ":exclamation: ";
					break;
				case '?':
					output += ":question: ";
					break;
				case '#':
					output += ":hash: ";
					break;
				case '*':
					output += ":asterisk: ";
					break;
				case '$':
					output += ":heavy_dollar_sign: ";
					break;
			}
		} else if (/[0-9]/.test(text[i])) {
			output += `:${numText(text[i])}: `;
		} else {
			output += text[i];
		}
	}
	return output;
}

function numText(num) {
	text = ["zero","one","two","three","four","five","six","seven","eight","nine"];
	return (text[parseInt(num)] ? text[parseInt(num)]: num);
	// switch(num) {
	// 	case '0':
	// 		return "zero";
	// 	case '1':
	// 		return "one";
	// 	case '2':
	// 		return "two";
	// 	case '3':
	// 		return "three";
	// 	case '4':
	// 		return "four";
	// 	case '5':
	// 		return "five";
	// 	case '6':
	// 		return "six";
	// 	case '7':
	// 		return "seven";
	// 	case '8':
	// 		return "eight";
	// 	case '9':
	// 		return "nine";
	// 	default:
	// 		return num;
	// }
}

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
		}
	);
}

client.on('error', (error) => {
	console.error("Encountered error:\n" + error);
	hadError = true;
	errorMessage = error;
});

client.on('warn', (warning) => {
	debugChannelMessage('warning', warning);
});

client.on('disconnect', () => {
	console.info("Disconnected from Discord, attempting to log in...");
});

try {
	client.login(token);
} catch(e) {
	console.error("There was an error logging in. Make sure you specified your token!");
}

// gracefully handle the control c
process.on('SIGINT', () => {
	console.info("Destroying bot and exiting...");
	client.destroy();
	process.exit(0);
});
