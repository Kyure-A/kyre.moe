import { srcPath } from "@/shared/lib/path";
import AnimatedContent from "@/shared/ui/AnimatedContent/AnimatedContent";
import { Omit } from "@react-spring/web";
import Image from "next/image";
import { ReactNode } from "react";
import { FaGithub as FaGitHub } from "react-icons/fa";
import { FaBluesky, FaLastfm, FaMastodon, FaSteam, FaThreads, FaTwitter } from "react-icons/fa6";
import { SiMisskey } from "react-icons/si";
import { TbBrandMinecraft } from "react-icons/tb";
import { WiNightSnowThunderstorm } from "react-icons/wi";

type AccountProps = {
    id: string;
    description: string;
    avatarUrl?: string;
    serviceUrl: string;
    serviceIcon: ReactNode;
    delay: number;
}

function Account (props: AccountProps) {
    return (
        <a href={props.serviceUrl} className="block w-full px-2">
          <AnimatedContent delay={props.delay}>
            <div className="flex items-center border border-gray-600 rounded-lg w-full max-w-lg mx-auto my-4 p-3 bg-gray-1000 bg-opacity-50">
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
                <p className="text-xs text-gray-300 mt-1 truncate">{props.description}</p>            
              </div>
            </div>
          </AnimatedContent>
        </a>
    );
}

export default function Accounts () {
    const accounts: Omit<AccountProps, "delay">[] = [
        { id: "kyremoe", description: "本アカウント 3 つめ", serviceIcon: <FaTwitter />, avatarUrl: srcPath("/icon.jpg"), serviceUrl: "https://x.com/kyremoe"},
        { id: "3kyu4", description: "女装アカウント", serviceIcon: <FaTwitter />, avatarUrl: srcPath("/icon.jpg"), serviceUrl: "https://x.com/3kyu4"},
        { id: "Kyure-A", description: "OSS やったりやらない", serviceIcon: <FaGitHub />, avatarUrl: srcPath("/icon.jpg"), serviceUrl: "https://github.com/Kyure-A"},
        { id: "Kyure_A@misskey.io", description: "xyz からやってる", serviceIcon: <SiMisskey />, avatarUrl: srcPath("/icon.jpg"), serviceUrl: "https://misskey.io/@Kyure_A"},
        { id: "Kyure_A@mstdn.maud.io", description: "中学からやってる", serviceIcon: <FaMastodon />, avatarUrl: srcPath("/icon.jpg"), serviceUrl: "https://mstdn.maud.io/@Kyure_A"},
        { id: "kyure_a", description: "", serviceIcon: <FaThreads />, avatarUrl: srcPath("/icon.jpg"), serviceUrl: "https://threads.net/@kyure_a" },
        { id: "kyure-a.bsky.social", description: "", serviceIcon: <FaBluesky />, avatarUrl: srcPath("/icon.jpg"), serviceUrl: "https://bsky.app/profile/kyure-a.bsky.social" },
        { id: "npub1u66qnxs", description: "", serviceIcon: <FaTwitter />, avatarUrl: srcPath("/icon.jpg"), serviceUrl: "https://snort.social/p/npub1u66qnxs3gth2tx944u66xh8x7qp5sjj3xmh25dqa846jpk74229swuetxg"},
        { id: "Kyure_A", description: "「積みゲー」というゲーム", serviceIcon: <FaSteam />, avatarUrl: srcPath("/icon.jpg") , serviceUrl: "https://steamcommunity.com/id/kyure_a/"},
        { id: "Kyure_A", description: "", serviceIcon: <TbBrandMinecraft />, avatarUrl: srcPath("/icon.jpg"), serviceUrl: "https://ja.namemc.com/profile/Kyure_A" },
        { id: "Kyure_A", description: "", serviceIcon: <FaLastfm />, avatarUrl: srcPath("/icon.jpg"), serviceUrl: "https://www.last.fm/user/Kyure_A"}
    ]
    return (
        <>
          <AnimatedContent>
            <div className="py-20">
              {accounts.map((account, index) => {
                  return (
                      <Account
                          key={index}
                          id={account.id}
                          description={account.description}
                          serviceIcon={account.serviceIcon}
                          avatarUrl={account.avatarUrl ?? ""}
                          serviceUrl={account.serviceUrl}
                          delay={index * 100}
                      />

              )})}
            </div>
        </AnimatedContent>
        </>
    );
}
