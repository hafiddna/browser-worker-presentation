"use client";

import React from "react";
import Image from "next/image";

import { ThemeToggler } from "@/components/theme-toggler";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton";
import { CodeEditor } from '@/components/ui/shadcn-io/code-editor';
import { WebPreview, WebPreviewBody } from '@/components/ui/shadcn-io/ai/web-preview';

import { zodResolver } from "@hookform/resolvers/zod";
import { Settings } from 'lucide-react';
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const options = [
	{
		value: "/content",
		description: "The /content endpoint instructs the browser to navigate to a website and capture the fully rendered HTML of a page, including the head section, after JavaScript execution. This is ideal for capturing content from JavaScript-heavy or interactive websites.",
	},
	{
		value: "/screenshot",
		description: "The /screenshot endpoint renders the webpage by processing its HTML and JavaScript, then captures a screenshot of the fully rendered page.",
	},
	{
		value: "/pdf",
		description: "The /pdf endpoint instructs the browser to generate a PDF of a webpage or custom HTML using Cloudflare's headless browser rendering service.",
	},
	{
		value: "/snapshot",
		description: "The /snapshot endpoint captures both the HTML content and a screenshot of the webpage in one request. It returns the HTML as a text string and the screenshot as a Base64-encoded image.",
	},
	{
		value: "/scrape",
		description: "The /scrape endpoint extracts structured data from specific elements on a webpage, returning details such as element dimensions and inner HTML.",
	},
	{
		value: "/json",
		description: "The /json endpoint extracts structured data from a webpage. You can specify the expected output using either a prompt or a response_format parameter which accepts a JSON schema. The endpoint returns the extracted data in JSON format. By default, this endpoint leverages Workers AI. If you would like to specify your own AI model for the extraction, you can use the custom_ai parameter.",
	},
	{
		value: "/links",
		description: "The /links endpoint retrieves all links from a webpage. It can be used to extract all links from a page, including those that are hidden.",
	},
	{
		value: "/markdown",
		description: "The /markdown endpoint retrieves a webpage's content and converts it into Markdown format. You can specify a URL and optional parameters to refine the extraction process.",
	}
];

const formSchema = z.object({
	options: z.
		string()
		.nonempty("Please select an option.")
		.refine((val) => options.some((option) => option.value === val), {
			message: "Invalid option selected.",
		}),
	url: z
		.string()
		.nonempty("URL is required.")
		.url("Please enter a valid URL."),
	prompt: z
		.string(),
})

