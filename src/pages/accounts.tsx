import InfiniteScroll from "@/blocks/Components/InfiniteScroll/InfiniteScroll";
import Image from "next/image";
import { ReactNode } from "react";
import { FaGithub as FaGitHub } from "react-icons/fa";
import { FaTwitter } from "react-icons/fa6";
import { SiMisskey } from "react-icons/si";

type AccountProps = {
    id: string;
    description: string;
    avatarUrl?: string;
    serviceIcon: ReactNode;
}

function Account (props: AccountProps) {
    return (
        <div className="flex justify-center border border-gray-600 rounded-lg w-1/3 mx-auto my-4">
          <Image
              className="rounded-full p-4"
              alt=""
              src={props.avatarUrl as string}
              width={100}
              height={100}
          />
          <div className="flex flex-col items-center justify-center mx-auto">
            <div className="flex items-center">
              <div className="px-2">{props.serviceIcon}</div>
              <p>@{props.id}</p>
            </div>
            <p className="text-xs">{props.description}</p>            
          </div>
        </div>
    );
}

export default function Accounts () {
    const accounts: AccountProps[] = [
        { id: "kyremoe", description: "本アカウント 3 つめ", serviceIcon: <FaTwitter />, avatarUrl: "/icon.jpg"},
        { id: "Kyure-A", description: "OSS やったりやらない", serviceIcon: <FaGitHub />, avatarUrl: "/icon.jpg"},
        { id: "Kyure_A@misskey.io", description: "xyz からやってる", serviceIcon: <SiMisskey />, avatarUrl: "/icon.jpg"}
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
                    />

          )})}
        </>
    );
}
