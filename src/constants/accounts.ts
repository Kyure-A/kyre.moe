type Child = {
    name: string,
    url: string,
    id: string
};

type Account = {
    parent: string,
    child: Child[]
};

export const accounts: Account[] = [
    {
        parent: "Twitter",
        child: [
            {
                name: "@kyureq (Main)",
                url: "https://twitter.com/kyureq",
                id: "@kyureq"
            },
            {
                name: "@Kyure_A (Suspended)",
                url: "https://twitter.com/Kyure_A",
                id: "@Kyure_A"
            },
            {
                name: "@Xyure_A (Private)",
                url: "https://twitter.com/Xyure_A",
                id: "@Xyure_A"
            },
            {
                name: "@3kyu4 (Cosplay)",
                url: "https://twitter.com/3kyu4",
                id: "@3kyu4"
            },
            {
                name: "@kyre_cpp (Competitive programming)",
                url: "https://twitter.com/kyre_cpp",
                id: "@kyre_cpp"
            },
        ]
    },
    {
        parent: "Development",
        child: [
            {
                name: "GitHub",
                url: "https://github.com/Kyure-A",
                id: "Kyure-A"
            },
            {
                name: "AtCoder",
                url: "https://atcoder.jp/users/kyre",
                id: "kyre"
            }
        ]
    },
    {
        parent: "Fediverse",
        child: [
            {
                name: "@Kyure_A@mstdn.maud.io",
                url: "https://mstdn.maud.io/@Kyure_A",
                id: "@Kyure_A@mstdn.maud.io"
            },
            {
                name: "@Kyure_A@misskey.io",
                url: "https://misskey.io/@Kyure_A",
                id: "@Kyure_A@misskey.io"
            },
            {
                name: "@kyre@misskey.kyoupro.com",
                url: "https://misskey.kyoupro.com/@kyre",
                id: ""
            },
            {
                name: "@Kyure_A@mstdn.jp",
                url: "https://mstdn.jp/@Kyure_A",
                id: ""
            }
        ]
    },
    {
        parent: "Games",
        child: [
            {
                name: "Steam",
                url: "https://steamcommunity.com/id/kyure_a/",
                id: ""
            },
            {
                name: "Nintendo Switch",
                url: "",
                id: "SW-1698-6437-2977"
            },
            {
                name: "Epic Games",
                url: "https://store.epicgames.com/ja/u/6637d18ee37d470b9e17de1784812aa0",
                id: ""
            },
            {
                name: "Minecraft",
                url: "https://ja.namemc.com/profile/Kyure_A",
                id: ""
            },
            {
                name: "CHUNITHM (Chunirec)",
                url: "https://chunirec.net/users/kyre",
                id: ""
            },
            {
                name: "Arcaea",
                url: "",
                id: "669 602 127"
            },
            {
                name: "ウマ娘 プリティーダービー",
                url: "",
                id: "785561379876"
            },
            {
                name: "モンスターストライク",
                url: "",
                id: "163012306"
            },
        ]
    },
    {
        parent: "Others",
        child: [
            {
                name: "Discord",
                url: "",
                id: "kyure_a"
            },
            {
                name: "Instagram",
                url: "https://instagram.com/kyure_a",
                id: "kyure_a"
            },
            {
                name: "Bluesky",
                url: "https://bsky.app/profile/kyure-a.bsky.social",
                id: "@kyure-a.bsky.social"
            },
            {
                name: "Threads",
                url: "https://www.threads.net/@kyure_a",
                id: "kyure_a"
            },
            {
                name: "Last.fm",
                url: "https://www.last.fm/user/Kyure_A",
                id: "Kyure_A"
            },
            {
                name: "Nostr",
                url: "https://snort.social/p/npub1u66qnxs3gth2tx944u66xh8x7qp5sjj3xmh25dqa846jpk74229swuetxg",
                id: "npub1u66qnxs3gth2tx944u66xh8x7qp5sjj3xmh25dqa846jpk74229swuetxg"
            },
            {
                name: "hatenablog",
                url: "https://kyre.hatenablog.jp",
                id: "Kyure_A"
            }
        ]
    }

];
