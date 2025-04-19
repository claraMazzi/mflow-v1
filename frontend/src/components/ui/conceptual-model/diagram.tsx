"use client";

import { ConceptualModel } from "@/app/conceptual-model/page";
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
	propertyPathPrefix = namePrefix
}: {
	register: any;
	watch: any;
	namePrefix: Path<ConceptualModel>;
	propertyPathPrefix?: string;
}) {
	
	const [imgSource, setImageSource] = useState<undefined | string>();
	const debouncedRenderDiagram = useRef(
		debounce((value: any) => {
			const encoded = plantumlEncoder.encode(value);
			setImageSource("http://www.plantuml.com/plantuml/img/" + encoded);
		}, DEBOUNCE_DIAGRAM_RENDER_DELAY)
	);
	const plantTextCodeValue = watch(`${namePrefix}.plantTextCode`);
	const usesPlantTextValue = watch(`${namePrefix}.usesPlantText`);

	useEffect(() => {
		if (usesPlantTextValue) {
			debouncedRenderDiagram.current(plantTextCodeValue);
		}
		return () => {};
	}, [plantTextCodeValue, usesPlantTextValue]);

	return (
		<>
			<label>Utiliza PlanText: </label>
			<input type="checkbox" {...register({ name: `${namePrefix}.usesPlantText`, propertyPath: `${propertyPathPrefix}.usesPlantText` })} />
			<div className="flex flex-row gap-2">
				{usesPlantTextValue ? (
					<textarea
						className="flex-grow max-w-[50%]"
						{...register({ name: `${namePrefix}.plantTextCode`, propertyPath: `${propertyPathPrefix}.plantTextCode` })}
					/>
				) : (
					<input
						type="file"
						accept=".png, .jpg, .jpeg"
						onChange={(e) => {
							if (e.currentTarget.files && e.currentTarget.files.length > 0) {
								setImageSource(URL.createObjectURL(e.currentTarget.files[0]));
							} else {
                                setImageSource("")
                            }
						}}
					/>
				)}
				<img src={imgSource} alt="Diagram" />
			</div>
		</>
	);
}
