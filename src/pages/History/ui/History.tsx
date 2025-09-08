import Timeline, { TimelineItem } from "./Timeline";

export default function History() {
  const timelineData: TimelineItem[] = [
    {
      date: "July 10, 2005",
      title: "生まれる",
      description: "納豆の日、2700 g くらいの baby",
    },
    {
      date: "April, 2021",
      title: "大阪公立大学工業高等専門学校 入学",
      description: "ex-大阪府立大学工業高等専門学校",
      url: "https://www.ct.omu.ac.jp",
    },
    {
      date: "September, 2022",
      title: "パソコン甲子園 2022 プログラミング部門 (予選)",
      description: "順位表凍結時 63 位",
      url: "https://web.archive.org/web/20220910070431/https://radon.u-aizu.ac.jp/pckosien/stats/pck2022pre_standings.html#:~:text=63,%E9%AB%98%E7%AD%89%E5%B0%82%E9%96%80%E5%AD%A6%E6%A0%A1",
    },
    {
      date: "April, 2023",
      title:
        "大阪公立大学工業高等専門学校 総合工学システム学科 電子情報コース 配属",
      description: "電子:情報 = 7:3 くらい",
      url: "https://www.ct.omu.ac.jp/courses/electronics-and-information-course/",
    },
    {
      date: "September, 2023",
      title: "パソコン甲子園 2023 プログラミング部門 (予選)",
      description: "順位表凍結時 35 位 (大阪 1 位)",
      url: "http://web.archive.org/web/20230909072222/https://radon.u-aizu.ac.jp/pckosien/stats/pck2023pre_standings.html#:~:text=35,%E9%AB%98%E7%AD%89%E5%B0%82%E9%96%80%E5%AD%A6%E6%A0%A1",
    },
    {
      date: "October, 2023",
      title: "C-Style Inc. に join",
      description: "Next.js, Nest.js をやっている",
      url: "https://c-style.net",
    },
    {
      date: "October, 2023",
      title: "第34回 高専プロコン 競技部門",
      description: "ファイナルステージまで進出",
    },
    {
      date: "November, 2023",
      title: "パソコン甲子園 2023 プログラミング部門 (本選)",
      description: "何もできなかった",
    },
    {
      date: "September, 2024",
      title: "Booth ショップ 開設",
      description: "VRChat アバター向けアクセサリーを販売",
      url: "https://kyre.booth.pm",
    },
    {
      date: "August, 2025",
      title: "第 1 回 さくらの AI ハッカソン with Kloud",
      description: "最優秀賞",
      url: "https://kloud-hackathon.connpass.com/event/361937/",
    }
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 py-20 rounded-lg shadow-sm">
      {/* {<h2 className="text-2xl font-bold mb-6 text-gray-800">プロジェクト タイムライン</h2>}*/}
      <Timeline items={timelineData} />
    </div>
  );
}
