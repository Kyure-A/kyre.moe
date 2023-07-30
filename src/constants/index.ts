type Account = {
  type: string,
  name: string,
  url: string,
  id: string
};

export const accounts = [
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
        name: "ウマ娘 プリティーダービー",
        url: "",
        id: "785561379876"
      },
      {
        name: "Arcaea",
        url: "",
        id: "669 602 127"
      },
      {
        name: "モンスターストライク",
        url: "",
        id: "163012306"
      },
      {
        name: "Nintendo Switch",
        url: "",
        id: "SW-1698-6437-2977"
      }
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
      }
    ]
  }

];


type Affiliation = {
  name: string,
  course: string,
  start: Date,
  end: Date,
  link: string
};

export const affiliations: Affiliation[] = [
  {
    name: "Osaka Metropolitan University College of Technology",
    course: "Electronics and Information Course",
    start: new Date("2021/05/"), // 2021/04
    end: new Date("2026/04"), // 2026/03
    link: "https://www.ct.omu.ac.jp/courses/electronics-and-information-course/"
  }
];

type Experience = {
  name: string,
  team: string,
  result: string,
  url: string
};

export const experiences: Experience[] = [
  {
    name: "パソコン甲子園 2022 (予選)",
    team: "参加部門:モバイル",
    result: "63位",
    url: "http://web.archive.org/web/20220910070431/https://radon.u-aizu.ac.jp/pckosien/stats/pck2022pre_standings.html"
  },
  {
    name: "Kloud Hackathon #2",
    team: "金重",
    result: "",
    url: ""
  },
  {
    name: "高専プロコン 2023 (procon34) 競技部門",
    team: "",
    result: "",
    url: ""
  }
]
