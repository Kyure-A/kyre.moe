"use client";

import { useEffect } from "react";

const PLACEHOLDER_SELECTOR =
  ".blog-content .markdown-youtube-placeholder[data-youtube-video-id]";
const VIDEO_ID_PATTERN = /^[\w-]{11}$/;

const createYouTubeIframe = (videoId: string) => {
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.loading = "lazy";
  iframe.title = "YouTube video player";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  return iframe;
};

const YouTubeEmbedEnhancer = () => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const placeholder =
        target.closest<HTMLAnchorElement>(PLACEHOLDER_SELECTOR);
      if (!placeholder) return;

      const videoId = placeholder.dataset.youtubeVideoId;
      if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) return;

      event.preventDefault();

      if (placeholder.dataset.youtubeReady === "true") return;
      placeholder.dataset.youtubeReady = "true";
      placeholder.replaceWith(createYouTubeIframe(videoId));
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
};

export default YouTubeEmbedEnhancer;
