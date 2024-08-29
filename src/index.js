import { YoutubeTranscript } from "youtube-transcript";
import html from '../static/index.html';

function* extractSentencesFromTranscript(transcript) {
	let sentenceParts = [];

	for (let i = 0; i < transcript.length; i++) {
		const snippet = transcript[i].text;
		sentenceParts.push(snippet);

		if (snippet.endsWith(".")) {
			const fullSentence = sentenceParts.join(" ").replace(/\n/g, " ");
			yield fullSentence;
			sentenceParts = [];
		}
	}

	// Yield any remaining text as the last sentence
	if (sentenceParts.length > 0) {
		yield sentenceParts.join(" ").replace(/\n/g, " ");
	}
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

        if (request.method === 'GET' && url.pathname === '/') {
            return new Response(html, {
                headers: { 'Content-Type': 'text/html' },
            });
        } else if (request.method === 'POST' && url.pathname === '/transcript') {
			const { url, detailLevel } = await request.json();
			const model = '@cf/meta/llama-3.1-8b-instruct'; // can use a diff one 
			console.log(`url, Number(detailLevel): ${url}, ${detailLevel}`); 
			let transcript = await env.TRANSCRIPTS.get(url);
			console.log(`transcript outside ${transcript}`)
			if (transcript == undefined) {  // cached
				transcript = await YoutubeTranscript.fetchTranscript(url); //https://www.youtube.com/watch?v=8RCL5neas_M
        		const sentences = Array.from(extractSentencesFromTranscript(transcript));
				transcript = sentences.join("\n");
				console.log(`transcript ${transcript}`);
				await env.TRANSCRIPTS.put(url, transcript); //key = yt url
				console.log(`Put ${url} successfully!`);
			}

			const messages = [
				{ role: "system", content: "You are a friendly assistant" },
				{
				  role: "user",
				  content: `Summarize the following YouTube transcript: ${transcript}. On a scale of 0 (less detail) to 5 (more detail), the summary should have a detail level of ${detailLevel}. Do not mention anything besides a summary of the transcript.`,
				},
			];
			const summary = await env.AI.run(model,
				{ 
					temperature: 1,
					messages 
				}
			);
			console.log(`response ${JSON.stringify(summary)}`);
			return new Response(JSON.stringify(
				summary
			), {
				headers: { 'Content-Type': 'application/json' },
			});
		}
	},
};
