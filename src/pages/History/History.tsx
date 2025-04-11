import Timeline, { TimelineItem } from "./Timeline";

export default function History () {
    const timelineData: TimelineItem[] = [
        {
            date: "July, 2005",
            title: "生まれる",
            description: "納豆の日、2700 g くらいの baby"
        },
        {
            date: "April, 2021",
            title: "大阪公立大学工業高等専門学校 入学",
            description: "当時は 大阪府立大学工業高等専門学校"
        },
        {
            date: "September, 2022",
            title: "パソコン甲子園 2022 プログラミング部門 (予選)",
            description: "順位表凍結時 63 位",
        },
        {
            date: "April, 2023",
            title: "大阪公立大学工業高等専門学校 総合工学システム学科 電子情報コース 配属",
            description: "情報とは名ばかり"
        },
        {
            date: "August, 2023",
            title: "Kloud Hackathon #3",
            description: "スライドがかり"
        },
        {
            date: "September, 2023",
            title: "パソコン甲子園 2023 プログラミング部門 (予選)",
            description: "順位表凍結時 35 位 (大阪 1 位)"
        },
        {
            date: "October, 2023",
            title: "C-Style 株式会社に join",
            description: "Next.js, Nest.js をやっている"
        },
        {
            date: "October, 2023",
            title: "第34回 高専プロコン 競技部門",
            description: "かばん持ち"
        },
        {
            date: "November, 2023",
            title: "パソコン甲子園 2023 プログラミング部門 (本選)",
            description: "置物"
        },
        {
            date: "September, 2024",
            title: "Booth ショップ 開設",
            description: "割と売れてます"
        },
        {
            date: "March, 2025",
            title: "Kloud Hackathon #6",
            description: "素晴らしいスピーチ・スライドよりもモックを見せる"
        }
    ];

    return (
        <div className="max-w-2xl mx-auto p-6 py-2 rounded-lg shadow-sm">
          {/* {<h2 className="text-2xl font-bold mb-6 text-gray-800">プロジェクト タイムライン</h2>}*/}
          <Timeline items={timelineData} />
        </div>
    );
}
