import React, { Fragment, ReactNode } from "react";
import OptionsPopover, {
	PopoverOption,
} from "@components/ui/common/options-popover";
import { ArrowRight } from "lucide-react";

type ContentCardProps = (
	| {
			type: "project";
			description: string;
	  }
	| {
			type: "version";
			description?: undefined;
	  }
) & {
	title: string;
	decorators?: ReactNode[];
	action?: () => void;
	options?: PopoverOption[];
};

const colorVariants = {
	project: {
		arrowColor: "text-blue-900",
		actionBarBackgroundColor: "bg-purple-400",
	},
	version: {
		arrowColor: "text-green-900",
		actionBarBackgroundColor: "bg-green-400",
	},
};

const ContentCard = ({
	type,
	title,
	description,
	action,
	options,
	decorators,
}: ContentCardProps) => {
	return (
		<div className="bg-white flex flex-col justify-between rounded-lg h-full">
			<div className="p-3 flex flex-col gap-2">
				<div className="flex justify-between ">
					<h3 className="text-base font-bold">{title}</h3>
					{options && <OptionsPopover options={options} />}
				</div>
				{decorators && (
					<div className="flex flex-col gap-1">
						{decorators.map((decorator, index) => (
							<Fragment key={`card-decorator-${index}`}>{decorator}</Fragment>
						))}
					</div>
				)}
				{type === "project" && <div className="text-sm">{description}</div>}
			</div>
			<div className={`flex w-full justify-end ${colorVariants[type].actionBarBackgroundColor} p-2 rounded-b-lg`}>
				{action && (
					<button onClick={action} className={`${colorVariants[type].arrowColor} hover:underline`}>
						<ArrowRight width={24} height={24} className="opacity-90" />
					</button>
				)}
			</div>
		</div>
	);
};

export default ContentCard;
