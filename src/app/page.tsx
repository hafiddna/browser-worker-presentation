"use client";

import React from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggler } from "@/components/theme-toggler";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN ?? "";
const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";

const options = [
	{
		value: "/content",
		description: "Get the content of a website.",
	},
	{
		value: "/screenshot",
		description: "Take a screenshot of a website.",
	},
	{
		value: "/pdf",
		description: "Convert a website to PDF.",
	},
	{
		value: "/snapshot",
		description: "Take a snapshot of a website.",
	},
	{
		value: "/scrape",
		description: "Scrape a website for data.",
	},
	{
		value: "/json",
		description: "Get the JSON representation of a website.",
	},
	{
		value: "/links",
		description: "Get all the links on a website.",
	},
	{
		value: "/markdown",
		description: "Convert a website to Markdown.",
	},
	{
		value: "basic",
		description: "Basic usage example.",
	}
];

const formSchema = z.object({
	options: z.
		string()
		.nonempty("Please select an option.")
		.refine((val) => options.some((option) => option.value === val), {
			message: "Invalid option selected.",
		}),
	title: z
		.string()
		.min(5, "Bug title must be at least 5 characters.")
		.max(32, "Bug title must be at most 32 characters."),
	description: z
		.string()
		.min(20, "Description must be at least 20 characters.")
		.max(100, "Description must be at most 100 characters."),
})

export default function Home() {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			options: "/content",
			title: "",
			description: "",
		},
	})

	function onSubmit(data: z.infer<typeof formSchema>) {
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
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
			<main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
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
										name="title"
										control={form.control}
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor="form-rhf-demo-title">
													Bug Title
												</FieldLabel>
												<Input
													{...field}
													id="form-rhf-demo-title"
													aria-invalid={fieldState.invalid}
													placeholder="Login button not working on mobile"
													autoComplete="off"
												/>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
											</Field>
										)}
									/>
									<Controller
										name="description"
										control={form.control}
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor="form-rhf-demo-description">
													Description
												</FieldLabel>
												<InputGroup>
													<InputGroupTextarea
														{...field}
														id="form-rhf-demo-description"
														placeholder="I'm having an issue with the login button on mobile."
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
													Include steps to reproduce, expected behavior, and what
													actually happened.
												</FieldDescription>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
											</Field>
										)}
									/>
								</FieldGroup>
							</form>
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
