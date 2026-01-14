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
import { WiNightSnowThunderstorm } from "react-icons/wi";
import AnimatedContent from "@/shared/ui/AnimatedContent/AnimatedContent";

type AccountProps = {
	id: string;
	description?: string;
	serviceUrl: string;
	serviceIcon: ReactNode;
	platform: string;
	accentColor: string;
};

function NostrIcon() {
	return (
		<svg
			className="w-6 h-6 inline-block"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 256 256"
			fill="currentColor"
		>
			<path d="M210.8 199.4c0 3.1-2.5 5.7-5.7 5.7h-68c-3.1 0-5.7-2.5-5.7-5.7v-15.5c.3-19 2.3-37.2 6.5-45.5 2.5-5 6.7-7.7 11.5-9.1 9.1-2.7 24.9-.9 31.7-1.2 0 0 20.4.8 20.4-10.7s-9.1-8.6-9.1-8.6c-10 .3-17.7-.4-22.6-2.4-8.3-3.3-8.6-9.2-8.6-11.2-.4-23.1-34.5-25.9-64.5-20.1-32.8 6.2.4 53.3.4 116.1v8.4c0 3.1-2.6 5.6-5.7 5.6H57.7c-3.1 0-5.7-2.5-5.7-5.7v-144c0-3.1 2.5-5.7 5.7-5.7h31.7c3.1 0 5.7 2.5 5.7 5.7 0 4.7 5.2 7.2 9 4.5 11.4-8.2 26-12.5 42.4-12.5 36.6 0 64.4 21.4 64.4 68.7v83.2ZM150 99.3c0-6.7-5.4-12.1-12.1-12.1s-12.1 5.4-12.1 12.1 5.4 12.1 12.1 12.1S150 106 150 99.3Z" />
		</svg>
	);
}

function Account(props: AccountProps) {
	const accentStyle = {
		"--accent": props.accentColor,
	} as CSSProperties;
	const displayId =
		props.id.includes("@") || props.id.startsWith("npub") || props.platform === "VRChat"
		? props.id
		: `@${props.id}`;
	const descriptionText = props.description ?? "";
	const hasDescription = descriptionText.trim().length > 0;
	return (
		<li>
			<a href={props.serviceUrl} className="group block w-full px-2" style={accentStyle}>
				<div className="flex w-full items-center gap-5 px-0 py-3 text-gray-100 transition-[padding,background-color,border-radius,color] duration-[400ms] ease-out group-hover:px-5 group-hover:rounded-[10px] group-hover:bg-[var(--accent)] group-hover:text-white group-hover:[text-shadow:0_1px_4px_rgba(0,0,0,0.2)]">
					<span className="flex h-6 w-6 items-center justify-center text-[22px] text-gray-200 transition-colors duration-[400ms] ease-out group-hover:text-white">
						{props.serviceIcon}
					</span>
					<div className="flex min-w-0 flex-1 items-start">
						<span className="platform mr-5 w-28 shrink-0 self-center truncate text-[16px] font-semibold text-gray-200 transition-[margin,color] duration-[400ms] ease-out group-hover:mr-1 group-hover:text-white">
							{props.platform}
						</span>
						<div
							className={`min-w-0 flex flex-col min-h-[40px] ${hasDescription ? "" : "justify-center"}`}
						>
							<p className="text-[15px] text-gray-100 truncate transition-colors duration-[400ms] ease-out group-hover:text-white">
								{displayId}
							</p>
							{hasDescription ? (
								<p className="text-[13px] text-gray-400 truncate transition-colors duration-[400ms] ease-out group-hover:text-white/90">
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
			id: "kyure-a.bsky.social",
			description: "",
			platform: "Bluesky",
			accentColor: "#0085FF",
			serviceIcon: <FaBluesky />,
			serviceUrl: "https://bsky.app/profile/kyure-a.bsky.social",
		},
		{
			id: "npub1kyrem0e",
			description: "",
			platform: "Nostr",
			accentColor: "#8E4BFF",
			serviceIcon: <NostrIcon />,
			serviceUrl: "https://iris.to/npub1kyrem0eejds8cwr2732ygtpksxnlehlg4wu92dkvyxxgz48fl5cqn6fay4",
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
      accentColor: "#FF6F61",
      serviceIcon: <WiNightSnowThunderstorm />,
      serviceUrl: "https://vrchat.com/home/user/usr_daa6a1ac-65c2-49a3-a9a7-074434c05a4d",
    }
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
