"use client";

import { ConceptualModel } from "#types/conceptual-model";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Path } from "react-hook-form";
const plantumlEncoder = require("plantuml-encoder");

function debounce(func: any, delay: number) {
	let timeout: NodeJS.Timeout | null = null;
	return (...args: any) => {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			func(...args);
		}, delay);
	};
}

const DEBOUNCE_DIAGRAM_RENDER_DELAY = 3000;

export default function Diagram({
	register,
	watch,
	namePrefix,
	propertyPathPrefix = namePrefix,
}: {
	register: any;
	watch: any;
	namePrefix: Path<ConceptualModel>;
	propertyPathPrefix?: string;
}) {
	const [imgSource, setImageSource] = useState<undefined | string>();
	const imgRef = useRef<null|HTMLImageElement>(null);
	const debouncedRenderDiagram = useRef(
		debounce((value: any) => {
			const encoded = plantumlEncoder.encode(value);
			setImageSource("http://www.plantuml.com/plantuml/img/" + encoded);
		}, DEBOUNCE_DIAGRAM_RENDER_DELAY)
	);
	const plantTextCodeValue = watch(`${namePrefix}.plantTextCode`);
	const usesPlantTextValue = watch(`${namePrefix}.usesPlantText`);
	const imageFilePath = watch(`${namePrefix}.imageFilePath`);

	useEffect(() => {
		if (usesPlantTextValue) {
			debouncedRenderDiagram.current(plantTextCodeValue);
		} else {
			setImageSource(imageFilePath);
		}
		return () => {};
	}, [plantTextCodeValue, usesPlantTextValue, imageFilePath]);

	const checkboxRegister = register({
		name: `${namePrefix}.usesPlantText`,
		propertyPath: `${propertyPathPrefix}.usesPlantText`,
		propagateUpdateOnChange: true,
	});

	return (
		<>
			<label>Utiliza PlanText: </label>
			<input
				type="checkbox"
				{...checkboxRegister}
				className={`${checkboxRegister.readOnly ? "pointer-events-none" : ""}`}
			/>
			<div className="flex flex-row gap-2">
				{usesPlantTextValue ? (
					<textarea
						className="flex-grow max-w-[50%]"
						{...register({
							name: `${namePrefix}.plantTextCode`,
							propertyPath: `${propertyPathPrefix}.plantTextCode`,
						})}
					/>
				) : (
					//TODO FIX UPLOAD TO USE THE NEW ENDPOINT
					<input
						type="file"
						accept=".png, .jpg, .jpeg"
						onChange={(e) => {
							const files = e.currentTarget.files;
							if (!files || files.length == 0) return;
						}}
					/>
				)}
				<img alt="Diagram" src={imgSource} />
			</div>
		</>
	);
}
