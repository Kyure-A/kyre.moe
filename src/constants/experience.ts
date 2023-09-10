type Experience = {
    name: string,
    url: string,
    team: string,
    result: string,
    result_url: string,
    description: string,
    public: boolean
};

export const experience: Experience[] = [
    {
        name: "パソコン甲子園 2022 プログラミング部門 (予選)",
        url: "https://pckoshien.u-aizu.ac.jp/news/2022/07/2022-1.html",
        team: "参加部門:モバイル",
        result: "63 位",
        result_url: "http://web.archive.org/web/20220910070431/https://radon.u-aizu.ac.jp/pckosien/stats/pck2022pre_standings.html#:~:text=63,%E9%AB%98%E7%AD%89%E5%B0%82%E9%96%80%E5%AD%A6%E6%A0%A1",
        description: "",
        public: true,
    },
    {
        name: "Kloud Hackathon #2",
        url: "https://kloud-hackathon.connpass.com/event/280936/",
        team: "金重",
        result: "GitHub Repo",
        result_url: "https://github.com/Kyure-A/status-visualizer",
        description: "健康状態をゲームの「ステータスボード」のように可視化するアプリケーションのプロトタイプを作成しました．",
        public: true,
    },
    {
        name: "Kloud Hackathon #3",
        url: "https://kloud-hackathon.connpass.com/event/290649/",
        team: "キュレェとゆかいななかまたち",
        result: "GitHub Repo",
        result_url: "https://github.com/Kyure-A/geocolle",
        description: "位置情報を利用したすれちがい通信アプリケーションのフロントエンドを作成しました (Flutter)",
        public: true,
    },
    {
        name: "パソコン甲子園 2023 プログラミング部門 (予選)",
        url: "https://pckoshien.u-aizu.ac.jp/news/2023/07/2023-4.html",
        team: "✊☺☝️†最強†☝️☺✊",
        result: "35 位 (大阪 1 位)",
        result_url: "http://web.archive.org/web/20230909072222/https://radon.u-aizu.ac.jp/pckosien/stats/pck2023pre_standings.html#:~:text=35,%E9%AB%98%E7%AD%89%E5%B0%82%E9%96%80%E5%AD%A6%E6%A0%A1",
        description: "5 完 x 2でした 地域ごとなので大阪で 1 位でも本戦に通るわけではないですが......(泣)",
        public: true,
    },
    {
        name: "高専プロコン 第34回 福井大会 (2023)",
        url: "https://www.procon.gr.jp",
        team: "",
        result: "",
        result_url: "",
        description: "",
        public: false,
    },
];
