import "./globals.css";
import NotFound from "@/pages/NotFound/ui/NotFound";
import ThemeScript from "@/shared/ui/ThemeProvider/ThemeScript";

// ルートレイアウトが存在しないため、単体でグローバル CSS とテーマ初期化を読み込む
const RootNotFoundPage = () => {
  return (
    <>
      <ThemeScript />
      <NotFound />
    </>
  );
};

export default RootNotFoundPage;
