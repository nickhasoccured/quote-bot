/*
Copyright (C) 2020-2022 Nicholas Christopher

This file is part of Quoter.

Quoter is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, version 3.

Quoter is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Quoter.  If not, see <https://www.gnu.org/licenses/>.
*/

const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageAttachment } = require("discord.js");
const { Readable } = require("stream");
const Guild = require("../schemas/guild.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("export")
		.setDescription("Exports the server's quotes into a JSON file."),
	cooldown: 30,
	permission: "manage",
	async execute(interaction) {
		const { quotes } =
			interaction.db ??
			(await Guild.findOneAndUpdate(
				{ _id: interaction.guild.id },
				{},
				{ upsert: true, new: true }
			));

		const json = JSON.stringify(
			quotes,
			["text", "author", "createdTimestamp", "editedTimestamp"],
			" "
		);
		const stream = Readable.from(json);
		const attachment = new MessageAttachment(stream, "quotes.json");

		await interaction.reply({
			content: "📥 **|** Here are this server's quotes for download.",
			files: [attachment],
			ephemeral: true,
		});
	},
};