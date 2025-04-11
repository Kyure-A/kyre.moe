import { srcPath } from "@/shared/lib/path";
import Image from "next/image";
import { ReactNode } from "react";
import { FaGithub as FaGitHub } from "react-icons/fa";
import { FaLastfm, FaMastodon, FaSteam, FaTwitter } from "react-icons/fa6";
import { SiMisskey } from "react-icons/si";

type AccountProps = {
    id: string;
    description: string;
    avatarUrl?: string;
    serviceUrl: string;
    serviceIcon: ReactNode;
}

function Account (props: AccountProps) {
    return (
        <a href={props.serviceUrl} className="block w-full px-2">
          <div className="flex items-center border border-gray-600 rounded-lg w-full max-w-lg mx-auto my-4 p-3 bg-gray-1000 bg-opacity-50">
            <Image
                className="rounded-full flex-shrink-0"
                alt=""
                src={props.avatarUrl as string}
                width={60}
                height={60}
            />
            <div className="flex flex-col ml-4 overflow-hidden">
              <div className="flex items-center">
                <div className="mr-2 flex-shrink-0">{props.serviceIcon}</div>
                <p className="text-white truncate">@{props.id}</p>
              </div>
              <p className="text-xs text-gray-300 mt-1 truncate">{props.description}</p>            
            </div>
          </div>
        </a>
    );
}

export default function Accounts () {
    const accounts: AccountProps[] = [
        { id: "kyremoe", description: "本アカウント 3 つめ", serviceIcon: <FaTwitter />, avatarUrl: srcPath("/icon.jpg"), serviceUrl: "https://x.com/kyremoe"},
        { id: "Kyure-A", description: "OSS やったりやらない", serviceIcon: <FaGitHub />, avatarUrl: srcPath("/icon.jpg"), serviceUrl: "https://github.com/Kyure-A"},
        { id: "Kyure_A@misskey.io", description: "xyz からやってる", serviceIcon: <SiMisskey />, avatarUrl: srcPath("/icon.jpg"), serviceUrl: "https://misskey.io/@Kyure_A"},
        { id: "Kyure_A@mstdn.maud.io", description: "中学からやってる", serviceIcon: <FaMastodon />, avatarUrl: srcPath("/icon.jpg"), serviceUrl: "https://mstdn.maud.io/@Kyure_A"},
        { id: "Kyure_A", description: "「積みゲー」というゲーム", serviceIcon: <FaSteam />, avatarUrl: srcPath("/icon.jpg") , serviceUrl: "https://steamcommunity.com/id/kyure_a/"},
        { id: "Kyure_A", description: "", serviceIcon: <FaLastfm />, avatarUrl: srcPath("/icon.jpg"), serviceUrl: "https://www.last.fm/user/Kyure_A"}
    ]
    return (
        <>
          {accounts.map((account, i) => {
              return (
                    <Account
                        key={i}
                        id={account.id}
                        description={account.description}
                        serviceIcon={account.serviceIcon}
                        avatarUrl={account.avatarUrl ?? ""}
                        serviceUrl={account.serviceUrl}
                    />

          )})}
        </>
    );
}
