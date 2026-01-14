import Timeline, { type TimelineItem } from "@/pages/History/ui/Timeline";

export default function History() {
	const timelineData: TimelineItem[] = [
		{
			date: "July 10, 2005",
			title: "キュレェ 生誕",
			description: "納豆の日、約 2700 g",
		},
		{
			date: "April, 2021",
			title: "大阪府立大学工業高等専門学校 入学",
			description: "現: 大阪公立大学工業高等専門学校",
			url: "https://www.ct.omu.ac.jp",
		},
		{
			date: "September, 2023",
			title: "パソコン甲子園 2023 プログラミング部門 (予選)",
			description: "大阪 1 位 (全体 35 位)",
			url: "http://web.archive.org/web/20230909072222/https://radon.u-aizu.ac.jp/pckosien/stats/pck2023pre_standings.html",
		},
		{
			date: "October, 2023",
			title: "第34回 高専プロコン 競技部門",
			description: "ファイナルステージまで進出",
		},
		{
			date: "November, 2023",
			title: "パソコン甲子園 2023 プログラミング部門 (本選)",
			description: "24 位 / 29 チーム",
			url: "https://web.archive.org/web/20231111083450/https://radon.u-aizu.ac.jp/pckosien/stats/pck2023final_standings.html",
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
		},
	];

	return (
		<div className="max-w-2xl mx-auto p-6 py-20 rounded-lg shadow-sm">
			{/* {<h2 className="text-2xl font-bold mb-6 text-gray-800">プロジェクト タイムライン</h2>}*/}
			<Timeline items={timelineData} />
		</div>
	);
}
