"use client";

import { Ellipsis } from "lucide-react";
import { ReactElement, useEffect, useRef, useState } from "react";

export type PopoverOption = {
  content: ReactElement;
};

type OptionsPopoverProps = {
  options: PopoverOption[];
  buttonClassName?: string;
  popoverClassName?: string;
  optionClassName?: string;
};

const OptionsPopover = ({
  options,
  buttonClassName = "p-1 rounded-full hover:bg-gray-100 transition-colors ",
  popoverClassName = "absolute right-0 top-[60%] mt-1 bg-white shadow-md p-1 shadow-custom z-10 min-w-[155px] py-1",
}: OptionsPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const togglePopover = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={togglePopover}
        className={buttonClassName}
        aria-label="Options"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Ellipsis color="#ADB5BD" />
      </button>

      {isOpen && (
        <div ref={popoverRef} className={popoverClassName} role="menu">
          {options.map((options, index) => (
            <div className="w-full min-w-[150px]" key={`option-${index}`}>
              {options.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OptionsPopover;
