import type { CSSProperties, ReactNode } from "react";

export type AccountProps = {
  id: string;
  description?: string;
  serviceUrl: string;
  serviceIcon: ReactNode;
  platform: string;
  accentColor: string;
  iconClassName?: string;
};

export default function Account(props: AccountProps) {
  const accentStyle = {
    "--accent": props.accentColor,
  } as CSSProperties;

  const descriptionText = props.description ?? "";
  const hasDescription = descriptionText.trim().length > 0;
  return (
    <li>
      <a
        href={props.serviceUrl}
        className="group block w-full px-2"
        style={accentStyle}
      >
        <div className="flex w-full items-center gap-3 px-0 py-2 text-gray-100 transition-[padding,background-color,border-radius,color] duration-[400ms] ease-out group-hover:px-4 group-hover:rounded-[10px] group-hover:bg-[var(--accent)] group-hover:text-white group-hover:[text-shadow:0_1px_4px_rgba(0,0,0,0.2)] sm:gap-5 sm:py-3 sm:group-hover:px-5">
          <span
            className={`flex items-center justify-center text-[18px] text-gray-200 transition-colors duration-[400ms] ease-out group-hover:text-white sm:text-[22px] ${props.iconClassName ?? "h-5 w-5 sm:h-6 sm:w-6"}`}
          >
            {props.serviceIcon}
          </span>
          <div className="flex min-w-0 flex-1 items-center">
            <span className="platform mr-3 w-16 shrink-0 truncate text-[12px] font-semibold leading-none text-gray-200 transition-[margin,color] duration-[400ms] ease-out group-hover:mr-1 group-hover:text-white sm:mr-5 sm:w-24 sm:text-[14px] md:w-28 md:text-[15px]">
              {props.platform}
            </span>
            <div
              className={`min-w-0 flex flex-col min-h-[40px] ${hasDescription ? "" : "justify-center"}`}
            >
              <p className="text-[12px] leading-none text-gray-100 whitespace-nowrap transition-colors duration-[400ms] ease-out group-hover:text-white sm:text-[14px] md:text-[15px]">
                {props.id}
              </p>
              {hasDescription ? (
                <p className="mt-0.5 text-[12px] leading-snug text-gray-400 truncate transition-colors duration-[400ms] ease-out group-hover:text-white/90 sm:mt-1 sm:text-[13px]">
                  {descriptionText}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </a>
    </li>
  );
}
