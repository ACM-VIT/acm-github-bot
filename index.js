const Discord = require('discord.js')
const client = new Discord.Client()
const config = require('./config.json')
const command = require('./command')
const guildInvites = new Map();

client.on('inviteCreate', async invite => guildInvites.set(invite.guild.id, await invite.guild.fetchInvites()));
client.on('ready', () => {
    console.log('Bot is Ready!');
    client.guilds.cache.forEach(guild => {
        guild.fetchInvites()
            .then(invites => guildInvites.set(guild.id, invites))
            .catch(err => console.log(err));
    });
    command(client, 'ping', (message) => {
        message.channel.send('Pong!');
    })
});
client.on('guildMemberAdd', async member => {
    console.log("shit's working")
    const cachedInvites = guildInvites.get(member.guild.id);
    const newInvites = await member.guild.fetchInvites();
    guildInvites.set(member.guild.id, newInvites);
    try {
        const usedInvite = newInvites.find(inv => cachedInvites.get(inv.code).uses < inv.uses);
        console.log(usedInvite.code)
        if (usedInvite.code === 'jWuzrT5ZNp') {
            let role = member.guild.roles.cache.find(r => r.name === "Haxor");
            member.roles.add(role).catch(console.error);
        }
    }
    catch (err) {
        console.log(err);
    }
});

client.login(config.token);