export default function Home() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [response, setResponse] = React.useState<any>(null);
	const [loading, setLoading] = React.useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			options: "/content",
			url: "https://example.com",
			prompt: "",
		},
	})

	async function onSubmit(data: z.infer<typeof formSchema>) {
		toast("You submitted the following values:", {
			description: (
				<pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
			),
			position: "bottom-right",
			classNames: {
				content: "flex flex-col gap-2",
			},
			style: {
				"--border-radius": "calc(var(--radius)  + 4px)",
			} as React.CSSProperties,
		})

		setLoading(true);

		fetch("/api/cloudflare", {
			method: "POST",
			body: (() => {
				const formData = new FormData();
				formData.append("options", data.options);
				formData.append("url", data.url);
				if (data.prompt) {
					formData.append("prompt", data.prompt);
				}
				return formData;
			})(),
		})
		.then(async (res) => {
			if (data.options !== "/pdf" && data.options !== "/screenshot") {
				const json = await res.json();
				setResponse(json);
			} else {
				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				console.log("response url: ", url);
				setResponse(url);
			}
		})
		.catch((error) => {
			console.error("Error:", error);
			setResponse(null);
			toast.error("An error occurred while processing your request.");
		})
		.finally(() => {
			setLoading(false);
		});
	}

	React.useEffect(() => {
		setResponse(null);
	}, [form.watch("options")]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
			<main className="flex min-h-screen w-full flex-col items-center py-32 px-16 bg-white dark:bg-black sm:items-start">
				<div className="w-full flex justify-between items-center mb-16">
					<Image
						className="dark:invert"
						src="/cloudflare.svg"
						alt="Next.js logo"
						width={100}
						height={20}
						priority
					/>

					<ThemeToggler />
				</div>

				<div className="w-full flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
					<Card className="w-full">
						<CardHeader>
							<CardTitle>
								Cloudflare Browser Rendering
							</CardTitle>
							<CardDescription>
								Experiment with cloudflare worker and browser rendering API.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
								<FieldGroup>
									<Controller
										name="options"
										control={form.control}
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor="form-rhf-select-language">
													Rendering Option
												</FieldLabel>
												<Select
													name={field.name}
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger
														id="form-rhf-select-language"
														aria-invalid={fieldState.invalid}
														className="min-w-[120px]"
													>
														<SelectValue placeholder="Select" />
													</SelectTrigger>
													<SelectContent position="item-aligned">
														{options.map((language) => (
															<SelectItem key={language.value} value={language.value}>
																{language.value}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FieldDescription>
													{options.find((opt) => opt.value === field.value)?.description}
												</FieldDescription>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
											</Field>
										)}
									/>
									<Controller
										name="url"
										control={form.control}
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor="form-rhf-demo-url">
													URL
												</FieldLabel>
												<Input
													{...field}
													id="form-rhf-demo-url"
													aria-invalid={fieldState.invalid}
													placeholder="https://example.com"
													autoComplete="off"
												/>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
											</Field>
										)}
									/>
									{form.watch("options") === "/json" && (
										<Controller
											name="prompt"
											control={form.control}
											render={({ field, fieldState }) => (
												<Field data-invalid={fieldState.invalid}>
													<FieldLabel htmlFor="form-rhf-demo-prompt">
														Prompt (for JSON option)
													</FieldLabel>
													<InputGroup>
														<InputGroupTextarea
															{...field}
															id="form-rhf-demo-prompt"
															placeholder="E.g., Extract all article titles and their publication dates."
															rows={6}
															className="min-h-24 resize-none"
															aria-invalid={fieldState.invalid}
														/>
														<InputGroupAddon align="block-end">
															<InputGroupText className="tabular-nums">
																{field.value?.length}/100 characters
															</InputGroupText>
														</InputGroupAddon>
													</InputGroup>
													<FieldDescription>
														Provide a prompt to guide the data extraction process.
													</FieldDescription>
													{fieldState.invalid && (
														<FieldError errors={[fieldState.error]} />
													)}
												</Field>
											)}
										/>
									)}
								</FieldGroup>
							</form>

							<p className="leading-none font-semibold mt-7 mb-3">
								Preview :
							</p>

							{!loading && response ? (
								<>
									{(form.getValues("options") === "/content") && response && (
										<div className="w-full" style={{ height: '500px' }}>
											<WebPreview defaultUrl={form.watch("url")}>
												<WebPreviewBody />
											</WebPreview>
										</div>
									)}

									{(form.getValues("options") === "/pdf") && response && (
										<div className="w-full" style={{ height: '500px' }}>
											<iframe
												src={response}
												title="PDF Preview"
												className="w-full h-full border-0"
											 />
										</div>
									)}

									{(form.getValues("options") === "/screenshot") && response && (
										<div className="w-full" style={{ height: '500px' }}>
											<WebPreview defaultUrl={response}>
												<WebPreviewBody />
											</WebPreview>
										</div>
									)}

									{(form.getValues("options") === "/snapshot" || form.getValues("options") === "/json" || form.getValues("options") === "/links" || form.getValues("options") === "/scrape"  || form.getValues("options") === "/markdown") && response && (
										<CodeEditor
											writing={false}
											className="w-full h-[500px]"
											lang={form.getValues("options") === "/markdown" ? "markdown" : (form.getValues("options") === "/snapshot") ? "html" : "javascript"}
											title={form.getValues("options") === "/markdown" ? "response.md" : (form.getValues("options") === "/snapshot") ? "response.html" : "response.json"}
											icon={<Settings />}
											copyButton
										>
											{form.getValues("options") === "/markdown" || form.getValues("options") === "/snapshot"  ? response.data : JSON.stringify(response.data, null, 2)}
										</CodeEditor>
									)}
								</>
							) : (!loading && !response) ? (
								<div className="w-full h-[500px] flex items-center justify-center">
									<p className="text-muted-foreground">No preview available</p>
								</div>
							) : (
								<div className="flex flex-col space-y-3">
									<Skeleton className="h-[500px] w-full rounded-xl" />
								</div>
							)}
						</CardContent>
						<CardFooter>
							<Field orientation="horizontal">
								<Button className="cursor-pointer" type="button" variant="outline" onClick={() => form.reset()}>
									Reset
								</Button>
								<Button className="cursor-pointer" type="submit" form="form-rhf-demo">
									Submit
								</Button>
							</Field>
						</CardFooter>
					</Card>
				</div>
			</main>
		</div>
	);
}
