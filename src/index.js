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
			const { url } = await request.json();
			console.log(`url hurr ${url}`);
			const transcript = await YoutubeTranscript.fetchTranscript(url); //https://www.youtube.com/watch?v=8RCL5neas_M
        	const sentences = Array.from(extractSentencesFromTranscript(transcript));
			console.log(`request.body ${JSON.stringify(request.body)}`)
      		await env.MY_BUCKET.put(sentences, request.body);
      		console.log(`Object ${sentences} uploaded successfully!`);
			
			const messages = [
				{ role: "system", content: "You are a friendly assistant" },
				{
				  role: "user",
				  content: `Summarize the given YouTube video transcript: ${sentences}`,
				},
			];
			const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", { messages });
			console.log(`response ${JSON.stringify(response)}`);
			return new Response(JSON.stringify(response), {
				headers: { 'Content-Type': 'application/json' },
			});
		}
	},
};
