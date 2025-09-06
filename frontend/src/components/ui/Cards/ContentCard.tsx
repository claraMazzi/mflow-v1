import React, { Fragment, ReactNode } from "react";
import OptionsPopover, {
  PopoverOption,
} from "@components/ui/common/options-popover";
import { ArrowRight } from "lucide-react";

interface ContentCardProps {
  title: string;
  description: string;
  decorators?: ReactNode[];
  action?: () => void;
  options?: PopoverOption[];
}
const ContentCard = ({
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
        <div className="text-sm">{description}</div>
      </div>
      <div className="flex w-full justify-end bg-purple-400 p-2 rounded-b-lg">
        {action && (
          <button onClick={action} className="text-blue-500 hover:underline">
            <ArrowRight color="#6E6182" width={24} height={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ContentCard;
