import Timeline, { TimelineItem } from "./Timeline";

export default function History () {
    const timelineData: TimelineItem[] = [
        {
            date: "2005/07",
            title: "生まれる",
            description: "納豆の日、2700 g くらいの baby"
        },
        {
            date: "2021/04",
            title: "大阪公立大学工業高等専門学校 入学",
            description: ""
        },
        {
            date: "2022/09",
            title: "パソコン甲子園 2022 プログラミング部門 (予選)",
            description: "順位表凍結時 63 位",
        },
        {
            date: "2023/04",
            title: "大阪公立大学工業高等専門学校 総合工学システム学科 電子情報コース 配属",
            description: "情報とは名ばかり"
        },
        {
            date: "2023/08",
            title: "Kloud Hackathon #3",
            description: "スライドがかり"
        },
        {
            date: "2023/09",
            title: "パソコン甲子園 2023 プログラミング部門 (予選)",
            description: "順位表凍結時 35 位 (大阪 1 位)"
        },
        {
            date: "2023/10",
            title: "C-Style 株式会社に join",
            description: "Next.js, Nest.js をやっている"
        },
        {
            date: "2023/10",
            title: "第34回 高専プロコン 競技部門",
            description: "かばん持ち"
        },
        {
            date: "2023/11",
            title: "パソコン甲子園 2023 プログラミング部門 (本選)",
            description: "置物"
        },
        {
            date: "2024/09",
            title: "Booth ショップ 開設",
            description: "割と売れてます"
        },
        {
            date: "2025/03",
            title: "Kloud Hackathon #6",
            description: "素晴らしいスピーチ・スライドよりもモックを見せる"
        }
    ];

    return (
        <div className="max-w-2xl mx-auto p-6 rounded-lg shadow-sm">
          {/* {<h2 className="text-2xl font-bold mb-6 text-gray-800">プロジェクト タイムライン</h2>}*/}
          <Timeline items={timelineData} />
        </div>
    );
}
