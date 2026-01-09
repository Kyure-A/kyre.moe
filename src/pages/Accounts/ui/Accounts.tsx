import type { Omit } from "@react-spring/web";
import Image from "next/image";
import type { ReactNode } from "react";
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
import { srcPath } from "@/shared/lib/path";
import AnimatedContent from "@/shared/ui/AnimatedContent/AnimatedContent";

type AccountProps = {
	id: string;
	description: string;
	avatarUrl?: string;
	serviceUrl: string;
	serviceIcon: ReactNode;
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
	return (
		<a href={props.serviceUrl} className="block w-full px-2">
			<div className="flex items-center border border-gray-600 rounded-lg w-full my-2 p-3 bg-gray-1000 bg-opacity-50 min-h-20">
				{/* <Image
            className="rounded-full flex-shrink-0"
            alt=""
            src={props.avatarUrl as string}
            width={60}
            height={60}
            /> */}
				<div className="ml-2 flex-shrink-0">{props.serviceIcon}</div>
				<div className="flex flex-col ml-4 overflow-hidden">
					<div className="flex items-center">
						<p className="text-white truncate">@{props.id}</p>
					</div>
					<p className="text-xs text-gray-300 mt-1 truncate">
						{props.description}
					</p>
				</div>
			</div>
		</a>
	);
}

export default function Accounts() {
	const accounts: Omit<AccountProps, "delay">[] = [
		{
			id: "kyremoe",
			description: "本アカウント 3 つめ",
			serviceIcon: <FaTwitter />,
			avatarUrl: srcPath("/icon.jpg"),
			serviceUrl: "https://x.com/kyremoe",
		},
		{
			id: "3kyu4",
			description: "女装アカウント",
			serviceIcon: <FaTwitter />,
			avatarUrl: srcPath("/icon.jpg"),
			serviceUrl: "https://x.com/3kyu4",
		},
		{
			id: "Kyure-A",
			description: "OSS やったりやらない",
			serviceIcon: <FaGitHub />,
			avatarUrl: srcPath("/icon.jpg"),
			serviceUrl: "https://github.com/Kyure-A",
		},
		{
			id: "Kyure_A@misskey.io",
			description: "xyz からやってる",
			serviceIcon: <SiMisskey />,
			avatarUrl: srcPath("/icon.jpg"),
			serviceUrl: "https://misskey.io/@Kyure_A",
		},
		{
			id: "Kyure_A@mstdn.maud.io",
			description: "中学からやってる",
			serviceIcon: <FaMastodon />,
			avatarUrl: srcPath("/icon.jpg"),
			serviceUrl: "https://mstdn.maud.io/@Kyure_A",
		},
		{
			id: "kyure_a",
			description: "",
			serviceIcon: <FaThreads />,
			avatarUrl: srcPath("/icon.jpg"),
			serviceUrl: "https://threads.net/@kyure_a",
		},
		{
			id: "kyure-a.bsky.social",
			description: "",
			serviceIcon: <FaBluesky />,
			avatarUrl: srcPath("/icon.jpg"),
			serviceUrl: "https://bsky.app/profile/kyure-a.bsky.social",
		},
		{
			id: "npub1u66qnxs",
			description: "",
			serviceIcon: <NostrIcon />,
			avatarUrl: srcPath("/icon.jpg"),
			serviceUrl:
				"https://snort.social/p/npub1u66qnxs3gth2tx944u66xh8x7qp5sjj3xmh25dqa846jpk74229swuetxg",
		},
		{
			id: "Kyure_A",
			description: "「積みゲー」というゲーム",
			serviceIcon: <FaSteam />,
			avatarUrl: srcPath("/icon.jpg"),
			serviceUrl: "https://steamcommunity.com/id/kyure_a/",
		},
		{
			id: "Kyure_A",
			description: "",
			serviceIcon: <TbBrandMinecraft />,
			avatarUrl: srcPath("/icon.jpg"),
			serviceUrl: "https://ja.namemc.com/profile/Kyure_A",
		},
		{
			id: "Kyure_A",
			description: "",
			serviceIcon: <FaLastfm />,
			avatarUrl: srcPath("/icon.jpg"),
			serviceUrl: "https://www.last.fm/user/Kyure_A",
		},
	];
	return (
		<>
			<div className="py-20 grid grid-cols-1 md:grid-cols-2 gap-4">
				{accounts.map((account, index) => {
					return (
						<Account
							key={index}
							id={account.id}
							description={account.description}
							serviceIcon={account.serviceIcon}
							avatarUrl={account.avatarUrl ?? ""}
							serviceUrl={account.serviceUrl}
						/>
					);
				})}
			</div>
		</>
	);
}
