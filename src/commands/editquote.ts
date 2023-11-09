/*
Copyright (C) 2020-2023 Nick Oates

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

import {
	EmbedBuilder,
	SlashCommandBuilder,
	Colors,
	PermissionFlagsBits,
	ChatInputCommandInteraction,
} from "discord.js";
import mentionParse from "../util/mentionParse.js";
import trimQuotes from "../util/trimQuotes.js";
import cleanString from "../util/cleanString.js";
import QuoterCommand from "../QuoterCommand.js";
import fetchDbGuild from "../util/fetchDbGuild.js";
import { maxQuoteLength } from "../util/quoteLimits.js";

const EditQuoteCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("editquote")
		.setDescription("Edits the specified quote.")
		.addIntegerOption((o) =>
			o
				.setName("id")
				.setDescription("The ID of the quote to edit.")
				.setRequired(true),
		)
		.addStringOption((o) =>
			o
				.setName("text")
				.setDescription("The quote's new text.")
				.setRequired(true),
		)
		.addStringOption((o) =>
			o.setName("author").setDescription("The quote's new author."),
		)
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
	cooldown: 10,
	// permission: "manageSelf",
	async execute(interaction: ChatInputCommandInteraction) {
		const id = interaction.options.getInteger("id");
		if (id === null) throw new Error("ID is null");

		const guild = await fetchDbGuild(interaction);

		const { quotes } = guild;
		const quote = quotes[id - 1];

		if (!quote) {
			await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				ephemeral: true,
			});
			return;
		}

		let author = interaction.options.getString("author");
		author &&= await mentionParse(author, interaction.client);

		const textInput = interaction.options.getString("text");
		if (textInput === null) throw new Error("Text input is null");
		const text = trimQuotes(textInput);

		if (text.length > (guild.maxQuoteLength || maxQuoteLength)) {
			await interaction.reply({
				content: `❌ **|** Quotes cannot be longer than ${
					guild.maxQuoteLength || maxQuoteLength
				} characters.`,
				ephemeral: true,
			});
			return;
		}

		quotes.set(id - 1, {
			text,
			author: author || undefined,
			createdTimestamp: quote.createdTimestamp,
			editedTimestamp: Date.now(),
			quoterID: quote.quoterID,
			editorID: interaction.user.id,
		});

		await guild.save();

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("✅ Edited quote")
					.setColor(Colors.Green)
					.setDescription(
						`"${cleanString(text, false)}"${
							author ? ` - ${cleanString(author, false)}` : ""
						}`,
					)
					.setFooter({ text: `Quote #${id}` }),
			],
		});
	},
};

export default EditQuoteCommand;
