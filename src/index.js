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
			const { url, model, styleValue } = await request.json();
			console.log(`url, model, styleValue, ${url}, ${model}, ${styleValue}`);
			const transcript = await YoutubeTranscript.fetchTranscript(url); //https://www.youtube.com/watch?v=8RCL5neas_M
        	const sentences = Array.from(extractSentencesFromTranscript(transcript));
			
			const messages = [
				{ role: "system", content: "You are a friendly assistant" },
				{
				  role: "user",
				  content: `Summarize the following YouTube transcript: ${sentences}. The creativity and hilarity of the summary should be a ${styleValue} on a scale from 0 to 5 (where 5 is most creative and fun). Do not mention anything besides a summary of the transcript.`,
				},
			];
			const summary = await env.AI.run(model, { messages });
			console.log(`response ${JSON.stringify(summary)}`);
			return new Response(JSON.stringify(
				summary
			), {
				headers: { 'Content-Type': 'application/json' },
			});
		}
	},
};
