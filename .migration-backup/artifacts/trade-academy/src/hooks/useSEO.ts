import { useEffect } from "react";

interface SEOOptions {
  title: string;
  description?: string;
  noindex?: boolean;
  canonical?: string;
}

const SITE_NAME = "TradeAcademy Angola";
const BASE_URL = "https://tradeacademy.ao";

export function useSEO({ title, description, noindex = false, canonical }: SEOOptions) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    setMeta("name", "description", description ?? "");
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description ?? "");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description ?? "");

    if (noindex) {
      setMeta("name", "robots", "noindex, nofollow");
    } else {
      setMeta("name", "robots", "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");
    }

    if (canonical) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = `${BASE_URL}${canonical}`;
    }

    return () => {
      document.title = `${SITE_NAME} — Curso de Trading em Português | Grátis`;
      setMeta("name", "robots", "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");
    };
  }, [title, description, noindex, canonical]);
}

function setMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}
