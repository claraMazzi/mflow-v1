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
		<div className="bg-white flex h-full min-h-0 flex-col justify-between rounded-lg">
			<div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-3">
				<div className="flex min-w-0 items-start justify-between gap-2">
					<h3 className="min-w-0 flex-1 text-base font-bold break-words">
						{title}
					</h3>
					{options && (
						<div className="shrink-0 pt-0.5">
							<OptionsPopover options={options} />
						</div>
					)}
				</div>
				{decorators && (
					<div className="flex min-w-0 flex-col gap-1">
						{decorators.map((decorator, index) => (
							<Fragment key={`card-decorator-${index}`}>{decorator}</Fragment>
						))}
					</div>
				)}
				{type === "project" && (
					<div className="min-w-0 text-sm break-words">{description}</div>
				)}
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
