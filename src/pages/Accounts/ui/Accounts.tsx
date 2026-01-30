import type { Omit } from "@react-spring/web";
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
import type { SiteLang } from "@/shared/lib/i18n";
import Account, { type AccountProps } from "./Account";

type AccountData = Omit<AccountProps, "delay" | "description"> & {
  description?: Partial<Record<SiteLang, string>>;
};

const ACCOUNT_DATA: AccountData[] = [
  {
    id: "@kyremoe",
    description: { ja: "3 代目", en: "3rd account" },
    platform: "Twitter",
    accentColor: "#1DA1F2",
    serviceIcon: <FaTwitter />,
    serviceUrl: "https://x.com/kyremoe",
  },
  {
    id: "@3kyu4",
    description: { ja: "女装", en: "for crossdressing" },
    platform: "Twitter",
    accentColor: "#1DA1F2",
    serviceIcon: <FaTwitter />,
    serviceUrl: "https://x.com/3kyu4",
  },
  {
    id: "@_______kyu",
    description: { ja: "VRChat", en: "for VRChat" },
    platform: "Twitter",
    accentColor: "#1DA1F2",
    serviceIcon: <FaTwitter />,
    serviceUrl: "https://x.com/_______kyu",
  },
  {
    id: "@kyreroe",
    description: { ja: "絵を RT する", en: "for retweet illustrations" },
    platform: "Twitter",
    accentColor: "#1DA1F2",
    serviceIcon: <FaTwitter />,
    serviceUrl: "https://x.com/kyreroe",
  },
  {
    id: "Kyure-A",
    platform: "GitHub",
    accentColor: "#171515",
    serviceIcon: <FaGitHub />,
    serviceUrl: "https://github.com/Kyure-A",
  },
  {
    id: "Kyure_A@misskey.io",
    description: { ja: "xyz 世代", en: "Gen .xyz" },
    platform: "Misskey",
    accentColor: "#55C500",
    serviceIcon: <SiMisskey />,
    serviceUrl: "https://misskey.io/@Kyure_A",
  },
  {
    id: "Kyure_A@mstdn.maud.io",
    platform: "Mastodon",
    accentColor: "#6364FF",
    serviceIcon: <FaMastodon />,
    serviceUrl: "https://mstdn.maud.io/@Kyure_A",
  },
  {
    id: "@kyure_a",
    platform: "Threads",
    accentColor: "#1A1A1A",
    serviceIcon: <FaThreads />,
    serviceUrl: "https://threads.net/@kyure_a",
  },
  {
    id: "kyre.moe",
    platform: "Bluesky",
    accentColor: "#0085FF",
    serviceIcon: <FaBluesky />,
    serviceUrl: "https://bsky.app/profile/kyre.moe",
  },
  {
    id: "npub1kyrem0e",
    platform: "Nostr",
    accentColor: "#8E4BFF",
    serviceIcon: <NostrIcon />,
    serviceUrl:
      "https://iris.to/npub1kyrem0eejds8cwr2732ygtpksxnlehlg4wu92dkvyxxgz48fl5cqn6fay4",
  },
  {
    id: "Kyure_A",
    platform: "Steam",
    accentColor: "#171A21",
    serviceIcon: <FaSteam />,
    serviceUrl: "https://steamcommunity.com/id/kyure_a/",
  },
  {
    id: "Kyure_A",
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
    serviceIcon: <VRChatIcon />,
    serviceUrl:
      "https://vrchat.com/home/user/usr_daa6a1ac-65c2-49a3-a9a7-074434c05a4d",
  },
];

export default function Accounts({ lang }: { lang: SiteLang }) {
  const accounts = ACCOUNT_DATA.map((account) => ({
    ...account,
    description: account.description?.[lang] ?? "",
  }));
  return (
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
  );
}
