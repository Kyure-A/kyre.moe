import Image from "next/image";
import { ReactNode } from "react";
import { FaGithub as FaGitHub } from "react-icons/fa";
import { FaSteam, FaTwitter } from "react-icons/fa6";
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
        <a href={props.serviceUrl}>
          <div className="flex flex-col sm:flex-row justify-center border border-gray-600 rounded-lg w-full max-w-md mx-auto my-4 p-2">
            <Image
                className="rounded-full p-2 sm:p-4 mx-auto sm:mx-0"
                alt=""
                src={props.avatarUrl as string}
                width={100}
                height={100}
            />
            <div className="flex flex-col items-center justify-center w-full mx-auto overflow-hidden">
              <div className="flex items-center">
                <div className="px-2 py-2">{props.serviceIcon}</div>
                <p>@{props.id}</p>
              </div>
              <p className="text-xs py-2">{props.description}</p>            
              </div>
          </div>
        </a>
    );
}

export default function Accounts () {
    const accounts: AccountProps[] = [
        { id: "kyremoe", description: "本アカウント 3 つめ", serviceIcon: <FaTwitter />, avatarUrl: "/icon.jpg", serviceUrl: "https://x.com/kyremoe"},
        { id: "Kyure-A", description: "OSS やったりやらない", serviceIcon: <FaGitHub />, avatarUrl: "/icon.jpg", serviceUrl: "https://github.com/Kyure-A"},
        { id: "Kyure_A@misskey.io", description: "xyz からやってる", serviceIcon: <SiMisskey />, avatarUrl: "/icon.jpg", serviceUrl: "https://misskey.io/@Kyure_A"},
        { id: "Kyure_A", description: "「積みゲー」というゲーム", serviceIcon: <FaSteam />, avatarUrl: "/icon.jpg" , serviceUrl: "https://steamcommunity.com/id/kyure_a/"}
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
