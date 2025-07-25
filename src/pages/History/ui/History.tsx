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
      description: "当時は 大阪府立大学工業高等専門学校",
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
      description: "情報とは名ばかり",
      url: "https://www.ct.omu.ac.jp/courses/electronics-and-information-course/",
    },
    {
      date: "August, 2023",
      title: "Kloud Hackathon #3",
      description: "スライドがかり",
      url: "https://kloud-hackathon.connpass.com/event/290649/",
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
      description: "かばん持ち",
    },
    {
      date: "November, 2023",
      title: "パソコン甲子園 2023 プログラミング部門 (本選)",
      description: "置物",
    },
    {
      date: "September, 2024",
      title: "Booth ショップ 開設",
      description: "割と売れてます",
      url: "https://kyre.booth.pm",
    },
    {
      date: "March, 2025",
      title: "Kloud Hackathon #6",
      description: "素晴らしいスピーチ・スライドよりもモックを見せる",
      url: "https://kloud-hackathon.connpass.com/event/343422/",
    },
    {
      date: "July, 2025",
      title: "筑波大学 情報学群 知識情報・図書館学類 合格",
      description: "なぜ受かったかわからない",
      url: "https://www.klis.tsukuba.ac.jp",
    }
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 py-20 rounded-lg shadow-sm">
      {/* {<h2 className="text-2xl font-bold mb-6 text-gray-800">プロジェクト タイムライン</h2>}*/}
      <Timeline items={timelineData} />
    </div>
  );
}
