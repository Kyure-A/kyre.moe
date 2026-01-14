import type { Omit } from "@react-spring/web";
import type { CSSProperties, ReactNode } from "react";
import { FaGithub as FaGitHub } from "react-icons/fa";
import {
	FaBluesky,
	FaLastfm,
	FaMastodon,
	FaSteam,
	FaThreads,
	FaTwitter,
} from "react-icons/fa6";
import { SiMisskey } from "react-icons/si";
import { TbBrandMinecraft } from "react-icons/tb";
import { NostrIcon } from "@/shared/icons/nostr";
import { VRChatIcon } from "@/shared/icons/vrchat";

type AccountProps = {
	id: string;
	description?: string;
	serviceUrl: string;
	serviceIcon: ReactNode;
	platform: string;
	accentColor: string;
	iconClassName?: string;
};

function Account(props: AccountProps) {
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
								{displayId}
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

export default function Accounts() {
	const accounts: Omit<AccountProps, "delay">[] = [
		{
			id: "kyremoe",
			description: "3 代目",
			platform: "Twitter",
			accentColor: "#1DA1F2",
			serviceIcon: <FaTwitter />,
			serviceUrl: "https://x.com/kyremoe",
		},
		{
			id: "3kyu4",
			description: "女装アカウント",
			platform: "Twitter",
			accentColor: "#1DA1F2",
			serviceIcon: <FaTwitter />,
			serviceUrl: "https://x.com/3kyu4",
		},
		{
			id: "_______kyu",
			description: "VRChat 用アカウント",
			platform: "Twitter",
			accentColor: "#1DA1F2",
			serviceIcon: <FaTwitter />,
			serviceUrl: "https://x.com/_______kyu",
		},
		{
			id: "Kyure-A",
			description: "",
			platform: "GitHub",
			accentColor: "#171515",
			serviceIcon: <FaGitHub />,
			serviceUrl: "https://github.com/Kyure-A",
		},
		{
			id: "Kyure_A@misskey.io",
			description: "xyz 世代",
			platform: "Misskey",
			accentColor: "#55C500",
			serviceIcon: <SiMisskey />,
			serviceUrl: "https://misskey.io/@Kyure_A",
		},
		{
			id: "Kyure_A@mstdn.maud.io",
			description: "",
			platform: "Mastodon",
			accentColor: "#6364FF",
			serviceIcon: <FaMastodon />,
			serviceUrl: "https://mstdn.maud.io/@Kyure_A",
		},
		{
			id: "kyure_a",
			description: "",
			platform: "Threads",
			accentColor: "#1A1A1A",
			serviceIcon: <FaThreads />,
			serviceUrl: "https://threads.net/@kyure_a",
		},
		{
			id: "kyre.moe",
			description: "",
			platform: "Bluesky",
			accentColor: "#0085FF",
			serviceIcon: <FaBluesky />,
			serviceUrl: "https://bsky.app/profile/kyre.moe",
		},
		{
			id: "npub1kyrem0e",
			description: "",
			platform: "Nostr",
			accentColor: "#8E4BFF",
			serviceIcon: <NostrIcon />,
			serviceUrl:
				"https://iris.to/npub1kyrem0eejds8cwr2732ygtpksxnlehlg4wu92dkvyxxgz48fl5cqn6fay4",
		},
		{
			id: "Kyure_A",
			description: "",
			platform: "Steam",
			accentColor: "#171A21",
			serviceIcon: <FaSteam />,
			serviceUrl: "https://steamcommunity.com/id/kyure_a/",
		},
		{
			id: "Kyure_A",
			description: "",
			platform: "Minecraft",
			accentColor: "#4CAF50",
			serviceIcon: <TbBrandMinecraft />,
			serviceUrl: "https://ja.namemc.com/profile/Kyure_A",
		},
		{
			id: "Kyure_A",
			platform: "Last.fm",
			accentColor: "#D51007",
			serviceIcon: <FaLastfm />,
			serviceUrl: "https://www.last.fm/user/Kyure_A",
		},
		{
			id: "Kyure_A",
			platform: "VRChat",
			accentColor: "#000000",
			serviceIcon: <VRChatLogo />,
			serviceUrl:
				"https://vrchat.com/home/user/usr_daa6a1ac-65c2-49a3-a9a7-074434c05a4d",
		},
	];
	return (
		<>
			<ul className="py-24 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 list-none max-w-6xl mx-auto px-4 sm:px-6">
				{accounts.map((account) => {
					return (
						<Account
							key={account.serviceUrl}
							id={account.id}
							description={account.description}
							platform={account.platform}
							accentColor={account.accentColor}
							serviceIcon={account.serviceIcon}
							serviceUrl={account.serviceUrl}
						/>
					);
				})}
			</ul>
		</>
	);
}
