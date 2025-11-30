import { type NextRequest } from 'next/server'
import Cloudflare from "cloudflare";

export async function POST(request: NextRequest): Promise<Response> {
	const apiToken = process.env.CLOUDFLARE_API_TOKEN ?? "";
	const account_id = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";

	const client = new Cloudflare({ apiToken });

	const formData = await request.formData();
	const options = formData.get('options');
	const url = String(formData.get('url')) ?? "";
	const prompt = formData.get('prompt') ?? "";

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let data: any = null;

	switch (options) {
		case "/screenshot":
			const screenshot = await client.browserRendering.snapshot.create({
				account_id,
				url,
			});

			const screenshotBuffer = Buffer.from(screenshot.screenshot, "base64");

			return new Response(screenshotBuffer, {
				status: 200,
				headers: {
					"content-type": "image/png",
				},
			});
		case "/pdf":
			const pdf = await client.browserRendering.pdf.create({
				account_id,
				url,
			});

			const file = await pdf.blob();
			const response = await file.arrayBuffer();

			return new Response(response, {
				status: 200,
				headers: {
					"content-type": "application/pdf",
				},
			});
 		case "/snapshot":
			const snapshot = await client.browserRendering.snapshot.create({
				account_id,
				url,
			});

			data = snapshot.content
			break;
		case "/scrape":
			data = await client.browserRendering.scrape.create({
				account_id,
				url,
				elements: [
					{selector: "h1"},
					{selector: "a"}
				]
			});
			break;
		case "/json":
			data = await client.browserRendering.json.create({
				account_id,
				url,
				prompt: String(prompt)
			});
			break;
		case "/links":
			data = await client.browserRendering.links.create({
				account_id,
				url
			});
			break;
		case "/markdown":
			data = await client.browserRendering.markdown.create({
				account_id,
				url
			});
			break;
		default:
			data = await client.browserRendering.content.create({
				account_id,
				url
			});
			break;
	}

	return Response.json({
		error: false,
		data
	}, {
		status: 200,
	});
}
