const HATENA_STAR_SCRIPT_URL = "https://s.hatena.ne.jp/js/widget/star.js";

const HatenaStarScript = () => {
  return (
    <script
      src={HATENA_STAR_SCRIPT_URL}
      defer={true}
      suppressHydrationWarning={true}
    />
  );
};

export default HatenaStarScript;
