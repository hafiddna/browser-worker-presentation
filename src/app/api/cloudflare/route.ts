import { type NextRequest } from 'next/server'
import Cloudflare from "cloudflare";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

export async function POST(request: NextRequest): Promise<Response> {
	const apiToken = process.env.CLOUDFLARE_API_TOKEN ?? "";
	const account_id = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
	const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? "";

	// R2 configuration
	const r2Client = new S3Client({
		region: "auto",
		endpoint: process.env.CLOUDFLARE_S3_API,
		credentials: {
			accessKeyId: process.env.CLOUDFLARE_S3_ACCESS_KEY_ID ?? "",
			secretAccessKey: process.env.CLOUDFLARE_S3_SECRET_ACCESS_KEY ?? "",
		},
	});

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
			const pdfBuffer = await file.arrayBuffer();

			// Save PDF to R2
			const pdfKey = `pdfs/${new URL(url).hostname}/${Date.now()}.pdf`;
			await r2Client.send(new PutObjectCommand({
				Bucket: bucketName,
				Key: pdfKey,
				Body: new Uint8Array(pdfBuffer),
				ContentType: "application/pdf",
			}));

			return new Response(pdfBuffer, {
				status: 200,
				headers: {
					"content-type": "application/pdf",
					"x-r2-key": pdfKey,
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

			// Save markdown to R2 using Upload for better stream handling
			const markdownKey = `markdown/${new URL(url).hostname}/${Date.now()}.md`;
			const markdownContent = typeof data === 'string' ? data : JSON.stringify(data);
			
			const upload = new Upload({
				client: r2Client,
				params: {
					Bucket: bucketName,
					Key: markdownKey,
					Body: Buffer.from(markdownContent, 'utf-8'),
					ContentType: "text/markdown",
				},
			});

			await upload.done();

			// Return both data and R2 key
			return Response.json({
				error: false,
				data: data,
				r2Key: markdownKey
			}, {
				status: 200,
			});
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
